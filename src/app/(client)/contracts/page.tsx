'use client';
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { FileText, Plus, CheckCircle2, Clock, AlertTriangle, Eye, Edit3, Send, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { dataLayer } from '@/lib/dataLayer';
import { createContract, sendContractEmail } from '@/actions/contractActions';

// ── BlockNote 에디터 (SSR 비활성화) ──────────────────────────────
interface BlockNoteEditorProps { initialContent: string; onChange: (v: string) => void; }
const BlockNoteEditorComponent = dynamic<BlockNoteEditorProps>(
    () => import('./_BlockNoteEditor'),
    { ssr: false, loading: () => <div className="w-full h-48 rounded-xl animate-pulse" style={{ background: '#f3f4f6' }} /> }
);

const CONTRACT_TEMPLATES = [
    { id: '서비스 이용 계약', name: '서비스 이용 계약', desc: '플랫폼 서비스 제공 계약서 표준 양식' },
    { id: '자문 계약서', name: '자문 계약서', desc: '법률·경영 자문 위임 계약서' },
    { id: '가맹계약서', name: '가맹계약서', desc: '가맹본부-가맹점 표준 계약서 (가맹사업법 준거)' },
    { id: 'NDA', name: '비밀유지계약서(NDA)', desc: '영업비밀 보호를 위한 표준 NDA 양식' }
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: '초안', color: '#94a3b8', icon: <Edit3 className="w-3 h-3" /> },
    waiting_other: { label: '서명 대기', color: '#fb923c', icon: <Clock className="w-3 h-3" /> },
    both_signed: { label: '서명 완료', color: '#4ade80', icon: <CheckCircle2 className="w-3 h-3" /> },
};

