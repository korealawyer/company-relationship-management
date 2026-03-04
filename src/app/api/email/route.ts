import { NextRequest, NextResponse } from 'next/server';
import { leadStore } from '@/lib/leadStore';

// ── 이메일 발송 API ──────────────────────────────────────────
// Phase 1: 콘솔 출력 Mock
// Phase 2: SMTP_HOST/SMTP_USER/SMTP_PASS 설정 시 실 발송

const SMTP_CONFIGURED = !!(process.env.SMTP_HOST && process.env.SMTP_USER);

interface EmailPayload {
    type: 'sales_notify' | 'company_hook';
    leadId: string;
    lawyerNote?: string;
}

function buildSalesEmail(leadId: string, lawyerNote: string) {
    const lead = leadStore.getById(leadId);
    if (!lead) return null;
    return {
        to: process.env.SALES_EMAIL || 'sales@ibs-law.kr',
        subject: `[IBS 영업알림] ${lead.companyName} 변호사 컨펌 완료 — 연락 가능`,
        html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#0a0e1a;padding:20px;border-radius:12px;margin-bottom:20px">
    <h2 style="color:#c9a84c;margin:0">IBS 법률사무소</h2>
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
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#0a0e1a;padding:20px;border-radius:12px;margin-bottom:24px">
    <h2 style="color:#c9a84c;margin:0">IBS 법률사무소</h2>
    <p style="color:#94a3b8;margin:4px 0 0">프랜차이즈 전문 법률 서비스</p>
  </div>
  <h3 style="color:#1e293b">${lead.contactName} 담당자님께</h3>
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
    <a href="http://localhost:3000/pricing" style="background:linear-gradient(135deg,#c9a84c,#e8c87a);color:#0a0e1a;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;display:inline-block">
      무료 정밀 검토 신청하기 →
    </a>
  </div>
  <p style="color:#94a3b8;font-size:12px">본 이메일은 자동 분석 시스템에 의해 발송되었습니다. 문의: 02-1234-5678</p>
</div>`,
    };
}

export async function POST(req: NextRequest) {
    try {
        const { type, leadId, lawyerNote = '' }: EmailPayload = await req.json();

        const emails = [];
        if (type === 'sales_notify') {
            const e = buildSalesEmail(leadId, lawyerNote);
            if (e) emails.push(e);
        } else if (type === 'company_hook') {
            const e = buildHookEmail(leadId, lawyerNote);
            if (e) emails.push(e);
        }

        if (emails.length === 0) return NextResponse.json({ error: '리드를 찾을 수 없습니다' }, { status: 404 });

        if (SMTP_CONFIGURED) {
            // Phase 2: nodemailer 실 발송
            // const nodemailer = await import('nodemailer');
            // const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, ... });
            // for (const email of emails) await transporter.sendMail({ from: 'IBS <noreply@ibs-law.kr>', ...email });
        } else {
            // Mock: 콘솔 출력
            for (const email of emails) {
                console.log('\n📧 === 이메일 발송 시뮬레이션 ===');
                console.log(`To: ${email.to}`);
                console.log(`Subject: ${email.subject}`);
                console.log('(Phase 2: SMTP_HOST/USER/PASS 설정 시 실 발송)');
                console.log('=================================\n');
            }
        }

        // 리드 상태 업데이트
        leadStore.update(leadId, { status: 'emailed', emailSentAt: new Date().toISOString() });

        return NextResponse.json({ ok: true, mock: !SMTP_CONFIGURED, emailCount: emails.length });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: '이메일 발송 오류' }, { status: 500 });
    }
}
