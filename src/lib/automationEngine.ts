// src/lib/automationEngine.ts — 송무 자동화 엔진 (P0 + P1)
// 5가지 자동화: 기한알림, 청구서발행, 미납재촉, 만족도설문(trigger in store), AI메모요약

import { store, personalStore, addLog, LitigationCase } from './store';

// ── 실행 중복 방지 ──
const LAST_RUN_KEY = 'ibs_auto_lastrun';
const ENGINE_INTERVAL = 30_000; // 30초

interface LastRunTimestamps {
    deadlineAlert: number;
    monthlyBilling: number;
    overdueReminder: number;
}

function getLastRun(): LastRunTimestamps {
    if (typeof window === 'undefined') return { deadlineAlert: 0, monthlyBilling: 0, overdueReminder: 0 };
    try { return JSON.parse(localStorage.getItem(LAST_RUN_KEY) || 'null') || { deadlineAlert: 0, monthlyBilling: 0, overdueReminder: 0 }; }
    catch { return { deadlineAlert: 0, monthlyBilling: 0, overdueReminder: 0 }; }
}

function setLastRun(patch: Partial<LastRunTimestamps>) {
    if (typeof window === 'undefined') return;
    const cur = getLastRun();
    localStorage.setItem(LAST_RUN_KEY, JSON.stringify({ ...cur, ...patch }));
}

// ═══════════════════════════════════════════════════════════════
// P0-1: 기한 D-day 알림 자동 발송
// ═══════════════════════════════════════════════════════════════
const ALERT_DAYS = [30, 14, 7, 3, 0];
const SENT_ALERTS_KEY = 'ibs_sent_alerts';

function getSentAlerts(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try { return new Set(JSON.parse(localStorage.getItem(SENT_ALERTS_KEY) || '[]')); }
    catch { return new Set(); }
}

function addSentAlert(key: string) {
    const set = getSentAlerts();
    set.add(key);
    // 최대 200개 유지
    const arr = Array.from(set);
    if (arr.length > 200) arr.splice(0, arr.length - 200);
    localStorage.setItem(SENT_ALERTS_KEY, JSON.stringify(arr));
}

export function runDeadlineAlerts(): number {
    const settings = store.getAutoSettings();
    if (!settings.autoDeadlineAlert) return 0;

    const cases = store.getLitAll();
    const now = Date.now();
    const sentAlerts = getSentAlerts();
    let count = 0;

    for (const lit of cases) {
        for (const d of lit.deadlines) {
            if (d.completed) continue;
            const daysLeft = Math.ceil((new Date(d.dueDate).getTime() - now) / 86400000);

            for (const alertDay of ALERT_DAYS) {
                if (daysLeft <= alertDay) {
                    const alertKey = `${lit.id}:${d.id}:D-${alertDay}`;
                    if (sentAlerts.has(alertKey)) continue;

                    const urgent = alertDay <= 3;
                    const channel = alertDay <= 7 ? '카카오 + 이메일' : '이메일';
                    const escalate = alertDay <= 3 ? ` (대표 변호사 참조)` : '';

                    addLog({
                        type: 'deadline_alert',
                        label: `기한 알림 D-${alertDay}${urgent ? ' ⚠ 긴급' : ''}`,
                        companyName: lit.companyName,
                        detail: `[${d.label}] ${d.dueDate} (${daysLeft}일 남음) → ${lit.assignedLawyer || '미배정'}에게 ${channel} 발송${escalate}`,
                        channel,
                    });
                    addSentAlert(alertKey);
                    count++;
                    break; // 가장 적합한 알림 단계만 발송
                }
            }
        }
    }
    return count;
}

export function runPersonalDeadlineAlerts(): number {
    const settings = store.getAutoSettings();
    if (!settings.autoDeadlineAlert) return 0;

    const cases = personalStore.getAll();
    const now = Date.now();
    const sentAlerts = getSentAlerts();
    let count = 0;

    for (const lit of cases) {
        for (const d of lit.deadlines) {
            if (d.completed) continue;
            const daysLeft = Math.ceil((new Date(d.dueDate).getTime() - now) / 86400000);

            for (const alertDay of ALERT_DAYS) {
                if (daysLeft <= alertDay) {
                    const alertKey = `personal_lit:${lit.id}:${d.id}:D-${alertDay}`;
                    if (sentAlerts.has(alertKey)) continue;

                    const urgent = alertDay <= 3;
                    const channel = alertDay <= 7 ? '카카오 + 이메일' : '이메일';
                    const escalate = alertDay <= 3 ? ` (대표 변호사 참조)` : '';

                    addLog({
                        type: 'deadline_alert',
                        label: `개인기한 알림 D-${alertDay}${urgent ? ' ⚠ 긴급' : ''}`,
                        companyName: lit.clientName,
                        detail: `[${d.label}] ${d.dueDate} (${daysLeft}일 남음) → ${lit.assignedLawyer || '미배정'}에게 ${channel} 발송${escalate}`,
                        channel,
                    });
                    addSentAlert(alertKey);
                    count++;
                    break; // 가장 적합한 알림 단계만 발송
                }
            }
        }
    }
    return count;
}