export default function ContractsPage() {
    const router = useRouter();
    const [showNew, setShowNew] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [contractTitle, setContractTitle] = useState('');
    const [partyEmail, setPartyEmail] = useState('');
    const [content, setContent] = useState('');
    
    // Status states
    const [createdContractId, setCreatedContractId] = useState('');
    const [creating, setCreating] = useState(false);
    const [sending, setSending] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    
    // Data states
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // ── 세션에서 회사명 읽기 ────────────────────────────────
    const [companyName, setCompanyName] = useState('');
    useEffect(() => {
        try {
            const raw = localStorage.getItem('ibs_auth_v1');
            if (raw) {
                const s = JSON.parse(raw);
                if (s?.companyName) setCompanyName(s.companyName);
            }
        } catch { /* ignore */ }
    }, []);

    // ── 데이터 페칭 ────────────────────────────────
    const fetchContracts = async () => {
        try {
            const data = await dataLayer.contracts.getAll();
            setContracts(data);
        } catch (err) {
            console.error('Failed to fetch contracts', err);
            setContracts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, []);

    useEffect(() => {
        if (selectedTemplate) {
            setContent(`제1조 (목적)
본 계약은 갑(${companyName || 'IBS 법률사무소'})과 을 간의 ${selectedTemplate} 운영에 관한 권리·의무 관계를 규정함을 목적으로 한다.

제2조 (계약금)
본 계약의 계약금액은 당사자 간 별도 협의에 따른다.

제3조 (비밀유지)
을은 계약 기간 중 및 계약 종료 후 2년간 갑의 영업비밀을 누설하여서는 아니 된다.`);
        } else {
            setContent('');
        }
    }, [selectedTemplate, companyName]);

    const showToast = (msg: string, type: 'success'|'error' = 'success') => {
        setToastMsg(msg);
        setToastType(type);
        setTimeout(() => setToastMsg(''), 3000);
    };

    const handleCreate = async () => {
        if (!contractTitle || !content) {
            showToast('제목과 본문을 입력해주세요.', 'error');
            return;
        }
        setCreating(true);
        try {
            const id = await createContract({
                title: contractTitle,
                template: selectedTemplate,
                partyEmail: partyEmail,
                companyName: companyName || '(주)기업명',
                content: content
            });
            setCreatedContractId(id);
            fetchContracts();
            showToast('계약서가 생성되었습니다.');
        } catch (err: any) {
            showToast(err.message || '계약서 생성에 실패했습니다.', 'error');
        } finally {
            setCreating(false);
        }
    };

    const handleSendEmail = async () => {
        if (!partyEmail) {
            showToast('받는 사람의 이메일 주소를 입력해주세요.', 'error');
            return;
        }
        setSending(true);
        try {
            const domain = window.location.origin;
            const link = `${domain}/contracts/${createdContractId}`;
            await sendContractEmail(createdContractId, partyEmail, link);
            showToast('이메일 발송이 성공적으로 완료되었습니다.');
            fetchContracts(); // Refresh to update status to waiting_other
        } catch (err: any) {
            showToast(err.message || '이메일 발송에 실패했습니다.', 'error');
        } finally {
            setSending(false);
        }
    };
    
    const resetModal = () => {
        setShowNew(false);
        setCreatedContractId('');
        setSelectedTemplate('');
        setContractTitle('');
        setPartyEmail('');
        setContent('');
    };

    return (
        <div className="min-h-screen pt-20 pb-12" style={{ background: '#f8f7f4' }}>
            <div className="max-w-5xl mx-auto px-4 relative">
                
                {/* Toast Notification */}
                {toastMsg && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                                className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full font-bold text-sm shadow-lg flex items-center gap-2"
                                style={{ 
                                    background: toastType === 'success' ? '#111827' : '#27272a', // 점잖은 검은색 계열 에러 박스
                                    border: toastType === 'error' ? '1px solid #dc2626' : '1px solid #4ade80',
                                    color: '#fff' 
                                }}>
                        {toastType === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                        {toastMsg}
                    </motion.div>
                )}

                {/* 헤더 */}
                <div className="flex items-center justify-between py-6 mb-6"
                    style={{ borderBottom: '1px solid #e8e5de' }}>
                    <div>
                        <h1 className="text-2xl font-black" style={{ color: '#111827' }}>전자계약</h1>
                        <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>계약서 작성·발송·서명 관리</p>
                    </div>
                    <button onClick={() => setShowNew(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
                        style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#111827' }}>
                        <Plus className="w-4 h-4" /> 새 계약서
                    </button>
                </div>

                {/* 새 계약서 생성 모달 */}
                {showNew && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-2xl mb-8"
                        style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                        {!createdContractId ? (
                            <>
                                <h2 className="font-black mb-5" style={{ color: '#c9a84c' }}>새 계약서 작성</h2>
                                <div className="grid md:grid-cols-2 gap-3 mb-5">
                                    {CONTRACT_TEMPLATES.map(t => (
                                        <div key={t.id} onClick={() => setSelectedTemplate(t.id)}
                                            className="p-4 rounded-xl cursor-pointer transition-all"
                                            style={{
                                                background: selectedTemplate === t.id ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
                                                border: `2px solid ${selectedTemplate === t.id ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.08)'}`,
                                            }}>
                                            <div className="font-bold text-sm mb-1" style={{ color: selectedTemplate === t.id ? '#c9a84c' : '#374151' }}>{t.name}</div>
                                            <div className="text-xs" style={{ color: '#6b7280' }}>{t.desc}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid md:grid-cols-2 gap-4 mb-5">
                                    <div>
                                        <label className="block text-sm font-bold mb-1.5" style={{ color: '#374151' }}>계약서 제목</label>
                                        <input value={contractTitle} onChange={e => setContractTitle(e.target.value)}
                                            placeholder="예: 2026년 법률 자문 위임 계약"
                                            className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                                            style={{ background: '#f3f4f6', border: '1px solid #e8e5de', color: '#111827' }} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1.5" style={{ color: '#374151' }}>상대방 이메일 (서명 요청)</label>
                                        <input value={partyEmail} onChange={e => setPartyEmail(e.target.value)}
                                            placeholder="상대방 이메일 (나중에 추가 가능)"
                                            className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                                            style={{ background: '#f3f4f6', border: '1px solid #e8e5de', color: '#111827' }} />
                                    </div>
                                </div>
                                <div className="mb-5">
                                    <label className="block text-sm font-bold mb-1.5" style={{ color: '#374151' }}>계약서 본문 에디터</label>
                                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e8e5de', minHeight: '200px' }}>
                                        <BlockNoteEditorComponent
                                            initialContent={content}
                                            onChange={setContent}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={handleCreate} disabled={creating}
                                        className="px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center min-w-[120px] transition-all"
                                        style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#111827', opacity: creating ? 0.7 : 1 }}>
                                        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : '계약서 생성'}
                                    </button>
                                    <button onClick={resetModal}
                                        className="px-6 py-2.5 rounded-xl font-bold text-sm"
                                        style={{ background: '#f3f4f6', color: '#6b7280' }}>
                                        취소
                                    </button>
                                </div>
                            </>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#4ade80' }} />
                                <h3 className="font-black text-lg mb-2" style={{ color: '#4ade80' }}>계약서 생성 완료!</h3>
                                <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                                    서명 링크가 생성되었습니다. 상대방에게 링크를 전송하세요.
                                </p>
                                <div className="p-3 rounded-xl mb-4 text-left mx-auto max-w-lg"
                                    style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                                    <p className="text-xs font-bold mb-1" style={{ color: '#4ade80' }}>서명 링크 (복사 후 발송)</p>
                                    <p className="text-xs font-mono break-all" style={{ color: '#374151' }}>
                                        {typeof window !== 'undefined' ? window.location.origin : ''}/contracts/{createdContractId}
                                    </p>
                                </div>
                                <div className="flex gap-3 justify-center">
                                    <button onClick={handleSendEmail} disabled={sending || !partyEmail}
                                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm min-w-[140px] transition-all"
                                        style={{ background: '#fef3c7', color: '#c9a84c', border: '1px solid #c9a84c', opacity: (sending || !partyEmail) ? 0.6 : 1 }}>
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> 이메일로 발송</>}
                                    </button>
                                    <button onClick={resetModal}
                                        className="px-5 py-2.5 rounded-xl font-bold text-sm"
                                        style={{ background: '#f3f4f6', color: '#6b7280' }}>
                                        닫기
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* 계약서 목록 */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#c9a84c' }} />
                    </div>
                ) : contracts.length === 0 ? (
                    <div className="text-center py-12 text-sm" style={{ color: '#9ca3af' }}>
                        아직 작성된 전자계약서가 없습니다.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {contracts.map(c => {
                            const s = STATUS_MAP[c.status] || STATUS_MAP.draft;
                            const createdDate = new Date(c.created_at).toLocaleDateString('ko-KR');
                            const partyName = c.party_b_name || c.party_b_email || '—';
                            
                            return (
                                <motion.div key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="p-5 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 md:gap-5 cursor-pointer transition-all hover:bg-gray-50 hover:shadow-sm"
                                    onClick={() => router.push(`/contracts/${c.id}`)}
                                    style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="p-2.5 rounded-xl shrink-0" style={{ background: '#fef3c7' }}>
                                            <FileText className="w-5 h-5" style={{ color: '#c9a84c' }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm mb-0.5 truncate" style={{ color: '#111827' }}>{c.title}</div>
                                            <div className="text-xs truncate" style={{ color: '#6b7280' }}>
                                                {c.template} · {partyName} · {createdDate}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 justify-end">
                                        <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold whitespace-nowrap"
                                            style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30` }}>
                                            {s.icon} {s.label}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                <p className="text-center text-xs mt-8" style={{ color: '#d1d5db' }}>
                    Phase 2: 모두사인·DocuSign API 연동 시 전자서명 법적 효력 강화
                </p>
            </div>
        </div>
    );
}
