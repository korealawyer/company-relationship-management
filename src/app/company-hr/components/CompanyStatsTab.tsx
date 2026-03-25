import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Clock, CheckCircle2, AlertCircle, ShieldCheck, Phone, Mail, Briefcase } from 'lucide-react';
import { MONTHLY, BY_TYPE, BY_GROUP, THIS_MONTH } from '@/lib/mockData/companyHrMock';

function StatCard({ icon, label, value, sub, color }: {
    icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
}) {
    return (
        <div className="p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}15` }}>
                <span style={{ color }}>{icon}</span>
            </div>
            <div className="text-2xl font-black mb-0.5" style={{ color }}>{value}</div>
            <div className="text-xs font-bold" style={{ color: '#6b7280' }}>{label}</div>
            {sub && <div className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>{sub}</div>}
        </div>
    );
}

export function CompanyStatsTab({ period, setPeriod }: { period: string, setPeriod: (p: string) => void }) {
    const maxBar = Math.max(...MONTHLY.map(m => (m.qna || 0) + (m.contract || 0) + (m.lit || 0)));

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <StatCard icon={<MessageSquare className="w-4 h-4" />} label="총 상담 건수" value={THIS_MONTH.total} sub="전월 대비 +16%" color="#c9a84c" />
                <StatCard icon={<Clock className="w-4 h-4" />} label="평균 응답 시간" value={THIS_MONTH.avgResponse} sub="업무시간 기준" color="#818cf8" />
                <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="만족도" value={`${THIS_MONTH.satisfaction}%`} sub="구성원 응답 기준" color="#34d399" />
                <StatCard icon={<AlertCircle className="w-4 h-4" />} label="처리 대기" value={THIS_MONTH.pending} sub="72h 이내 완료 예정" color="#f59e0b" />
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
                {/* 월별 차트 */}
                <div className="lg:col-span-2 p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <p className="font-black text-sm" style={{ color: '#111827' }}>월별 상담 추이</p>
                            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>유형별 분류 포함</p>
                        </div>
                        <div className="flex gap-1">
                            {['3개월', '6개월'].map(p => (
                                <button key={p} onClick={() => setPeriod(p)}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                                    style={{ background: period === p ? '#fef3c7' : '#f3f4f6', color: period === p ? '#c9a84c' : '#6b7280', border: period === p ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent' }}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-end gap-2 h-36">
                        {(period === '3개월' ? MONTHLY.slice(-3) : MONTHLY).map((m, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] font-black" style={{ color: '#c9a84c' }}>{m.total}</span>
                                <div className="w-full rounded-t-lg overflow-hidden flex flex-col-reverse" style={{ height: `${(m.total / maxBar) * 100}px`, minHeight: 8 }}>
                                    <div style={{ height: `${(m.legal / m.total) * 100}%`, background: '#818cf8', minHeight: 4 }} />
                                    <div style={{ height: `${(m.hr / m.total) * 100}%`, background: '#34d399' }} />
                                    <div style={{ height: `${(m.other / m.total) * 100}%`, background: '#f59e0b' }} />
                                </div>
                                <span className="text-[10px]" style={{ color: '#9ca3af' }}>{m.month}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                        {[{ label: '법률', color: '#818cf8' }, { label: '노무·HR', color: '#34d399' }, { label: '기타', color: '#f59e0b' }].map(l => (
                            <div key={l.label} className="flex items-center gap-1.5 text-[10px]" style={{ color: '#6b7280' }}>
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                                {l.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 유형별 */}
                <div className="p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                    <p className="font-black text-sm mb-1" style={{ color: '#111827' }}>상담 유형별</p>
                    <p className="text-[10px] mb-4" style={{ color: '#9ca3af' }}>누적 전체 기간</p>
                    <div className="space-y-3">
                        {BY_TYPE.map(t => (
                            <div key={t.label}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span style={{ color: '#374151' }}>{t.label}</span>
                                    <span className="font-black" style={{ color: t.color }}>{t.count}건</span>
                                </div>
                                <div className="h-1.5 rounded-full" style={{ background: '#e5e7eb' }}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${t.pct}%` }} transition={{ duration: 0.8 }}
                                        className="h-full rounded-full" style={{ background: t.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 그룹별 */}
            <div className="mt-4 p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                <p className="font-black text-sm mb-1" style={{ color: '#111827' }}>그룹별 이용 현황</p>
                <p className="text-[10px] mb-4" style={{ color: '#9ca3af' }}>개인 식별 불가 익명 통계 · 부서/점포명 미포함</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {BY_GROUP.map((g, i) => (
                        <div key={i} className="p-4 rounded-xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            <div className="flex items-center gap-1.5 mb-3">
                                <Briefcase className="w-3.5 h-3.5" style={{ color: '#c9a84c' }} />
                                <span className="text-[11px] font-bold" style={{ color: '#374151' }}>{g.group}</span>
                            </div>
                            <div className="text-2xl font-black mb-0.5" style={{ color: '#111827' }}>{g.count}<span className="text-sm font-normal ml-1" style={{ color: '#9ca3af' }}>건</span></div>
                            <div className="text-xs mb-3" style={{ color: '#9ca3af' }}>1인 평균 {g.avg}일 이용</div>
                            <div className="h-1.5 rounded-full" style={{ background: '#e5e7eb' }}>
                                <div className="h-full rounded-full" style={{ width: `${g.pct}%`, background: 'linear-gradient(90deg,#c9a84c,#e8c87a)' }} />
                            </div>
                            <div className="text-[10px] mt-1" style={{ color: '#9ca3af' }}>{g.pct}% 비중</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 플랜+연락처 */}
            <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                    <p className="font-black text-sm mb-4" style={{ color: '#111827' }}>현재 플랜</p>
                    <div className="flex items-start gap-3 p-3 rounded-xl mb-3" style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.15)' }}>
                        <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#c9a84c' }} />
                        <div>
                            <p className="text-sm font-black" style={{ color: '#c9a84c' }}>본사 지원 프리미엄</p>
                            <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>임직원·가맹점주 전원 무제한 이용</p>
                        </div>
                    </div>
                    {['법률 문서 검토 무제한', '전담 변호사 24h 응답', '노무·HR 자문', '개인정보 컴플라이언스', '월별 리포트 자동 발송'].map(f => (
                        <div key={f} className="flex items-center gap-2 text-xs mb-1.5" style={{ color: '#374151' }}>
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#34d399' }} />{f}
                        </div>
                    ))}
                </div>

                <div className="p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                    <p className="font-black text-sm mb-4" style={{ color: '#111827' }}>담당 변호사</p>
                    {[
                        { name: '김수현 변호사', role: '법률 전담', phone: '02-1234-5678', email: 'lawyer1@ibslaw.kr', color: '#818cf8' },
                    ].map(l => (
                        <div key={l.name} className="flex items-center justify-between p-3 rounded-xl mb-2" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs" style={{ background: `${l.color}15`, color: l.color }}>{l.name[0]}</div>
                                <div>
                                    <p className="text-sm font-black" style={{ color: '#111827' }}>{l.name}</p>
                                    <p className="text-[10px]" style={{ color: '#9ca3af' }}>{l.role}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <a href={`tel:${l.phone}`} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}><Phone className="w-3.5 h-3.5" /></a>
                                <a href={`mailto:${l.email}`} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(129,140,248,0.12)', color: '#818cf8' }}><Mail className="w-3.5 h-3.5" /></a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
