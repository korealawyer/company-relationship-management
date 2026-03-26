// src/lib/automationEngine.ts — 송무 자동화 엔진 (P0 + P1)
// 5가지 자동화: 기한알림, 청구서발행, 미납재촉, 만족도설문, AI메모요약
// [MIGRATION NOTE] 프로덕션 환경(Vercel)에서는 클라이언트사이드(브라우저)에서 setInterval을 
// 도는 방식(Navbar 마운트 시 실행)이 메모리 누수 및 중복 실행(N명의 유저 동시접속 시 N번 실행)을 
// 초래하므로, Vercel Cron Jobs 또는 Supabase Edge Functions 예약 작업으로 이관되어야 합니다.
// 현재는 UI 에러 방지를 위한 Stub으로 대체되었습니다.

export function runDeadlineAlerts(): number {
    console.log('[AutoEngine] (Stub) 기한알림 발송 보류 (Vercel Cron 이관 예정)');
    return 0;
}

export function runPersonalDeadlineAlerts(): number {
    return 0;
}

export function getBillingRecords(): any[] { 
    return []; 
}

export function runMonthlyBilling(): number {
    console.log('[AutoEngine] (Stub) 월 청구서 자동 발행 보류 (Vercel Cron 이관 예정)');
    return 0;
}

export function runOverdueReminders(): number {
    return 0;
}

export function getAiSummary(litId: string): string | null {
    return null;
}

export async function generateAiMemoSummary(litId: string, notes: string): Promise<string> {
    console.log('[AutoEngine] (Stub) AI 요약 서버 호출 대기 중..');
    return `[AI 요약 대기 중] ${notes.slice(0, 50)}...`;
}

export function startAutomationEngine(): void {
    if (typeof window === 'undefined') return;
    console.log('[⚡ AutoEngine] 브라우저 기반 자동화 엔진은 프로덕션에서 비활성화되었습니다.');
    console.log('                 (Supabase Edge Func 또는 Vercel Cron 활용 요망)');
}

export function stopAutomationEngine(): void {
    // No-op
}

export function getAutomationStats() {
    return {
        deadlineAlerts: 0,
        billingIssued: 0,
        overdueReminders: 0,
        satisfactionSurveys: 0,
        aiMemoSummaries: 0,
        recentLogs: [] as any[],
        isRunning: false,
    };
}
