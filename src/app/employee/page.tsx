'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, RefreshCw, CheckCircle2, X, Plus, Search,
    Phone, Mail, ChevronDown, ChevronUp, AlertTriangle,
    ArrowRight, Clock, MessageCircle, Eye, Star, Bot,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    store, Company, CaseStatus, AutoSettings, AutoLog,
    STATUS_LABEL, STATUS_COLOR, STATUS_TEXT,
    PIPELINE, LAWYERS, SALES_REPS,
} from '@/lib/mockStore';

// ── 상태 배지 ──────────────────────────────────────────────────
function StatusBadge({ status }: { status: CaseStatus }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ background: STATUS_COLOR[status], color: STATUS_TEXT[status] }}>
            {status === 'crawling' && <RefreshCw className="w-3 h-3 animate-spin" />}
            {STATUS_LABEL[status]}
        </span>
    );
}

// ── 워크플로우 단계 셀 ─────────────────────────────────────────
function StepCell({ done, label, active }: { done: boolean; label: string; active?: boolean }) {
    if (done) return (
        <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#4ade80' }}>
            <CheckCircle2 className="w-3 h-3" /> {label}
        </span>
    );
    if (active) return (
        <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#fbbf24' }}>
            <Clock className="w-3 h-3 animate-pulse" /> {label}
        </span>
    );
    return <span className="text-[10px]" style={{ color: 'rgba(240,244,255,0.2)' }}>—</span>;
}

// ── 액션 버튼 ──────────────────────────────────────────────────
function ActionButton({
    c, run, confirmingId, setConfirmingId, confirmRep, setConfirmRep,
    assigningId, setAssigningId, assignLawyer, setAssignLawyer, loading, refresh,
}: {
    c: Company; run: (k: string, fn: () => void) => void;
    confirmingId: string | null; setConfirmingId: (v: string | null) => void;
    confirmRep: string; setConfirmRep: (v: string) => void;
    assigningId: string | null; setAssigningId: (v: string | null) => void;
    assignLawyer: string; setAssignLawyer: (v: string) => void;
    loading: string | null; refresh: () => void;
}) {
    const s = c.status;

    if (s === 'pending') return (
        <Button variant="premium" size="sm"
            onClick={() => run(c.id, () => store.triggerAI(c.id))}>
            <Zap className="w-3.5 h-3.5 mr-1" /> AI 분석
        </Button>
    );

    if (s === 'crawling') return (
        <span className="text-xs flex items-center gap-1" style={{ color: '#fbbf24' }}>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> 분석 중...
        </span>
    );

    if (s === 'analyzed') return (
        <>
            {confirmingId === c.id ? (
                <div className="flex items-center gap-1.5">
                    <select value={confirmRep} onChange={e => setConfirmRep(e.target.value)}
                        className="text-xs px-1.5 py-1 rounded"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }}>
                        {SALES_REPS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <Button variant="premium" size="sm"
                        onClick={() => run(c.id, () => { store.salesConfirm(c.id, confirmRep); setConfirmingId(null); })}>
                        확인
                    </Button>
                    <button onClick={() => setConfirmingId(null)} className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>✕</button>
                </div>
            ) : (
                <Button variant="outline" size="sm" onClick={() => setConfirmingId(c.id)}>
                    영업 컨펌
                </Button>
            )}
        </>
    );

    if (s === 'sales_confirmed') return (
        <>
            {assigningId === c.id ? (
                <div className="flex items-center gap-1.5">
                    <select value={assignLawyer} onChange={e => setAssignLawyer(e.target.value)}
                        className="text-xs px-1.5 py-1 rounded"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }}>
                        {LAWYERS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <Button variant="premium" size="sm"
                        onClick={() => run(c.id, () => { store.assignLawyer(c.id, assignLawyer); setAssigningId(null); })}>
                        배정
                    </Button>
                    <button onClick={() => setAssigningId(null)} className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>✕</button>
                </div>
            ) : (
                <Button variant="outline" size="sm" onClick={() => setAssigningId(c.id)}>
                    변호사 배정
                </Button>
            )}
        </>
    );

    if (s === 'assigned' || s === 'reviewing') return (
        <span className="text-xs flex items-center gap-1" style={{ color: '#fb923c' }}>
            <Eye className="w-3.5 h-3.5" /> 변호사 검토 중
        </span>
    );

    if (s === 'lawyer_confirmed') return (
        <Button variant="premium" size="sm"
            onClick={() => run(c.id, () => store.sendEmail(c.id))}
            disabled={loading === c.id}>
            <Mail className="w-3.5 h-3.5 mr-1" />
            {loading === c.id ? '발송 중...' : '이메일 발송'}
        </Button>
    );

    if (s === 'emailed') return (
        <span className="text-xs flex items-center gap-1" style={{ color: '#4ade80' }}>
            <Mail className="w-3.5 h-3.5" /> 발송 완료
        </span>
    );

    if (s === 'client_replied') return (
        <Button variant="outline" size="sm"
            onClick={() => run(c.id, () => store.update(c.id, { plan: 'standard', status: 'subscribed' }))}>
            <Star className="w-3.5 h-3.5 mr-1" /> 구독 처리
        </Button>
    );

    return <span className="text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>—</span>;
}

