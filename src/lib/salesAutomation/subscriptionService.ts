import { Company, store } from '../store';

export const AutoSubscriptionService = {
    /** 서명 완료 → 구독 자동 전환 */
    convertToSubscribed(companyId: string): void {
        store.update(companyId, {
            status: 'subscribed' as any,
            plan: 'starter',
        });
    },

    /** 온보딩 이메일 발송 시뮬레이션 */
    sendOnboardingEmail(company: Company): string {
        const subject = `[IBS 법률사무소] ${company.name} 서비스 이용 안내`;
        const body = `${company.contactName || '담당자'}님, ${company.name}의 서비스 가입이 완료되었습니다.\n\n` +
            `■ 가입 플랜: Entry\n` +
            `■ 담당 변호사: ${company.assignedLawyer || '배정 예정'}\n` +
            `■ 대시보드: https://ibs-crm.vercel.app/dashboard\n\n` +
            `가입을 환영합니다! 편하신 시간에 대시보드에서 서류를 확인해 주세요.`;
        // 프로덕션: 실제 이메일 API 호출
        console.log(`[Onboarding Email] ${subject}\n${body}`);
        return subject;
    },
};
