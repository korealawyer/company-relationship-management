import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gavel } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { store, COURTS, LITIGATION_TYPES, LAWYERS } from '@/lib/mockStore';

export const INSTANCE_TYPES = ['1심', '2심(항소)', '3심(상고)', '헌법', '가처분', '가압류', '조정'];
export const CASE_CATEGORIES = ['민사', '형사', '가사', '행정', '헌법', '회생/파산', '국제중재'];

export default function AddCaseModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
    const companies = store.getAll();
    const [form, setForm] = useState({
        companyId: companies[0]?.id ?? '', caseNo: '', court: COURTS[0], type: LITIGATION_TYPES[0],
        category: '민사', instance: '1심', opponent: '', opponentCounsel: '', claimAmount: '',
        assignedLawyer: LAWYERS[0], coLawyer: '', assistLawyer: '', notes: '', filingDate: '',
    });
    const [deadlines, setDeadlines] = useState<{ label: string; dueDate: string }[]>([{ label: '소장 접수', dueDate: '' }]);
    const [aiSuggestion, setAiSuggestion] = useState<any>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('ibs_ocr_suggestion');
        if (stored) {
            try {
                setAiSuggestion(JSON.parse(stored));
            } catch (e) {}
        }
    }, []);

    const handleApplySuggestion = () => {
        if (!aiSuggestion) return;
        setForm(p => ({
            ...p,
            opponent: aiSuggestion.parties?.[1] || p.opponent,
            claimAmount: aiSuggestion.amounts?.[0] ? aiSuggestion.amounts[0].replace(/[^0-9]/g, '') : p.claimAmount,
        }));
    };

    const handleAdd = () => {
        const company = companies.find(c => c.id === form.companyId);
        store.addLit({
            companyId: form.companyId, companyName: company?.name ?? '',
            caseNo: form.caseNo, court: form.court, type: form.type,
            opponent: form.opponent, claimAmount: parseInt(form.claimAmount.replace(/,/g, '')) || 0,
            status: 'preparing', assignedLawyer: form.assignedLawyer,
            deadlines: deadlines.filter(d => d.label && d.dueDate).map((d, i) => ({ id: `d${Date.now()}-${i}`, ...d, completed: false, completedAt: '' })),
            notes: form.notes, result: '', resultNote: '',
        });
        sessionStorage.removeItem('ibs_ocr_suggestion');
        onAdd(); onClose();
    };
    const F = ({ label, reqd, children }: { label: string; reqd?: boolean; children: React.ReactNode }) => (
        <div><label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>{reqd && <span style={{ color: '#dc2626' }}>★ </span>}{label}</label>{children}</div>
    );
    const inputCls = "w-full px-3 py-2 rounded-lg text-sm";
    const inputStyle = { background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' };
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="w-full max-w-2xl rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
                style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-black text-lg" style={{ color: '#1e293b' }}>⚖️ 신규 사건 등록</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100" style={{ color: '#94a3b8' }}><X className="w-5 h-5" /></button>
                </div>
                {aiSuggestion && (
                    <div className="mb-4 p-3 rounded-lg flex items-center justify-between" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <div>
                            <p className="text-sm font-bold" style={{ color: '#16a34a' }}>🤖 AI가 문서에서 추출한 정보</p>
                            <p className="text-xs" style={{ color: '#15803d' }}>
                                당사자: {aiSuggestion.parties?.join(', ')} / 
                                청구액: {aiSuggestion.amounts?.[0]}
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleApplySuggestion} className="border-green-300 text-green-700 hover:bg-green-100">
                            적용
                        </Button>
                    </div>
                )}
                <div className="mb-4"><p className="text-[10px] font-black uppercase tracking-wider mb-3 pb-1" style={{ color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>📋 기초사항</p>
                    <div className="grid grid-cols-2 gap-3">
                        <F label="의뢰인" reqd><select value={form.companyId} onChange={e => setForm(p => ({ ...p, companyId: e.target.value }))} className={inputCls} style={inputStyle}>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></F>
                        <F label="대분류"><select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputCls} style={inputStyle}>{CASE_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></F>
                        <F label="소송 유형"><select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={inputCls} style={inputStyle}>{LITIGATION_TYPES.map(t => <option key={t}>{t}</option>)}</select></F>
                        <F label="심급"><select value={form.instance} onChange={e => setForm(p => ({ ...p, instance: e.target.value }))} className={inputCls} style={inputStyle}>{INSTANCE_TYPES.map(t => <option key={t}>{t}</option>)}</select></F>
                        <F label="수임일"><input type="date" value={form.filingDate} onChange={e => setForm(p => ({ ...p, filingDate: e.target.value }))} className={inputCls} style={inputStyle} /></F>
                        <F label="사건번호" reqd><input value={form.caseNo} onChange={e => setForm(p => ({ ...p, caseNo: e.target.value }))} placeholder="2026가합12345" className={inputCls} style={inputStyle} /></F>
                    </div>
                </div>
                <div className="mb-4"><p className="text-[10px] font-black uppercase tracking-wider mb-3 pb-1" style={{ color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>🏛️ 계속기관</p>
                    <div className="grid grid-cols-2 gap-3">
                        <F label="법원(가관)"><select value={form.court} onChange={e => setForm(p => ({ ...p, court: e.target.value }))} className={inputCls} style={inputStyle}>{COURTS.map(c => <option key={c}>{c}</option>)}</select></F>
                        <F label="청구금액 (원)"><input value={form.claimAmount} onChange={e => setForm(p => ({ ...p, claimAmount: e.target.value }))} placeholder="50000000" className={inputCls} style={inputStyle} /></F>
                    </div>
                </div>
                <div className="mb-4"><p className="text-[10px] font-black uppercase tracking-wider mb-3 pb-1" style={{ color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>👥 당사자</p>
                    <div className="grid grid-cols-2 gap-3">
                        <F label="상대방" reqd><input value={form.opponent} onChange={e => setForm(p => ({ ...p, opponent: e.target.value }))} placeholder="김○○ / ○○연합회" className={inputCls} style={inputStyle} /></F>
                        <F label="상대방 소송대리인"><input value={form.opponentCounsel} onChange={e => setForm(p => ({ ...p, opponentCounsel: e.target.value }))} placeholder="○○법무법인" className={inputCls} style={inputStyle} /></F>
                    </div>
                </div>
                <div className="mb-4"><p className="text-[10px] font-black uppercase tracking-wider mb-3 pb-1" style={{ color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>⚖️ 수임 / 수행 / 보조</p>
                    <div className="grid grid-cols-3 gap-3">
                        <F label="수임 변호사" reqd><select value={form.assignedLawyer} onChange={e => setForm(p => ({ ...p, assignedLawyer: e.target.value }))} className={inputCls} style={inputStyle}>{LAWYERS.map(l => <option key={l}>{l}</option>)}</select></F>
                        <F label="수행 변호사"><select value={form.coLawyer} onChange={e => setForm(p => ({ ...p, coLawyer: e.target.value }))} className={inputCls} style={inputStyle}><option value="">없음</option>{LAWYERS.map(l => <option key={l}>{l}</option>)}</select></F>
                        <F label="보조 변호사"><select value={form.assistLawyer} onChange={e => setForm(p => ({ ...p, assistLawyer: e.target.value }))} className={inputCls} style={inputStyle}><option value="">없음</option>{LAWYERS.map(l => <option key={l}>{l}</option>)}</select></F>
                    </div>
                </div>
                <div className="mb-4"><label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>사건 메모</label>
                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg text-sm resize-none" style={inputStyle} /></div>
                <div className="mb-5"><div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold" style={{ color: '#64748b' }}>📅 기한·일정</p>
                    <button onClick={() => setDeadlines(p => [...p, { label: '', dueDate: '' }])} className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: '#fffbeb', color: '#b8960a', border: '1px solid #fde68a' }}>+ 추가</button>
                </div>
                <div className="space-y-2">{deadlines.map((d, i) => (
                    <div key={i} className="flex gap-2">
                        <input value={d.label} onChange={e => setDeadlines(p => p.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="기한명" className="flex-1 px-2 py-1.5 rounded-lg text-xs" style={inputStyle} />
                        <input type="date" value={d.dueDate} onChange={e => setDeadlines(p => p.map((x, j) => j === i ? { ...x, dueDate: e.target.value } : x))} className="px-2 py-1.5 rounded-lg text-xs" style={inputStyle} />
                        {deadlines.length > 1 && <button onClick={() => setDeadlines(p => p.filter((_, j) => j !== i))} className="p-1"><X className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} /></button>}
                    </div>
                ))}</div></div>
                <div className="flex gap-2">
                    <Button variant="ghost" className="flex-1" onClick={onClose}>취소</Button>
                    <Button variant="premium" className="flex-1" onClick={handleAdd}><Gavel className="w-4 h-4 mr-1" /> 사건 등록</Button>
                </div>
            </motion.div>
        </motion.div>
    );
}
