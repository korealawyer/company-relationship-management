'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Mail, Globe, Building2, AlertTriangle, CheckCircle2, Clock, MessageSquare, Plus, Eye } from 'lucide-react';
import Link from 'next/link';
import { leadStore, calcSubscription, type Lead, type LeadMemo, type LeadStatus } from '@/lib/leadStore';

const STATUS_LABEL: Record<string, string> = {
    pending: '대기', analyzed: '분석완료', sales_confirmed: '영업컨펌',
    lawyer_confirmed: '변호사컨펌', emailed: '발송완료', in_contact: '연락중',
    contracted: '계약완료', failed: '실패',
};

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
    const [lead, setLead] = useState<Lead | null>(null);
    const [memoText, setMemoText] = useState('');
    const [storeCount, setStoreCount] = useState(0);
    const [resolvedId, setResolvedId] = useState('');

    useEffect(() => {
        // Next.js 15: params may be a Promise
        Promise.resolve(params).then(p => {
            const id = p.id;
            setResolvedId(id);
            const l = leadStore.getById(id);
            if (l) { setLead(l); setStoreCount(l.storeCount); }
        });
    }, []);

    if (!lead) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#04091a' }}>
            <p style={{ color: 'rgba(240,244,255,0.4)' }}>리드를 찾을 수 없습니다</p>
        </div>
    );

    const sub = calcSubscription(storeCount);

    const addMemo = () => {
        if (!memoText.trim()) return;
        leadStore.addMemo(lead.id, { author: '영업팀', content: memoText });
        setLead(leadStore.getById(lead.id)!);
        setMemoText('');
    };



    return (
        <div className="min-h-screen pt-20 pb-12" style={{ background: '#04091a' }}>
            <div className="max-w-5xl mx-auto px-4">
                {/* 뒤로가기 */}
                <Link href="/admin/leads">
                    <button className="flex items-center gap-2 text-sm mb-6" style={{ color: 'rgba(240,244,255,0.4)' }}>
                        <ArrowLeft className="w-4 h-4" /> 영업 리드 목록
                    </button>
                </Link>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* 회사 정보 */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-xl font-black" style={{ color: '#f0f4ff' }}>{lead.companyName}</h1>
                                <span className="text-sm px-3 py-1 rounded-full font-bold"
                                    style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c' }}>
                                    {STATUS_LABEL[lead.status]}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {[
                                    { icon: Globe, label: '도메인', value: lead.domain },
                                    { icon: Building2, label: '업종', value: lead.bizType },
                                    { icon: Phone, label: '전화', value: lead.contactPhone },
                                    { icon: Mail, label: '이메일', value: lead.contactEmail },
                                    { icon: Building2, label: '담당자', value: lead.contactName },
                                    { icon: Building2, label: '가맹점수', value: `${lead.storeCount}개` },
                                ].map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="flex items-center gap-2">
                                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(240,244,255,0.3)' }} />
                                        <span style={{ color: 'rgba(240,244,255,0.4)' }}>{label}:</span>
                                        <span style={{ color: '#f0f4ff' }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                            {lead.privacyUrl && (
                                <a href={lead.privacyUrl} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-1.5 mt-3 text-xs" style={{ color: '#c9a84c' }}>
                                    <Globe className="w-3 h-3" /> 개인정보처리방침 원문 →
                                </a>
                            )}
                        </div>

                        {/* 리스크 요약 */}
                        {lead.riskLevel && (
                            <div className="p-5 rounded-2xl" style={{
                                background: lead.riskLevel === 'HIGH' ? 'rgba(248,113,113,0.06)' : 'rgba(251,146,60,0.06)',
                                border: `1px solid ${lead.riskLevel === 'HIGH' ? 'rgba(248,113,113,0.2)' : 'rgba(251,146,60,0.2)'}`
                            }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4" style={{ color: lead.riskLevel === 'HIGH' ? '#f87171' : '#fb923c' }} />
                                    <span className="font-black text-sm" style={{ color: lead.riskLevel === 'HIGH' ? '#f87171' : '#fb923c' }}>
                                        리스크 {lead.riskScore}점 ({lead.riskLevel}) — {lead.issueCount}건 발견
                                    </span>
                                </div>
                                <Link href={`/lawyer/privacy-review?leadId=${lead.id}&company=${encodeURIComponent(lead.companyName)}`}>
                                    <button className="flex items-center gap-1.5 text-xs font-bold mt-2 px-3 py-1.5 rounded-lg"
                                        style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.25)' }}>
                                        <Eye className="w-3 h-3" /> 변호사 조문 대조표 보기 →
                                    </button>
                                </Link>
                            </div>
                        )}

                        {/* 후속 메모 타임라인 */}
                        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 className="font-black text-sm mb-4" style={{ color: '#f0f4ff' }}>
                                <MessageSquare className="w-4 h-4 inline mr-1.5" style={{ color: '#c9a84c' }} />
                                후속 관리 메모
                            </h3>
                            <div className="space-y-3 mb-4">
                                {lead.memos.length === 0 && (
                                    <p className="text-sm text-center py-4" style={{ color: 'rgba(240,244,255,0.3)' }}>메모가 없습니다</p>
                                )}
                                {lead.memos.map(memo => (
                                    <div key={memo.id} className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#c9a84c' }} />
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-bold" style={{ color: '#c9a84c' }}>{memo.author}</span>
                                                <span className="text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                                    {new Date(memo.createdAt).toLocaleString('ko-KR')}
                                                </span>
                                            </div>
                                            <p className="text-sm" style={{ color: 'rgba(240,244,255,0.7)' }}>{memo.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input value={memoText} onChange={e => setMemoText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addMemo()}
                                    placeholder="메모 입력 후 Enter..."
                                    className="flex-1 px-3 py-2 rounded-lg outline-none text-sm"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }} />
                                <button onClick={addMemo} className="px-4 py-2 rounded-lg font-bold text-sm"
                                    style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }}>
                                    추가
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 사이드 — 계산기 + 상태변경 */}
                    <div className="space-y-4">
                        {/* 구독 계산기 */}
                        <div className="p-5 rounded-2xl" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
                            <h3 className="font-black text-sm mb-4" style={{ color: '#c9a84c' }}>구독료 계산기</h3>
                            <label className="text-xs mb-1 block" style={{ color: 'rgba(240,244,255,0.5)' }}>가맹점 수</label>
                            <input type="number" value={storeCount} onChange={e => setStoreCount(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg outline-none text-sm mb-3"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#f0f4ff' }} />
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span style={{ color: 'rgba(240,244,255,0.5)' }}>플랜</span>
                                    <span className="font-bold" style={{ color: '#c9a84c' }}>{sub.plan}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'rgba(240,244,255,0.5)' }}>월 구독료</span>
                                    <span className="font-black" style={{ color: '#f0f4ff' }}>{sub.monthly.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'rgba(240,244,255,0.5)' }}>연간 합계</span>
                                    <span style={{ color: 'rgba(240,244,255,0.7)' }}>{sub.annual.toLocaleString()}원</span>
                                </div>
                            </div>
                            <button className="w-full py-2.5 rounded-xl font-black text-sm mt-4"
                                style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a' }}>
                                결제 링크 생성 →
                            </button>
                        </div>

                        {/* 현재 상태 */}
                        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 className="font-black text-sm mb-3" style={{ color: '#f0f4ff' }}>현재 상태</h3>
                            <div className="py-3 px-4 rounded-lg text-sm font-bold text-center"
                                style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }}>
                                ✓ {STATUS_LABEL[lead.status]}
                            </div>
                            <p className="text-xs text-center mt-2" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                상태 변경은 CRM에서 관리됩니다
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
