// src/lib/mock/store.ts — 메인 store 객체 + 자동화 파이프라인
// mockStore.ts에서 분리. 비즈니스 로직만 포함.

import type { Company, Issue, LitigationCase, LitigationDeadline, AutoSettings, AutoLog } from './types';
import { DEFAULT_COMPANIES, DEFAULT_LIT, DEFAULT_AUTO, BASE_ISSUES } from './data';
import { LAWYERS } from './constants';

const CASE_KEY = 'ibs_store_v4';
const LIT_KEY = 'ibs_lit_v1';
const AUTO_KEY = 'ibs_auto_settings';
const LOG_KEY = 'ibs_auto_logs';
const MAX_LOGS = 50;

// ── localStorage 유틸 ─────────────────────────────────────────
function loadAuto(): AutoSettings {
    if (typeof window === 'undefined') return DEFAULT_AUTO;
    try { return { ...DEFAULT_AUTO, ...JSON.parse(localStorage.getItem(AUTO_KEY) || 'null') }; } catch { return DEFAULT_AUTO; }
}
function saveAuto(s: AutoSettings) {
    if (typeof window !== 'undefined') localStorage.setItem(AUTO_KEY, JSON.stringify(s));
}

function loadLogs(): AutoLog[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { return []; }
}
function addLog(log: Omit<AutoLog, 'id' | 'at'>) {
    if (typeof window === 'undefined') return;
    const logs = loadLogs();
    logs.unshift({
        ...log,
        id: `log${Date.now()}`,
        at: new Date().toLocaleString('ko-KR', { hour12: false }),
    });
    if (logs.length > MAX_LOGS) logs.pop();
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
}

function load(): Company[] {
    if (typeof window === 'undefined') return DEFAULT_COMPANIES;
    try {
        const raw = localStorage.getItem(CASE_KEY);
        if (!raw) { localStorage.setItem(CASE_KEY, JSON.stringify(DEFAULT_COMPANIES)); return DEFAULT_COMPANIES; }
        return JSON.parse(raw);
    } catch { return DEFAULT_COMPANIES; }
}
function save(cs: Company[]) {
    if (typeof window !== 'undefined') localStorage.setItem(CASE_KEY, JSON.stringify(cs));
}

function loadLit(): LitigationCase[] {
    if (typeof window === 'undefined') return DEFAULT_LIT;
    try {
        const raw = localStorage.getItem(LIT_KEY);
        if (!raw) { localStorage.setItem(LIT_KEY, JSON.stringify(DEFAULT_LIT)); return DEFAULT_LIT; }
        return JSON.parse(raw);
    } catch { return DEFAULT_LIT; }
}
function saveLit(cs: LitigationCase[]) {
    if (typeof window !== 'undefined') localStorage.setItem(LIT_KEY, JSON.stringify(cs));
}

// ── 자동화 파이프라인 ─────────────────────────────────────────
async function runAutoPipeline(companyId: string): Promise<void> {
    const delay = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

    await delay(500);
    {
        const settings = loadAuto();
        const all = load();
        const c = all.find(x => x.id === companyId);
        if (c && c.status === 'analyzed' && settings.autoSalesConfirm) {
            const now = new Date().toLocaleString('ko-KR', { hour12: false });
            c.status = 'sales_confirmed';
            c.salesConfirmed = true;
            c.salesConfirmedAt = now;
            c.salesConfirmedBy = 'AI 자동';
            c.updatedAt = new Date().toISOString();
            save(all);
            addLog({ type: 'auto_confirm', label: '영업 자동 컨펌', companyName: c.name, detail: `분석완료 → AI가 자동으로 영업 컨펌 처리 (담당: AI 자동)` });
        }
    }

    await delay(800);
    {
        const settings = loadAuto();
        const all = load();
        const c = all.find(x => x.id === companyId);
        if (c && c.status === 'sales_confirmed' && settings.autoAssignLawyer && !c.assignedLawyer) {
            const s = loadAuto();
            const lawyer = LAWYERS[s.lawyerRoundRobin % LAWYERS.length];
            s.lawyerRoundRobin = (s.lawyerRoundRobin + 1) % LAWYERS.length;
            saveAuto(s);
            c.assignedLawyer = lawyer;
            c.status = 'assigned';
            c.updatedAt = new Date().toISOString();
            save(all);
            addLog({ type: 'auto_assign', label: '변호사 자동 배정', companyName: c.name, detail: `라운드로빈 → ${lawyer} 자동 배정 완료` });
        }
    }

    await delay(800);
    {
        const settings = loadAuto();
        const all = load();
        const c = all.find(x => x.id === companyId);
        if (c && c.status === 'lawyer_confirmed' && settings.autoSendEmail && !c.emailSentAt) {
            // /api/email 실제 호출
            try {
                const resp = await fetch('/api/email', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        type: 'company_hook',
                        leadId: c.id,
                        lawyerNote: '',
                        autoMode: true,
                    }),
                });
                const result = await resp.json();
                const now = new Date().toLocaleString('ko-KR', { hour12: false });
                c.status = 'emailed';
                c.emailSentAt = `${now} (자동발송)`;
                c.emailSubject = `[IBS 법률사무소] ${c.name} 개인정보처리방침 법률 검토 결과`;
                c.updatedAt = new Date().toISOString();
                save(all);
                const modeText = result.mock ? '(Mock 모드)' : '(실 발송)';
                addLog({ type: 'auto_email', label: `이메일 자동 발송 ${modeText}`, companyName: c.name, detail: `변호사 컨펌 → ${c.email}로 자동 발송 완료 ${modeText}` });
            } catch (err) {
                // API 호출 실패 시 로컬 mock으로 폴백
                const now = new Date().toLocaleString('ko-KR', { hour12: false });
                c.status = 'emailed';
                c.emailSentAt = `${now} (자동발송·오프라인)`;
                c.emailSubject = `[IBS 법률사무소] ${c.name} 개인정보처리방침 법률 검토 결과`;
                c.updatedAt = new Date().toISOString();
                save(all);
                addLog({ type: 'auto_email', label: '이메일 자동 발송 (오프라인)', companyName: c.name, detail: `API 호출 실패 → 로컬 mock으로 상태 업데이트 완료` });
            }
        }
    }
}

