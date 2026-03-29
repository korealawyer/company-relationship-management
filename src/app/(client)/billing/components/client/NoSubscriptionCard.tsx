import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, CheckCircle2, Star, Phone, Receipt } from 'lucide-react';
import Link from 'next/link';
import { T } from '../../types';

interface Props {
    setToast: (msg: string) => void;
}

export default function NoSubscriptionCard({ setToast }: Props) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* 구독 없음 안내 카드 */}
            <div className="p-8 rounded-2xl text-center mb-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ background: T.goldBg }}>
                    <Wallet className="w-8 h-8" style={{ color: T.gold }} />
                </div>
                <h2 className="text-lg font-black mb-2" style={{ color: T.heading }}>현재 구독 중인 플랜이 없습니다</h2>
                <p className="text-sm mb-6" style={{ color: T.muted }}>
                    IBS 법률 서비스를 구독하시면 전담 변호사 배정, 월간 리스크 모니터링,<br />
                    이메일 법률 자문 등 프리미엄 법무 인프라를 이용하실 수 있습니다.
                </p>

                {/* 플랜 비교 미니 카드 */}
                <div className="grid grid-cols-3 gap-3 mb-6 max-w-lg mx-auto">
                    {[
                        { name: 'Entry', price: '30~38만', color: '#60a5fa', features: ['무제한 본사 자문', '가맹점 BACKCALL'] },
                        { name: 'Growth', price: '39~72만', color: '#c9a84c', features: ['무제한 본사 자문', '가맹점 BACKCALL'], popular: true },
                        { name: 'Scale', price: '72~199만', color: '#a78bfa', features: ['무제한 본사 자문', '가맹점 BACKCALL'] },
                    ].map(p => (
                        <div key={p.name} className="relative p-4 rounded-xl text-left"
                            style={{
                                background: p.popular ? `${p.color}08` : T.bg,
                                border: `1px solid ${p.popular ? p.color + '40' : T.border}`,
                            }}>
                            {p.popular && (
                                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] px-2 py-0.5 rounded-full font-black"
                                    style={{ background: p.color, color: '#fff' }}>추천</span>
                            )}
                            <p className="text-xs font-black mb-1" style={{ color: p.color }}>{p.name}</p>
                            <p className="text-sm font-black mb-2" style={{ color: T.heading }}>₩{p.price}<span className="text-[10px] font-normal" style={{ color: T.faint }}>/월</span></p>
                            {p.features.map(f => (
                                <div key={f} className="flex items-center gap-1 text-[10px] mb-0.5" style={{ color: T.body }}>
                                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: '#059669' }} /> {f}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-center gap-3">
                    <Link href="/pricing">
                        <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #e8c87a, #c9a84c)', color: '#04091a' }}>
                            <Star className="w-4 h-4" /> 플랜 선택하기
                        </button>
                    </Link>
                    <button className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all"
                        style={{ background: T.bg, color: T.muted, border: `1px solid ${T.border}` }}
                        onClick={() => setToast('📞 상담 예약: 02-598-8518 (평일 9-18시)')}>
                        <Phone className="w-4 h-4" /> 도입 상담
                    </button>
                </div>
            </div>

            {/* 결제 내역 없음 */}
            <div className="rounded-2xl p-8 text-center" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <Receipt className="w-8 h-8 mx-auto mb-3" style={{ color: T.faint }} />
                <p className="text-sm font-bold" style={{ color: T.muted }}>결제 내역이 없습니다</p>
                <p className="text-xs mt-1" style={{ color: T.faint }}>플랜 구독 후 결제 내역이 여기에 표시됩니다</p>
            </div>
        </motion.div>
    );
}
