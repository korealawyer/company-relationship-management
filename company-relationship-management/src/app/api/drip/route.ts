import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';
import { dripStore, fillTemplate, DRIP_SEQUENCE, type DripMember } from '@/lib/dripStore';
import { leadStore, calcSubscription } from '@/lib/leadStore';
import { callClaude, hasAIKey } from '@/lib/ai';
import { checkRateLimit } from '@/lib/rateLimit';

const SMTP_CONFIGURED = !!(process.env.SMTP_HOST && process.env.SMTP_USER);

// QA-FIX #10: HTML 이스케이프 — 이메일 템플릿 XSS 방지
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}
export async function POST(req: NextRequest) {
  // A3: 인증 추가
  const auth = await requireSessionFromCookie(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // SEC-FIX: RBAC (인가) 검증
  const ALLOWED_ROLES = ['sales', 'super_admin', 'admin', 'lawyer'];
  if (!ALLOWED_ROLES.includes(auth.role)) {
    return NextResponse.json({ error: '드립 이메일 등록 권한이 없습니다.' }, { status: 403 });
  }

  // SEC-FIX: 페이로드 유효성 검증
  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: '잘못된 JSON 형식입니다.' }, { status: 400 });
  }

  const { leadId, bizRegNo } = body;
  if (!leadId || typeof leadId !== 'string' || !bizRegNo || typeof bizRegNo !== 'string') {
    return NextResponse.json({ error: 'leadId, bizRegNo는 문자열 형식의 필수 값입니다.' }, { status: 400 });
  }

  const lead = leadStore.getById(leadId);
  if (!lead) return NextResponse.json({ error: '리드 없음' }, { status: 404 });

  const existing = dripStore.getByLeadId(leadId);
  if (existing) return NextResponse.json({ member: existing, alreadyExists: true });

  const member = dripStore.register({
    leadId, companyName: lead.companyName,
    contactEmail: lead.contactEmail, contactName: lead.contactName,
    bizRegNo, riskLevel: lead.riskLevel, issueCount: lead.issueCount,
  });

  leadStore.update(leadId, { status: 'in_contact' });

  await sendEmail({
    to: lead.contactEmail,
    subject: `[IBS 법률] ${lead.companyName} 회원 등록 완료 — 임시 비밀번호 안내`,
    html: buildWelcomeEmail(member),
  });

  return NextResponse.json({ member, mock: !SMTP_CONFIGURED });
}

