'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Plus, CheckSquare, Square, ChevronDown, ChevronUp, X,
    Building2, Phone, Mail, AlertTriangle, TrendingUp,
    Clock, CheckCircle2, Users, Send, Play, RefreshCw,
    User, FileText, Activity, MessageSquare, Upload,
    Calendar, Clipboard, Copy, Edit3, Save, PhoneCall,
    Eye, Scale, CheckCheck, ChevronRight, Gavel, RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import {
    leadStore, type Lead, type LeadStatus, type LeadTimelineEvent, type TimelineEventType
} from '@/lib/leadStore';
import { dripStore, DRIP_SEQUENCE, type DripMember } from '@/lib/dripStore';

// ── 색상 시스템 (employee 페이지와 동일) ─────────────────────────
const T = {
    heading: '#0f172a', body: '#1e293b', sub: '#475569',
    muted: '#64748b', faint: '#94a3b8',
    border: '#d1d5db', borderSub: '#e5e7eb',
    bg: '#f8f9fc', card: '#ffffff', rowHover: '#f1f5f9',
};

// ── 상태 메타 ─────────────────────────────────────────────
const STATUS_META: Record<LeadStatus, { label: string; color: string; bg: string; border: string }> = {
    pending: { label: '대기', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
    analyzed: { label: '분석완료', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
    sales_confirmed: { label: '영업컨펌', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    lawyer_confirmed: { label: '변호사컨펌', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    emailed: { label: '발송완료', color: '#b8960a', bg: '#fefce8', border: '#fde047' },
    in_contact: { label: '연락중', color: '#0284c7', bg: '#e0f2fe', border: '#7dd3fc' },
    contracted: { label: '계약완료', color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
    failed: { label: '실패', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
};

const RISK_META = {
    HIGH: { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', label: '위험' },
    MEDIUM: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: '주의' },
    LOW: { color: '#16a34a', bg: '#dcfce7', border: '#86efac', label: '양호' },
    '': { color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', label: '-' },
};

const TIMELINE_ICON: Record<TimelineEventType, React.ReactNode> = {
    status_change: <Activity className="w-3.5 h-3.5" />,
    call: <PhoneCall className="w-3.5 h-3.5" />,
    email: <Mail className="w-3.5 h-3.5" />,
    note: <MessageSquare className="w-3.5 h-3.5" />,
    meeting: <Calendar className="w-3.5 h-3.5" />,
};
const TIMELINE_COLOR: Record<TimelineEventType, string> = {
    status_change: '#6366f1', call: '#0284c7', email: '#d97706',
    note: '#64748b', meeting: '#059669',
};

const STATUS_ORDER: LeadStatus[] = ['pending', 'analyzed', 'sales_confirmed', 'lawyer_confirmed', 'emailed', 'in_contact', 'contracted', 'failed'];
const LAWYERS = ['유정훈 변호사', '김수현 변호사', '박민준 변호사', '이지원 변호사'];

// ── 상태 배지 ─────────────────────────────────────────────
function StatusBadge({ status }: { status: LeadStatus }) {
    const m = STATUS_META[status];
    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border"
            style={{ color: m.color, background: m.bg, borderColor: m.border }}>
            {m.label}
        </span>
    );
}

// ── 위험도 배지 ───────────────────────────────────────────
function RiskBadge({ level }: { level: string }) {
    const m = RISK_META[level as keyof typeof RISK_META] ?? RISK_META[''];
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border"
            style={{ color: m.color, background: m.bg, borderColor: m.border }}>
            {m.label}
        </span>
    );
}

// ── 일괄 변경 툴바 ────────────────────────────────────────
function BulkToolbar({ count, onClear, onBulkAssign }: {
    count: number; onClear: () => void;
    onBulkAssign: (l: string) => void;
}) {
    const [showAssign, setShowAssign] = useState(false);
    return (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 border"
            style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
            <CheckSquare className="w-5 h-5" style={{ color: '#b8960a' }} />
            <span className="font-bold text-sm" style={{ color: '#b8960a' }}>{count}개 선택됨</span>
            <div className="h-5 w-px bg-slate-200" />
            <div className="relative">
                <button onClick={() => { setShowAssign(v => !v); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border bg-white hover:bg-slate-50 transition-colors"
                    style={{ color: '#475569', borderColor: '#e2e8f0' }}>
                    변호사 배정 <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showAssign && (
                    <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                        {LAWYERS.map(l => (
                            <button key={l} onClick={() => { onBulkAssign(l); setShowAssign(false); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                                style={{ color: '#475569' }}>
                                {l}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <button onClick={onClear} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: '#94a3b8' }}>
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}



// ── 슬라이드 패널: 연락처 탭 ──────────────────────────────
function ContactTab({ lead, onUpdate }: { lead: Lead; onUpdate: () => void }) {
    const [editing, setEditing] = useState<string | null>(null);
    const contacts = lead.contacts.length > 0
        ? lead.contacts
        : [{ id: 'legacy', name: lead.contactName, phone: lead.contactPhone, email: lead.contactEmail, isPrimary: true, role: '', department: '' }];

    return (
        <div className="space-y-3">
            {contacts.map(c => (
                <div key={c.id} className="p-4 rounded-xl border" style={{ borderColor: c.isPrimary ? '#c7d2fe' : '#e2e8f0', background: c.isPrimary ? '#eef2ff' : '#f8fafc' }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                                style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                                {c.name[0]}
                            </div>
                            <div>
                                <p className="font-bold text-sm" style={{ color: '#1e293b' }}>{c.name}</p>
                                <p className="text-xs" style={{ color: '#64748b' }}>{c.role}{c.department && ` · ${c.department}`}</p>
                            </div>
                        </div>
                        {c.isPrimary && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#e0e7ff', color: '#4f46e5' }}>주 담당자</span>}
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {c.phone && (
                            <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg bg-white border border-slate-200 hover:border-blue-300 transition-colors" style={{ color: '#0284c7' }}>
                                <Phone className="w-3.5 h-3.5" />{c.phone}
                            </a>
                        )}
                        {c.email && (
                            <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg bg-white border border-slate-200 hover:border-amber-300 transition-colors" style={{ color: '#b8960a' }}>
                                <Mail className="w-3.5 h-3.5" />{c.email}
                            </a>
                        )}
                    </div>
                </div>
            ))}
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed text-sm font-semibold transition-colors hover:bg-slate-50"
                style={{ borderColor: '#cbd5e1', color: '#94a3b8' }}>
                <Plus className="w-4 h-4" /> 담당자 추가
            </button>
        </div>
    );
}

// ── 슬라이드 패널: 스크립트 탭 ───────────────────────────
function ScriptTab({ lead, onUpdate }: { lead: Lead; onUpdate: () => void }) {
    const defaultCall = `안녕하세요, ${lead.contactName}님. IBS 법률사무소 영업팀입니다.\n\n${lead.companyName}의 개인정보처리방침을 검토한 결과, ${lead.issueCount}건의 법적 리스크를 발견했습니다.\n\n특히 ${lead.riskLevel === 'HIGH' ? '위험 수준의 이슈가 포함되어 있어' : '주의가 필요한 사항이 있어'} 말씀드리고 싶었습니다.\n\n10분 정도 통화 가능하신가요?`;
    const defaultEmail = `제목: [IBS 법률] ${lead.companyName} 개인정보처리방침 리스크 진단 결과\n\n${lead.contactName} 담당자님께,\n\n안녕하세요. IBS 법률사무소 영업팀입니다.\n\n${lead.companyName}의 홈페이지를 검토한 결과, 개인정보보호법 위반 소지가 있는 ${lead.issueCount}건의 이슈를 발견했습니다.\n\n가맹점 ${lead.storeCount.toLocaleString()}개 규모의 본사이신 만큼, 리스크 관리가 중요합니다.\n\n무료 상세 진단 리포트를 제공해 드릴 수 있습니다. 한번 검토해보시겠습니까?\n\nIBS 법률사무소 드림`;

    const [callScript, setCallScript] = useState(lead.customScript?.call ?? defaultCall);
    const [emailScript, setEmailScript] = useState(lead.customScript?.email ?? defaultEmail);
    const [activeScript, setActiveScript] = useState<'call' | 'email'>('call');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        leadStore.saveScript(lead.id, { call: callScript, email: emailScript });
        onUpdate();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };
    const handleCopy = (text: string) => { navigator.clipboard.writeText(text); };

    return (
        <div>
            <div className="flex gap-1 mb-4">
                {([['call', '📞 콜 스크립트'], ['email', '📧 이메일']] as const).map(([k, label]) => (
                    <button key={k} onClick={() => setActiveScript(k)}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                        style={{ background: activeScript === k ? '#eef2ff' : 'transparent', color: activeScript === k ? '#4f46e5' : '#94a3b8', border: activeScript === k ? '1px solid #c7d2fe' : '1px solid transparent' }}>
                        {label}
                    </button>
                ))}
            </div>
            <div className="relative">
                <textarea
                    value={activeScript === 'call' ? callScript : emailScript}
                    onChange={e => activeScript === 'call' ? setCallScript(e.target.value) : setEmailScript(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 rounded-xl border text-sm resize-none outline-none transition-colors"
                    style={{ borderColor: '#e2e8f0', color: '#1e293b', lineHeight: '1.7', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = '#c7d2fe'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <div className="flex gap-2 mt-2">
                    <button onClick={() => handleCopy(activeScript === 'call' ? callScript : emailScript)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white hover:bg-slate-50 transition-colors"
                        style={{ color: '#475569', borderColor: '#e2e8f0' }}>
                        <Copy className="w-3.5 h-3.5" /> 복사
                    </button>
                    <button onClick={handleSave}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        style={{ background: saved ? '#dcfce7' : '#eef2ff', color: saved ? '#16a34a' : '#4f46e5', border: `1px solid ${saved ? '#86efac' : '#c7d2fe'}` }}>
                        {saved ? <><CheckCircle2 className="w-3.5 h-3.5" /> 저장됨</> : <><Save className="w-3.5 h-3.5" /> 저장</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── 슬라이드 패널: 진행 상황 탭 ──────────────────────────
function TimelineTab({ lead, onUpdate }: { lead: Lead; onUpdate: () => void }) {
    const [newContent, setNewContent] = useState('');
    const [newType, setNewType] = useState<TimelineEventType>('call');
    const sorted = [...lead.timeline].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleAdd = () => {
        if (!newContent.trim()) return;
        leadStore.addTimelineEvent(lead.id, { createdAt: new Date().toISOString(), author: '영업팀', type: newType, content: newContent });
        onUpdate();
        setNewContent('');
    };

    return (
        <div>
            {/* 새 활동 입력 */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 mb-4 space-y-2">
                <div className="flex gap-1">
                    {([['call', '통화'], ['email', '이메일'], ['meeting', '미팅'], ['note', '메모']] as const).map(([t, label]) => (
                        <button key={t} onClick={() => setNewType(t)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                            style={{ background: newType === t ? TIMELINE_COLOR[t] : 'white', color: newType === t ? 'white' : '#64748b', border: `1px solid ${newType === t ? TIMELINE_COLOR[t] : '#e2e8f0'}` }}>
                            {label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input value={newContent} onChange={e => setNewContent(e.target.value)}
                        placeholder="활동 내용 입력..."
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                        style={{ borderColor: '#e2e8f0', color: '#1e293b' }} />
                    <button onClick={handleAdd}
                        className="px-3 py-2 rounded-lg text-sm font-bold transition-colors"
                        style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
                        기록
                    </button>
                </div>
            </div>
            {/* 타임라인 목록 */}
            <div className="space-y-3">
                {sorted.map(event => {
                    const color = TIMELINE_COLOR[event.type];
                    const m = STATUS_META;
                    return (
                        <div key={event.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${color}18`, color }}>
                                    {TIMELINE_ICON[event.type]}
                                </div>
                                <div className="w-px flex-1 mt-1" style={{ background: '#e2e8f0', minHeight: 12 }} />
                            </div>
                            <div className="pb-3 min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-bold" style={{ color }}>{event.author}</span>
                                    <span className="text-[10px]" style={{ color: '#94a3b8' }}>
                                        {new Date(event.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-sm" style={{ color: '#475569' }}>{event.content}</p>
                                {event.fromStatus && event.toStatus && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <StatusBadge status={event.fromStatus} />
                                        <span className="text-xs" style={{ color: '#94a3b8' }}>→</span>
                                        <StatusBadge status={event.toStatus} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── 슬라이드 패널: 메모 탭 ───────────────────────────────
function MemoTab({ lead, onUpdate }: { lead: Lead; onUpdate: () => void }) {
    const [text, setText] = useState('');
    const handleSave = () => {
        if (!text.trim()) return;
        leadStore.addMemo(lead.id, { author: '영업팀', content: text });
        onUpdate();
        setText('');
    };
    return (
        <div className="space-y-3">
            {lead.memos.length === 0 && (
                <div className="text-center py-8" style={{ color: '#94a3b8' }}>
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">아직 메모가 없습니다</p>
                </div>
            )}
            {[...lead.memos].reverse().map(memo => (
                <div key={memo.id} className="p-3 rounded-xl border" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold" style={{ color: '#4f46e5' }}>{memo.author}</span>
                        <span className="text-[10px]" style={{ color: '#94a3b8' }}>
                            {new Date(memo.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <p className="text-sm" style={{ color: '#475569', lineHeight: '1.6' }}>{memo.content}</p>
                </div>
            ))}
            <div className="border-t pt-3" style={{ borderColor: '#e2e8f0' }}>
                <textarea value={text} onChange={e => setText(e.target.value)}
                    placeholder="새 메모 입력..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none outline-none mb-2"
                    style={{ borderColor: '#e2e8f0', color: '#1e293b', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = '#c7d2fe'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                <button onClick={handleSave} disabled={!text.trim()}
                    className="w-full py-2 rounded-lg text-sm font-bold transition-colors"
                    style={{ background: text.trim() ? '#eef2ff' : '#f8fafc', color: text.trim() ? '#4f46e5' : '#cbd5e1', border: `1px solid ${text.trim() ? '#c7d2fe' : '#e2e8f0'}` }}>
                    메모 저장
                </button>
            </div>
        </div>
    );
}

// ── 슬라이드 패널: 이메일 미리보기 탭 ───────────────────────
function EmailPreviewTab({ lead }: { lead: Lead }) {
    const defaultSubject = `[IBS 법률] ${lead.companyName} 개인정보처리방침 리스크 진단 결과`;
    const defaultBody = [
        `${lead.contactName} 담당자님께,`,
        '',
        '안녕하세요. IBS 법률사무소 영업팀입니다.',
        '',
        `${lead.companyName}의 홈페이지를 검토한 결과, 개인정보보호법 위반 소지가 있는 ${lead.issueCount}건의 이슈를 발견했습니다.`,
        '',
        `가맹점 ${lead.storeCount.toLocaleString()}개 규모의 본사이신 만큼, 리스크 관리가 중요합니다.`,
        ...(lead.riskLevel === 'HIGH' ? ['', '⚠️ 특히 위험 등급 이슈가 포함되어 있어 즉각적인 검토가 필요합니다.'] : []),
        '',
        '무료 상세 진단 리포트를 제공해 드릴 수 있습니다.',
        '한번 검토해보시겠습니까?',
        '',
        'IBS 법률사무소 드림',
    ].join('\n');

    const [subject, setSubject] = useState(lead.customScript?.email?.startsWith('[IBS') ? (lead.customScript.email.split('\n')[0] ?? defaultSubject) : defaultSubject);
    const [body, setBody] = useState(lead.customScript?.email ?? defaultBody);
    const [mode, setMode] = useState<'preview' | 'edit'>('preview');
    const [sent, setSent] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleSend = () => {
        leadStore.saveScript(lead.id, { email: `${subject}\n\n${body}` });
        setSent(true);
        setTimeout(() => setSent(false), 2500);
    };
    const handleCopy = () => {
        navigator.clipboard.writeText(`제목: ${subject}\n\n${body}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-3">
            {/* 모드 토글 */}
            <div className="flex items-center justify-between">
                <div className="flex gap-1">
                    {([['preview', '👁 미리보기'], ['edit', '✏️ 편집']] as const).map(([k, label]) => (
                        <button key={k} onClick={() => setMode(k)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            style={{ background: mode === k ? '#fffbeb' : 'transparent', color: mode === k ? '#b8960a' : '#94a3b8', border: `1px solid ${mode === k ? '#fde68a' : 'transparent'}` }}>
                            {label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: '#94a3b8' }}>
                    <Mail className="w-3.5 h-3.5" />{lead.contactEmail}
                </div>
            </div>

            {/* 제목 */}
            {mode === 'edit' ? (
                <input value={subject} onChange={e => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm font-semibold outline-none"
                    style={{ borderColor: '#fde68a', color: '#1e293b', background: '#fffbeb' }}
                    placeholder="이메일 제목" />
            ) : (
                <div className="px-3 py-2 rounded-xl text-sm font-bold" style={{ background: '#fffbeb', color: '#b8960a', border: '1px solid #fde68a' }}>
                    {subject}
                </div>
            )}

            {/* 본문 */}
            {mode === 'edit' ? (
                <textarea value={body} onChange={e => setBody(e.target.value)}
                    rows={13}
                    className="w-full px-4 py-3 rounded-xl border text-sm resize-none outline-none"
                    style={{ borderColor: '#e2e8f0', color: '#1e293b', lineHeight: '1.7', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = '#fde68a'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            ) : (
                <div className="px-4 py-3 rounded-xl border text-sm" style={{ borderColor: '#e2e8f0', color: '#475569', whiteSpace: 'pre-wrap', lineHeight: '1.8', minHeight: 200, background: '#fafafa' }}>
                    {body}
                </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-2 pt-1">
                <button onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border bg-white hover:bg-slate-50 transition-colors"
                    style={{ color: '#475569', borderColor: '#e2e8f0' }}>
                    {copied ? <><CheckCheck className="w-3.5 h-3.5" style={{ color: '#16a34a' }} /> 복사됨</> : <><Copy className="w-3.5 h-3.5" /> 클립보드 복사</>}
                </button>
                <button onClick={handleSend}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-colors"
                    style={{ background: sent ? '#dcfce7' : 'linear-gradient(135deg,#fde68a,#f59e0b)', color: sent ? '#16a34a' : '#78350f', border: `1px solid ${sent ? '#86efac' : '#fde68a'}` }}>
                    {sent ? <><CheckCircle2 className="w-4 h-4" /> 발송 완료</> : <><Send className="w-4 h-4" /> 이메일 발송</>}
                </button>
            </div>
        </div>
    );
}

// ── 슬라이드 패널: 조문 검토 탭 ──────────────────────────────
const CLAUSE_MOCK = [
    {
        id: 'c1', law: '개인정보 보호법 제30조 제1항 제1호',
        title: '수집 항목 법정 기재 누락',
        level: 'HIGH' as const,
        original: '(현재 처리방침에 수집 항목 명시 없음)\n이름·연락처·사업자번호 등 수집하나 처리방침에 기재 없음.',
        risk: '과태료 최대 3,000만원',
        draft: `제1조(수집하는 개인정보 항목) \n회사는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.\n• 필수: 성명, 연락처, 사업자등록번호, 이메일\n• 선택: 직함, 팀명\n• 자동수집: 접속 IP, 쿠키, 이용기록`,
        checked: false,
    },
    {
        id: 'c2', law: '개인정보 보호법 제17조 제2항',
        title: '제3자 제공 동의 절차 부재',
        level: 'HIGH' as const,
        original: '파트너사 마케팅 목적으로 정보를 공유할 수 있습니다.',
        risk: '과태료 최대 5,000만원',
        draft: `제5조(개인정보의 제3자 제공) \n회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.\n다만 이용자가 사전 동의한 경우 또는 법령 요청 시 예외입니다.\n파트너사 마케팅 제공은 별도 동의 절차를 거칩니다.`,
        checked: false,
    },
    {
        id: 'c3', law: '개인정보 보호법 제30조 제1항 제3호',
        title: '보유·이용기간 불명확',
        level: 'MEDIUM' as const,
        original: '서비스 종료 시까지 보유합니다.',
        risk: '시정 권고',
        draft: `제6조(개인정보 보유 및 이용기간) \n• 계약·청약철회 기록: 5년\n• 소비자 불만·분쟁 기록: 3년\n• 서비스 이용 기록: 1년`,
        checked: false,
    },
    {
        id: 'c4', law: '개인정보 보호법 제35·36조',
        title: '정보주체 권리 행사 방법 미기재',
        level: 'LOW' as const,
        original: '(열람·정정·삭제 요청 방법 없음)',
        risk: '시정 권고',
        draft: `제9조(정보주체 권리 행사) \n이용자는 언제든지 열람·정정·삭제·처리정지를 요구할 수 있습니다.\n문의: dhk@ibslaw.co.kr`,
        checked: false,
    },
];

const RISK_BADGE_INLINE = {
    HIGH: { label: '위험', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
    MEDIUM: { label: '주의', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    LOW: { label: '양호', color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
};

function ClauseReviewTab({ lead }: { lead: Lead }) {
    const [clauses, setClauses] = useState(CLAUSE_MOCK.map(c => ({ ...c })));
    const [expanded, setExpanded] = useState<string | null>('c1');
    const [editingDraft, setEditingDraft] = useState<string | null>(null);
    const [draftValues, setDraftValues] = useState<Record<string, string>>(
        Object.fromEntries(CLAUSE_MOCK.map(c => [c.id, c.draft]))
    );
    const [saved, setSaved] = useState<string | null>(null);

    const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);
    const toggleCheck = (id: string) => setClauses(prev => prev.map(c => c.id === id ? { ...c, checked: !c.checked } : c));
    const handleSaveDraft = (id: string) => {
        setClauses(prev => prev.map(c => c.id === id ? { ...c, draft: draftValues[id] } : c));
        setEditingDraft(null);
        setSaved(id);
        setTimeout(() => setSaved(null), 2000);
    };
    const handleCopyDraft = (id: string) => navigator.clipboard.writeText(draftValues[id]);

    const checkedCount = clauses.filter(c => c.checked).length;

    return (
        <div>
            {/* 진행률 */}
            <div className="flex items-center justify-between mb-4 p-3 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
                <div className="flex items-center gap-2">
                    <Gavel className="w-4 h-4" style={{ color: '#16a34a' }} />
                    <span className="text-sm font-bold" style={{ color: '#16a34a' }}>검토 진행률</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full" style={{ background: '#dcfce7' }}>
                        <div className="h-2 rounded-full transition-all" style={{ background: '#16a34a', width: `${(checkedCount / clauses.length) * 100}% ` }} />
                    </div>
                    <span className="text-sm font-black" style={{ color: '#16a34a' }}>{checkedCount}/{clauses.length}</span>
                </div>
            </div>

            {/* 조문 목록 */}
            <div className="space-y-2">
                {clauses.map(clause => {
                    const risk = RISK_BADGE_INLINE[clause.level];
                    const isOpen = expanded === clause.id;
                    const isEditing = editingDraft === clause.id;
                    return (
                        <div key={clause.id} className="rounded-xl border overflow-hidden transition-all"
                            style={{ borderColor: clause.checked ? '#86efac' : isOpen ? risk.border : '#e2e8f0', background: clause.checked ? '#f0fdf4' : 'white' }}>
                            {/* 헤더 */}
                            <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => toggle(clause.id)}>
                                <button className="flex-shrink-0" onClick={e => { e.stopPropagation(); toggleCheck(clause.id); }}>
                                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                                        style={{ borderColor: clause.checked ? '#16a34a' : '#cbd5e1', background: clause.checked ? '#16a34a' : 'white' }}>
                                        {clause.checked && <CheckCheck className="w-3 h-3" style={{ color: 'white' }} />}
                                    </div>
                                </button>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0"
                                    style={{ color: risk.color, background: risk.bg, borderColor: risk.border }}>{risk.label}</span>
                                <span className="flex-1 text-sm font-bold truncate" style={{ color: clause.checked ? '#64748b' : '#1e293b' }}>{clause.title}</span>
                                <ChevronRight className="w-4 h-4 flex-shrink-0 transition-transform" style={{ color: '#94a3b8', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                            </button>

                            {/* 펼침 영역 */}
                            {isOpen && (
                                <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                                    {/* 위반 법령 + 리스크 */}
                                    <div className="pt-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: '#94a3b8' }}>위반 법령</p>
                                        <p className="text-xs font-semibold" style={{ color: '#475569' }}>{clause.law}</p>
                                        <p className="text-xs mt-1" style={{ color: risk.color }}>⚠️ {clause.risk}</p>
                                    </div>
                                    {/* 원문 */}
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: '#94a3b8' }}>현재 원문</p>
                                        <div className="px-3 py-2.5 rounded-lg text-xs" style={{ background: '#fef2f2', color: '#9f1239', border: '1px solid #fca5a5', whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                                            {clause.original}
                                        </div>
                                    </div>
                                    {/* AI 수정 초안 */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#94a3b8' }}>AI 수정 초안</p>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleCopyDraft(clause.id)}
                                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border bg-white hover:bg-slate-50"
                                                    style={{ color: '#64748b', borderColor: '#e2e8f0' }}>
                                                    <Copy className="w-3 h-3" /> 복사
                                                </button>
                                                <button onClick={() => setEditingDraft(isEditing ? null : clause.id)}
                                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors"
                                                    style={{ background: isEditing ? '#eef2ff' : 'white', color: isEditing ? '#4f46e5' : '#64748b', borderColor: isEditing ? '#c7d2fe' : '#e2e8f0' }}>
                                                    <Edit3 className="w-3 h-3" /> {isEditing ? '편집 중' : '편집'}
                                                </button>
                                            </div>
                                        </div>
                                        {isEditing ? (
                                            <div>
                                                <textarea
                                                    value={draftValues[clause.id]}
                                                    onChange={e => setDraftValues(prev => ({ ...prev, [clause.id]: e.target.value }))}
                                                    rows={6}
                                                    className="w-full px-3 py-2.5 rounded-lg border text-xs resize-none outline-none"
                                                    style={{ borderColor: '#c7d2fe', color: '#1e293b', lineHeight: 1.7, fontFamily: 'inherit', background: '#fafeff' }}
                                                />
                                                <button onClick={() => handleSaveDraft(clause.id)}
                                                    className="mt-1.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors"
                                                    style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
                                                    <Save className="w-3 h-3" /> 초안 저장
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="px-3 py-2.5 rounded-lg text-xs relative"
                                                style={{ background: '#f0fdf4', color: '#166534', border: `1px solid ${saved === clause.id ? '#4ade80' : '#86efac'} `, whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                                                {saved === clause.id && (
                                                    <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[10px] font-bold" style={{ color: '#16a34a' }}>
                                                        <CheckCircle2 className="w-3 h-3" /> 저장됨
                                                    </div>
                                                )}
                                                {draftValues[clause.id]}
                                            </div>
                                        )}
                                    </div>
                                    {/* 완료 체크 버튼 */}
                                    <button onClick={() => toggleCheck(clause.id)}
                                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-colors"
                                        style={{
                                            background: clause.checked ? '#f0fdf4' : '#eef2ff',
                                            color: clause.checked ? '#16a34a' : '#4f46e5',
                                            borderColor: clause.checked ? '#86efac' : '#c7d2fe',
                                        }}>
                                        {clause.checked ? <><CheckCheck className="w-3.5 h-3.5" /> 검토 완료</> : <><CheckCircle2 className="w-3.5 h-3.5" /> 검토 완료로 표시</>}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── 슬라이드 패널 ─────────────────────────────────────────
const PANEL_TABS = [
    { key: 'email', label: '이메일 미리보기', icon: <Mail className="w-3.5 h-3.5" /> },
    { key: 'clause', label: '조문 검토', icon: <Gavel className="w-3.5 h-3.5" /> },
] as const;

function SlidePanel({ lead, onClose, onUpdate, initialTab }: { lead: Lead; onClose: () => void; onUpdate: () => void; initialTab?: 'email' | 'clause' }) {
    const [tab, setTab] = useState<'email' | 'clause'>(initialTab && (initialTab === 'email' || initialTab === 'clause') ? initialTab : 'email');
    const subscription = calcSubscription(lead.storeCount);

    return (
        <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 h-full shadow-2xl z-50 flex flex-col"
            style={{ width: '66vw', background: '#ffffff', borderLeft: '1px solid #e2e8f0' }}>

            {/* 패널 헤더 - 테이블 컬럼과 동일한 레이아웃 */}
            <div className="border-b" style={{ borderColor: '#e2e8f0' }}>
                {/* 회사명 + 닫기 */}
                <div className="px-5 pt-4 pb-3 flex items-start justify-between">
                    <div>
                        <h2 className="font-black text-lg leading-tight" style={{ color: '#1e293b' }}>{lead.companyName}</h2>
                        <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{lead.bizType}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0 mt-0.5" style={{ color: '#94a3b8' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 테이블 컬럼 그리드: 위험도 / 가맹점 / 이슈 / 상태 / 담당 변호사 */}
                <div className="grid grid-cols-5 border-t" style={{ borderColor: '#f1f5f9' }}>
                    {[
                        {
                            label: '위험도',
                            value: <RiskBadge level={lead.riskLevel} />,
                        },
                        {
                            label: '가맹점',
                            value: <span className="text-sm font-bold" style={{ color: '#1e293b' }}>{lead.storeCount.toLocaleString()}개</span>,
                        },
                        {
                            label: '이슈',
                            value: (
                                <span className="text-sm font-black" style={{ color: lead.issueCount >= 4 ? '#dc2626' : lead.issueCount >= 2 ? '#d97706' : '#16a34a' }}>
                                    {lead.issueCount}건
                                </span>
                            ),
                        },
                        {
                            label: '상태',
                            value: <StatusBadge status={lead.status} />,
                        },
                        {
                            label: '담당 변호사',
                            value: lead.assignedLawyer
                                ? <span className="text-xs font-semibold px-1.5 py-0.5 rounded-lg" style={{ background: '#eef2ff', color: '#4f46e5' }}>{lead.assignedLawyer}</span>
                                : <span className="text-xs" style={{ color: '#cbd5e1' }}>—</span>,
                        },
                    ].map((col, i) => (
                        <div key={i} className="flex flex-col items-center justify-center py-2.5 gap-1"
                            style={{ borderRight: i < 4 ? '1px solid #f1f5f9' : undefined }}>
                            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#94a3b8' }}>{col.label}</span>
                            {col.value}
                        </div>
                    ))}
                </div>
            </div>

            {/* 탭 */}
            <div className="flex border-b overflow-x-auto" style={{ borderColor: '#e2e8f0' }}>
                {PANEL_TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className="flex-1 flex items-center justify-center gap-1 py-3 text-xs font-bold transition-colors whitespace-nowrap px-2"
                        style={{
                            color: tab === t.key ? '#4f46e5' : '#94a3b8',
                            borderBottom: tab === t.key ? '2px solid #4f46e5' : '2px solid transparent',
                            background: tab === t.key ? '#fafbff' : 'transparent',
                        }}>
                        {t.icon}{t.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-hidden">
                {tab === 'email' && (
                    <iframe src={`/admin/email-preview?leadId=${lead.id}&company=${encodeURIComponent(lead.companyName)}`}
                        className="w-full h-full border-none" />
                )}
                {tab === 'clause' && (
                    <iframe src={`/lawyer/privacy-review?leadId=${lead.id}&company=${encodeURIComponent(lead.companyName)}`}
                        className="w-full h-full border-none" />
                )}
            </div>
        </motion.div>
    );
}

// ── 드립 캠페인 탭 (흡수) ────────────────────────────────
const STATUS_COLOR_DRIP: Record<string, string> = {
    active: '#6366f1', paused: '#94a3b8', completed: '#16a34a', converted: '#b8960a'
};
const STATUS_LABEL_DRIP: Record<string, string> = {
    active: '진행 중', paused: '일시 중지', completed: '완료', converted: '전환 완료'
};
const TYPE_LABEL_DRIP: Record<string, string> = {
    legal_tip: '📋 법률 팁', case_study: '📊 케이스 분석', risk_alert: '⚠️ 리스크 알림', cta: '🎯 CTA'
};

function DripTab({ onSelectLead }: { onSelectLead: (leadId: string) => void }) {
    const [members, setMembers] = useState<DripMember[]>(() => dripStore.getAll());
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [nowMs] = useState(() => Date.now());

    const sendNow = async (memberId: string, day: number) => {
        setSendingId(`${memberId}_${day} `);
        try {
            await fetch('/api/drip', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ memberId, day }) });
            setMembers(dripStore.getAll());
        } catch { alert('발송 오류'); }
        setSendingId(null);
    };

    const stats = {
        total: members.length,
        active: members.filter(m => m.dripStatus === 'active').length,
        converted: members.filter(m => m.dripStatus === 'converted').length,
        totalSent: members.reduce((s, m) => s + m.sentDays.length, 0),
    };

    return (
        <div>
            {/* KPI */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                    { label: '총 멤버', value: stats.total, color: '#b8960a', bg: '#fffbeb', border: '#fde68a' },
                    { label: '진행 중', value: stats.active, color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
                    { label: '총 발송', value: stats.totalSent, color: '#0284c7', bg: '#e0f2fe', border: '#7dd3fc' },
                    { label: '전환 완료', value: stats.converted, color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
                ].map(k => (
                    <div key={k.label} className="p-4 rounded-xl border" style={{ background: k.bg, borderColor: k.border }}>
                        <div className="text-2xl font-black mb-0.5" style={{ color: k.color }}>{k.value}</div>
                        <div className="text-xs font-semibold" style={{ color: '#374151' }}>{k.label}</div>
                    </div>
                ))}
            </div>

            {/* 30일 시퀀스 */}
            <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50">
                <p className="font-black text-sm mb-3" style={{ color: '#1e293b' }}>30일 드립 시퀀스</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {DRIP_SEQUENCE.map((email, i) => (
                        <div key={i} className="flex-shrink-0 p-3 rounded-xl bg-white border border-slate-200 text-center w-28">
                            <div className="text-base font-black mb-1" style={{ color: '#b8960a' }}>D+{email.day}</div>
                            <div className="text-[10px] mb-1 font-semibold" style={{ color: '#6b7280' }}>{TYPE_LABEL_DRIP[email.contentType]}</div>
                            <div className="text-[10px]" style={{ color: '#64748b' }}>
                                {email.subject.replace(/^\[IBS 법률\]\s*|.*?—\s*/g, '').slice(0, 18)}...
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 멤버 목록 */}
            {members.length === 0 ? (
                <div className="text-center py-16 rounded-xl border-2 border-dashed border-slate-200">
                    <Mail className="w-10 h-10 mx-auto mb-3" style={{ color: '#cbd5e1' }} />
                    <p className="font-semibold" style={{ color: '#94a3b8' }}>등록된 드립 멤버가 없습니다</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {members.map(member => {
                        const daysSince = Math.floor((nowMs - new Date(member.joinedAt).getTime()) / 86400000);
                        const nextEmail = DRIP_SEQUENCE.find(e => !member.sentDays.includes(e.day));
                        return (
                            <div key={member.id}
                                className="p-4 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-amber-300 hover:shadow-sm transition-all"
                                onClick={() => onSelectLead(member.leadId)}>
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-bold text-sm" style={{ color: '#1e293b' }}>{member.companyName}</h3>
                                        <p className="text-xs font-semibold" style={{ color: '#374151' }}>{member.contactEmail} · D+{daysSince}일</p>
                                    </div>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold border"
                                        style={{ background: `${STATUS_COLOR_DRIP[member.dripStatus]} 12`, color: STATUS_COLOR_DRIP[member.dripStatus], borderColor: `${STATUS_COLOR_DRIP[member.dripStatus]} 30` }}>
                                        {STATUS_LABEL_DRIP[member.dripStatus]}
                                    </span>
                                </div>
                                <div className="flex gap-1.5 mb-3">
                                    {DRIP_SEQUENCE.map(email => {
                                        const sent = member.sentDays.includes(email.day);
                                        const pending = email.day <= daysSince && !sent;
                                        return (
                                            <div key={email.day} className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black border"
                                                style={{
                                                    background: sent ? '#dcfce7' : pending ? '#fffbeb' : '#f8fafc',
                                                    borderColor: sent ? '#86efac' : pending ? '#fde68a' : '#e2e8f0',
                                                    color: sent ? '#16a34a' : pending ? '#d97706' : '#94a3b8',
                                                }}>
                                                {sent ? '✓' : email.day}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs" style={{ color: '#64748b' }}>
                                        발송 {member.sentDays.length}/{DRIP_SEQUENCE.length}회
                                        {nextEmail && ` · 다음: D + ${nextEmail.day} `}
                                    </span>
                                    {nextEmail && !member.subscribed && (
                                        <button onClick={() => sendNow(member.id, nextEmail.day)}
                                            disabled={sendingId === `${member.id}_${nextEmail.day} `}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors"
                                            style={{ background: '#eef2ff', color: '#6366f1', borderColor: '#c7d2fe' }}>
                                            {sendingId === `${member.id}_${nextEmail.day} ` ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                            D+{nextEmail.day} 즉시 발송
                                        </button>
                                    )}
                                    {member.subscribed && (
                                        <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#16a34a' }}>
                                            <CheckCircle2 className="w-3.5 h-3.5" /> 구독 전환
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── calcSubscription ──────────────────────────────────────
function calcSubscription(storeCount: number) {
    if (storeCount <= 10) return { plan: 'Basic', monthly: 99000 };
    if (storeCount <= 50) return { plan: 'Standard', monthly: 297000 };
    if (storeCount <= 200) return { plan: 'Pro', monthly: 594000 };
    return { plan: 'Enterprise', monthly: 990000 };
}

// ── 메인 페이지 ───────────────────────────────────────────
export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>(() => leadStore.getAll());
    const [tab, setTab] = useState<'leads' | 'drip'>('leads');
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all');
    const [filterRisk, setFilterRisk] = useState<string>('all');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [activePanel, setActivePanel] = useState<Lead | null>(null);
    const [activePanelTab, setActivePanelTab] = useState<'email' | 'clause'>('email');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [memoInput, setMemoInput] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const reload = () => setLeads(leadStore.getAll());

    const filtered = leads.filter(l => {
        const q = search.toLowerCase();
        if (q && !l.companyName.toLowerCase().includes(q) && !l.contactName.toLowerCase().includes(q)) return false;
        if (filterStatus !== 'all' && l.status !== filterStatus) return false;
        if (filterRisk !== 'all' && l.riskLevel !== filterRisk) return false;
        return true;
    });

    const toggleSelect = (id: string) => {
        const s = new Set(selected);
        s.has(id) ? s.delete(id) : s.add(id);
        setSelected(s);
    };
    const toggleAll = () => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(l => l.id)));


    const handleBulkAssign = (lawyer: string) => {
        selected.forEach(id => leadStore.update(id, { assignedLawyer: lawyer }));
        reload(); setSelected(new Set());
    };

    const openPanel = (lead: Lead, tab?: 'email' | 'clause') => { setActivePanelTab(tab ?? 'email'); setActivePanel(lead); };
    const closePanel = () => setActivePanel(null);
    const updatePanel = () => { reload(); if (activePanel) setActivePanel(leadStore.getById(activePanel.id) ?? null); };

    // 요약 카운트
    const counts = {
        total: leads.length,
        high: leads.filter(l => l.riskLevel === 'HIGH').length,
        contracted: leads.filter(l => l.status === 'contracted').length,
        pending: leads.filter(l => l.status === 'pending').length,
    };

    return (
        <div className="min-h-screen px-4 py-8 max-w-[1600px] mx-auto" style={{ background: T.bg }}>



            <div className={`transition-all duration-300 ${activePanel ? 'mr-[66vw]' : ''}`}>

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black" style={{ color: T.heading }}>📋 영업 현황판</h1>
                        <p className="text-sm mt-0.5" style={{ color: T.muted }}>
                            영업 파이프라인 모니터링 · 관리자 전용 | {leads.length}개 리드
                        </p>
                    </div>
                </div>

                {/* 요약 KPI */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                    {[
                        { label: '전체 리드', value: counts.total, color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
                        { label: '위험 건수', value: counts.high, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
                        { label: '신규 대기', value: counts.pending, color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
                        { label: '계약 완료', value: counts.contracted, color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
                    ].map(k => (
                        <div key={k.label} className="p-4 flex items-center gap-3 rounded-xl"
                            style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black"
                                style={{ background: k.bg, color: k.color }}>
                                {k.value}
                            </div>
                            <span className="text-sm font-semibold" style={{ color: T.sub }}>{k.label}</span>
                        </div>
                    ))}
                </div>

                {/* 탭 */}
                <div className="flex gap-1 mb-4">
                    {([['leads', '📋 리드 목록'], ['drip', '📧 드립 캠페인']] as const).map(([k, label]) => (
                        <button key={k} onClick={() => setTab(k)}
                            className="px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                            style={{ background: tab === k ? T.card : 'transparent', color: tab === k ? T.body : T.faint, boxShadow: tab === k ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', border: tab === k ? `1px solid ${T.border}` : '1px solid transparent' }}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* 리드 목록 탭 */}
                {tab === 'leads' && (
                    <div>
                        {/* 파이프라인 필터 */}
                        <div className="mb-5 overflow-x-auto pb-1">
                            <div className="flex gap-1 min-w-max items-center">
                                <button onClick={() => { setFilterStatus('all'); setCurrentPage(1); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                                    style={{ background: filterStatus === 'all' ? '#fffbeb' : T.card, border: `1px solid ${filterStatus === 'all' ? '#fde68a' : T.border}`, color: filterStatus === 'all' ? '#b8960a' : T.sub }}>
                                    전체 <span>{leads.length}</span>
                                </button>
                                {STATUS_ORDER.filter(s => s !== 'failed').map(s => {
                                    const cnt = leads.filter(l => l.status === s).length;
                                    const m = STATUS_META[s];
                                    return (
                                        <React.Fragment key={s}>
                                            <ChevronDown className="w-3 h-3 -rotate-90 flex-shrink-0" style={{ color: T.faint }} />
                                            <button onClick={() => { setFilterStatus(s); setCurrentPage(1); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                                                style={{ background: filterStatus === s ? m.bg : T.card, border: `1px solid ${filterStatus === s ? m.color + '60' : T.border}`, color: filterStatus === s ? m.color : T.sub }}>
                                                {m.label} <span>{cnt}</span>
                                            </button>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 검색 + 위험도 필터 + 보기개수 */}
                        <div className="mb-4 flex gap-3 items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.faint }} />
                                <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                                    placeholder="회사명, 담당자명, 이메일 검색..."
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium"
                                    style={{ background: T.card, border: `1px solid ${T.border}`, color: T.body, outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} />
                            </div>
                            <select value={filterRisk} onChange={e => { setFilterRisk(e.target.value); setCurrentPage(1); }}
                                className="px-3 py-2.5 rounded-xl text-sm font-medium"
                                style={{ background: T.card, border: `1px solid ${T.border}`, color: T.body, outline: 'none' }}>
                                <option value="all">위험도 전체</option>
                                <option value="HIGH">위험</option>
                                <option value="MEDIUM">주의</option>
                                <option value="LOW">양호</option>
                            </select>
                            <div className="flex items-center gap-2">
                                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                    className="px-2 py-2 rounded-xl text-xs font-bold"
                                    style={{ background: T.card, border: `1px solid ${T.border}`, color: T.body, outline: 'none' }}>
                                    {[10, 20, 50, 100].map(n => (
                                        <option key={n} value={n}>{n}개씩</option>
                                    ))}
                                </select>
                                <span className="text-xs whitespace-nowrap" style={{ color: T.faint }}>
                                    {filtered.length}건 중 {Math.min((currentPage - 1) * pageSize + 1, filtered.length)}–{Math.min(currentPage * pageSize, filtered.length)}
                                </span>
                            </div>
                        </div>

                        {/* 일괄 툴바 */}
                        <AnimatePresence>
                            {selected.size > 0 && (
                                <BulkToolbar count={selected.size} onClear={() => setSelected(new Set())}
                                    onBulkAssign={handleBulkAssign} />
                            )}
                        </AnimatePresence>

                        {/* 테이블 */}
                        <div className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: '#f8f9fc', borderBottom: `2px solid ${T.border}` }}>
                                        <th className="px-3 py-3 text-left">
                                            <button onClick={toggleAll} style={{ color: T.faint }}>
                                                {selected.size === filtered.length && filtered.length > 0
                                                    ? <CheckSquare className="w-4 h-4" style={{ color: '#6366f1' }} />
                                                    : <Square className="w-4 h-4" />}
                                            </button>
                                        </th>
                                        {['회사명', '위험도', '가맹점', '이슈', '상태', '영업컨펌', '담당 변호사', '전화번호', '메모', '상세'].map(h => (
                                            <th key={h} className="py-3 px-3 text-left text-xs font-black whitespace-nowrap tracking-wide" style={{ color: '#b8960a' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const start = (currentPage - 1) * pageSize;
                                        const paginated = filtered.slice(start, start + pageSize);
                                        return paginated.map((lead, i) => (
                                            <React.Fragment key={lead.id}>
                                                <tr
                                                    className="transition-colors"
                                                    style={{ borderBottom: `1px solid ${T.borderSub}`, background: selected.has(lead.id) ? '#eef2ff' : undefined }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = selected.has(lead.id) ? '#eef2ff' : T.rowHover)}
                                                    onMouseLeave={e => (e.currentTarget.style.background = selected.has(lead.id) ? '#eef2ff' : 'transparent')}>
                                                    <td className="px-4 py-3.5" onClick={e => { e.stopPropagation(); toggleSelect(lead.id); }}>
                                                        {selected.has(lead.id)
                                                            ? <CheckSquare className="w-4 h-4" style={{ color: '#6366f1' }} />
                                                            : <Square className="w-4 h-4" style={{ color: '#cbd5e1' }} />}
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <div>
                                                            <p className="font-black text-sm" style={{ color: T.body }}>{lead.companyName}</p>
                                                            <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>{lead.contactName} · {lead.contactEmail}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-3"><RiskBadge level={lead.riskLevel} /></td>
                                                    <td className="py-3.5 px-3">
                                                        <span className="text-xs font-black" style={{ color: T.body }}>{lead.storeCount.toLocaleString()}</span>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <span className="text-xs font-black" style={{ color: lead.issueCount >= 4 ? '#dc2626' : lead.issueCount >= 2 ? '#d97706' : '#16a34a' }}>{lead.issueCount}건</span>
                                                    </td>
                                                    <td className="py-3.5 px-3"><StatusBadge status={lead.status} /></td>
                                                    {/* 영업컨펌 담당자 */}
                                                    <td className="py-3.5 px-3">
                                                        <span className="text-xs font-semibold" style={{ color: T.muted }}>{(lead as unknown as Record<string, string>).salesConfirmedBy ?? '—'}</span>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-xs font-semibold" style={{ color: T.muted }}>{lead.assignedLawyer ?? '—'}</td>
                                                    {/* 전화번호 */}
                                                    <td className="py-3.5 px-3">
                                                        {lead.contactPhone ? (
                                                            <a href={`tel:${lead.contactPhone}`}
                                                                className="flex items-center gap-1 text-xs font-medium whitespace-nowrap"
                                                                style={{ color: '#2563eb' }}
                                                                onClick={e => e.stopPropagation()}>
                                                                <Phone className="w-3 h-3 flex-shrink-0" />
                                                                {lead.contactPhone}
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs" style={{ color: T.faint }}>—</span>
                                                        )}
                                                    </td>
                                                    {/* 메모 (최신순) */}
                                                    <td className="py-3.5 px-3" style={{ maxWidth: 140 }}>
                                                        {lead.memos.length > 0 ? (
                                                            <p className="text-xs truncate" style={{ color: T.sub, maxWidth: 140 }}
                                                                title={lead.memos[lead.memos.length - 1].content}>
                                                                {lead.memos[lead.memos.length - 1].content}
                                                            </p>
                                                        ) : (
                                                            <span className="text-xs" style={{ color: T.faint }}>—</span>
                                                        )}
                                                    </td>

                                                    <td className="py-3.5 px-3">
                                                        <button
                                                            onClick={e => { e.stopPropagation(); setExpandedId(expandedId === lead.id ? null : lead.id); }}
                                                            className="p-2 rounded-xl transition-colors"
                                                            style={{
                                                                background: expandedId === lead.id ? '#eef2ff' : '#f8f9fc',
                                                                border: `1px solid ${expandedId === lead.id ? '#c7d2fe' : '#e5e7eb'}`,
                                                            }}
                                                            title={expandedId === lead.id ? '접기' : '펼치기'}>
                                                            {expandedId === lead.id
                                                                ? <ChevronUp className="w-5 h-5" style={{ color: '#6366f1' }} />
                                                                : <ChevronDown className="w-5 h-5" style={{ color: '#64748b' }} />}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {/* 확장 행 */}
                                                {expandedId === lead.id && (
                                                    <tr style={{ background: '#f8fafc' }}>
                                                        <td colSpan={11} className="px-4 py-3" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                                                            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                                                <div className="flex gap-2">
                                                                    <textarea rows={3} value={memoInput} onChange={e => setMemoInput(e.target.value)}
                                                                        placeholder="메모 입력..."
                                                                        className="flex-1 px-3 py-2 rounded-lg text-xs resize-none"
                                                                        style={{ border: `1px solid ${T.border}`, outline: 'none', color: T.body }} />
                                                                    <button onClick={() => {
                                                                        if (!memoInput.trim()) return;
                                                                        const now = new Date().toISOString();
                                                                        const newMemo = { id: `m_${Date.now()}`, content: memoInput.trim(), author: '관리자', createdAt: now };
                                                                        leadStore.update(lead.id, { memos: [...lead.memos, newMemo] });
                                                                        setMemoInput('');
                                                                        reload();
                                                                    }}
                                                                        className="self-stretch px-4 rounded-lg text-xs font-bold"
                                                                        style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#0a0e1a' }}>
                                                                        추가
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                            {filtered.length === 0 && (
                                <div className="text-center py-16" style={{ color: T.faint }}>
                                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="font-medium">검색 결과가 없습니다</p>
                                </div>
                            )}

                            {/* 페이지 전환 */}
                            {filtered.length > 0 && Math.ceil(filtered.length / pageSize) > 1 && (
                                <div className="flex items-center justify-center py-3" style={{ borderTop: `1px solid ${T.borderSub}` }}>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
                                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-30"
                                            style={{ background: T.card, border: `1px solid ${T.border}`, color: T.body }}>
                                            ← 이전
                                        </button>
                                        {Array.from({ length: Math.ceil(filtered.length / pageSize) }, (_, i) => i + 1).slice(
                                            Math.max(0, currentPage - 3), currentPage + 2
                                        ).map(p => (
                                            <button key={p} onClick={() => setCurrentPage(p)}
                                                className="w-8 h-8 rounded-lg text-xs font-bold transition-colors"
                                                style={{
                                                    background: p === currentPage ? '#eef2ff' : 'transparent',
                                                    border: p === currentPage ? '1px solid #c7d2fe' : '1px solid transparent',
                                                    color: p === currentPage ? '#6366f1' : T.muted,
                                                }}>
                                                {p}
                                            </button>
                                        ))}
                                        <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filtered.length / pageSize), p + 1))}
                                            disabled={currentPage >= Math.ceil(filtered.length / pageSize)}
                                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-30"
                                            style={{ background: T.card, border: `1px solid ${T.border}`, color: T.body }}>
                                            다음 →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-xs mt-2 text-right font-medium" style={{ color: T.faint }}>
                            총 {filtered.length}건{selected.size > 0 && ` · ${selected.size}개 선택`}
                        </p>
                    </div>
                )}

                {/* 드립 캠페인 탭 */}
                {tab === 'drip' && <DripTab onSelectLead={(leadId) => { const l = leads.find(x => x.id === leadId); if (l) openPanel(l); }} />}
            </div>

            {/* 슬라이드 패널 오버레이 */}
            <AnimatePresence>
                {activePanel && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.12)' }}
                            onClick={closePanel} />
                        <SlidePanel lead={activePanel} onClose={closePanel} onUpdate={updatePanel} initialTab={activePanelTab} />
                    </>
                )}
            </AnimatePresence>

        </div >
    );
}
