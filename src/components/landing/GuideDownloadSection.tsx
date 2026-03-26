'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Download } from 'lucide-react';
import GuideDownloadForm from '@/components/marketing/GuideDownloadForm';
import { fadeUp } from '@/lib/landingData';

export default function GuideDownloadSection() {
    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ background: '#0f172a' }}>
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-bold pill-gold pill-gold-text">
                        <Download className="w-4 h-4" /> 무료 제공 자료
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black mb-6 text-light leading-tight">
                        프랜차이즈 본사라면<br />
                        <span className="text-gold-gradient">반드시 점검해야 할 5가지</span>
                    </h2>
                    <p className="text-lg mb-8 text-muted-80">
                        정보공개서, 가맹계약서, 개인정보처리방침 등 법적 리스크를 피하기 위한 핵심 가이드북을 무료로 제공해 드립니다. 
                        지금 바로 우리 회사의 상태를 진단해보세요.
                    </p>
                    <ul className="flex flex-col gap-4 text-muted-80">
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-gold" />
                            최신 법령이 반영된 <strong>필수 체크리스트</strong>
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-gold" />
                            과태료를 피하는 <strong>개인정보 관리 노하우</strong>
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-gold" />
                            가맹점과의 <strong>분쟁 예방 가이드</strong>
                        </li>
                    </ul>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                    <GuideDownloadForm />
                </motion.div>
            </div>
        </section>
    );
}