// ── store 객체 ────────────────────────────────────────────────
export const store = {
    getAll(): Company[] { return load(); },
    getById(id: string): Company | undefined { return load().find(c => c.id === id); },
    getAutoSettings(): AutoSettings { return loadAuto(); },
    getLogs(): AutoLog[] { return loadLogs(); },
    clearLogs(): void { if (typeof window !== 'undefined') localStorage.removeItem(LOG_KEY); },

    updateAutoSettings(patch: Partial<AutoSettings>, changedBy = '영업팀'): AutoSettings {
        const prev = loadAuto();
        const s = { ...prev, ...patch, updatedAt: new Date().toLocaleString('ko-KR', { hour12: false }), updatedBy: changedBy };
        saveAuto(s);
        const LABELS: Record<string, string> = {
            autoSalesConfirm: '영업 자동 컨펌',
            autoAssignLawyer: '변호사 자동 배정',
            autoGenerateDraft: 'AI 초안 자동생성',
            autoSendEmail: '이메일 자동 발송',
        };
        (Object.keys(patch) as (keyof AutoSettings)[]).forEach(key => {
            if (key in LABELS && patch[key] !== prev[key]) {
                addLog({
                    type: 'setting_change',
                    label: `설정 변경: ${LABELS[key]}`,
                    detail: `${changedBy}가 설정 변경`,
                    prevValue: prev[key] ? '🟢 ON' : '🔴 OFF',
                    newValue: patch[key] ? '🟢 ON' : '🔴 OFF',
                });
            }
        });
        return s;
    },

    update(id: string, patch: Partial<Company>): Company[] {
        const all = load();
        const idx = all.findIndex(c => c.id === id);
        if (idx >= 0) all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
        save(all); return all;
    },

    updateIssue(companyId: string, issueId: string, patch: Partial<Issue>): Company[] {
        const all = load();
        const c = all.find(x => x.id === companyId);
        if (c) { const issue = c.issues.find(i => i.id === issueId); if (issue) Object.assign(issue, patch); c.updatedAt = new Date().toISOString(); }
        save(all); return all;
    },

    add(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Company[] {
        const all = load();
        const c: Company = { ...data, id: `c${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        all.unshift(c);
        save(all);
        return all;
    },

    triggerAI(companyId: string): void {
        store.update(companyId, { status: 'crawling', issues: [], aiDraftReady: false });
        const c0 = store.getById(companyId);
        addLog({ type: 'ai_analysis', label: '분석 시작', companyName: c0?.name, detail: '개인정보처리방침 자동 검토 및 이슈 분석 시작' });

        // /api/analyze-privacy 실제 호출
        fetch('/api/analyze-privacy', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                leadId: companyId,
                companyName: c0?.name || '',
                url: c0?.url || '',
            }),
        })
            .then(resp => resp.json())
            .then(data => {
                const all = load();
                const c = all.find(co => co.id === companyId);
                if (c && c.status === 'crawling') {
                    if (data.analysis?.clauses?.length) {
                        // API 분석 결과 → Issue[] 변환
                        c.issues = data.analysis.clauses.map((cl: {
                            clauseNum: string; title: string; original: string;
                            riskSummary: string; level: string; lawRef: string;
                            scenario: string; fix: string;
                        }, idx: number) => ({
                            id: `i_${companyId}_${idx}`,
                            level: (['HIGH', 'MEDIUM', 'LOW'].includes(cl.level) ? cl.level : 'MEDIUM') as 'HIGH' | 'MEDIUM' | 'LOW',
                            law: cl.lawRef || '',
                            title: `[${cl.clauseNum}] ${cl.title}`,
                            originalText: cl.original || '',
                            riskDesc: cl.riskSummary || '',
                            customDraft: cl.fix || '',
                            lawyerNote: '',
                            reviewChecked: false,
                            aiDraftGenerated: true,
                        }));
                        const modeText = data.mock ? '(Mock)' : '(Claude AI)';
                        addLog({ type: 'ai_analysis', label: `AI 분석 완료 ${modeText}`, companyName: c.name, detail: `이슈 ${c.issues.length}건 발견, AI 수정문구 초안 자동 생성 완료` });
                    } else {
                        // API 응답에 clauses 없으면 폴백
                        c.issues = BASE_ISSUES.map(i => ({ ...i }));
                        addLog({ type: 'ai_analysis', label: 'AI 분석 완료 (폴백)', companyName: c.name, detail: `API 응답 이상 → 기본 이슈 ${c.issues.length}건 적용` });
                    }
                    c.status = 'analyzed';
                    c.aiDraftReady = true;
                    c.updatedAt = new Date().toISOString();
                    save(all);
                    runAutoPipeline(companyId);
                }
            })
            .catch(() => {
                // API 완전 실패 → 기존 로직으로 폴백
                setTimeout(() => {
                    const all = load();
                    const c = all.find(co => co.id === companyId);
                    if (c && c.status === 'crawling') {
                        c.issues = BASE_ISSUES.map(i => ({ ...i }));
                        c.status = 'analyzed';
                        c.aiDraftReady = true;
                        c.updatedAt = new Date().toISOString();
                        save(all);
                        addLog({ type: 'ai_analysis', label: 'AI 분석 완료 (오프라인)', companyName: c.name, detail: `API 연결 실패 → 기본 이슈 ${c.issues.length}건 적용` });
                        runAutoPipeline(companyId);
                    }
                }, 2000);
            });
    },

    salesConfirm(companyId: string, by: string): Company[] {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        const result = store.update(companyId, { salesConfirmed: true, salesConfirmedAt: now, salesConfirmedBy: by, status: 'sales_confirmed' });
        runAutoPipeline(companyId);
        return result;
    },

    assignLawyer(companyId: string, lawyer: string): Company[] {
        return store.update(companyId, { assignedLawyer: lawyer, status: 'assigned' });
    },

    markReviewing(companyId: string): Company[] {
        const c = store.getById(companyId);
        if (c && c.status === 'assigned') return store.update(companyId, { status: 'reviewing' });
        return load();
    },

    lawyerConfirm(companyId: string): Company[] {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        const result = store.update(companyId, { lawyerConfirmed: true, lawyerConfirmedAt: now, status: 'lawyer_confirmed' });
        runAutoPipeline(companyId);
        return result;
    },

    sendEmail(companyId: string): Company[] {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        const c = store.getById(companyId);
        return store.update(companyId, {
            status: 'emailed',
            emailSentAt: now,
            emailSubject: `[IBS 법률사무소] ${c?.name ?? ''} 개인정보처리방침 법률 검토 결과`,
        });
    },

    markClientReplied(companyId: string, note: string): Company[] {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        return store.update(companyId, { clientReplied: true, clientRepliedAt: now, clientReplyNote: note, status: 'client_replied' });
    },

    getBadge(role: 'admin' | 'employee' | 'lawyer' | 'litigation'): number {
        const all = load();
        if (role === 'lawyer') return all.filter(c => ['sales_confirmed', 'assigned', 'reviewing'].includes(c.status)).length;
        if (role === 'employee') return all.filter(c => c.status === 'analyzed' || c.status === 'lawyer_confirmed' || c.status === 'client_replied').length;
        if (role === 'admin') return all.filter(c => ['analyzed', 'sales_confirmed', 'lawyer_confirmed'].includes(c.status)).length;
        if (role === 'litigation') {
            const lits = loadLit();
            const today = new Date();
            return lits.filter(l => l.deadlines.some(d => !d.completed && new Date(d.dueDate) <= new Date(today.getTime() + 7 * 86400000))).length;
        }
        return 0;
    },

    reset(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(CASE_KEY);
        localStorage.removeItem(LIT_KEY);
        localStorage.removeItem(AUTO_KEY);
        localStorage.removeItem(LOG_KEY);
    },

    // ── 송무팀 ──
    getLitAll(): LitigationCase[] { return loadLit(); },
    getLitById(id: string): LitigationCase | undefined { return loadLit().find(l => l.id === id); },

    addLit(data: Omit<LitigationCase, 'id' | 'createdAt' | 'updatedAt'>): LitigationCase[] {
        const all = loadLit();
        all.unshift({ ...data, id: `l${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        saveLit(all); return all;
    },

    updateLit(id: string, patch: Partial<LitigationCase>): LitigationCase[] {
        const all = loadLit();
        const idx = all.findIndex(l => l.id === id);
        if (idx >= 0) all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
        saveLit(all); return all;
    },

    updateDeadline(litId: string, deadlineId: string, patch: Partial<LitigationDeadline>): LitigationCase[] {
        const all = loadLit();
        const lit = all.find(l => l.id === litId);
        if (lit) { const d = lit.deadlines.find(x => x.id === deadlineId); if (d) Object.assign(d, patch); lit.updatedAt = new Date().toISOString(); }
        saveLit(all); return all;
    },
};
