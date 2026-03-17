'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FAQ_ITEMS, fadeUp } from '@/lib/landingData';

export default function FaqSection() {
    const [open, setOpen] = useState<number | null>(null);
    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: 'rgba(13,27,62,0.3)' }}>
            <div className="max-w-3xl mx-auto">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                    className="text-center mb-10">
                    <h2 className="text-3xl font-black mb-2 text-light">자주 묻는 질문</h2>
                    <p className="text-sm text-muted-40">도입 전 궁금한 것들을 미리 해소하세요</p>
                </motion.div>
                <div className="space-y-2">
                    {FAQ_ITEMS.map((item, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                            <div className="rounded-xl overflow-hidden"
                                style={{ border: '1px solid rgba(201,168,76,0.12)', background: open === i ? 'rgba(201,168,76,0.05)' : 'rgba(13,27,62,0.5)' }}>
                                <button className="w-full text-left flex items-center justify-between gap-3 px-5 py-4"
                                    onClick={() => setOpen(open === i ? null : i)}>
                                    <span className="font-bold text-sm text-light">{item.q}</span>
                                    {open === i
                                        ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-gold" />
                                        : <ChevronDown className="w-4 h-4 flex-shrink-0 text-gold-40" />}
                                </button>
                                <AnimatePresence>
                                    {open === i && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                                            <p className="px-5 pb-4 text-sm leading-relaxed text-muted-60">{item.a}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
