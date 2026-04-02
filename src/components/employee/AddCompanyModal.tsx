// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { T } from './shared';
import { useCompanies, useAutoSettings } from '@/hooks/useDataLayer';
import { getPromptConfig } from '@/lib/prompts/privacy';

interface AddCompanyModalProps {
    onClose: () => void;
    refresh: () => void;
}

export default function AddCompanyModal({ onClose, refresh }: AddCompanyModalProps) {
    const { addCompany, updateCompany, mutate } = useCompanies();
    const { settings: autoSettings } = useAutoSettings();
    const [addForm, setAddForm] = useState({ name: '', biz: '', url: '', email: '', phone: '', storeCount: '', contactName: '', contactPhone: '', bizType: '', franchiseType: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
                className="w-full max-w-lg rounded-2xl p-6"
                style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-black" style={{ color: T.heading }}>기업 등록</h2>
                    <button onClick={onClose} disabled={isSubmitting} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50" style={{ color: T.muted }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="space-y-3">
                    {[
                        { k: 'name', l: '기업명 *', ph: '(주)교촌에프앤비' },
                        { k: 'franchiseType', l: '구분 (프랜차이즈/그외) *', type: 'select', options: [{label: '선택 안함', value: ''}, {label: '프랜차이즈', value: '프랜차이즈'}, {label: '그외', value: '그외'}] },
                        { k: 'bizType', l: '업종 (예: 식음료, IT)', ph: '식음료' },
                        { k: 'biz', l: '사업자번호', ph: '123-45-67890' },
                        { k: 'url', l: '홈페이지 URL (등록 시 방침 자동 분석)', ph: 'https://kyochon.com' },
                        { k: 'email', l: '이메일 *', ph: 'legal@kyochon.com' },
                        { k: 'phone', l: '전화번호', ph: '02-1234-5678' },
                        { k: 'storeCount', l: '가맹점수', ph: '100' },
                    ].map(f => (
                        <div key={f.k}>
                            <label className="text-xs font-bold mb-1 block" style={{ color: T.sub }}>{f.l}</label>
                            {f.type === 'select' ? (
                                <select 
                                    value={addForm[f.k as keyof typeof addForm]}
                                    onChange={e => setAddForm((p: typeof addForm) => ({ ...p, [f.k]: e.target.value }))}
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                                    style={{ background: '#f8f9fc', border: `1px solid ${T.border}`, color: T.body, outline: 'none' }}
                                >
                                    {f.options?.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <input value={addForm[f.k as keyof typeof addForm]}
                                    onChange={e => setAddForm((p: typeof addForm) => ({ ...p, [f.k]: e.target.value }))}
                                    placeholder={f.ph}
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                                    style={{ background: '#f8f9fc', border: `1px solid ${T.border}`, color: T.body, outline: 'none' }} />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-5">
                    <Button variant="ghost" className="flex-1" onClick={onClose} disabled={isSubmitting}>취소</Button>
                    <Button variant="premium" className="flex-1" disabled={isSubmitting} onClick={async () => {
                        if (!addForm.name || !addForm.email || !addForm.franchiseType) {
                            alert('기업명, 이메일, 구분(프랜차이즈/그외)은 필수 항목입니다.');
                            return;
                        }
                        if (addForm.franchiseType !== '프랜차이즈' && addForm.franchiseType !== '그외') {
                            alert('구분(프랜차이즈/그외)을 정확히 선택해주세요.');
                            return;
                        }

                        setIsSubmitting(true);
                        const newId = crypto.randomUUID();
                        
                        try {
                            const initialStatus = addForm.url ? 'crawling' : 'pending';
                            
                            await addCompany({
                                id: newId,
                                name: addForm.name, biz: addForm.biz, url: addForm.url,
                                email: addForm.email, phone: addForm.phone,
                                storeCount: parseInt(addForm.storeCount) || 0,
                                status: initialStatus, assignedLawyer: '', issues: [],
                                salesConfirmed: false, salesConfirmedAt: '', salesConfirmedBy: '',
                                lawyerConfirmed: false, lawyerConfirmedAt: '',
                                emailSentAt: '', emailSubject: '',
                                clientReplied: false, clientRepliedAt: '', clientReplyNote: '',
                                loginCount: 0, callNote: '', plan: 'none',
                                autoMode: true, aiDraftReady: false, source: 'manual' as const,
                                riskScore: 0, riskLevel: '', issueCount: 0,
                                bizType: addForm.bizType || '', 
                                franchiseType: addForm.franchiseType as '프랜차이즈' | '그외',
                                domain: addForm.url || '', privacyUrl: addForm.url || '',
                                contactName: addForm.contactName || '', contactEmail: addForm.email || '',
                                contactPhone: addForm.contactPhone || addForm.phone || '',
                                contacts: [], memos: [], timeline: [],
                            });

                            setAddForm({ name: '', biz: '', url: '', email: '', phone: '', storeCount: '', contactName: '', contactPhone: '', bizType: '', franchiseType: '' });
                            onClose();
                            refresh();

                            // 등록 후 URL이 있으면 백그라운드로 분석 요청 (fire-and-forget)
                            if (addForm.url) {
                                (async () => {
                                    try {
                                        const promptConfig = getPromptConfig();
                                        const res = await fetch('/api/analyze', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ 
                                                companyId: newId, 
                                                url: addForm.url, 
                                                systemPrompt: promptConfig.analyzePrompt,
                                                model: promptConfig.model
                                            })
                                        });
                                        const data = await res.json();
                                        if (!res.ok || !data.success) {
                                            await updateCompany(newId, { status: 'pending' });
                                        } else {
                                            const payload: any = { 
                                                status: 'analyzed',
                                                issues: data.issues || [],
                                                issueCount: data.issueCount || 0,
                                                riskLevel: data.riskLevel || 'MEDIUM',
                                                aiDraftReady: autoSettings?.autoGenerateDraft ?? false
                                            };
                                            if (data.rawText) {
                                                payload.privacyPolicyText = data.rawText;
                                            }
                                            await updateCompany(newId, payload);
                                        }
                                    } catch (err) {
                                        console.error('Auto analysis error:', err);
                                        await updateCompany(newId, { status: 'pending' });
                                    } finally {
                                        mutate(); // 전체 리프레시
                                    }
                                })();
                            }
                        } catch (error) {
                            console.error('Failed to add company:', error);
                            alert('기업 등록에 실패했습니다. 관리자에게 문의하세요.');
                            setIsSubmitting(false);
                        }
                    }}>
                        {isSubmitting ? '처리 중...' : <><Zap className="w-4 h-4 mr-1" /> 등록 + 분석 예약</>}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}
