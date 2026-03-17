import { NextRequest, NextResponse } from 'next/server';
import { dripStore, fillTemplate, DRIP_SEQUENCE, type DripMember } from '@/lib/dripStore';
import { leadStore, calcSubscription } from '@/lib/leadStore';

const SMTP_CONFIGURED = !!(process.env.SMTP_HOST && process.env.SMTP_USER);
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

// ── 사업자번호로 회원 등록 ────────────────────────────────────
export async function POST(req: NextRequest) {
    const { leadId, bizRegNo } = await req.json();
    if (!leadId || !bizRegNo) return NextResponse.json({ error: 'leadId, bizRegNo 필수' }, { status: 400 });

    const lead = leadStore.getById(leadId);
    if (!lead) return NextResponse.json({ error: '리드 없음' }, { status: 404 });

    // 이미 등록된 경우 반환
    const existing = dripStore.getByLeadId(leadId);
    if (existing) return NextResponse.json({ member: existing, alreadyExists: true });

    const member = dripStore.register({
        leadId, companyName: lead.companyName,
        contactEmail: lead.contactEmail, contactName: lead.contactName,
        bizRegNo, riskLevel: lead.riskLevel, issueCount: lead.issueCount,
    });

    // 리드 상태 → in_contact
    leadStore.update(leadId, { status: 'in_contact' });

    // 임시 비밀번호 이메일 발송
    await sendEmail({
        to: lead.contactEmail,
        subject: `[IBS 법률] ${lead.companyName} 회원 등록 완료 — 임시 비밀번호 안내`,
        html: buildWelcomeEmail(member),
    });

    return NextResponse.json({ member, mock: !SMTP_CONFIGURED });
}

// ── 드립 발송 대기 목록 조회 ─────────────────────────────────
export async function GET() {
    const pending = dripStore.getPendingEmails();
    return NextResponse.json({
        pending: pending.map(p => ({
            memberId: p.member.id,
            companyName: p.member.companyName,
            day: p.email.day,
            subject: p.email.subject,
            contentType: p.email.contentType,
        }))
    });
}

// ── 드립 이메일 즉시 발송 ────────────────────────────────────
export async function PUT(req: NextRequest) {
    const { memberId, day } = await req.json();
    const member = dripStore.getById(memberId);
    if (!member) return NextResponse.json({ error: '멤버 없음' }, { status: 404 });

    const emailTemplate = DRIP_SEQUENCE.find(e => e.day === day);
    if (!emailTemplate) return NextResponse.json({ error: '이메일 없음' }, { status: 404 });

    const lead = leadStore.getById(member.leadId);
    const sub = calcSubscription(lead?.storeCount || 0);
    const vars = {
        company: member.companyName,
        contactName: member.contactName,
        leadId: member.leadId,
        riskScore: String(lead?.riskScore || 0),
        riskLevel: member.riskLevel,
        storeCount: String(lead?.storeCount || 0),
        bizType: lead?.bizType || '업종',
        monthlyFee: sub.monthly.toLocaleString(),
    };

    const subject = fillTemplate(emailTemplate.subject, vars);
    const html = buildDripEmailHtml(fillTemplate(emailTemplate.content, vars), {
        subject, ctaText: emailTemplate.ctaText,
        ctaUrl: `http://localhost:3000${fillTemplate(emailTemplate.ctaUrl, vars)}`,
        companyName: member.companyName, day, contactName: member.contactName,
    });

    await sendEmail({ to: member.contactEmail, subject, html });
    dripStore.markSent(memberId, day);

    return NextResponse.json({ ok: true, mock: !SMTP_CONFIGURED });
}

// ── 헬퍼 함수 ────────────────────────────────────────────────
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
    if (SMTP_CONFIGURED) {
        // nodemailer 실 발송 (Phase 2)
    } else {
        console.log(`\n📧 [드립 이메일] To: ${to}\nSubject: ${subject}\n`);
    }
}

function buildWelcomeEmail(member: DripMember): string {
    return `
<div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:600px;margin:0 auto;background:#04091a;padding:32px;border-radius:16px">
  <div style="text-align:center;margin-bottom:28px">
    <h1 style="color:#c9a84c;font-size:22px;margin:0">⚖️ IBS 법률사무소</h1>
    <p style="color:#94a3b8;margin:4px 0 0;font-size:13px">프랜차이즈 전문 법률 서비스</p>
  </div>
  <div style="background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:12px;padding:20px;margin-bottom:20px">
    <h2 style="color:#4ade80;margin:0 0 8px;font-size:18px">🎉 회원 가입을 환영합니다!</h2>
    <p style="color:#f0f4ff;margin:0">${member.companyName}의 ${member.contactName}님이 IBS 법률사무소 회원으로 등록되었습니다.</p>
  </div>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:10px;background:rgba(255,255,255,0.05);color:#94a3b8;font-size:13px;border-radius:6px 0 0 6px">로그인 ID (사업자번호)</td><td style="padding:10px;background:rgba(255,255,255,0.05);color:#f0f4ff;font-size:13px;font-weight:bold">${member.bizRegNo}</td></tr>
    <tr><td style="padding:10px;color:#94a3b8;font-size:13px">임시 비밀번호</td><td style="padding:10px;color:#c9a84c;font-size:18px;font-weight:bold;letter-spacing:2px">${member.tempPassword}</td></tr>
  </table>
  <div style="text-align:center;margin:24px 0">
    <a href="http://localhost:3000/client-login" style="background:linear-gradient(135deg,#c9a84c,#e8c87a);color:#0a0e1a;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:900;display:inline-block;font-size:15px">
      지금 로그인하여 분석 결과 확인 →
    </a>
  </div>
  <p style="color:#64748b;font-size:12px;text-align:center">로그인 후 비밀번호를 변경해 주세요. 문의: 02-1234-5678</p>
</div>`;
}

function buildDripEmailHtml(content: string, opts: {
    subject: string; ctaText: string; ctaUrl: string;
    companyName: string; day: number; contactName: string;
}): string {
    return `
<div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:0">
  <div style="background:#04091a;padding:20px 32px">
    <h2 style="color:#c9a84c;margin:0;font-size:18px">⚖️ IBS 법률사무소</h2>
    <p style="color:#94a3b8;margin:2px 0 0;font-size:12px">법률 가이드 Day ${opts.day}</p>
  </div>
  <div style="padding:28px 32px">
    <h3 style="color:#1e293b;margin:0 0 16px">${opts.subject.replace(/^\[IBS 법률\]\s*/, '')}</h3>
    <div style="color:#374151;line-height:1.8;white-space:pre-line">${content}</div>
    <div style="text-align:center;margin:32px 0">
      <a href="${opts.ctaUrl}" style="background:linear-gradient(135deg,#c9a84c,#e8c87a);color:#0a0e1a;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:900;display:inline-block">
        ${opts.ctaText} →
      </a>
    </div>
    <p style="color:#94a3b8;font-size:12px;text-align:center">수신거부: <a href="#" style="color:#94a3b8">여기 클릭</a> | IBS 법률사무소 | 02-1234-5678</p>
  </div>
</div>`;
}
