import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Copy, Ticket } from 'lucide-react';
import { INVITE_CODES } from '@/lib/auth';
import { T } from './shared';

export default function InvitePanel() {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <motion.div key="invite-panel" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-5">
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #fde68a', background: T.card, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                    <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4" style={{ color: '#92400e' }} />
                        <h3 className="text-sm font-black" style={{ color: '#92400e' }}>직원 초대코드 관리</h3>
                    </div>
                    <p className="text-[10px]" style={{ color: '#92400e' }}>카톡으로 코드를 전달하면 직원이 가입 시 자동 역할 배정됩니다</p>
                </div>
                <div className="p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Object.entries(INVITE_CODES).filter(([, v]) => v.isInternal).map(([code, info]) => {
                            const roleLabels: Record<string, string> = {
                                sales: '영업팀', lawyer: '변호사', litigation: '송무팀',
                                finance: '회계팀', counselor: '상담사', hr: 'HR', admin: '관리자',
                            };
                            const roleColors: Record<string, string> = {
                                sales: '#2563eb', lawyer: '#7c3aed', litigation: '#dc2626',
                                finance: '#16a34a', counselor: '#d97706', hr: '#0891b2', admin: '#64748b',
                            };
                            const cl = roleColors[info.role] || '#64748b';
                            return (
                                <div key={code} className="p-3 rounded-xl transition-all hover:shadow-md"
                                    style={{ background: `${cl}08`, border: `1px solid ${cl}25` }}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                            style={{ background: `${cl}15`, color: cl }}>
                                            {roleLabels[info.role] || info.role}
                                        </span>
                                        <span className="text-[9px]" style={{ color: T.faint }}>
                                            ~{info.expires.slice(0, 7)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs font-black flex-1 truncate" style={{ color: T.body }}>{code}</code>
                                        <button onClick={() => copyCode(code)}
                                            className="p-1.5 rounded-lg transition-all hover:scale-110"
                                            style={{ background: copiedCode === code ? '#dcfce7' : '#f1f5f9', color: copiedCode === code ? '#16a34a' : T.muted }}>
                                            {copiedCode === code
                                                ? <CheckCircle2 className="w-3.5 h-3.5" />
                                                : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 rounded-xl p-3" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                        <p className="text-[11px] font-medium" style={{ color: '#0369a1' }}>
                            💡 <strong>사용 방법:</strong> 코드 복사 → 카톡/이메일로 전달 → 직원이 <strong>회원가입</strong> 시 코드 입력 → 자동 역할 배정, 즉시 사용 가능
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
