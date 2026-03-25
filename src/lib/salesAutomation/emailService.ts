import { Company } from '../mockStore';

export interface AutoEmailConfig {
    enabled: boolean;
    triggerOnAnalyzed: boolean;    // 분석완료 → 즉시 발송
    autoFollowUp: boolean;         // 팔로업 시퀀스 활성화
}

const EMAIL_CONFIG_KEY = 'ibs_auto_email_config';

export const AutoEmailService = {
    getConfig(): AutoEmailConfig {
        if (typeof window === 'undefined') return { enabled: true, triggerOnAnalyzed: true, autoFollowUp: true };
        const raw = localStorage.getItem(EMAIL_CONFIG_KEY);
        return raw ? JSON.parse(raw) : { enabled: true, triggerOnAnalyzed: true, autoFollowUp: true };
    },

    setConfig(config: Partial<AutoEmailConfig>): void {
        const current = this.getConfig();
        localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify({ ...current, ...config }));
    },

    // 분석 완료 시 자동 이메일 발송 로직 (mock)
    shouldAutoSend(company: Company): boolean {
        const config = this.getConfig();
        return config.enabled && config.triggerOnAnalyzed && company.status === 'analyzed';
    },
};
