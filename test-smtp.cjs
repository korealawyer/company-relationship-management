const nodemailer = require("nodemailer");

async function main() {
  const transporter = nodemailer.createTransport({
    host: "smtp.worksmobile.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: "info@ibslaw.co.kr",
      pass: "1qazxsw@",
    },
  });

  try {
    const info = await transporter.sendMail({
      from: "IBS 법률사무소 <info@ibslaw.co.kr>",
      to: "dhk@ibslaw.co.kr",
      subject: "이 이메일은 테스트 발송입니다",
      text: "안녕하세요. CRM 시스템 연동 테스트를 위한 이메일입니다.",
      html: "<b>안녕하세요. CRM 시스템 연동 테스트를 위한 본문입니다.</b>",
    });
    console.log("Message sent: %s", info.messageId);
    console.log("SUCCESS!");
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

main();
