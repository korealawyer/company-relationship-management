import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';
import { supabaseCompanyStore } from '@/lib/supabaseStore';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { renderToStaticMarkup } from 'react-dom/server';
import ContractEmailTemplate from '@/components/crm/ContractEmailTemplate';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// ── SMTP 설정 ────────────────────────────────────────────────
// .env.local에서 읽어옴 — 설정이 없으면 Mock 모드
const SMTP_CONFIGURED = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

const FROM_NAME = process.env.SMTP_FROM_NAME || 'IBS 법률사무소';
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'info@ibslaw.co.kr';
const FROM = `${FROM_NAME} <${FROM_EMAIL}>`;

// nodemailer transporter (SMTP 설정 시 실 발송)
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465', // ethereal은 587, false
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });
}

// ── 이메일 본문 생성 ─────────────────────────────────────────

interface EmailPayload {
  type: 'sales_notify' | 'company_hook' | 'clause_review_done' | 'full_revision_to_client' | 'send_contract';
  leadId: string;
  lawyerNote?: string;
  repId?: string;        // 영업 담당자 ID (→ client-portal URL 파라미터)
  // send_contract
  to?: string;
  contractCompany?: any;
  plan?: 'starter' | 'standard' | 'premium';
  // clause_review_done
  company?: string;
  clauseData?: Record<string, string>;
  highRiskCount?: number;
  medRiskCount?: number;
  summaryOpinion?: string;
  // full_revision_to_client
  revisionData?: Record<string, string>;
  documentTitle?: string;
  documentNo?: string;
}

// 비동기 fetching으로 변경
async function buildSalesEmail(leadId: string, lawyerNote: string) {
  const lead = await supabaseCompanyStore.getById(leadId);
  if (!lead) return null;
  return {
    to: process.env.SALES_EMAIL || FROM_EMAIL,
    subject: `[IBS 영업알림] ${lead.name || '미상기업'} 변호사 컨펌 완료 — 연락 가능`,
    html: `
<div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#0a0e1a;padding:20px;border-radius:12px;margin-bottom:20px">
    <h2 style="color:#c9a84c;margin:0">${FROM_NAME}</h2>
    <p style="color:#94a3b8;margin:4px 0 0">영업팀 내부 알림</p>
  </div>
  <h3 style="color:#1e293b">✅ 변호사 컨펌 완료</h3>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;background:#f8fafc;font-weight:bold">회사명</td><td style="padding:8px">${lead.name || '-'}</td></tr>
    <tr><td style="padding:8px;background:#f8fafc;font-weight:bold">담당자</td><td style="padding:8px">${lead.contactName || '-'} (${lead.contactPhone || '-'})</td></tr>
    <tr><td style="padding:8px;background:#f8fafc;font-weight:bold">이메일</td><td style="padding:8px">${lead.contactEmail || '-'}</td></tr>
    <tr><td style="padding:8px;background:#f8fafc;font-weight:bold">리스크</td><td style="padding:8px;color:${lead.riskLevel === '고위험' ? '#f87171' : '#fb923c'}">${lead.riskLevel || '-'} (${lead.riskScore || 0}점) — ${lead.issueCount || 0}건</td></tr>
    <tr><td style="padding:8px;background:#f8fafc;font-weight:bold">가맹점수</td><td style="padding:8px">${lead.storeCount || 0}개</td></tr>
  </table>
  ${lawyerNote ? `<div style="background:#fef9ec;border-left:4px solid #c9a84c;padding:12px;margin:16px 0"><strong>변호사 메모:</strong><br/>${lawyerNote}</div>` : ''}
  <p style="color:#64748b">지금 바로 연락하세요. 업체에는 자동 이메일이 발송되었습니다.</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
  <p style="color:#94a3b8;font-size:12px">발신: ${FROM}</p>
</div>`,
  };
}

