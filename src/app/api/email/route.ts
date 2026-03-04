import { NextRequest, NextResponse } from 'next/server';
import { leadStore } from '@/lib/leadStore';
import { requireSessionFromCookie } from '@/lib/auth';
import nodemailer from 'nodemailer';

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
    secure: process.env.SMTP_SECURE !== 'false', // 기본 true (SSL)
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });
}

// ── 이메일 본문 생성 ─────────────────────────────────────────

interface EmailPayload {
  type: 'sales_notify' | 'company_hook';
  leadId: string;
  lawyerNote?: string;
}

function buildSalesEmail(leadId: string, lawyerNote: string) {
  const lead = leadStore.getById(leadId);
  if (!lead) return null;
  return {
    to: process.env.SALES_EMAIL || FROM_EMAIL,
    subject: `[IBS 영업알림] ${lead.companyName} 변호사 컨펌 완료 — 연락 가능`,
    html: `
<div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#0a0e1a;padding:20px;border-radius:12px;margin-bottom:20px">
    <h2 style="color:#c9a84c;margin:0">${FROM_NAME}</h2>
    <p style="color:#94a3b8;margin:4px 0 0">영업팀 내부 알림</p>
  </div>
  <h3 style="color:#1e293b">✅ 변호사 컨펌 완료</h3>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;background:#f8fafc;font-weight:bold">회사명</td><td style="padding:8px">${lead.companyName}</td></tr>
    <tr><td style="padding:8px;background:#f8fafc;font-weight:bold">담당자</td><td style="padding:8px">${lead.contactName} (${lead.contactPhone})</td></tr>
    <tr><td style="padding:8px;background:#f8fafc;font-weight:bold">이메일</td><td style="padding:8px">${lead.contactEmail}</td></tr>
    <tr><td style="padding:8px;background:#f8fafc;font-weight:bold">리스크</td><td style="padding:8px;color:${lead.riskLevel === 'HIGH' ? '#f87171' : '#fb923c'}">${lead.riskLevel} (${lead.riskScore}점) — ${lead.issueCount}건</td></tr>
    <tr><td style="padding:8px;background:#f8fafc;font-weight:bold">가맹점수</td><td style="padding:8px">${lead.storeCount}개</td></tr>
  </table>
  ${lawyerNote ? `<div style="background:#fef9ec;border-left:4px solid #c9a84c;padding:12px;margin:16px 0"><strong>변호사 메모:</strong><br/>${lawyerNote}</div>` : ''}
  <p style="color:#64748b">지금 바로 연락하세요. 업체에는 자동 이메일이 발송되었습니다.</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
  <p style="color:#94a3b8;font-size:12px">발신: ${FROM}</p>
</div>`,
  };
}

function buildHookEmail(leadId: string, lawyerNote: string) {
  const lead = leadStore.getById(leadId);
  if (!lead) return null;
  const issueText = `개인정보처리방침에서 ${lead.issueCount}건의 위반 가능성이 발견되었습니다.`;
  return {
    to: lead.contactEmail,
    subject: `[IBS 법률] ${lead.companyName} 개인정보처리방침 리스크 진단 결과`,
    html: `
<div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#0a0e1a;padding:20px;border-radius:12px;margin-bottom:24px">
    <h2 style="color:#c9a84c;margin:0">${FROM_NAME}</h2>
    <p style="color:#94a3b8;margin:4px 0 0">프랜차이즈 전문 법률 서비스</p>
  </div>
  <h3 style="color:#1e293b">${lead.contactName} 担당자님께</h3>
  <p style="color:#374151;line-height:1.6">
    안녕하세요. IBS 법률사무소 AI 분석 시스템이 귀사(<strong>${lead.companyName}</strong>)의
    개인정보처리방침을 검토한 결과를 전달드립니다.
  </p>
  <div style="background:#fef2f2;border-left:4px solid #f87171;padding:16px;margin:20px 0;border-radius:0 8px 8px 0">
    <h4 style="color:#dc2626;margin:0 0 8px">🔴 ${lead.riskLevel} 리스크 — ${issueText}</h4>
    <p style="color:#374151;margin:0">과징금 최대 <strong>3,000만원</strong>이 부과될 수 있는 항목이 포함되어 있습니다.</p>
  </div>
  <h4 style="color:#374151">주요 발견 사항</h4>
  <ul style="color:#374151;line-height:1.8">
    <li>개인정보 과다수집 의심 (개보법 §16)</li>
    <li>제3자 제공 현황 미명시 (개보법 §17)</li>
    <li>보유기간 일부 항목 누락 (개보법 §21)</li>
  </ul>
  <div style="text-align:center;margin:32px 0">
    <a href="https://ibslaw.co.kr/pricing" style="background:linear-gradient(135deg,#c9a84c,#e8c87a);color:#0a0e1a;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;display:inline-block">
      무료 정밀 검토 신청하기 →
    </a>
  </div>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
  <p style="color:#94a3b8;font-size:12px">본 이메일은 자동 분석 시스템에 의해 발송되었습니다.<br/>
  문의: ${FROM_EMAIL} | IBS 법률사무소</p>
</div>`,
  };
}

// ── POST 핸들러 ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 인증 검증
  const auth = requireSessionFromCookie(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { type, leadId, lawyerNote = '' }: EmailPayload = await req.json();

    const emails: { to: string; subject: string; html: string }[] = [];
    if (type === 'sales_notify') {
      const e = buildSalesEmail(leadId, lawyerNote);
      if (e) emails.push(e);
    } else if (type === 'company_hook') {
      const e = buildHookEmail(leadId, lawyerNote);
      if (e) emails.push(e);
    }

    if (emails.length === 0) {
      return NextResponse.json({ error: '리드를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (SMTP_CONFIGURED) {
      // ─ 실 발송 (nodemailer) ─
      const transporter = createTransporter();
      for (const email of emails) {
        await transporter.sendMail({
          from: FROM,
          to: email.to,
          subject: email.subject,
          html: email.html,
        });
      }
      console.log(`[email] ✅ 실 발송 완료 | from: ${FROM} | to: ${emails.map(e => e.to).join(', ')}`);
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

    // 리드 상태 업데이트
    leadStore.update(leadId, { status: 'emailed', emailSentAt: new Date().toISOString() });

    return NextResponse.json({
      ok: true,
      mock: !SMTP_CONFIGURED,
      from: FROM,
      emailCount: emails.length,
    });
  } catch (err) {
    console.error('[email API] 발송 오류:', err);
    const message = err instanceof Error ? err.message : '이메일 발송 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