// ── 드립 발송 대기 목록 조회 ─────────────────────────────────
export async function GET(req: NextRequest) {
  // A3: 인증 추가
  const auth = await requireSessionFromCookie(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const ALLOWED_ROLES = ['sales', 'super_admin', 'admin', 'lawyer'];
  if (!ALLOWED_ROLES.includes(auth.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

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

// ── 드립 이메일 즉시 발송 (B2: AI 개인화 포함) ─────────────────
export async function PUT(req: NextRequest) {
  // A3: 인증 추가
  const auth = await requireSessionFromCookie(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const ALLOWED_ROLES = ['sales', 'super_admin', 'admin', 'lawyer'];
  if (!ALLOWED_ROLES.includes(auth.role)) {
    return NextResponse.json({ error: '발송 권한이 없습니다.' }, { status: 403 });
  }

  // SEC-FIX: AI 자원 보호를 위한 Rate Limit (IP 기반)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
  const rateLimit = await checkRateLimit(`drip_put_${ip}`, 10, 60);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'AI 이메일 발송 요청 한도를 초과했습니다. 잠시 후 시도하세요.' }, { status: 429 });
  }

  // SEC-FIX: 페이로드 유효성 검증
  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: '잘못된 JSON 형식입니다.' }, { status: 400 });
  }

  const { memberId, day } = body;
  if (!memberId || typeof memberId !== 'string' || typeof day !== 'number') {
    return NextResponse.json({ error: '유효한 memberId(string)와 day(number)가 필요합니다.' }, { status: 400 });
  }

  const member = dripStore.getById(memberId);
  if (!member) return NextResponse.json({ error: '멤버 없음' }, { status: 404 });

  const emailTemplate = DRIP_SEQUENCE.find(e => e.day === day);
  if (!emailTemplate) return NextResponse.json({ error: '이메일 없음' }, { status: 404 });

  const lead = leadStore.getById(member.leadId);
  const sub = calcSubscription(lead?.storeCount || 0);
  // QA-FIX #10: 사용자 입력 데이터에 HTML 이스케이프 적용 (이메일 XSS 방지)
  const vars = {
    company: escapeHtml(member.companyName),
    contactName: escapeHtml(member.contactName),
    leadId: member.leadId,
    riskScore: String(lead?.riskScore || 0),
    riskLevel: escapeHtml(member.riskLevel),
    storeCount: String(lead?.storeCount || 0),
    bizType: escapeHtml(lead?.bizType || '업종'),
    monthlyFee: sub.monthly.toLocaleString(),
  };

  const subject = fillTemplate(emailTemplate.subject, vars);
  let content = fillTemplate(emailTemplate.content, vars);

  // B2: AI 개인화 — API 키가 있으면 Claude로 이메일 본문 개인화
  if (hasAIKey) {
    try {
      const result = await callClaude({
        system: `당신은 B2B 법률 서비스 마케팅 전문가입니다.
드립 이메일의 기본 템플릿을 받아 해당 회사에 맞게 개인화합니다.
회사의 리스크 레벨, 이슈 수, 업종을 고려하여 더 설득력 있게 수정하세요.
원본의 핵심 메시지는 유지하되, 구체적인 데이터를 활용해 개인화하세요.
수정된 이메일 본문만 반환하세요. 마크다운이나 설명 없이 본문 텍스트만.`,
        messages: [{
          role: 'user',
          content: `회사 정보:
- 회사명: ${member.companyName}
- 업종: ${lead?.bizType || '미상'}
- 가맹점 수: ${lead?.storeCount || 0}개
- 리스크 레벨: ${member.riskLevel}
- 이슈 수: ${member.issueCount}건

기본 이메일 템플릿:
제목: ${subject}
본문:
${content}`,
        }],
        maxTokens: 2000,
      });
      content = result.text;
    } catch (err) {
      // AI 실패 시 기본 템플릿 그대로 사용
      console.error('[drip] AI 개인화 실패, 기본 템플릿 사용:', err);
    }
  }

  const html = buildDripEmailHtml(content, {
    subject, ctaText: emailTemplate.ctaText,
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}${fillTemplate(emailTemplate.ctaUrl, vars)}`,
    companyName: member.companyName, day, contactName: member.contactName,
  });

  await sendEmail({ to: member.contactEmail, subject, html });
  dripStore.markSent(memberId, day);

  return NextResponse.json({ ok: true, mock: !SMTP_CONFIGURED, aiPersonalized: hasAIKey });
}

// ── 헬퍼 함수 ────────────────────────────────────────────────
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (SMTP_CONFIGURED) {
    // H4: SMTP 실 발송 복원 — 주석 해제
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
    });
    await transporter.sendMail({
      from: `${process.env.SMTP_FROM_NAME || 'IBS 법률사무소'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to, subject, html,
    });
    console.log(`[drip] ✅ 실 발송 완료 → ${to}`);
  }
  // 개발 모드: 콘솔 출력은 intentional (이메일 확인용)
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n📧 [드립 이메일] To: ${to}\nSubject: ${subject}\nHTML length: ${html.length}\n`);
  }
}

function buildWelcomeEmail(member: DripMember): string {
  // SEC-FIX #3b: 사용자 데이터에 HTML 이스케이프 적용 (XSS 방지)
  const safeCompanyName = escapeHtml(member.companyName);
  const safeContactName = escapeHtml(member.contactName);
  const safeBizRegNo = escapeHtml(member.bizRegNo);
  const safeTempPassword = escapeHtml(member.tempPassword);
  return `
<div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:600px;margin:0 auto;background:#04091a;padding:32px;border-radius:16px">
  <div style="text-align:center;margin-bottom:28px">
    <h1 style="color:#c9a84c;font-size:22px;margin:0">⚖️ IBS 법률사무소</h1>
    <p style="color:#94a3b8;margin:4px 0 0;font-size:13px">프랜차이즈 전문 법률 서비스</p>
  </div>
  <div style="background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:12px;padding:20px;margin-bottom:20px">
    <h2 style="color:#4ade80;margin:0 0 8px;font-size:18px">🎉 회원 가입을 환영합니다!</h2>
    <p style="color:#f0f4ff;margin:0">${safeCompanyName}의 ${safeContactName}님이 IBS 법률사무소 회원으로 등록되었습니다.</p>
  </div>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:10px;background:rgba(255,255,255,0.05);color:#94a3b8;font-size:13px;border-radius:6px 0 0 6px">로그인 ID (사업자번호)</td><td style="padding:10px;background:rgba(255,255,255,0.05);color:#f0f4ff;font-size:13px;font-weight:bold">${safeBizRegNo}</td></tr>
    <tr><td style="padding:10px;color:#94a3b8;font-size:13px">임시 비밀번호</td><td style="padding:10px;color:#c9a84c;font-size:18px;font-weight:bold;letter-spacing:2px">${safeTempPassword}</td></tr>
  </table>
  <div style="text-align:center;margin:24px 0">
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/client-login" style="background:linear-gradient(135deg,#c9a84c,#e8c87a);color:#0a0e1a;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:900;display:inline-block;font-size:15px">
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
