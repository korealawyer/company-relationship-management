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
