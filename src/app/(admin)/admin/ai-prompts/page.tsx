'use client';

import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, CheckCircle2, ChevronDown, Zap, FileText, MessageSquare, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import {
    type PrivacyPromptConfig, type ScenarioCategory,
    DEFAULT_PROMPT_CONFIG, DEFAULT_SCENARIO_CATEGORIES, AI_MODEL_OPTIONS,
    getPromptConfig, savePromptConfig, getScenarioCategories, saveScenarioCategories,
} from '@/lib/prompts/privacy';

export default function AdminAIPromptsPage() {
    const [config, setConfig] = useState<PrivacyPromptConfig>(DEFAULT_PROMPT_CONFIG);
    const [categories, setCategories] = useState<ScenarioCategory[]>(DEFAULT_SCENARIO_CATEGORIES);
    const [saved, setSaved] = useState(false);
    const [activeSection, setActiveSection] = useState<'model' | 'prompts' | 'scenarios' | 'flow'>('model');

    useEffect(() => {
        setConfig(getPromptConfig());
        setCategories(getScenarioCategories());
    }, []);

    const handleSave = () => {
        savePromptConfig(config);
        saveScenarioCategories(categories);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        setConfig(DEFAULT_PROMPT_CONFIG);
        setCategories(DEFAULT_SCENARIO_CATEGORIES);
    };

    const toggleCategory = (id: string) => {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
    };

    const updateCategoryDesc = (id: string, desc: string) => {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, description: desc } : c));
    };

    const sections = [
        { id: 'model' as const, label: 'AI 모델 선택', icon: <Zap className="w-4 h-4" /> },
        { id: 'prompts' as const, label: '프롬프트 편집', icon: <MessageSquare className="w-4 h-4" /> },
        { id: 'scenarios' as const, label: '시나리오 카테고리', icon: <FileText className="w-4 h-4" /> },
        { id: 'flow' as const, label: '플로우 시각화', icon: <ArrowRight className="w-4 h-4" /> },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* 상단 헤더 */}
            <div className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 h-[60px] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/employee">
                        <button className="text-[13px] text-slate-500 hover:text-slate-800 transition-colors bg-transparent border-none cursor-pointer font-medium">← 돌아가기</button>
                    </Link>
                    <div className="w-px h-4 bg-slate-200" />
                    <span className="text-[15px] font-black text-slate-800 flex items-center gap-2">🤖 AI 프롬프트 관리</span>
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 py-0.5 px-2 rounded-full">관리자 전용</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleReset} className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg py-1.5 px-3.5 cursor-pointer text-[13px] font-semibold transition-colors">
                        <RotateCcw className="w-3.5 h-3.5" /> 초기화
                    </button>
                    <button onClick={handleSave} className={`flex items-center gap-1.5 border-none rounded-lg py-1.5 px-4 cursor-pointer text-[13px] font-bold shadow-sm transition-all ${saved ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'}`}>
                        {saved ? <><CheckCircle2 className="w-3.5 h-3.5" /> 저장됨</> : <><Save className="w-3.5 h-3.5" /> 저장</>}
                    </button>
                </div>
            </div>

            <div className="flex max-w-[1200px] mx-auto py-8 px-6 flex-col md:flex-row gap-6">
                {/* 좌측 네비 */}
                <div className="w-full md:w-[220px] shrink-0">
                    <div className="sticky top-[84px] space-y-1">
                        {sections.map(s => (
                            <button key={s.id} onClick={() => setActiveSection(s.id)}
                                className={`flex items-center gap-2 w-full px-3.5 py-2.5 rounded-xl border-none cursor-pointer text-[13px] font-bold text-left transition-all ${activeSection === s.id ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-200 text-amber-600' : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
                                {s.icon} {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 우측 컨텐츠 */}
                <div className="flex-1 min-w-0">
                    {/* ── AI 모델 선택 ── */}
                    {activeSection === 'model' && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-base font-black text-slate-800 mb-1">⚡ AI 모델 선택</h2>
                            <p className="text-xs text-slate-500 mb-6 font-medium">조문 검토 및 의견서 생성에 사용할 AI 모델을 선택하세요</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {AI_MODEL_OPTIONS.map(m => (
                                    <button key={m.value} onClick={() => setConfig(p => ({ ...p, model: m.value }))}
                                        className={`p-4 rounded-xl cursor-pointer text-left transition-all bg-white border ${config.model === m.value ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-50/30' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                                        <div className={`text-[13px] font-bold mb-1 ${config.model === m.value ? 'text-amber-700' : 'text-slate-700'}`}>{m.label}</div>
                                        <div className="text-[11px] text-slate-500 font-medium">{m.provider}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── 프롬프트 편집 ── */}
                    {activeSection === 'prompts' && (
                        <div className="flex flex-col gap-5">
                            {[
                                { key: 'firstReviewPrompt' as const, label: '📋 1차 조문검토 프롬프트', desc: '이슈 분석 + 검토의견 + 시나리오 생성용' },
                                { key: 'fullRevisionPrompt' as const, label: '📄 전체수정완본 프롬프트', desc: '수정본 + 변호사 의견 + 수정근거 생성용' },
                            ].map(p => (
                                <div key={p.key} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <h3 className="text-[14px] font-black text-slate-800 mb-1">{p.label}</h3>
                                    <p className="text-xs text-slate-500 mb-4 font-medium">{p.desc}</p>
                                    <textarea
                                        value={config[p.key]}
                                        onChange={e => setConfig(prev => ({ ...prev, [p.key]: e.target.value }))}
                                        rows={12}
                                        className="w-full resize-y font-mono text-xs leading-relaxed text-slate-700 p-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all box-border"
                                    />
                                    <div className="flex justify-between mt-3">
                                        <span className="text-[11px] font-semibold text-slate-400 font-mono tracking-wide">{config[p.key].length.toLocaleString()} bytes</span>
                                        <button onClick={() => setConfig(prev => ({ ...prev, [p.key]: DEFAULT_PROMPT_CONFIG[p.key] }))}
                                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-transparent border-none cursor-pointer hover:underline transition-all">
                                            기본값 복원
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── 시나리오 카테고리 관리 ── */}
                    {activeSection === 'scenarios' && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-base font-black text-slate-800 mb-1">📊 시나리오 카테고리 관리</h2>
                            <p className="text-xs text-slate-500 mb-6 font-medium">조문 검토 시 포함할 시나리오 유형을 관리하세요</p>
                            <div className="flex flex-col gap-3">
                                {categories.map(cat => (
                                    <div key={cat.id} className={`p-4 rounded-xl border transition-all ${cat.enabled ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-lg">{cat.icon}</span>
                                            <span className="text-[14px] font-bold" style={{ color: cat.color }}>{cat.label}</span>
                                            <button onClick={() => toggleCategory(cat.id)}
                                                className={`ml-auto w-10 h-5 rounded-full border-none cursor-pointer relative transition-all ${cat.enabled ? 'shadow-inner' : 'bg-slate-200'}`} style={{ backgroundColor: cat.enabled ? cat.color : undefined }}>
                                                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-all duration-200 ${cat.enabled ? 'left-[22px]' : 'left-[2px]'}`} />
                                            </button>
                                        </div>
                                        <textarea
                                            value={cat.description}
                                            onChange={e => updateCategoryDesc(cat.id, e.target.value)}
                                            rows={2}
                                            className="w-full resize-none text-[12px] text-slate-700 bg-slate-50 border border-slate-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium leading-relaxed box-border"
                                        />
                                        <div className="flex gap-1.5 mt-3 flex-wrap">
                                            {cat.examples.map((ex, i) => (
                                                <span key={i} className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-sm">
                                                    {ex}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── 플로우 시각화 ── */}
                    {activeSection === 'flow' && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-base font-black text-slate-800 mb-1">🔄 AI 호출 플로우</h2>
                            <p className="text-xs text-slate-500 mb-8 font-medium">조문 검토 시 AI 프롬프트가 호출되는 순서</p>

                            {[
                                { step: '1', label: '조문 클릭', desc: '변호사가 특정 조문을 선택', color: '#3b82f6', sub: '사전 생성 (페이지 로드 시)' },
                                { step: '2', label: '1차 조문검토 생성', desc: `AI 모델: ${config.model}`, color: '#a855f7', sub: '프롬프트: 1차 조문검토용' },
                                { step: '3', label: '이슈 분석 표시', desc: '검토의견 + 시나리오 + 예상 제재', color: '#f59e0b', sub: `시나리오 카테고리: ${categories.filter(c => c.enabled).length}종 활성` },
                                { step: '4', label: '변호사 편집', desc: '클릭→편집으로 내용 수정', color: '#10b981', sub: '수정된 내용 → 프라이버시 리포트 반영' },
                                { step: '5', label: '전체수정완본 탭 클릭', desc: 'AI 의견서 생성 시작', color: '#d97706', sub: '프롬프트: 전체수정완본용' },
                                { step: '6', label: '의견서 완료', desc: '레터헤드 + 서명란 포함 공식 문서', color: '#ec4899', sub: '고객 즉시 공유 가능' },
                                { step: '7', label: '컨펌 & 발송', desc: '영업팀 전송 + 고객 이메일 발송', color: '#059669', sub: 'API: /api/email' },
                            ].map((item, i, arr) => (
                                <div key={item.step}>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black shadow-sm"
                                            style={{ backgroundColor: `${item.color}15`, border: `2px solid ${item.color}40`, color: item.color }}>
                                            {item.step}
                                        </div>
                                        <div className="flex-1 pt-0.5">
                                            <div className="text-[13px] font-black text-slate-800">{item.label}</div>
                                            <div className="text-[12px] font-medium text-slate-500 mt-1">{item.desc}</div>
                                            <div className="text-[11px] font-bold mt-1" style={{ color: item.color }}>{item.sub}</div>
                                        </div>
                                    </div>
                                    {i < arr.length - 1 && (
                                        <div className="w-0.5 h-6 bg-slate-200 ml-[15px] my-1.5 rounded-full" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
