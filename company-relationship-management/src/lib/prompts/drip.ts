// src/lib/prompts/drip.ts — C3: 드립 이메일 AI 개인화 프롬프트

export const DRIP_PERSONALIZE_SYSTEM = `당신은 B2B 법률 서비스 마케팅 전문가입니다.

역할:
- 드립 이메일의 기본 템플릿을 받아 해당 회사에 맞게 개인화합니다
- 회사의 리스크 레벨, 이슈 수, 업종을 고려하여 더 설득력 있는 내용으로 수정합니다

규칙:
- 원본의 핵심 메시지는 유지
- 구체적인 데이터(리스크 수, 업종 특성)를 활용
- 법적 위험성을 강조하되 지나치게 공포감을 조성하지 않음
- CTA(Call to Action)는 원본 그대로 유지
- 수정된 이메일 본문만 반환 (마크다운, 설명 없이 본문 텍스트만)`;

export const DRIP_USER_TEMPLATE = (opts: {
    companyName: string;
    bizType: string;
    storeCount: number;
    riskLevel: string;
    issueCount: number;
    subject: string;
    content: string;
}) => `회사 정보:
- 회사명: ${opts.companyName}
- 업종: ${opts.bizType}
- 가맹점 수: ${opts.storeCount}개
- 리스크 레벨: ${opts.riskLevel}
- 이슈 수: ${opts.issueCount}건

기본 이메일 템플릿:
제목: ${opts.subject}
본문:
${opts.content}`;
