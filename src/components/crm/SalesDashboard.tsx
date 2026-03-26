'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, FileText, DollarSign } from 'lucide-react';
import { Company, AutoLog, PIPELINE, STATUS_LABEL, STATUS_COLOR, STATUS_TEXT } from '@/lib/store';

const T = {
    heading: '#0f172a', body: '#1e293b', sub: '#475569',
    muted: '#64748b', faint: '#94a3b8',
    border: '#d1d5db', borderSub: '#e5e7eb',
    bg: '#f8f9fc', card: '#ffffff',
};

interface SalesDashboardProps {
    companies: Company[];
    logs: AutoLog[];
}

export default function SalesDashboard({ companies, logs }: SalesDashboardProps) {
    const total = companies.length;
    const subscribed = companies.filter(c => c.status === 'subscribed').length;
    const contractSigned = companies.filter(c => c.status === 'contract_signed').length;
    const conversionRate = total > 0 ? Math.round(((subscribed + contractSigned) / total) * 100) : 0;
    
    // 매출 추정 (구독 기업 수 × 평균 월 요금)
    const avgMonthly = 500000; // 50만원 평균
    const monthlyRevenue = subscribed * avgMonthly;

    // 파이프라인별 건수
    const pipelineCounts = PIPELINE.map(s => ({
        status: s,
        label: STATUS_LABEL[s],
        count: companies.filter(c => c.status === s).length,
        color: STATUS_TEXT[s],
        bg: STATUS_COLOR[s],
    }));
    const maxCount = Math.max(1, ...pipelineCounts.map(p => p.count));

    // KPI 카드 데이터
    const kpis = [
        {
            icon: Users, label: '총 관리 기업', value: total.toString(),
            sub: `활성 ${companies.filter(c => !['pending', 'crawling'].includes(c.status)).length}개`,
            color: '#2563eb', bg: '#eff6ff',
        },
        {
            icon: TrendingUp, label: '계약 전환율', value: `${conversionRate}%`,
            sub: `구독 ${subscribed} + 서명 ${contractSigned}`,
            color: '#16a34a', bg: '#f0fdf4',
        },
        {
            icon: FileText, label: '구독 기업', value: subscribed.toString(),
            sub: companies.filter(c => c.status === 'subscribed').map(c => c.name.replace('(주)', '')).join(', ') || '-',
            color: '#c9a84c', bg: '#fffbeb',
        },
        {
            icon: DollarSign, label: '월 추정 매출', value: `₩${(monthlyRevenue / 10000).toFixed(0)}만`,
            sub: `구독 ${subscribed}사 × 월 50만원`,
            color: '#7c3aed', bg: '#faf5ff',
        },
    ];

    // 최근 로그 5개
    const recentLogs = logs.slice(0, 5);
    const logIcons: Record<string, string> = {
        ai_analysis: '🤖', auto_confirm: '✅', auto_assign: '⚖️',
        auto_email: '📧', setting_change: '⚙️',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5"
        >
            <div style={{
                borderRadius: 16, overflow: 'hidden',
                border: `1px solid ${T.borderSub}`,
                background: T.card,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
                {/* 헤더 */}
                <div style={{
                    padding: '16px 24px', background: '#fffbeb',
                    borderBottom: '1px solid #fde68a',
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <TrendingUp style={{ width: 16, height: 16, color: '#c9a84c' }} />
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#b8960a' }}>영업팀 성과 대시보드</span>
                </div>

                <div style={{ padding: 20 }}>
                    {/* KPI 카드 그리드 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                        {kpis.map((kpi, i) => (
                            <div key={i} style={{
                                padding: '16px 20px', borderRadius: 14,
                                background: kpi.bg, border: `1px solid ${kpi.color}20`,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <kpi.icon style={{ width: 16, height: 16, color: kpi.color }} />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: T.muted }}>{kpi.label}</span>
                                </div>
                                <p style={{ fontSize: 24, fontWeight: 900, color: kpi.color, margin: '0 0 2px' }}>{kpi.value}</p>
                                <p style={{ fontSize: 10, color: T.faint, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kpi.sub}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                        {/* 파이프라인 퍼널 */}
                        <div style={{
                            padding: 16, borderRadius: 14,
                            background: T.bg, border: `1px solid ${T.borderSub}`,
                        }}>
                            <p style={{ fontSize: 11, fontWeight: 800, color: T.sub, marginBottom: 12 }}>📊 파이프라인 퍼널</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {pipelineCounts.map(p => (
                                    <div key={p.status} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{
                                            width: 72, fontSize: 10, fontWeight: 700, color: T.muted,
                                            textAlign: 'right', flexShrink: 0,
                                        }}>
                                            {p.label}
                                        </span>
                                        <div style={{
                                            flex: 1, height: 18, borderRadius: 6,
                                            background: '#f1f5f9', overflow: 'hidden',
                                        }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(p.count / maxCount) * 100}%` }}
                                                transition={{ duration: 0.6, delay: 0.1 }}
                                                style={{
                                                    height: '100%', borderRadius: 6,
                                                    background: p.color,
                                                    minWidth: p.count > 0 ? 24 : 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                                    paddingRight: 6,
                                                }}
                                            >
                                                {p.count > 0 && (
                                                    <span style={{ fontSize: 9, fontWeight: 900, color: '#fff' }}>{p.count}</span>
                                                )}
                                            </motion.div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 최근 활동 */}
                        <div style={{
                            padding: 16, borderRadius: 14,
                            background: T.bg, border: `1px solid ${T.borderSub}`,
                        }}>
                            <p style={{ fontSize: 11, fontWeight: 800, color: T.sub, marginBottom: 12 }}>⚡ 최근 활동</p>
                            {recentLogs.length === 0 ? (
                                <p style={{ fontSize: 11, color: T.faint, textAlign: 'center', padding: '16px 0' }}>활동 기록 없음</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {recentLogs.map(log => (
                                        <div key={log.id} style={{
                                            display: 'flex', alignItems: 'start', gap: 6,
                                            padding: '6px 8px', borderRadius: 8,
                                            background: T.card, border: `1px solid ${T.borderSub}`,
                                        }}>
                                            <span style={{ fontSize: 12, flexShrink: 0 }}>{logIcons[log.type] || '📋'}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: 10, fontWeight: 700, color: T.body, margin: 0 }}>{log.label}</p>
                                                {log.companyName && (
                                                    <p style={{ fontSize: 9, color: T.faint, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.companyName}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