async function buildHookEmail(leadId: string, lawyerNote: string, repId?: string) {
  const lead = await supabaseCompanyStore.getById(leadId);
  if (!lead) return null;
  const issueText = `개인정보처리방침에서 ${lead.issueCount || 0}건의 위반 가능성이 발견되었습니다.`;
  
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ibslaw.co.kr';
  const params = new URLSearchParams();
  if (lead.biz) params.append('biz', lead.biz);
  if (repId) params.append('rep', repId);
  if (lead.name) params.append('cname', lead.name);
  const queryString = params.toString() ? `?${params.toString()}` : '';
  const portalUrl = `${BASE_URL}/${queryString}`;

  return {
    to: lead.contactEmail || FROM_EMAIL,
    subject: `[IBS 법률] ${lead.name || '미상기업'} 개인정보처리방침 리스크 진단 결과`,
    html: `
<div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#0a0e1a;padding:20px;border-radius:12px;margin-bottom:24px">
    <h2 style="color:#c9a84c;margin:0">${FROM_NAME}</h2>
    <p style="color:#94a3b8;margin:4px 0 0">프랜차이즈 전문 법률 서비스</p>
  </div>
  <h3 style="color:#1e293b">${lead.contactName || '담당자'}님께</h3>
  <p style="color:#374151;line-height:1.6">
    안녕하세요. IBS 법률사무소 AI 분석 시스템이 귀사(<strong>${lead.name || '미상기업'}</strong>)의
    개인정보처리방침을 검토한 결과를 전달드립니다.
  </p>
  <div style="background:#fef2f2;border-left:4px solid #f87171;padding:16px;margin:20px 0;border-radius:0 8px 8px 0">
    <h4 style="color:#dc2626;margin:0 0 8px">🔴 ${lead.riskLevel || '알 수 없음'} — ${issueText}</h4>
    <p style="color:#374151;margin:0">과징금 최대 <strong>3,000만원</strong>이 부과될 수 있는 항목이 포함되어 있습니다.</p>
  </div>
  <h4 style="color:#374151">주요 발견 사항</h4>
  <ul style="color:#374151;line-height:1.8">
    <li>개인정보 과다수집 의심 (개보법 §16)</li>
    <li>제3자 제공 현황 미명시 (개보법 §17)</li>
    <li>보유기간 일부 항목 누락 (개보법 §21)</li>
  </ul>
  <div style="text-align:center;margin:32px 0">
    <a href="${portalUrl}" style="background:linear-gradient(135deg,#c9a84c,#e8c87a);color:#0a0e1a;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;display:inline-block">
      🏢 IBS 법률사무소 방문 및 진단 결과 확인하기 →
    </a>
  </div>
  <p style="color:#64748b;font-size:12px;text-align:center">위 버튼을 클릭하면 귀사만의 맞춤 법률 진단 리포트를 바로 열람하실 수 있습니다.</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
  <p style="color:#94a3b8;font-size:12px">본 이메일은 자동 분석 시스템에 의해 발송되었습니다.<br/>
  문의: ${FROM_EMAIL} | IBS 법률사무소</p>
</div>`,
  };
}

