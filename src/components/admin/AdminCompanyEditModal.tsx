'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Building2, User, Phone, Mail, Store, ShieldAlert, BadgeInfo } from 'lucide-react';
import type { Company } from '@/lib/types';

interface AdminCompanyEditModalProps {
    isOpen: boolean;
    company: Company | null;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Company>) => Promise<void>;
}

export function AdminCompanyEditModal({ isOpen, company, onClose, onSave }: AdminCompanyEditModalProps) {
    const [formData, setFormData] = useState<Partial<Company>>({});
    const [saving, setSaving] = useState(false);

    // company prop이 바뀔 때 로컬 상태 초기화
    React.useEffect(() => {
        if (company && isOpen) {
            setFormData({
                name: company.name || '',
                email: company.email || '',
                phone: company.phone || '',
                storeCount: company.storeCount || 0,
                plan: company.plan || 'none',
                status: company.status || 'pending',
                assignedLawyer: company.assignedLawyer || '',
                riskLevel: company.riskLevel || '',
            });
        }
    }, [company, isOpen]);

    if (!isOpen || !company) return null;

    const handleChange = (field: keyof Company, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(company.id, formData);
            onClose();
        } catch (e) {
            console.error('Failed to update company:', e);
            alert('업데이트 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
                    style={{ background: '#0a0f24', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)' }}>
                                <Building2 className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">마스터 고객 정보 수정</h3>
                                <p className="text-xs text-gray-400">슈퍼관리자 전용 데이터 권한</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 custom-scrollbar">
                        {/* 1. Basic Info */}
                        <div>
                            <h4 className="flex items-center gap-2 mb-3 text-sm font-bold tracking-wide" style={{ color: 'rgba(240,244,255,0.8)' }}>
                                <User className="w-4 h-4 text-blue-400" /> 기본 정보
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400">기업/고객명</label>
                                    <input
                                        type="text"
                                        value={formData.name || ''}
                                        onChange={e => handleChange('name', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400">매장(지점) 수</label>
                                    <input
                                        type="number"
                                        value={formData.storeCount || 0}
                                        onChange={e => handleChange('storeCount', parseInt(e.target.value, 10) || 0)}
                                        className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400">이메일</label>
                                    <input
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={e => handleChange('email', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400">연락처</label>
                                    <input
                                        type="text"
                                        value={formData.phone || ''}
                                        onChange={e => handleChange('phone', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Status & Plan */}
                        <div>
                            <h4 className="flex items-center gap-2 mb-3 text-sm font-bold tracking-wide" style={{ color: 'rgba(240,244,255,0.8)' }}>
                                <ShieldAlert className="w-4 h-4 text-orange-400" /> 권한 및 상태 관리
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400">상태(Status)</label>
                                    <select
                                        value={formData.status || 'pending'}
                                        onChange={e => handleChange('status', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        <option value="active">Active (활성)</option>
                                        <option value="pending">Pending (승인 대기)</option>
                                        <option value="trial">Trial (무료 체험)</option>
                                        <option value="subscribed">Subscribed (구독 확정)</option>
                                        <option value="suspended">Suspended (계정 정지)</option>
                                        <option value="churn_risk">Churn Risk (이탈 위험)</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400">요금제 플랜(Plan)</label>
                                    <select
                                        value={formData.plan || 'none'}
                                        onChange={e => handleChange('plan', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        <option value="none">None (플랜 없음)</option>
                                        <option value="starter">Starter</option>
                                        <option value="standard">Standard</option>
                                        <option value="premium">Premium</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400">리스크 레벨</label>
                                    <select
                                        value={formData.riskLevel || ''}
                                        onChange={e => handleChange('riskLevel', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        <option value="">분석 필요(빈값)</option>
                                        <option value="LOW">LOW (안전)</option>
                                        <option value="MEDIUM">MEDIUM (주의)</option>
                                        <option value="HIGH">HIGH (위험)</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400">전담 변호사 배정</label>
                                    <input
                                        type="text"
                                        value={formData.assignedLawyer || ''}
                                        onChange={e => handleChange('assignedLawyer', e.target.value)}
                                        placeholder="변호사 이름 입력"
                                        className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                    <p className="text-[10px] text-gray-500 mt-0.5">이름만 텍스트로 입력 (ex: 임태호 변호사)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors hover:bg-white/5"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#ffffff' }}
                        >
                            <Save className="w-4 h-4" />
                            {saving ? '저장 중...' : '변경 사항 저장'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
