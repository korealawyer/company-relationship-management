// src/lib/pendingClientService.ts — 신규 고객 전용 URL 토큰 + 알람 유틸
// callRecordingService와 독립되어 세 채널 모두에서 호출 가능

import { PendingClientStore, NotificationStore } from './mockStore';

export type { PendingClient, CrmNotification } from './mockStore';
export { PendingClientStore, NotificationStore };

/* ══════════════════════════════════════════════════════════════
   1. 신규 고객 전용 URL 토큰 서비스
   ══════════════════════════════════════════════════════════════ */

const TOKEN_KEY = 'ibs_intake_tokens_v1';
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

export interface IntakeToken {
    token: string;
    userId: string;
    userName: string;
    portal: 'lawyer' | 'sales';
    expiresAt: string;
    createdAt: string;
    usedAt?: string;
}

function loadTokens(): IntakeToken[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || '[]'); } catch { return []; }
}
function saveTokens(tokens: IntakeToken[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export const IntakeTokenService = {
    /** 새 전용 URL 토큰 생성 */
    generate(userId: string, userName: string, portal: 'lawyer' | 'sales'): IntakeToken {
        const tokens = loadTokens();
        const token: IntakeToken = {
            token: `ibs-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`,
            userId,
            userName,
            portal,
            expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
            createdAt: new Date().toISOString(),
        };
        tokens.unshift(token);
        // 만료된 토큰 자동 정리 (최대 50개 유지)
        const active = tokens.filter(t => new Date(t.expiresAt) > new Date()).slice(0, 50);
        saveTokens(active);
        return token;
    },

    /** 토큰 유효성 검사 */
    validate(token: string): IntakeToken | null {
        const tokens = loadTokens();
        const found = tokens.find(t => t.token === token);
        if (!found) return null;
        if (new Date(found.expiresAt) < new Date()) return null; // 만료
        return found;
    },

    /** 전용 URL 생성 */
    buildUrl(token: string): string {
        if (typeof window === 'undefined') return `/intake/${token}`;
        return `${window.location.origin}/intake/${token}`;
    },

    /** 토큰 사용 처리 */
    markUsed(token: string): void {
        const tokens = loadTokens();
        const t = tokens.find(x => x.token === token);
        if (t) { t.usedAt = new Date().toISOString(); saveTokens(tokens); }
    },
};

/* ══════════════════════════════════════════════════════════════
   2. AI 단계별 요약 생성 (노션 AI 회의록 스타일)
   ══════════════════════════════════════════════════════════════ */

const STEP_TEMPLATES = [
    { icon: '🗣️', label: '상황 파악', keywords: ['개인정보', '가맹', '계약', '분쟁', '손해'] },
    { icon: '⚖️', label: '법적 쟁점', keywords: ['위반', '소송', '청구', '배상', '과태료'] },
    { icon: '📋', label: '다음 조치', keywords: ['상담', '검토', '접수', '제출', '처리'] },
    { icon: '💰', label: '수임료 기대치', keywords: ['수임료', '비용', '예산', '계약'] },
];

export async function generateSummarySteps(
    transcript: string,
    clientName: string,
    category: string
): Promise<{ steps: string[]; fullSummary: string }> {
    // Mock AI 분석 (실제 LLM 호출로 교체 가능)
    await new Promise(r => setTimeout(r, 1200));

    const lower = transcript.toLowerCase();
    const steps: string[] = [
        `🗣️ **상황**: ${clientName}님이 ${category} 관련 법적 조언 요청. "${transcript.split('\n')[0]?.replace(/\[\d+:\d+\]\s?/, '').slice(0, 40)}..." 로 시작.`,
        `⚖️ **쟁점**: 녹취 내용 분석 결과 ${lower.includes('손해') ? '손해배상 청구 가능성' : lower.includes('계약') ? '계약 위반 여부 검토 필요' : '법적 리스크 사전 진단 필요'} 확인됨.`,
        `📋 **조치**: ${lower.includes('미팅') || lower.includes('상담') ? '대면 상담 일정 확정 권장' : '서면 자료 수집 후 검토 진행'}. 수임 여부 확인 필요.`,
        `💰 **수임료**: ${category.includes('형사') ? '형사 사건 기준 500만~1,500만원 예상' : category.includes('가사') ? '이혼/가사 사건 기준 300만~800만원 예상' : '사건 규모 확인 후 산정 예정'}.`,
    ];

    const fullSummary = `${clientName}님 ${category} 상담 — 법적 쟁점 확인, 수임 가능성 있음`;
    return { steps, fullSummary };
}

/* ══════════════════════════════════════════════════════════════
   3. 접수 완료 처리 (채널 공통)
   ══════════════════════════════════════════════════════════════ */

export async function registerPendingClient(params: {
    channel: 'recording' | 'intake_url' | 'meeting';
    clientName: string;
    clientPhone: string;
    category: string;
    transcript: string;
    recordingDuration?: number;
    sourcePortal: 'lawyer' | 'sales' | 'intake';
    sourceUserId?: string;
    sourceUserName?: string;
    token?: string;
}) {
    const { steps, fullSummary } = await generateSummarySteps(
        params.transcript,
        params.clientName,
        params.category
    );

    return PendingClientStore.save({
        ...params,
        summarySteps: steps,
        fullSummary,
        status: 'pending',
    });
}
