import { Company } from '@/lib/types';

export const PLAN_DETAILS: Record<string, { name: string; price: string; features: string[] }> = {
  starter: {
    name: 'Entry',
    price: '월 33만원',
    features: ['본사 법률자문 (무제한)', '변호사 검토 의견서', '법률 문서 2,000종 제공'],
  },
  standard: {
    name: 'Growth',
    price: '월 55만원',
    features: ['Entry 전체 포함', '분기별 정기 검토', '가맹점 법률상담 BACKCALL', '법률 문서 2,000종 제공'],
  },
  premium: {
    name: 'Scale',
    price: '월 110만원',
    features: ['Growth 전체 포함', '전담 파트너 변호사 배정', '임직원 법률상담 포함', '분기 리스크 브리핑', 'EAP 심리상담'],
  },
};

export function renderContractEmailTemplateHtml(company: Company, plan: 'starter' | 'standard' | 'premium' = 'standard') {
  const planInfo = PLAN_DETAILS[plan] || PLAN_DETAILS.standard;
  const highIssues = company.issues?.filter(i => i.level === 'HIGH').length || 0;
  const totalIssues = company.issues?.length || company.issueCount || 0;

  return `
    <div style="max-width: 640px; margin: 0 auto; font-family: 'Pretendard', -apple-system, sans-serif;">
        <!-- 헤더 -->
        <div style="background: linear-gradient(135deg, #04091a 0%, #0d1b3e 100%); padding: 32px 40px; border-radius: 16px 16px 0 0;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #e8c87a, #c9a84c); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; color: #04091a;">
                    IBS
                </div>
                <div>
                    <p style="color: #f0f4ff; font-weight: 800; font-size: 16px; margin: 0;">IBS 법률사무소</p>
                    <p style="color: rgba(240,244,255,0.5); font-size: 12px; margin: 0;">프랜차이즈 전문 법률 자문</p>
                </div>
            </div>
            <h1 style="color: #e8c87a; font-size: 22px; font-weight: 900; margin: 0; line-height: 1.4;">
                법률 자문 서비스 계약서
            </h1>
            <p style="color: rgba(240,244,255,0.6); font-size: 14px; margin: 8px 0 0;">
                아래 내용을 확인하시고 전자서명을 진행해 주세요.
            </p>
        </div>

        <!-- 계약 요약 -->
        <div style="background: #ffffff; padding: 32px 40px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            <!-- 기업 정보 -->
            <div style="background: #f8f9fc; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
                <p style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">
                    계약 대상 기업
                </p>
                <p style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0 0 4px;">${company.name}</p>
                <div style="display: flex; gap: 16px; font-size: 13px; color: #64748b;">
                    <span>사업자등록번호: ${company.biz || '-'}</span>
                    <span>가맹점: ${(company.storeCount || 0).toLocaleString()}개</span>
                </div>
            </div>

            <!-- 분석 결과 요약 -->
            <div style="background: #fef2f2; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; border: 1px solid #fecaca;">
                <p style="font-size: 11px; font-weight: 800; color: #dc2626; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">
                    법률 검토 결과 요약
                </p>
                <div style="display: flex; gap: 24px;">
                    <div>
                        <p style="font-size: 28px; font-weight: 900; color: #dc2626; margin: 0;">${totalIssues}건</p>
                        <p style="font-size: 12px; color: #64748b; margin: 2px 0 0;">발견 이슈</p>
                    </div>
                    <div>
                        <p style="font-size: 28px; font-weight: 900; color: #dc2626; margin: 0;">${highIssues}건</p>
                        <p style="font-size: 12px; color: #64748b; margin: 2px 0 0;">고위험 (HIGH)</p>
                    </div>
                    <div>
                        <p style="font-size: 28px; font-weight: 900; color: ${company.riskLevel === 'HIGH' ? '#dc2626' : '#d97706'}; margin: 0;">
                            ${company.riskLevel || 'N/A'}
                        </p>
                        <p style="font-size: 12px; color: #64748b; margin: 2px 0 0;">위험 등급</p>
                    </div>
                </div>
            </div>

            <!-- 플랜 정보 -->
            <div style="background: #fffbeb; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; border: 1px solid #fde68a;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <p style="font-size: 11px; font-weight: 800; color: #b8960a; text-transform: uppercase; letter-spacing: 1px; margin: 0;">
                        선택 플랜
                    </p>
                    <span style="background: linear-gradient(135deg, #e8c87a, #c9a84c); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 900; color: #04091a;">
                        ${planInfo.name}
                    </span>
                </div>
                <p style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 0 0 12px;">${planInfo.price}</p>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    ${planInfo.features.map(f => `
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569;">
                            <span style="color: #16a34a; font-weight: 700;">✓</span> ${f}
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- CTA 버튼 -->
            <div style="text-align: center; margin: 32px 0 16px;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://ibsbase.com'}/checkout?plan=${plan}&company=${encodeURIComponent(company.name)}"
                   style="display: inline-block; background: linear-gradient(135deg, #e8c87a, #c9a84c); color: #04091a; padding: 14px 40px; border-radius: 12px; font-weight: 900; font-size: 15px; text-decoration: none; box-shadow: 0 4px 16px rgba(201,168,76,0.3);">
                    ✍️ 전자서명 진행하기
                </a>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 12px;">
                    버튼 클릭 시 전자서명 페이지로 이동합니다
                </p>
            </div>
        </div>

        <!-- 법적 고지 -->
        <div style="background: #f8f9fc; padding: 24px 40px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 8px;">법적 고지</p>
            <p style="font-size: 11px; color: #94a3b8; line-height: 1.6; margin: 0;">
                본 계약서는 「전자서명법」 제3조에 따른 전자서명으로 체결됩니다.
                전자서명된 계약서는 서면 계약과 동일한 법적 효력을 가집니다.
                계약 체결 후 30일 이내 청약 철회가 가능하며, 이후에는 약정 기간에 따라 적용됩니다.
            </p>
            <div style="border-top: 1px solid #e5e7eb; margin-top: 16px; padding-top: 16px;">
                <p style="font-size: 11px; color: #94a3b8; margin: 0 0 4px;">
                    IBS 법률사무소 | 02-598-8518 | legal@ibslaw.co.kr
                </p>
                <p style="font-size: 11px; color: #94a3b8; margin: 0 0 2px;">서울시 서초구 서초대로 272 IBS빌딩</p>
                <p style="font-size: 11px; color: #94a3b8; margin: 0;">서울시 서초구 서초대로 270 IBS법률상담센터</p>
            </div>
        </div>
    </div>
    `;
}

export function buildHookEmailHtml(vars: Record<string, string>, customMsg: string, baseUrl: string = ''): string {
  const lawyerName = vars.lawyerName || '';
  const trackOpen = `${baseUrl}/api/track?lid=${vars.leadId}&type=open`;
  const reportUrl = `${baseUrl}/?claim=${vars.leadId}`;
  const trackClick = `${baseUrl}/api/track?lid=${vars.leadId}&type=click&url=${encodeURIComponent(reportUrl)}`;
  const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${vars.unsubscribeToken}`;
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Apple SD Gothic Neo',Pretendard,sans-serif">
<div style="max-width:768px;margin:24px auto;padding:0;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">

  <!-- 헤더 -->
  <div style="background:#04091a;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center">
    <img src="${baseUrl}/ibs_logo.png" alt="IBS 법률사무소" style="height:36px;width:auto;margin:0 auto;display:block;" />
  </div>

  <!-- 리스크 요약 배너 -->
  <div style="background:#fef2f2;border-left:4px solid #f87171;padding:24px 40px;margin:0">
    <p style="color:#dc2626;font-size:16px;font-weight:900;margin:0 0 8px">⚠️ 개인정보처리방침 검토 결과 — ${vars.issueCount}건 시정 권고</p>
    <p style="color:#374151;font-size:14px;margin:0">개인정보보호법 위반 시 최대 과징금 <strong>3,000만원</strong>이 부과될 수 있는 사항이 확인되었습니다.</p>
  </div>

  <!-- 본문 -->
  <div style="background:#ffffff;padding:36px 40px 32px">
    <p style="color:#1e293b;font-size:16px;font-weight:bold;margin:0 0 24px">${vars.contactName} 담당자님께</p>

    ${lawyerName ? `
    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 16px">
      안녕하세요.<br/>
      <strong>IBS 법률사무소</strong> 개인정보보호 전문 <strong>${lawyerName} 변호사</strong>입니다.
    </p>
    ` : `
    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 16px">
      안녕하세요.<br/>
      <strong>IBS 법률사무소</strong> 개인정보보호 컴플라이언스 팀입니다.
    </p>
    `}

    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 16px">
      저희 법률사무소에서는 선도적인 기업들의 리스크 선제 대응과 컴플라이언스 강화를 위해,
      주요 기업의 개인정보처리방침에 대한 심층 법률 검토를 지원하고 있습니다.
    </p>

    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 20px">
      이번에 <strong>${vars.company}</strong>의 개인정보처리방침을 검토한 결과,
      <strong style="color:#dc2626">개인정보보호법상 시정이 필요한 사항 ${vars.issueCount}건</strong>이 확인되어
      아래와 같이 안내드립니다.
    </p>



    <!-- 검토 결과 요약 -->
    <p style="color:#1e293b;font-size:14px;font-weight:bold;margin:0 0 16px;padding-bottom:10px;border-bottom:2px solid #e2e8f0">📋 주요 검토 결과 요약</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 28px">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:12px 14px;text-align:left;color:#64748b;font-size:13px;border-bottom:2px solid #e2e8f0;word-break:keep-all">검토 항목</th>
          <th style="padding:12px 14px;text-align:center;color:#64748b;font-size:13px;border-bottom:2px solid #e2e8f0;white-space:nowrap">위험도</th>
          <th style="padding:12px 14px;text-align:left;color:#64748b;font-size:13px;border-bottom:2px solid #e2e8f0;word-break:keep-all">관련 법조문</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="padding:12px 14px;font-size:14px;color:#1e293b;border-bottom:1px solid #f1f5f9;word-break:keep-all">수집항목 과다수집</td><td style="padding:12px;text-align:center;white-space:nowrap"><span style="display:inline-block;white-space:nowrap;background:#fef2f2;color:#dc2626;font-size:12px;font-weight:bold;padding:4px 10px;border-radius:20px">고위험</span></td><td style="padding:12px 14px;font-size:13px;color:#64748b;word-break:keep-all">개인정보보호법 제16조</td></tr>
        <tr><td style="padding:12px 14px;font-size:14px;color:#1e293b;border-bottom:1px solid #f1f5f9;word-break:keep-all">제3자 제공 미명시</td><td style="padding:12px;text-align:center;white-space:nowrap"><span style="display:inline-block;white-space:nowrap;background:#fef2f2;color:#dc2626;font-size:12px;font-weight:bold;padding:4px 10px;border-radius:20px">고위험</span></td><td style="padding:12px 14px;font-size:13px;color:#64748b;word-break:keep-all">개인정보보호법 제17조</td></tr>
        <tr><td style="padding:12px 14px;font-size:14px;color:#1e293b;word-break:keep-all">보유기간 일부 누락</td><td style="padding:12px;text-align:center;white-space:nowrap"><span style="display:inline-block;white-space:nowrap;background:#fffbeb;color:#d97706;font-size:12px;font-weight:bold;padding:4px 10px;border-radius:20px">주의</span></td><td style="padding:12px 14px;font-size:13px;color:#64748b;word-break:keep-all">개인정보보호법 제21조</td></tr>
      </tbody>
    </table>

    <!-- 담당 변호사 의견 (제목 제거됨) -->
    ${customMsg ? `<div style="background:#fef9ec;border-left:4px solid #c9a84c;padding:16px;margin-bottom:24px;border-radius:0 8px 8px 0">
      <p style="color:#374151;font-size:13px;margin:0;line-height:1.7">${customMsg.replace(/\\n/g, '<br/>')}</p>
    </div>` : ''}

    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 20px">
      상세 검토 결과를 별도로 준비해두었으니, 아래 버튼을 통해 확인해주시기 바랍니다.<br/>
      검토 결과에 대해 궁금하신 사항이 있으시면 언제든 연락 주시기 바랍니다.
    </p>

    <!-- CTA -->
    <div style="text-align:center;padding:24px 0 12px">
      <a href="${trackClick}" style="background:linear-gradient(135deg,#e8c87a,#c9a84c);color:#04091a;text-decoration:none;padding:18px 48px;border-radius:12px;font-weight:900;font-size:16px;display:inline-block;box-shadow:0 4px 16px rgba(201,168,76,0.3)">
        검토 결과 전문 보기 →
      </a>
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:13px;margin:16px 0 0">클릭 시 귀사 개인정보처리방침 검토 보고서를 확인하실 수 있습니다</p>

    <!-- 서명 -->
    <div style="margin-top:56px;padding-top:40px;padding-bottom:0px;border-top:1px solid #e2e8f0">
      <div style="text-align:right;margin-bottom:32px;">
        <p style="color:#374151;font-size:14px;line-height:1.6;margin:0">귀사의 안전한 개인정보 관리를 위해 최선을 다하겠습니다.</p><p style="color:#374151;font-size:14px;line-height:1.6;margin:0">감사합니다. </p>
      </div>
      <div style="display:flex;align-items:center;justify-content:flex-end;gap:16px">
        ${lawyerName ? `
        <div style="text-align:right;">
          <p style="color:#1e293b;font-size:16px;font-weight:900;margin:0 0 3px">${lawyerName} 변호사</p>
          <p style="color:#64748b;font-size:13px;margin:0 0 2px">IBS 법률사무소 · 개인정보보호 전문</p>
          <p style="color:#64748b;font-size:13px;margin:0 0 2px">대한변호사협회 등록 · 개인정보관리사(CPPG)</p>
          <p style="color:#64748b;font-size:13px;margin:0">직통 02-598-8518 | info@ibslaw.co.kr</p>
        </div>
        ` : `
        <div style="text-align:right;">
          <p style="color:#1e293b;font-size:16px;font-weight:900;margin:0 0 3px">IBS 법률사무소 개인정보보호 팀</p>
          <p style="color:#64748b;font-size:13px;margin:0">02-598-8518 | info@ibslaw.co.kr</p>
        </div>
        `}
      </div>
    </div>
  </div>

  <!-- 실적 배너 -->
  <div style="background:#0f172a;padding:28px 40px;display:flex;justify-content:space-around;text-align:center">
    <div><p style="color:#c9a84c;font-size:24px;font-weight:900;margin:0">1,000억+</p><p style="color:#64748b;font-size:12px;margin:6px 0 0">자문 기업 엑시트</p></div>
    <div><p style="color:#c9a84c;font-size:24px;font-weight:900;margin:0">80,000+</p><p style="color:#64748b;font-size:12px;margin:6px 0 0">법률 자문 건수</p></div>
    <div><p style="color:#c9a84c;font-size:24px;font-weight:900;margin:0">45,000+</p><p style="color:#64748b;font-size:12px;margin:6px 0 0">지원회원</p></div>
  </div>

  <!-- 풋터 -->
  <div style="background:#04091a;border-radius:0 0 16px 16px;padding:32px 40px;text-align:center;border-top:1px solid #1e293b">
    <p style="color:#ffffff;font-size:14px;font-weight:bold;margin:0 0 8px">IBS 법률사무소 | 대표번호 02-598-8518 | info@ibslaw.co.kr | <a href="${unsubscribeUrl}" style="color:#94a3b8;font-weight:normal;text-decoration:underline;">수신거부</a></p>
    <p style="color:#e2e8f0;font-size:13px;margin:0 0 4px">서울시 서초구 서초대로 272 IBS빌딩</p>
    <p style="color:#e2e8f0;font-size:13px;margin:0">서울시 서초구 서초대로 270 IBS법률상담센터</p>
  </div>

  <!-- 트래킹 픽셀 (이메일 열람 추적) -->
  <img src="${trackOpen}" width="1" height="1" style="display:none" alt="" />
</div>
</body>
</html>`;
}
