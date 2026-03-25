import { Company } from '../mockStore';

export interface AIMemoResult {
    summary: string;
    keyPoints: string[];
    nextAction: string;
    nextActionType: 'send_contract' | 'schedule_meeting' | 'follow_up_call' | 'send_email' | 'escalate';
    confidence: number;   // 0~100
}

export const AIMemoService = {
    async analyze(company: Company, memo: string): Promise<AIMemoResult> {
        // Mock AI 분석 (실제 환경에서는 API 호출)
        await new Promise(resolve => setTimeout(resolve, 1200));

        const lowerMemo = memo.toLowerCase();
        const hasPositive = ['긍정', '관심', '좋', '검토', '계약', '가능', '동의', '확인'].some(w => memo.includes(w));
        const hasNegative = ['거절', '불필요', '나중', '다음', '보류', '관심없'].some(w => memo.includes(w));
        const hasCallback = ['콜백', '연락', '다시', '시간'].some(w => memo.includes(w));
        const hasMeeting = ['미팅', '방문', '만남', '상담'].some(w => memo.includes(w));

        let nextAction: string;
        let nextActionType: AIMemoResult['nextActionType'];
        let confidence: number;

        if (hasPositive && !hasNegative) {
            if (hasMeeting) {
                nextAction = '미팅 일정 잡기 — 고객 관심도 높음';
                nextActionType = 'schedule_meeting';
                confidence = 85;
            } else if (['client_replied', 'client_viewed'].includes(company.status)) {
                nextAction = '계약서 발송 추천 — 전환 가능성 높음';
                nextActionType = 'send_contract';
                confidence = 80;
            } else {
                nextAction = '팔로업 이메일 발송 — 관심 유지';
                nextActionType = 'send_email';
                confidence = 70;
            }
        } else if (hasCallback) {
            nextAction = '콜백 예약 — 고객 요청';
            nextActionType = 'follow_up_call';
            confidence = 75;
        } else if (hasNegative) {
            nextAction = '7일 후 재연락 — 시간 확보';
            nextActionType = 'follow_up_call';
            confidence = 40;
        } else {
            nextAction = '팔로업 이메일 발송 — 추가 정보 제공';
            nextActionType = 'send_email';
            confidence = 55;
        }

        // 핵심 키포인트 추출 (mock)
        const sentences = memo.split(/[.!?\n]+/).filter(s => s.trim().length > 3);
        const keyPoints = sentences.length > 0
            ? sentences.slice(0, 3).map(s => s.trim())
            : ['통화 내용 기록됨'];

        const summary = sentences.length > 0
            ? `${company.contactName || '담당자'}와 통화 완료. ${keyPoints[0]}.`
            : `${company.name} 통화 완료 — 상세 내용 기록됨`;

        return { summary, keyPoints, nextAction, nextActionType, confidence };
    },
};
