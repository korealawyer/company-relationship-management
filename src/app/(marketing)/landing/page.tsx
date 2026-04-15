'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2, Phone, Video, CreditCard, Lock } from 'lucide-react';
import { leadStore, calcSubscription, type Lead } from '@/lib/leadStore';
import { useDripStore } from '@/lib/dripStore';

// ── 개인화 랜딩 페이지 (/landing?cid={leadId}) ───────────────
// 고객이 이메일 클릭 후 처음 보는 페이지
// 분석 결과 티저 공개 → 로그인하면 전체 확인

const RISK_COLOR: Record<string, string> = { HIGH: '#f87171', MEDIUM: '#fb923c', LOW: '#facc15' };

function LandingContent() {
    const searchParams = useSearchParams();
    const leadId = searchParams.get('cid') || '';
    const [lead, setLead] = useState<Lead | null>(null);
    const [showLogin, setShowLogin] = useState(false);
    const [bizRegNo, setBizRegNo] = useState('');
    const [logging, setLogging] = useState(false);
    const [loggedIn, setLoggedIn] = useState(false);
    const [loginError, setLoginError] = useState('');

    useEffect(() => {
        const l = leadStore.getById(leadId);
        setLead(l || null);
    }, [leadId]);

    if (!lead) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#04091a' }}>
            <div className="text-center">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: '#c9a84c' }} />
                <p style={{ color: 'rgba(240,244,255,0.4)' }}>{leadId ? '유효하지 않은 링크입니다' : '로딩 중...'}</p>
            </div>
        </div>
    );

    const handleLogin = async () => {
        if (!bizRegNo.trim()) { setLoginError('사업자번호를 입력하세요'); return; }
        setLogging(true); setLoginError('');
        try {
            // 로컬 스토어에 회원가입 반영
            const cleanBizNo = bizRegNo.replace(/-/g, '');
            let member = useDripStore.getState().members.find(m => m.leadId === leadId);
            if (!member) {
                member = useDripStore.getState().register({
                    leadId, companyName: lead.companyName,
                    contactEmail: lead.contactEmail, contactName: lead.contactName,
                    bizRegNo: cleanBizNo, riskLevel: lead.riskLevel, issueCount: lead.issueCount,
                });
            }

            leadStore.update(leadId, { status: 'in_contact' });

            // 이메일 발송용 페이로드 전송
            const res = await fetch('/api/drip', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'welcome',
                    leadId, 
                    bizRegNo: cleanBizNo,
                    companyName: lead.companyName,
                    contactEmail: lead.contactEmail,
                    contactName: lead.contactName,
                    riskLevel: lead.riskLevel,
                    riskScore: lead.riskScore,
                    issueCount: lead.issueCount,
                    storeCount: lead.storeCount,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setLoggedIn(true);
            } else {
                setLoginError(data.error || '오류가 발생했습니다');
            }
        } catch {
            setLoginError('서버 오류. 잠시 후 다시 시도하세요.');
        }
        setLogging(false);
    };

    const riskColor = RISK_COLOR[lead.riskLevel] || '#94a3b8';

    return (
        <div className="min-h-screen" style={{ background: '#04091a' }}>
            {/* 헤더 */}
            <div className="px-6 py-4 flex items-center justify-between border-b"
                style={{ borderColor: 'rgba(201,168,76,0.15)', background: 'rgba(13,27,62,0.95)' }}>
                <div className="flex items-center gap-2">
                    <span className="text-xl font-black" style={{ color: '#c9a84c' }}>⚖️ IBS 법률사무소</span>
                </div>
                <button onClick={() => setShowLogin(!showLogin)}
                    className="text-sm px-4 py-2 rounded-lg font-bold"
                    style={{ background: showLogin ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}>
                    {loggedIn ? '✓ 로그인됨' : '로그인'}
                </button>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-10">
                {/* 회사명 + 리스크 */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
                        style={{ background: `${riskColor}15`, border: `1px solid ${riskColor}30` }}>
                        <AlertTriangle className="w-4 h-4" style={{ color: riskColor }} />
                        <span className="font-bold text-sm" style={{ color: riskColor }}>
                            {lead.riskLevel} 리스크 — {lead.issueCount}건 위반 가능성 발견
                        </span>
                    </div>
                    <h1 className="text-3xl font-black mb-3" style={{ color: '#f0f4ff' }}>
                        {lead.companyName}
                    </h1>
                    <p className="text-lg" style={{ color: 'rgba(240,244,255,0.6)' }}>
                        개인정보처리방침 법률 분석 결과
                    </p>
                </motion.div>

                {/* 리스크 요약 카드 (공개) */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    {[
                        { label: '리스크 점수', value: `${lead.riskScore}점`, color: riskColor },
                        { label: '위반 가능 건수', value: `${lead.issueCount}건`, color: '#f87171' },
                        { label: '예상 과징금', value: '최대 3,000만원', color: '#fb923c' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="p-5 rounded-2xl text-center"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="text-2xl font-black mb-1" style={{ color }}>{value}</div>
                            <div className="text-sm" style={{ color: 'rgba(240,244,255,0.5)' }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* 주요 위반 항목 티저 */}
                <div className="mb-8 rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <h2 className="font-black text-sm" style={{ color: '#f0f4ff' }}>주요 발견 항목</h2>
                    </div>
                    <div className="p-6 space-y-3">
                        {[
                            { title: '개인정보 과다수집 의심', level: 'HIGH', law: '개보법 §16', visible: true },
                            { title: '제3자 제공 현황 미명시', level: 'HIGH', law: '개보법 §17', visible: true },
                            { title: '보유기간 일부 항목 누락', level: 'MEDIUM', law: '개보법 §21', visible: loggedIn },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-xs px-2 py-0.5 rounded-full font-black flex-shrink-0"
                                    style={{ background: `${RISK_COLOR[item.level]}15`, color: RISK_COLOR[item.level] }}>
                                    {item.level}
                                </span>
                                {item.visible ? (
                                    <>
                                        <span className="text-sm" style={{ color: '#f0f4ff' }}>{item.title}</span>
                                        <span className="text-xs ml-auto" style={{ color: 'rgba(240,244,255,0.3)' }}>{item.law}</span>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 rounded" style={{ background: 'rgba(255,255,255,0.1)', width: 160 }} />
                                        <Lock className="w-3 h-3" style={{ color: 'rgba(240,244,255,0.2)' }} />
                                        <span className="text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>로그인 후 확인</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 로그인 박스 or CTA */}
                {!loggedIn ? (
                    <motion.div layout className="rounded-2xl p-6"
                        style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
                        <h3 className="font-black text-lg mb-2" style={{ color: '#f0f4ff' }}>
                            전체 분석 결과 + 즉시수정안 확인
                        </h3>
                        <p className="text-sm mb-5" style={{ color: 'rgba(240,244,255,0.5)' }}>
                            사업자번호를 입력하면 <strong style={{ color: '#c9a84c' }}>바로 회원 등록</strong>되고 전체 결과를 확인할 수 있습니다.<br />
                            이메일로 임시 비밀번호가 발송됩니다.
                        </p>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(240,244,255,0.4)' }}>사업자번호</label>
                                <input
                                    value={bizRegNo}
                                    onChange={e => setBizRegNo(e.target.value)}
                                    placeholder="000-00-00000"
                                    className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#f0f4ff' }}
                                />
                            </div>
                            {loginError && <p className="text-xs" style={{ color: '#f87171' }}>{loginError}</p>}
                            <button onClick={handleLogin} disabled={logging}
                                className="w-full py-4 rounded-xl font-black text-base"
                                style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a' }}>
                                {logging ? '처리 중...' : '무료 회원 등록 & 전체 결과 확인 →'}
                            </button>
                            <p className="text-xs text-center" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                결제 없이 가입 가능 · 이메일로 임시 비밀번호 발송
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl p-6 space-y-4"
                        style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}>
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle2 className="w-6 h-6" style={{ color: '#4ade80' }} />
                            <h3 className="font-black text-lg" style={{ color: '#4ade80' }}>회원 등록 완료!</h3>
                        </div>
                        <p className="text-sm" style={{ color: 'rgba(240,244,255,0.6)' }}>
                            임시 비밀번호가 이메일로 발송됐습니다. 이제 전담 변호사와 상담하실 수 있습니다.
                        </p>

                        {/* 메인 CTA — 전체 분석 결과 보기 */}
                        <a href={`/privacy-report?company=${encodeURIComponent(lead.companyName)}`}
                            className="block w-full py-4 rounded-xl font-black text-base text-center mt-4"
                            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a' }}>
                            🔍 전체 분석 결과 + 즉시수정안 확인 →
                        </a>

                        <div className="grid grid-cols-3 gap-3 mt-4">
                            <a href="tel:02-1234-5678" className="p-4 rounded-xl text-center block"
                                style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)' }}>
                                <Phone className="w-6 h-6 mx-auto mb-1.5" style={{ color: '#4ade80' }} />
                                <p className="font-black text-xs" style={{ color: '#4ade80' }}>전화 상담</p>
                                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(240,244,255,0.4)' }}>바로 연결</p>
                            </a>
                            <a href="/consultation" className="p-4 rounded-xl text-center block"
                                style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)' }}>
                                <Video className="w-6 h-6 mx-auto mb-1.5" style={{ color: '#818cf8' }} />
                                <p className="font-black text-xs" style={{ color: '#818cf8' }}>줌 미팅</p>
                                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(240,244,255,0.4)' }}>일정 예약</p>
                            </a>
                            <a href={`/checkout?plan=pro&company=${encodeURIComponent(lead.companyName)}`} className="p-4 rounded-xl text-center block"
                                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}>
                                <CreditCard className="w-6 h-6 mx-auto mb-1.5" style={{ color: '#c9a84c' }} />
                                <p className="font-black text-xs" style={{ color: '#c9a84c' }}>구독 시작</p>
                                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(240,244,255,0.4)' }}>월 {calcSubscription(lead.storeCount).monthly.toLocaleString()}원</p>
                            </a>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default function LandingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#04091a' }}>
                <p style={{ color: 'rgba(240,244,255,0.4)' }}>로딩 중...</p>
            </div>}>
            <LandingContent />
        </Suspense>
    );
}
