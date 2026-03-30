import nodemailer from 'nodemailer';
import { renderToStaticMarkup } from 'react-dom/server';
import ContractEmailTemplate from './src/components/crm/ContractEmailTemplate';
import React from 'react';

async function testEmail() {
  console.log('Generating Ethereal test account...');
  const testAccount = await nodemailer.createTestAccount();
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  const dummyCompany = {
    id: "test-uuid-1234",
    name: "주식회사 테스트컴퍼니",
    biz: "123-45-67890",
    email: "dhk@ibslaw.co.kr",
    phone: "010-1234-5678",
    status: "contract_sent",
    storeCount: 15,
    issues: [{ level: 'HIGH', title: '개인정보 과다 수집' }, { level: 'MED', title: '보유기간 명시 부족' }],
    riskLevel: "HIGH"
  };

  const htmlContent = renderToStaticMarkup(ContractEmailTemplate({ company: dummyCompany as any, plan: 'standard' }));

  console.log('Sending test email to dhk@ibslaw.co.kr...');
  const info = await transporter.sendMail({
    from: '"IBS 법률사무소" <info@ibslaw.co.kr>',
    to: "dhk@ibslaw.co.kr",
    subject: `[IBS 법률사무소] ${dummyCompany.name} 기업 법률 자문 서비스 계약서 발송`,
    html: htmlContent,
  });

  console.log('Message sent: %s', info.messageId);
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
}

testEmail().catch(console.error);
