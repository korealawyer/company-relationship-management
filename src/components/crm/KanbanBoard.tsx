'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Company, CaseStatus, STATUS_LABEL, STATUS_COLOR, STATUS_TEXT, PIPELINE } from '@/lib/store';

const T = {
    heading: '#0f172a', body: '#1e293b', sub: '#475569',
    muted: '#64748b', faint: '#94a3b8',
    border: '#d1d5db', borderSub: '#e5e7eb',
    bg: '#f8f9fc', card: '#ffffff',
};

function RiskDot({ level }: { level: string }) {
    const c = level === 'HIGH' ? '#dc2626' : level === 'MEDIUM' ? '#d97706' : level === 'LOW' ? '#16a34a' : '#94a3b8';
    return <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block', flexShrink: 0 }} />;
}

interface KanbanBoardProps {
    companies: Company[];
    onCardClick: (c: Company) => void;
}

export default function KanbanBoard({ companies, onCardClick }: KanbanBoardProps) {
    // 표시할 파이프라인 단계만 (0건 컬럼도 표시)
    const columns = PIPELINE.map(status => ({
        status,
        label: STATUS_LABEL[status],
        items: companies.filter(c => c.status === status),
    }));

    return (
        <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
            <div style={{ display: 'flex', gap: 12, minWidth: 'max-content' }}>
                {columns.map(col => (
                    <div key={col.status} style={{
                        width: 220, flexShrink: 0,
                        background: T.bg, borderRadius: 16,
                        border: `1px solid ${T.borderSub}`,
                        display: 'flex', flexDirection: 'column',
                    }}>
                        {/* 칼럼 헤더 */}
                        <div style={{
                            padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderBottom: `1px solid ${T.borderSub}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: STATUS_TEXT[col.status],
                                    display: 'inline-block',
                                }} />
                                <span style={{ fontSize: 12, fontWeight: 800, color: T.body }}>{col.label}</span>
                            </div>
                            <span style={{
                                fontSize: 10, fontWeight: 900, padding: '2px 8px',
                                borderRadius: 10, background: STATUS_COLOR[col.status],
                                color: STATUS_TEXT[col.status],
                            }}>
                                {col.items.length}
                            </span>
                        </div>

                        {/* 카드 목록 */}
                        <div style={{
                            padding: 8, flex: 1, minHeight: 120,
                            display: 'flex', flexDirection: 'column', gap: 8,
                        }}>
                            {col.items.length === 0 && (
                                <div style={{
                                    textAlign: 'center', padding: '24px 8px',
                                    color: T.faint, fontSize: 11,
                                }}>
                                    비어 있음
                                </div>
                            )}
                            {col.items.map(c => (
                                <motion.div
                                    key={c.id}
                                    whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    onClick={() => onCardClick(c)}
                                    style={{
                                        background: T.card, borderRadius: 12,
                                        padding: '12px 14px', cursor: 'pointer',
                                        border: `1px solid ${T.border}`,
                                        transition: 'box-shadow 0.2s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                        <RiskDot level={c.riskLevel} />
                                        <span style={{ fontSize: 12, fontWeight: 800, color: T.body }}>{c.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                                        {c.bizType && (
                                            <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', background: '#f1f5f9', color: '#475569', borderRadius: 4 }}>
                                                {c.bizType}
                                            </span>
                                        )}
                                        {c.plan && c.plan !== 'none' && (
                                            <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', background: '#e0e7ff', color: '#4f46e5', borderRadius: 4 }}>
                                                {c.plan.toUpperCase()} 플랜
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, fontSize: 10, color: T.muted }}>
                                        <span>🏪 {c.storeCount.toLocaleString()}</span>
                                        {c.assignedLawyer && <span>⚖️ {c.assignedLawyer.replace(' 변호사', '')}</span>}
                                    </div>
                                    {c.issues && c.issues.length > 0 && (
                                        <div style={{
                                            marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap',
                                        }}>
                                            {c.issues.filter(i => i.level === 'HIGH').length > 0 && (
                                                <span style={{
                                                    fontSize: 9, fontWeight: 800,
                                                    padding: '1px 6px', borderRadius: 6,
                                                    background: '#fef2f2', color: '#dc2626',
                                                }}>
                                                    HIGH {c.issues.filter(i => i.level === 'HIGH').length}
                                                </span>
                                            )}
                                            {c.issues.filter(i => i.level === 'MEDIUM').length > 0 && (
                                                <span style={{
                                                    fontSize: 9, fontWeight: 800,
                                                    padding: '1px 6px', borderRadius: 6,
                                                    background: '#fffbeb', color: '#d97706',
                                                }}>
                                                    MED {c.issues.filter(i => i.level === 'MEDIUM').length}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
