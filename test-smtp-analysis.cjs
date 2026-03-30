const nodemailer = require("nodemailer");

async function main() {
  const transporter = nodemailer.createTransport({
    host: "smtp.worksmobile.com",
    port: 465,
    secure: true,
    auth: {
      user: "info@ibslaw.co.kr",
      pass: "1qazxsw@",
    },
  });

  const htmlContent = `
<div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#0f172a;padding:20px;border-radius:12px;margin-bottom:24px">
    <h2 style="color:#c9a84c;margin:0">IBS 법률사무소</h2>
    <p style="color:#94a3b8;margin:4px 0 0">전문 법률 검토 의견서</p>
  </div>
  <h3 style="color:#1e293b">📄 개인정보처리방침 수정완본 안내</h3>
  <div style="background:#eff6ff;border-left:4px solid #2563eb;padding:16px;margin:16px 0;border-radius:0 8px 8px 0">
    <p style="margin:0;color:#1e40af;font-weight:bold">테스트 기업 개인정보처리방침 수정완본</p>
    <p style="margin:4px 0 0;color:#3b82f6;font-size:12px">문서번호: DOC-20260330-X1 | 작성일: ${new Date().toLocaleDateString('ko-KR')}</p>
  </div>
  <p style="color:#374151;line-height:1.6">당사와 자문 계약을 체결해주셔서 감사합니다.<br/>위 수정완본 및 법률 검토의견서가 고객 대시보드 문서함에 등록되어 안내해 드립니다.</p>
  <div style="text-align:center;margin:28px 0">
    <a href="https://ibslaw.co.kr/dashboard" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;display:inline-block">
      고객 전용 대시보드 열기 →
    </a>
  </div>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
  <p style="color:#94a3b8;font-size:12px">발신: IBS 법률사무소 &lt;info@ibslaw.co.kr&gt; | 본 메일은 발신 전용입니다.</p>
</div>
  `;

  try {
    const info = await transporter.sendMail({
      from: "IBS 법률사무소 <info@ibslaw.co.kr>",
      to: "dhk@ibslaw.co.kr",
      subject: "[IBS 법률사무소] 테스트 기업 개인정보처리방침 법률 분석 문서 발송",
      html: htmlContent,
    });
    console.log("Analysis mail sent: %s", info.messageId);
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

main();
