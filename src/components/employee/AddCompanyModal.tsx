import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { T } from './shared';
import { store } from '@/lib/mockStore';

interface AddCompanyModalProps {
    onClose: () => void;
    refresh: () => void;
}

export default function AddCompanyModal({ onClose, refresh }: AddCompanyModalProps) {
    const [addForm, setAddForm] = useState({ name: '', biz: '', url: '', email: '', phone: '', storeCount: '', contactName: '', contactPhone: '', bizType: '' });

    return (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
                className="w-full max-w-lg rounded-2xl p-6"
                style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-black" style={{ color: T.heading }}>기업 등록</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: T.muted }}>
                        <X className="w-5 h-5" />
                    </button>
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
                            <label className="text-xs font-bold mb-1 block" style={{ color: T.sub }}>{f.l}</label>
                            <input value={addForm[f.k as keyof typeof addForm]}
                                onChange={e => setAddForm((p: typeof addForm) => ({ ...p, [f.k]: e.target.value }))}
                                placeholder={f.ph}
                                className="w-full px-3 py-2 rounded-lg text-sm font-medium"
                                style={{ background: '#f8f9fc', border: `1px solid ${T.border}`, color: T.body, outline: 'none' }} />
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-5">
                    <Button variant="ghost" className="flex-1" onClick={onClose}>취소</Button>
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
                            riskScore: 0, riskLevel: '', issueCount: 0,
                            bizType: addForm.bizType || '', domain: addForm.url || '', privacyUrl: '',
                            contactName: addForm.contactName || '', contactEmail: addForm.email || '',
                            contactPhone: addForm.contactPhone || addForm.phone || '',
                            contacts: [], memos: [], timeline: [],
                        });
                        setAddForm({ name: '', biz: '', url: '', email: '', phone: '', storeCount: '', contactName: '', contactPhone: '', bizType: '' });
                        onClose(); refresh();
                    }}>
                        <Zap className="w-4 h-4 mr-1" /> 등록 + 분석 예약
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}
