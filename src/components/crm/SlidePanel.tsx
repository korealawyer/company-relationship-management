// @ts-nocheck
'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    X, User, Mail, Activity, MessageSquare, Phone, Shield,
    Copy, Save, CheckCircle2, CheckCheck, Send,
    PhoneCall, Calendar, Gavel, Edit3, ChevronRight, Plus,
} from 'lucide-react';
import { Company, CaseStatus, CompanyTimelineEvent, TimelineEventType } from '@/lib/types';
import { STATUS_LABEL, STATUS_COLOR, STATUS_TEXT } from '@/lib/constants';
import { useCompanies } from '@/hooks/useDataLayer';

// ── 색상 ──
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

// ── RiskBadge ──
export function RiskBadge({ level }: { level: string }) {
    const m = RISK_META[level as keyof typeof RISK_META] ?? RISK_META[''];
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border"
            style={{ color: m.color, background: m.bg, borderColor: m.border }}>
            {m.label}
        </span>
    );
}

// ── 연락처 탭 ──
function ContactTab({ company, onUpdate }: { company: Company; onUpdate: () => void }) {
    const contacts = (company.contacts?.length ?? 0) > 0
        ? company.contacts
        : [{ id: 'legacy', name: company.contactName || company.email?.split('@')[0] || '담당자', phone: company.contactPhone || company.phone, email: company.contactEmail || company.email, isPrimary: true, role: '', department: '' }];

    return (
        <div className="space-y-3">
            {contacts.map(c => (
                <div key={c.id} className="p-4 rounded-xl border" style={{ borderColor: c.isPrimary ? '#c7d2fe' : '#e2e8f0', background: c.isPrimary ? '#eef2ff' : '#f8fafc' }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                                style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                                {(c.name || '?')[0]}
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

// ── 스크립트 탭 ──
function ScriptTab({ company, onUpdate }: { company: Company; onUpdate: () => void }) {
    const defaultCall = `안녕하세요, ${company.contactName || '담당자'}님. IBS 법률사무소 영업팀입니다.\n\n${company.name}의 개인정보처리방침을 검토한 결과, ${company.issues?.length || 0}건의 법적 리스크를 발견했습니다.\n\n10분 정도 통화 가능하신가요?`;
    const defaultEmail = `제목: [IBS 법률] ${company.name} 개인정보처리방침 리스크 진단 결과\n\n${company.contactName || '담당자'} 님께,\n\n안녕하세요. IBS 법률사무소입니다.\n\n${company.name}의 홈페이지를 검토한 결과, ${company.issues?.length || 0}건의 이슈를 발견했습니다.\n\n무료 상세 진단 리포트를 제공해 드리겠습니다.\n\nIBS 법률사무소 드림`;

    const [callScript, setCallScript] = useState(company.customScript?.call ?? defaultCall);
    const [emailScript, setEmailScript] = useState(company.customScript?.email ?? defaultEmail);
    const [activeScript, setActiveScript] = useState<'call' | 'email'>('call');
    const [saved, setSaved] = useState(false);

    const { updateCompany } = useCompanies();
    const handleSave = () => {
        updateCompany(company.id, { customScript: { call: callScript, email: emailScript } });
        onUpdate(); setSaved(true); setTimeout(() => setSaved(false), 2000);
    };

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
                <button onClick={() => navigator.clipboard.writeText(activeScript === 'call' ? callScript : emailScript)}
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
    );
}

// ── 타임라인 탭 ──
function TimelineTab({ company, onUpdate }: { company: Company; onUpdate: () => void }) {
    const [newContent, setNewContent] = useState('');
    const [newType, setNewType] = useState<TimelineEventType>('call');
    const sorted = [...(company.timeline || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const { updateCompany } = useCompanies();
    const handleAdd = () => {
        if (!newContent.trim()) return;
        updateCompany(company.id, { 
            timeline: [...(company.timeline || []), { 
                id: crypto.randomUUID(), 
                createdAt: new Date().toISOString(), 
                author: '영업팀', 
                type: newType, 
                content: newContent 
            }] 
        });
        onUpdate(); setNewContent('');
    };

    return (
        <div>
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
                        placeholder="활동 내용 입력..." onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                        style={{ borderColor: '#e2e8f0', color: '#1e293b' }} />
                    <button onClick={handleAdd}
                        className="px-3 py-2 rounded-lg text-sm font-bold transition-colors"
                        style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
                        기록
                    </button>
                </div>
            </div>
            <div className="space-y-3">
                {sorted.map(event => {
                    const color = TIMELINE_COLOR[event.type];
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
                            </div>
                        </div>
                    );
                })}
                {sorted.length === 0 && (
                    <div className="text-center py-8" style={{ color: '#94a3b8' }}>
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">아직 활동 기록이 없습니다</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── 메모 탭 ──
function MemoTab({ company, onUpdate }: { company: Company; onUpdate: () => void }) {
    const [text, setText] = useState('');
    const { updateCompany } = useCompanies();
    const handleSave = () => {
        if (!text.trim()) return;
        updateCompany(company.id, { 
            memos: [...(company.memos || []), { 
                id: crypto.randomUUID(), 
                createdAt: new Date().toISOString(), 
                author: '영업팀', 
                content: text 
            }] 
        });
        onUpdate(); setText('');
    };
    return (
        <div className="space-y-3">
            {(!company.memos || company.memos.length === 0) && (
                <div className="text-center py-8" style={{ color: '#94a3b8' }}>
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">아직 메모가 없습니다</p>
                </div>
            )}
            {[...(company.memos || [])].reverse().map(memo => (
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
                    placeholder="새 메모 입력..." rows={3}
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

// ── 개인정보방침 탭 ──
function PrivacyTab({ company, onUpdate }: { company: Company; onUpdate: () => void }) {
    const [privacyUrl, setPrivacyUrl] = useState(company.privacyUrl || '');
    const [privacyText, setPrivacyText] = useState(company.privacyPolicyText || '');
    const [saved, setSaved] = useState(false);
    const { updateCompany } = useCompanies();

    const handleSave = () => {
        updateCompany(company.id, { privacyUrl, privacyPolicyText: privacyText });
        onUpdate(); 
        setSaved(true); 
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: '#64748b' }}>개인정보처리방침 URL</label>
                <input value={privacyUrl} onChange={e => setPrivacyUrl(e.target.value)}
                    placeholder="https://example.com/privacy (없으면 비워두세요)"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors"
                    style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#1e293b', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
                    onFocus={e => e.target.style.borderColor = '#c7d2fe'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: '#64748b' }}>방침 원문 텍스트 (옵션)</label>
                <textarea value={privacyText} onChange={e => setPrivacyText(e.target.value)}
                    placeholder="방침 전문 텍스트를 붙여넣으세요..." rows={9}
                    className="w-full px-4 py-3 rounded-xl border text-sm resize-none outline-none transition-colors"
                    style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#1e293b', lineHeight: '1.7', fontFamily: 'inherit', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
                    onFocus={e => e.target.style.borderColor = '#c7d2fe'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <button onClick={handleSave}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5"
                style={{ background: saved ? '#dcfce7' : '#eef2ff', color: saved ? '#16a34a' : '#4f46e5', border: `1px solid ${saved ? '#86efac' : '#c7d2fe'}` }}>
                {saved ? <><CheckCircle2 className="w-4 h-4" /> 저장됨</> : <><Save className="w-4 h-4" /> 저장 및 동기화</>}
            </button>
        </div>
    );
}

// ── 패널 탭 정의 ──
const PANEL_TABS = [
    { key: 'contact', label: '연락처', icon: <User className="w-3.5 h-3.5" /> },
    { key: 'script', label: '스크립트', icon: <Mail className="w-3.5 h-3.5" /> },
    { key: 'timeline', label: '진행', icon: <Activity className="w-3.5 h-3.5" /> },
    { key: 'memo', label: '메모', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { key: 'privacy', label: '개인정보', icon: <Shield className="w-3.5 h-3.5" /> },
] as const;

// ── 슬라이드 패널 메인 ──
export default function SlidePanel({ company, onClose, onUpdate }: { company: Company; onClose: () => void; onUpdate: () => void }) {
    const [tab, setTab] = useState<'contact' | 'script' | 'timeline' | 'memo' | 'privacy'>('contact');
    const risk = RISK_META[company.riskLevel as keyof typeof RISK_META] ?? RISK_META[''];

    return (
        <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 h-full w-[520px] shadow-2xl z-50 flex flex-col"
            style={{ background: '#ffffff', borderLeft: '1px solid #e2e8f0' }}>

            {/* 헤더 */}
            <div className="border-b" style={{ borderColor: '#e2e8f0' }}>
                <div className="px-5 pt-4 pb-3 flex items-start justify-between">
                    <div>
                        <h2 className="font-black text-lg leading-tight" style={{ color: '#1e293b' }}>{company.name}</h2>
                        <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{company.bizType || company.biz}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0 mt-0.5" style={{ color: '#94a3b8' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 요약 그리드 */}
                <div className="grid grid-cols-4 border-t" style={{ borderColor: '#f1f5f9' }}>
                    {[
                        { label: '위험도', value: <RiskBadge level={company.riskLevel} /> },
                        { label: '가맹점', value: <span className="text-sm font-bold" style={{ color: '#1e293b' }}>{company.storeCount.toLocaleString()}개</span> },
                        { label: '이슈', value: <span className="text-sm font-black" style={{ color: (company.issueCount || company.issues?.length || 0) >= 4 ? '#dc2626' : '#d97706' }}>{company.issueCount || company.issues?.length || 0}건</span> },
                        { label: '상태', value: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: STATUS_COLOR[company.status], color: STATUS_TEXT[company.status] }}>{STATUS_LABEL[company.status]}</span> },
                    ].map((col, i) => (
                        <div key={i} className="flex flex-col items-center justify-center py-2.5 gap-1"
                            style={{ borderRight: i < 3 ? '1px solid #f1f5f9' : undefined }}>
                            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#94a3b8' }}>{col.label}</span>
                            {col.value}
                        </div>
                    ))}
                </div>
            </div>

            {/* 탭 네비 */}
            <div className="flex border-b" style={{ borderColor: '#e2e8f0' }}>
                {PANEL_TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors"
                        style={{
                            color: tab === t.key ? '#4f46e5' : '#94a3b8',
                            borderBottom: `2px solid ${tab === t.key ? '#4f46e5' : 'transparent'}`,
                            background: tab === t.key ? '#eef2ff' : 'transparent',
                        }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* 탭 콘텐츠 */}
            <div className="flex-1 overflow-y-auto p-5">
                {tab === 'contact' && <ContactTab company={company} onUpdate={onUpdate} />}
                {tab === 'script' && <ScriptTab company={company} onUpdate={onUpdate} />}
                {tab === 'timeline' && <TimelineTab company={company} onUpdate={onUpdate} />}
                {tab === 'memo' && <MemoTab company={company} onUpdate={onUpdate} />}
                {tab === 'privacy' && <PrivacyTab company={company} onUpdate={onUpdate} />}
            </div>
        </motion.div>
    );
}
