import React from 'react';
import { motion } from 'framer-motion';
import { Users, Clock3, UserCheck, UserX, RefreshCw, Lock, CheckCircle2 } from 'lucide-react';
import { type PendingMember } from '@/lib/auth';

function StatusBadge({ status }: { status: PendingMember['status'] }) {
    const map = {
        pending: { label: '대기 중', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        approved: { label: '승인됨', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
        rejected: { label: '거절됨', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
    };
    const m = map[status];
    return (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ color: m.color, background: m.bg }}>
            {m.label}
        </span>
    );
}

export interface MemberApprovalTabProps {
    pending: PendingMember[];
    loadPending: () => void;
    addMockPending: () => void;
    handleApprove: (id: string) => void;
    handleReject: (id: string) => void;
}

export function MemberApprovalTab({ pending, loadPending, addMockPending, handleApprove, handleReject }: MemberApprovalTabProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-sm font-black" style={{ color: '#111827' }}>소속 가입 신청 관리</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                        회원가입 시 "소속 신청"을 선택한 구성원 목록입니다. 본인 확인 후 승인해주세요.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={addMockPending}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                        style={{ background: 'rgba(201,168,76,0.08)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.15)' }}>
                        + 테스트 신청 추가
                    </button>
                    <button onClick={loadPending}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                        style={{ background: '#f3f4f6', color: '#6b7280', border: '1px solid #e8e5de' }}>
                        <RefreshCw className="w-3.5 h-3.5" /> 새로고침
                    </button>
                </div>
            </div>

            {/* KPI 요약 */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                    { label: '대기 중', value: pending.filter(p => p.status === 'pending').length, color: '#f59e0b', icon: <Clock3 className="w-4 h-4" /> },
                    { label: '승인됨', value: pending.filter(p => p.status === 'approved').length, color: '#34d399', icon: <UserCheck className="w-4 h-4" /> },
                    { label: '거절됨', value: pending.filter(p => p.status === 'rejected').length, color: '#f87171', icon: <UserX className="w-4 h-4" /> },
                ].map(k => (
                    <div key={k.label} className="p-4 rounded-2xl flex items-center gap-3"
                        style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${k.color}15`, color: k.color }}>{k.icon}</div>
                        <div>
                            <div className="text-xl font-black" style={{ color: k.color }}>{k.value}</div>
                            <div className="text-xs" style={{ color: '#6b7280' }}>{k.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 신청 목록 */}
            {pending.length === 0 ? (
                <div className="text-center py-16 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                    <Users className="w-10 h-10 mx-auto mb-3" style={{ color: '#d1d5db' }} />
                    <p className="text-sm font-black mb-1" style={{ color: '#9ca3af' }}>소속 신청이 없습니다</p>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>구성원이 가입 시 "소속 신청"을 선택하면 여기 표시됩니다.</p>
                    <button onClick={addMockPending} className="mt-4 px-4 py-2 rounded-lg text-xs font-bold"
                        style={{ background: 'rgba(201,168,76,0.08)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.15)' }}>
                        테스트 데이터 추가해보기
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {pending.map(p => (
                        <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl flex-wrap"
                            style={{ background: '#fff', border: `1px solid ${p.status === 'pending' ? 'rgba(245,158,11,0.2)' : '#e8e5de'}` }}>

                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                                style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c' }}>
                                {p.name[0]}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="font-black text-sm" style={{ color: '#111827' }}>{p.name}</p>
                                    <StatusBadge status={p.status} />
                                </div>
                                <p className="text-xs" style={{ color: '#6b7280' }}>{p.email}{p.phone && ` · ${p.phone}`}</p>
                                {p.message && (
                                    <p className="text-[11px] mt-1 px-2 py-1 rounded-lg" style={{ background: '#f9fafb', color: '#6b7280' }}>
                                        "{p.message}"
                                    </p>
                                )}
                                <p className="text-[10px] mt-1" style={{ color: '#9ca3af' }}>
                                    신청일: {new Date(p.requestedAt).toLocaleDateString('ko-KR')}
                                </p>
                            </div>

                            {p.status === 'pending' && (
                                <div className="flex gap-2 flex-shrink-0">
                                    <button onClick={() => handleApprove(p.id)}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all hover:opacity-80"
                                        style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                                        <UserCheck className="w-3.5 h-3.5" /> 승인
                                    </button>
                                    <button onClick={() => handleReject(p.id)}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all hover:opacity-80"
                                        style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.15)' }}>
                                        <UserX className="w-3.5 h-3.5" /> 거절
                                    </button>
                                </div>
                            )}
                            {p.status === 'approved' && (
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#34d399' }} />
                            )}
                            {p.status === 'rejected' && (
                                <UserX className="w-5 h-5 flex-shrink-0" style={{ color: '#f87171' }} />
                            )}
                        </div>
                    ))}
                </div>
            )}

            <p className="text-[10px] mt-6 text-center" style={{ color: '#9ca3af' }}>
                <Lock className="w-3 h-3 inline mr-1" />승인 후에도 개인별 상담 내용은 HR 담당자에게 공개되지 않습니다.
            </p>
        </motion.div>
    );
}
