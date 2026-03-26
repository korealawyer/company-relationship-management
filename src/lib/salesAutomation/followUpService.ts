import { Company } from '../store';

export interface FollowUpStep {
    step: number;          // 1=D1, 2=D3, 3=D7
    dayOffset: number;     // 발송 후 경과일
    subject: string;
    sentAt?: string;
    opened?: boolean;
    status: 'pending' | 'sent' | 'opened' | 'skipped';
}

// D+1 1회 팔로업만 운영 — 그 이후는 영업팀 수동 판단
export const FOLLOW_UP_SEQUENCE: Omit<FollowUpStep, 'sentAt' | 'opened' | 'status'>[] = [
    { step: 1, dayOffset: 1, subject: '📊 [IBS 법률] 개인정보 리스크 진단 보고서를 확인해주세요' },
];

export const FollowUpService = {
    getSteps(company: Company): FollowUpStep[] {
        const emailSent = company.emailSentAt;
        if (!emailSent) return FOLLOW_UP_SEQUENCE.map(s => ({ ...s, status: 'pending' as const }));

        const sentDate = new Date(emailSent);
        const now = new Date();
        const daysSinceSent = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));

        // 답장을 받았으면 시퀀스 중단
        if (company.clientReplied) {
            return FOLLOW_UP_SEQUENCE.map(s => ({
                ...s,
                status: 'skipped' as const,
                sentAt: daysSinceSent >= s.dayOffset
                    ? new Date(sentDate.getTime() + s.dayOffset * 86400000).toISOString()
                    : undefined,
            }));
        }

        return FOLLOW_UP_SEQUENCE.map(s => {
            if (daysSinceSent >= s.dayOffset) {
                return {
                    ...s,
                    status: 'sent' as const,
                    sentAt: new Date(sentDate.getTime() + s.dayOffset * 86400000).toLocaleDateString('ko-KR'),
                    opened: Math.random() > 0.5,
                };
            }
            return { ...s, status: 'pending' as const };
        });
    },

    getNextStep(company: Company): FollowUpStep | null {
        const steps = this.getSteps(company);
        return steps.find(s => s.status === 'pending') || null;
    },

    getCurrentStep(company: Company): number {
        const steps = this.getSteps(company);
        const sent = steps.filter(s => s.status === 'sent' || s.status === 'opened');
        return sent.length;
    },
};