// ═══════════════════════════════════════════════════════════════
// P0-2: 월 자동 청구서 발행
// ═══════════════════════════════════════════════════════════════
const BILLING_KEY = 'ibs_auto_billing';
import { calcPrice as calcPriceFormula } from './pricing';
// 레거시 PLAN_PRICE 폴백 (storeCount 없는 경우)
const PLAN_PRICE: Record<string, number> = {
    starter: 330000, standard: 550000, premium: 1100000, none: 0,
};

interface AutoBillingRecord {
    id: string;
    companyId: string;
    companyName: string;
    plan: string;
    amount: number;
    monthKey: string; // '2026-03'
    createdAt: string;
    status: 'issued' | 'paid' | 'pending';
    invoiceNo: string;
}

function loadBillingRecords(): AutoBillingRecord[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(BILLING_KEY) || '[]'); }
    catch { return []; }
}

function saveBillingRecords(records: AutoBillingRecord[]) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(BILLING_KEY, JSON.stringify(records));
    }
}

export function getBillingRecords(): AutoBillingRecord[] { return loadBillingRecords(); }

export function runMonthlyBilling(): number {
    const settings = store.getAutoSettings();
    if (!settings.autoMonthlyBilling) return 0;

    const companies = store.getAll();
    const subscribed = companies.filter(c => c.status === 'subscribed' && c.plan && c.plan !== 'none');
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const records = loadBillingRecords();
    let count = 0;

    for (const c of subscribed) {
        const price = PLAN_PRICE[c.plan] || 0;
        if (price === 0) continue;

        // 이번 달 이미 발행했는지 확인
        const exists = records.find(r => r.companyId === c.id && r.monthKey === monthKey);
        if (exists) continue;

        const record: AutoBillingRecord = {
            id: `bill-${c.id}-${monthKey}`,
            companyId: c.id,
            companyName: c.name,
            plan: c.plan,
            amount: price,
            monthKey,
            createdAt: now.toISOString(),
            status: 'issued',
            invoiceNo: `INV-${monthKey.replace('-', '')}-${c.id.slice(-4)}`,
        };
        records.unshift(record);

        addLog({
            type: 'auto_billing',
            label: '월 청구서 자동 발행',
            companyName: c.name,
            detail: `${monthKey}월 ${c.plan} 플랜 청구서 (₩${price.toLocaleString()}) → ${c.email}로 발송`,
            channel: '이메일',
            amount: price,
        });
        count++;
    }

    if (count > 0) saveBillingRecords(records);
    return count;
}

// ═══════════════════════════════════════════════════════════════
// P0-3: 미납 재촉 알림 (D+1/7/14)
// ═══════════════════════════════════════════════════════════════
const OVERDUE_SENT_KEY = 'ibs_overdue_sent';
const OVERDUE_STAGES = [
    { days: 1,  channel: '카카오',           label: '1차 납부 안내' },
    { days: 7,  channel: '카카오 + 이메일',   label: '2차 독촉 (변호사 CC)' },
    { days: 14, channel: '카카오 + 이메일',   label: '3차 에스컬레이션 (대표 CC)' },
];

function getOverdueSent(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try { return new Set(JSON.parse(localStorage.getItem(OVERDUE_SENT_KEY) || '[]')); }
    catch { return new Set(); }
}

function addOverdueSent(key: string) {
    const set = getOverdueSent();
    set.add(key);
    const arr = Array.from(set);
    if (arr.length > 200) arr.splice(0, arr.length - 200);
    localStorage.setItem(OVERDUE_SENT_KEY, JSON.stringify(arr));
}

export function runOverdueReminders(): number {
    const settings = store.getAutoSettings();
    if (!settings.autoOverdueReminder) return 0;

    const records = loadBillingRecords();
    const now = Date.now();
    const overdueSent = getOverdueSent();
    let count = 0;

    for (const bill of records) {
        if (bill.status === 'paid') continue;

        const createdTime = new Date(bill.createdAt).getTime();
        const daysSinceIssued = Math.floor((now - createdTime) / 86400000);

        for (const stage of OVERDUE_STAGES) {
            if (daysSinceIssued >= stage.days) {
                const alertKey = `${bill.id}:overdue-D+${stage.days}`;
                if (overdueSent.has(alertKey)) continue;

                addLog({
                    type: 'overdue_reminder',
                    label: `미납 재촉 ${stage.label}`,
                    companyName: bill.companyName,
                    detail: `청구서 ${bill.invoiceNo} (₩${bill.amount.toLocaleString()}) 미납 D+${daysSinceIssued} → ${stage.channel} 발송`,
                    channel: stage.channel,
                    amount: bill.amount,
                });
                addOverdueSent(alertKey);
                count++;
            }
        }
    }
    return count;
}

// ═══════════════════════════════════════════════════════════════
// P1-2: AI 메모 자동 요약
// ═══════════════════════════════════════════════════════════════
const AI_SUMMARIES_KEY = 'ibs_ai_summaries';

interface AiMemoSummary {
    litId: string;
    originalNotes: string;
    summary: string;
    createdAt: string;
}