export async function POST(req: NextRequest) {
  // 인증 검증
  /*
  // 개발용 발송 테스트를 위해 인증 잠시 패스(또는 주석 해제하여 검증 처리)
  const auth = await requireSessionFromCookie(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  */

  try {
    const body: EmailPayload = await req.json();
    const { type, leadId, lawyerNote = '' } = body;

    const emails: { to: string; subject: string; html: string }[] = [];
    
    if (type === 'sales_notify') {
      const e = await buildSalesEmail(leadId, lawyerNote);
      if (e) emails.push(e);
    } else if (type === 'company_hook') {
      const e = await buildHookEmail(leadId, lawyerNote, body.repId);
      if (e) emails.push(e);
    } else if (type === 'clause_review_done') {
      const lead = await supabaseCompanyStore.getById(leadId);
      const companyName = body.company || lead?.name || '미상기업';
      emails.push({
        to: process.env.SALES_EMAIL || FROM_EMAIL,
        subject: `[변호사 조문검토✓] ${companyName} 1차 조문검토 컨펌 — 영업CRM 반영됨`,
        html: `
<div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#0f172a;padding:20px;border-radius:12px;margin-bottom:20px">
    <h2 style="color:#c9a84c;margin:0">${FROM_NAME}</h2>
    <p style="color:#94a3b8;margin:4px 0 0">변호사 조문검토 컨펌 알림</p>
  </div>
  <h3 style="color:#1e293b">✅ 1차 조문검토 컨펌 완료</h3>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;background:#f8fafc;font-weight:bold">회사명</td><td style="padding:8px">${companyName}</td></tr>
    <tr><td style="padding:8px;background:#f8fafc;font-weight:bold">고위험</td><td style="padding:8px;color:#dc2626">${body.highRiskCount ?? 0}건</td></tr>
    <tr><td style="padding:8px;background:#f8fafc;font-weight:bold">주의</td><td style="padding:8px;color:#d97706">${body.medRiskCount ?? 0}건</td></tr>
  </table>
  ${body.summaryOpinion ? `<div style="background:#fef9ec;border-left:4px solid #c9a84c;padding:12px;margin:16px 0"><strong>종합 검토의견:</strong><br/>${body.summaryOpinion}</div>` : ''}
  <p style="color:#374151">→ 영업팀 CRM 조문 리스크 영역 및 고객 프라이버시 리포트에 자동 반영되었습니다.</p>
  <p style="color:#64748b;font-size:12px">계약 완료 후 변호사 포털「전체수정완본」 탭에서 컨펌 시 고객 HR 문서함으로 자동 전달됩니다.</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
  <p style="color:#94a3b8;font-size:12px">발신: ${FROM}</p>
</div>`,
      });
    } else if (type === 'full_revision_to_client') {
      const lead = await supabaseCompanyStore.getById(leadId);
      const companyName = body.company || lead?.name || '미상기업';
      const recipientEmail = lead?.contactEmail || process.env.SALES_EMAIL || FROM_EMAIL;
      emails.push({
        to: recipientEmail,
        subject: `[IBS 법률] ${companyName} 개인정보처리방침 수정완본 전달 — ${body.documentNo || ''}`,
        html: `
<div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#0f172a;padding:20px;border-radius:12px;margin-bottom:24px">
    <h2 style="color:#c9a84c;margin:0">${FROM_NAME}</h2>
    <p style="color:#94a3b8;margin:4px 0 0">전문 법률 검토 의견서</p>
  </div>
  <h3 style="color:#1e293b">📄 개인정보처리방침 수정완본 안내</h3>
  <div style="background:#eff6ff;border-left:4px solid #2563eb;padding:16px;margin:16px 0;border-radius:0 8px 8px 0">
    <p style="margin:0;color:#1e40af;font-weight:bold">${body.documentTitle || companyName + ' 개인정보처리방침 수정완본'}</p>
    <p style="margin:4px 0 0;color:#3b82f6;font-size:12px">문서번호: ${body.documentNo || '-'} | 작성일: ${new Date().toLocaleDateString('ko-KR')}</p>
  </div>
  <p style="color:#374151;line-height:1.6">당사와 자문 계약을 체결해주셔서 감사합니다.<br/>아래 수정완본 및 법률 검토의견서가 고객 대시보드 문서함에 등록되었습니다.</p>
  <div style="text-align:center;margin:28px 0">
    <a href="https://ibslaw.co.kr/dashboard" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;display:inline-block">
      HR 대시보드 열기 →
    </a>
  </div>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
  <p style="color:#94a3b8;font-size:12px">발신: ${FROM} | IBS 법률사무소</p>
</div>`,
      });
    } else if (type === 'send_contract') {
      const company = body.contractCompany;
      if (!company) {
         return NextResponse.json({ error: 'Company data required for contract' }, { status: 400 });
      }
      const recipientEmail = body.to || 'dhk@ibslaw.co.kr';
      const htmlContent = renderToStaticMarkup(ContractEmailTemplate({ company, plan: body.plan || 'standard' }));
      emails.push({
        to: recipientEmail,
        subject: `[IBS 법률사무소] ${company.name} 기업 법률 자문 서비스 계약서 발송`,
        html: htmlContent
      });
    }

    if (emails.length === 0) {
      return NextResponse.json({ error: '처리할 수 없는 요청입니다.' }, { status: 400 });
    }

    let previewUrl = null;

    if (resend) {
      // ─ 실 발송 (Resend) ─
      for (const email of emails) {
        await resend.emails.send({
          from: FROM,
          to: email.to,
          subject: email.subject,
          html: email.html,
        });
      }
      console.log(`[email] ✅ 실 발송 완료 (Resend) | from: ${FROM} | to: ${emails.map(e => e.to).join(', ')}`);
    } else if (SMTP_CONFIGURED) {
      // ─ 실 발송 (nodemailer) ─
      const transporter = createTransporter();
      for (const email of emails) {
        const info = await transporter.sendMail({
          from: FROM,
          to: email.to,
          subject: email.subject,
          html: email.html,
        });
        // 만약 Ethereal 계정이라면 preview URL 제공
        if (process.env.SMTP_HOST?.includes('ethereal')) {
            previewUrl = nodemailer.getTestMessageUrl(info);
            console.log('\n📧 === Ethereal Email 미리보기 ===');
            console.log(`URL: ${previewUrl}`);
            console.log('=================================\n');
        }
      }
      console.log(`[email] ✅ 실 발송 완료 (Nodemailer) | from: ${FROM} | to: ${emails.map(e => e.to).join(', ')}`);
    } else {
      // ─ Mock 모드 (콘솔 출력) ─
      for (const email of emails) {
        console.log('\n📧 === 이메일 발송 시뮬레이션 ===');
        console.log(`From: ${FROM}`);
        console.log(`To: ${email.to}`);
        console.log(`Subject: ${email.subject}`);
        console.log('⚠️  실제 발송하려면 .env.local에 SMTP_HOST/USER/PASS 설정 필요');
        console.log('=================================\n');
      }
    }

    // 리드 상태 업데이트 (leadId가 유효한 리드일 때만)
    if (leadId && (type === 'sales_notify' || type === 'company_hook')) {
      const existingLead = await supabaseCompanyStore.getById(leadId);
      if (existingLead) {
        await supabaseCompanyStore.update(leadId, { status: 'emailed', emailSentAt: new Date().toISOString() });
      }
    }

    return NextResponse.json({
      ok: true,
      mock: !SMTP_CONFIGURED,
      from: FROM,
      emailCount: emails.length,
      previewUrl
    });
  } catch (err) {
    console.error('[email API] 발송 오류:', err);
    const message = err instanceof Error ? err.message : '이메일 발송 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