// ── 확장 행 (메모·답장) ────────────────────────────────────────
function ExpandedRow({ c, refresh }: { c: Company; refresh: () => void }) {
    const [note, setNote] = useState(c.callNote);
    const [reply, setReply] = useState(c.clientReplyNote);

    return (
        <tr>
            <td colSpan={10}>
                <div className="px-6 py-4 grid grid-cols-2 gap-4"
                    style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                        <p className="text-xs font-bold mb-1" style={{ color: 'rgba(240,244,255,0.5)' }}>📞 통화 메모</p>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            onBlur={() => { store.update(c.id, { callNote: note }); refresh(); }}
                            rows={2}
                            placeholder="통화 내용 메모..."
                            className="w-full text-xs px-3 py-2 rounded-lg resize-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#f0f4ff', outline: 'none' }}
                        />
                    </div>
                    <div>
                        <p className="text-xs font-bold mb-1" style={{ color: 'rgba(240,244,255,0.5)' }}>
                            📩 클라이언트 답장
                            {c.clientReplied && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(244,114,182,0.15)', color: '#f472b6' }}>답장 수신</span>}
                        </p>
                        <textarea
                            value={reply}
                            onChange={e => setReply(e.target.value)}
                            onBlur={() => { store.update(c.id, { clientReplyNote: reply }); refresh(); }}
                            rows={2}
                            placeholder="클라이언트 답장 내용..."
                            className="w-full text-xs px-3 py-2 rounded-lg resize-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#f0f4ff', outline: 'none' }}
                        />
                    </div>
                </div>
            </td>
        </tr>
    );
}

// ── 메인 페이지 ────────────────────────────────────────────────
export default function EmployeePage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | CaseStatus>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', biz: '', url: '', email: '', phone: '', storeCount: '' });
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [confirmRep, setConfirmRep] = useState(SALES_REPS[0]);
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [assignLawyer, setAssignLawyer] = useState(LAWYERS[0]);
    const [loading, setLoading] = useState<string | null>(null);
    const [autoSettings, setAutoSettings] = useState<AutoSettings>(store.getAutoSettings());
    const [autoLogs, setAutoLogs] = useState<AutoLog[]>(store.getLogs());
    const [showAutoPanel, setShowAutoPanel] = useState(false);
    const [autoTab, setAutoTab] = useState<'settings' | 'logs'>('settings');

    const updateAuto = (patch: Partial<AutoSettings>) => {
        const s = store.updateAutoSettings(patch, '영업팀');
        setAutoSettings(s);
        setAutoLogs([...store.getLogs()]);
    };

    const refresh = useCallback(() => {
        setCompanies([...store.getAll()]);
        setAutoLogs([...store.getLogs()]);
        setAutoSettings(store.getAutoSettings());
    }, []);

    useEffect(() => {
        refresh();
        const id = setInterval(refresh, 2000);
        return () => clearInterval(id);
    }, [refresh]);

    const run = (key: string, fn: () => void) => {
        setLoading(key);
        setTimeout(() => { fn(); setLoading(null); refresh(); }, 600);
    };

    const filtered = companies.filter(c => {
        const q = search.toLowerCase();
        const match = c.name.includes(search) || c.biz.includes(q) || c.email.includes(q) || c.phone.includes(q);
        const s = filterStatus === 'all' || c.status === filterStatus;
        return match && s;
    });

    const counts = Object.fromEntries(PIPELINE.map(s => [s, companies.filter(c => c.status === s).length]));
    const needsAction = companies.filter(c =>
        c.status === 'analyzed' || c.status === 'lawyer_confirmed' || c.status === 'client_replied'
    );

    return (
        <div className="min-h-screen px-4 py-8 max-w-[1600px] mx-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: '#f0f4ff' }}>
                        📊 영업팀 CRM
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(240,244,255,0.4)' }}>
                        총 {companies.length}개 기업 관리 중
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAutoPanel(p => !p)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                        style={{
                            background: showAutoPanel ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
                            color: showAutoPanel ? '#4ade80' : 'rgba(240,244,255,0.5)',
                            border: `1px solid ${showAutoPanel ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        }}>
                        <Bot className="w-3.5 h-3.5" /> AI 자동화
                        {autoLogs.length > 0 && (
                            <span className="ml-1 text-[9px] px-1 py-0.5 rounded-full font-black"
                                style={{ background: 'rgba(34,197,94,0.25)', color: '#4ade80' }}>
                                {autoLogs.length}
                            </span>
                        )}
                    </button>
                    <button onClick={() => { store.reset(); refresh(); }}
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(240,244,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        초기화
                    </button>
                    <Button variant="premium" size="sm" onClick={() => setShowAdd(true)}>
                        <Plus className="w-4 h-4 mr-1" /> 기업 등록
                    </Button>
                </div>
            </div>

            {/* ── AI 자동화 설정 패널 (2탭) ── */}
            <AnimatePresence>
                {showAutoPanel && (
                    <motion.div key="auto-panel" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-5">
                        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(34,197,94,0.25)', background: 'rgba(4,9,26,0.7)' }}>
                            {/* 탭 헤더 */}
                            <div className="flex items-center" style={{ background: 'rgba(34,197,94,0.06)', borderBottom: '1px solid rgba(34,197,94,0.15)' }}>
                                {(['settings', 'logs'] as const).map(t => (
                                    <button key={t} onClick={() => setAutoTab(t)}
                                        className="px-5 py-3 text-xs font-black transition-all whitespace-nowrap"
                                        style={{ color: autoTab === t ? '#4ade80' : 'rgba(240,244,255,0.4)', borderBottom: `2px solid ${autoTab === t ? '#4ade80' : 'transparent'}` }}>
                                        {t === 'settings' ? '⚙️ 자동화 설정' : `📜 실행 기록 (${autoLogs.length})`}
                                    </button>
                                ))}
                                {autoSettings.updatedAt && (
                                    <span className="ml-auto pr-4 text-[10px]" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                        마지막 변경: <strong style={{ color: 'rgba(240,244,255,0.5)' }}>{autoSettings.updatedBy}</strong> {autoSettings.updatedAt}
                                    </span>
                                )}
                            </div>

                            {/* 설정 탭 */}
                            {autoTab === 'settings' && (
                                <div className="p-5">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                        {([
                                            { k: 'autoSalesConfirm', l: '영업 자동 컨펌', sub: '분석완료 → 즉시 컨펌', color: '#a78bfa', on: '✅ 영업팀 클릭 없이 자동 컨펌', off: '❌ 영업팀이 직접 컨펌 버튼 클릭' },
                                            { k: 'autoAssignLawyer', l: '변호사 자동 배정', sub: '라운드로빈 자동', color: '#fb923c', on: '✅ 다음 순서 변호사에게 자동 배정', off: '❌ 영업팀이 드롭다운으로 선택' },
                                            { k: 'autoGenerateDraft', l: 'AI 초안 생성', sub: 'GPT-4o 수정문구', color: '#60a5fa', on: '✅ 변호사 검토 전 AI 초안 자동 생성', off: '❌ 변호사가 직접 초안 작성' },
                                            { k: 'autoSendEmail', l: '이메일 자동 발송', sub: '컨펌 즉시 발송', color: '#4ade80', on: '✅ 컨펌 즉시 자동 발송', off: '❌ 영업팀이 발송 버튼 클릭' },
                                        ] as { k: keyof AutoSettings; l: string; sub: string; color: string; on: string; off: string }[]).map(item => (
                                            <button key={item.k}
                                                onClick={() => updateAuto({ [item.k]: !autoSettings[item.k] })}
                                                className="p-4 rounded-xl text-left transition-all"
                                                style={{ background: autoSettings[item.k] ? `${item.color}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${autoSettings[item.k] ? item.color + '40' : 'rgba(255,255,255,0.07)'}` }}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs font-black" style={{ color: autoSettings[item.k] ? item.color : 'rgba(240,244,255,0.5)' }}>{item.l}</p>
                                                    <div className="w-9 h-5 rounded-full transition-all relative flex-shrink-0"
                                                        style={{ background: autoSettings[item.k] ? item.color : 'rgba(255,255,255,0.12)' }}>
                                                        <div className="absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all"
                                                            style={{ left: autoSettings[item.k] ? '21px' : '3px' }} />
                                                    </div>
                                                </div>
                                                <p className="text-[10px] mb-1.5" style={{ color: 'rgba(240,244,255,0.35)' }}>{item.sub}</p>
                                                <p className="text-[10px] leading-relaxed" style={{ color: autoSettings[item.k] ? item.color + 'cc' : 'rgba(240,244,255,0.3)' }}>
                                                    {autoSettings[item.k] ? item.on : item.off}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)' }}>
                                        <p className="text-[11px]" style={{ color: 'rgba(240,244,255,0.5)' }}>
                                            💡 <strong style={{ color: '#4ade80' }}>모두 ON</strong>: 기업등록 → AI분석 → 자동컨펌 → 자동배정 → <strong style={{ color: '#fbbf24' }}>변호사 검토·컨펌(유일한 수동)</strong> → 자동이메일발송 — 영업팀은 전화 + 메모만.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* 실행 기록 탭 */}
                            {autoTab === 'logs' && (
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-bold" style={{ color: 'rgba(240,244,255,0.4)' }}>자동화 실행 기록 {autoLogs.length}건</p>
                                        <button onClick={() => { store.clearLogs(); setAutoLogs([]); }}
                                            className="text-[10px] px-2 py-1 rounded"
                                            style={{ color: 'rgba(240,244,255,0.3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            기록 삭제
                                        </button>
                                    </div>
                                    {autoLogs.length === 0 ? (
                                        <div className="text-center py-10" style={{ color: 'rgba(240,244,255,0.2)' }}>
                                            <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">아직 자동화 기록이 없습니다</p>
                                            <p className="text-xs mt-1" style={{ color: 'rgba(240,244,255,0.15)' }}>AI 분석을 시작하거나 설정을 변경하면 기록이 쌓입니다</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                                            {autoLogs.map(log => {
                                                const colors: Record<string, string> = { ai_analysis: '#60a5fa', auto_confirm: '#a78bfa', auto_assign: '#fb923c', auto_email: '#4ade80', setting_change: '#fbbf24' };
                                                const icons: Record<string, string> = { ai_analysis: '🤖', auto_confirm: '✅', auto_assign: '⚖️', auto_email: '📧', setting_change: '⚙️' };
                                                const c = colors[log.type] ?? '#94a3b8';
                                                return (
                                                    <div key={log.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
                                                        style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${c}18` }}>
                                                        <span className="text-base flex-shrink-0 leading-none mt-0.5">{icons[log.type]}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="text-[11px] font-black" style={{ color: c }}>{log.label}</p>
                                                                {log.companyName && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(240,244,255,0.6)' }}>{log.companyName}</span>}
                                                            </div>
                                                            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(240,244,255,0.5)' }}>{log.detail}</p>
                                                            {log.prevValue && log.newValue && (
                                                                <p className="text-[10px] mt-0.5 font-medium" style={{ color: 'rgba(240,244,255,0.35)' }}>{log.prevValue} → {log.newValue}</p>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] flex-shrink-0 font-mono mt-0.5" style={{ color: 'rgba(240,244,255,0.22)' }}>{log.at}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── 조치 필요 배너 ── */}
            {needsAction.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
                    <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4" style={{ color: '#f87171' }} />
                            <p className="text-xs font-black" style={{ color: '#f87171' }}>조치 필요 — {needsAction.length}건</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {needsAction.map(c => (
                                <span key={c.id} className="text-xs px-2.5 py-1 rounded-full font-bold"
                                    style={{ background: STATUS_COLOR[c.status], color: STATUS_TEXT[c.status] }}>
                                    {c.name} · {STATUS_LABEL[c.status]}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── 파이프라인 바 ── */}
            <div className="mb-6 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                    <button onClick={() => setFilterStatus('all')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                        style={{
                            background: filterStatus === 'all' ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${filterStatus === 'all' ? '#c9a84c' : 'rgba(255,255,255,0.06)'}`,
                            color: filterStatus === 'all' ? '#c9a84c' : 'rgba(240,244,255,0.4)',
                        }}>
                        전체 <span>{companies.length}</span>
                    </button>
                    {PIPELINE.map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                            style={{
                                background: filterStatus === s ? STATUS_COLOR[s] : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${filterStatus === s ? STATUS_TEXT[s] + '60' : 'rgba(255,255,255,0.06)'}`,
                                color: filterStatus === s ? STATUS_TEXT[s] : 'rgba(240,244,255,0.4)',
                            }}>
                            {STATUS_LABEL[s]} <span>{counts[s] ?? 0}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── 검색 ── */}
            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(240,244,255,0.3)' }} />
                <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="기업명, 사업자번호, 이메일, 전화번호 검색..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f4ff', outline: 'none' }}
                />
            </div>

            {/* ── 슈퍼 테이블 ── */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {['기업명', '가맹점수', '상태', 'AI분석', '영업컨펌', '변호사배정', '변호사컨펌', '이메일', '답장', '액션'].map(h => (
                                    <th key={h} className="py-3 px-3 text-left text-xs font-black whitespace-nowrap"
                                        style={{ color: 'rgba(240,244,255,0.4)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c: Company) => (
                                <>
                                    <tr key={c.id}
                                        className="transition-colors"
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                                        {/* 기업명 */}
                                        <td className="py-3 px-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                                                    {expandedId === c.id ? <ChevronUp className="w-3.5 h-3.5" style={{ color: 'rgba(240,244,255,0.4)' }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: 'rgba(240,244,255,0.4)' }} />}
                                                </button>
                                                <div>
                                                    <p className="font-bold text-xs" style={{ color: '#f0f4ff' }}>{c.name}</p>
                                                    <p className="text-[10px]" style={{ color: 'rgba(240,244,255,0.35)' }}>{c.biz}</p>
                                                </div>
                                                {c.source === 'crawler' && <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>자동수집</span>}
                                            </div>
                                        </td>

                                        {/* 가맹점수 */}
                                        <td className="py-3 px-3">
                                            <span className="text-xs font-bold" style={{ color: '#f0f4ff' }}>{c.storeCount.toLocaleString()}</span>
                                        </td>

                                        {/* 상태 */}
                                        <td className="py-3 px-3"><StatusBadge status={c.status} /></td>

                                        {/* AI 분석 */}
                                        <td className="py-3 px-3">
                                            <StepCell done={PIPELINE.indexOf(c.status) >= PIPELINE.indexOf('analyzed')}
                                                label={`이슈 ${c.issues.length}건`}
                                                active={c.status === 'crawling'} />
                                        </td>

                                        {/* 영업 컨펌 */}
                                        <td className="py-3 px-3">
                                            <StepCell done={c.salesConfirmed} label={c.salesConfirmedBy || '컨펌'}
                                                active={c.status === 'analyzed'} />
                                            {c.salesConfirmedAt && <p className="text-[9px] mt-0.5" style={{ color: 'rgba(240,244,255,0.3)' }}>{c.salesConfirmedAt}</p>}
                                        </td>

                                        {/* 변호사 배정 */}
                                        <td className="py-3 px-3">
                                            <StepCell done={!!c.assignedLawyer} label={c.assignedLawyer || '배정 대기'}
                                                active={c.status === 'sales_confirmed'} />
                                        </td>

                                        {/* 변호사 컨펌 */}
                                        <td className="py-3 px-3">
                                            <StepCell done={c.lawyerConfirmed} label="컨펌 완료"
                                                active={['assigned', 'reviewing'].includes(c.status)} />
                                            {c.lawyerConfirmedAt && <p className="text-[9px] mt-0.5" style={{ color: 'rgba(240,244,255,0.3)' }}>{c.lawyerConfirmedAt}</p>}
                                        </td>

                                        {/* 이메일 */}
                                        <td className="py-3 px-3">
                                            <StepCell done={!!c.emailSentAt} label="발송완료"
                                                active={c.status === 'lawyer_confirmed'} />
                                            {c.emailSentAt && <p className="text-[9px] mt-0.5" style={{ color: 'rgba(240,244,255,0.3)' }}>{c.emailSentAt}</p>}
                                        </td>

                                        {/* 답장 */}
                                        <td className="py-3 px-3">
                                            <StepCell done={c.clientReplied} label="답장 수신"
                                                active={c.status === 'emailed'} />
                                        </td>

                                        {/* 액션 */}
                                        <td className="py-3 px-3">
                                            <ActionButton c={c} run={run}
                                                confirmingId={confirmingId} setConfirmingId={setConfirmingId}
                                                confirmRep={confirmRep} setConfirmRep={setConfirmRep}
                                                assigningId={assigningId} setAssigningId={setAssigningId}
                                                assignLawyer={assignLawyer} setAssignLawyer={setAssignLawyer}
                                                loading={loading} refresh={refresh} />
                                        </td>
                                    </tr>
                                    {expandedId === c.id && <ExpandedRow key={`exp-${c.id}`} c={c} refresh={refresh} />}
                                </>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="text-center py-16" style={{ color: 'rgba(240,244,255,0.2)' }}>
                                        <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p>검색 결과가 없습니다</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* ── 기업 등록 모달 ── */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.7)' }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="w-full max-w-lg rounded-2xl p-6"
                            style={{ background: '#050d1a', border: '1px solid rgba(201,168,76,0.2)' }}>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-base font-black" style={{ color: '#f0f4ff' }}>기업 등록</h2>
                                <button onClick={() => setShowAdd(false)}><X className="w-5 h-5" style={{ color: 'rgba(240,244,255,0.4)' }} /></button>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { k: 'name', l: '기업명 *', ph: '(주)교촌에프앤비' },
                                    { k: 'biz', l: '사업자번호', ph: '123-45-67890' },
                                    { k: 'url', l: '홈페이지 URL', ph: 'https://kyochon.com' },
                                    { k: 'email', l: '이메일 *', ph: 'legal@kyochon.com' },
                                    { k: 'phone', l: '전화번호', ph: '02-1234-5678' },
                                    { k: 'storeCount', l: '가맹점수', ph: '100' },
                                ].map(f => (
                                    <div key={f.k}>
                                        <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(240,244,255,0.5)' }}>{f.l}</label>
                                        <input
                                            value={addForm[f.k as keyof typeof addForm]}
                                            onChange={e => setAddForm((p: typeof addForm) => ({ ...p, [f.k]: e.target.value }))}
                                            placeholder={f.ph}
                                            className="w-full px-3 py-2 rounded-lg text-sm"
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f4ff' }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-5">
                                <Button variant="ghost" className="flex-1" onClick={() => setShowAdd(false)}>취소</Button>
                                <Button variant="premium" className="flex-1" onClick={() => {
                                    if (!addForm.name || !addForm.email) return;
                                    store.add({
                                        name: addForm.name, biz: addForm.biz, url: addForm.url,
                                        email: addForm.email, phone: addForm.phone,
                                        storeCount: parseInt(addForm.storeCount) || 0,
                                        status: 'pending', assignedLawyer: '', issues: [],
                                        salesConfirmed: false, salesConfirmedAt: '', salesConfirmedBy: '',
                                        lawyerConfirmed: false, lawyerConfirmedAt: '',
                                        emailSentAt: '', emailSubject: '',
                                        clientReplied: false, clientRepliedAt: '', clientReplyNote: '',
                                        loginCount: 0, callNote: '', plan: 'none',
                                        autoMode: true, aiDraftReady: false, source: 'manual' as const,
                                    });
                                    setAddForm({ name: '', biz: '', url: '', email: '', phone: '', storeCount: '' });
                                    setShowAdd(false);
                                    refresh();
                                }}>
                                    <Zap className="w-4 h-4 mr-1" /> 등록 + AI 분석 예약
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