function loadSummaries(): AiMemoSummary[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(AI_SUMMARIES_KEY) || '[]'); }
    catch { return []; }
}

function saveSummaries(summaries: AiMemoSummary[]) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(AI_SUMMARIES_KEY, JSON.stringify(summaries));
    }
}

export function getAiSummary(litId: string): string | null {
    const all = loadSummaries();
    const s = all.find(x => x.litId === litId);
    return s?.summary || null;
}

// AI 요약 시뮬레이션 (실제 환경에서는 GPT-4o API 호출)
function simulateAiSummary(notes: string): string {
    const lines = notes.split('\n').filter(l => l.trim());
    if (lines.length === 0) return '메모 없음';

    // 핵심 키워드 추출 시뮬레이션
    const keywords: string[] = [];
    const keywordPatterns = ['계약', '위반', '손해', '합의', '소장', '준비서면', '증거', '기일', '판결', '자문', '검토', '이슈', '리스크', '플랜', '구독', '개인정보'];
    for (const kw of keywordPatterns) {
        if (notes.includes(kw)) keywords.push(kw);
    }

    const summary = [
        `📋 메모 요약 (${lines.length}줄 → AI 분석)`,
        keywords.length > 0 ? `🔑 핵심 키워드: ${keywords.join(', ')}` : '',
        `📝 요지: ${lines[0].slice(0, 80)}${lines[0].length > 80 ? '...' : ''}`,
        lines.length > 1 ? `   + ${lines.length - 1}건 추가 사항` : '',
    ].filter(Boolean).join('\n');

    return summary;
}

export function generateAiMemoSummary(litId: string, notes: string): string {
    const settings = store.getAutoSettings();
    if (!settings.autoAiMemoSummary || !notes.trim()) return '';

    const summary = simulateAiSummary(notes);
    const summaries = loadSummaries();

    // 기존 요약 업데이트 또는 추가
    const idx = summaries.findIndex(s => s.litId === litId);
    const entry: AiMemoSummary = { litId, originalNotes: notes, summary, createdAt: new Date().toISOString() };
    if (idx >= 0) summaries[idx] = entry;
    else summaries.unshift(entry);

    saveSummaries(summaries);

    const lit = store.getLitById(litId);
    addLog({
        type: 'ai_memo_summary',
        label: 'AI 메모 요약 생성',
        companyName: lit?.companyName,
        detail: `사건 메모 → AI 자동 요약 완료 (${notes.length}자 → ${summary.length}자)`,
    });

    return summary;
}


// ═══════════════════════════════════════════════════════════════
// 통합 엔진 — 30초마다 자동 실행
// ═══════════════════════════════════════════════════════════════
let _engineTimer: ReturnType<typeof setInterval> | null = null;
let _engineRunning = false;

function runAll() {
    if (_engineRunning) return;
    _engineRunning = true;
    try {
        const lastRun = getLastRun();
        const now = Date.now();

        // 기한 알림: 1시간마다 (데모에서는 30초)
        if (now - lastRun.deadlineAlert > 60_000) {
            runDeadlineAlerts();
            runPersonalDeadlineAlerts();
            setLastRun({ deadlineAlert: now });
        }

        // 월 청구서: 12시간마다 (데모에서는 60초)
        if (now - lastRun.monthlyBilling > 60_000) {
            runMonthlyBilling();
            setLastRun({ monthlyBilling: now });
        }

        // 미납 재촉: 1시간마다 (데모에서는 30초)
        if (now - lastRun.overdueReminder > 30_000) {
            runOverdueReminders();
            setLastRun({ overdueReminder: now });
        }
    } finally {
        _engineRunning = false;
    }
}

export function startAutomationEngine(): void {
    if (typeof window === 'undefined' || _engineTimer) return;
    console.log('[⚡ AutoEngine] 송무 자동화 엔진 시작 (30초 주기)');
    // 초기 실행 (2초 후)
    setTimeout(runAll, 2000);
    _engineTimer = setInterval(runAll, ENGINE_INTERVAL);
}

export function stopAutomationEngine(): void {
    if (_engineTimer) {
        clearInterval(_engineTimer);
        _engineTimer = null;
        console.log('[⚡ AutoEngine] 송무 자동화 엔진 중지');
    }
}

// 엔진 상태 조회
export function getAutomationStats() {
    const logs = store.getLogs();
    return {
        deadlineAlerts: logs.filter(l => l.type === 'deadline_alert').length,
        billingIssued: logs.filter(l => l.type === 'auto_billing').length,
        overdueReminders: logs.filter(l => l.type === 'overdue_reminder').length,
        satisfactionSurveys: logs.filter(l => l.type === 'satisfaction_survey').length,
        aiMemoSummaries: logs.filter(l => l.type === 'ai_memo_summary').length,
        recentLogs: logs.filter(l =>
            ['deadline_alert', 'auto_billing', 'overdue_reminder', 'satisfaction_survey', 'ai_memo_summary'].includes(l.type)
        ).slice(0, 15),
        isRunning: _engineTimer !== null,
    };
}
