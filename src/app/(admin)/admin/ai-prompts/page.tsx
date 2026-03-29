'use client';
import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, CheckCircle2, ChevronDown, Zap, FileText, MessageSquare, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import {
    type PrivacyPromptConfig, type ScenarioCategory,
    DEFAULT_PROMPT_CONFIG, DEFAULT_SCENARIO_CATEGORIES, AI_MODEL_OPTIONS,
    getPromptConfig, savePromptConfig, getScenarioCategories, saveScenarioCategories,
} from '@/lib/prompts/privacy';

// ── 색상 ──────────────────────────────────────────────────
const C = {
    bg: '#04091a', card: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)',
    text: '#f0f4ff', muted: 'rgba(240,244,255,0.4)', gold: '#c9a84c',
    green: '#4ade80', blue: '#60a5fa', purple: '#a78bfa',
};

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
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
            {/* 상단 헤더 */}
            <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(13,27,62,0.97)', borderBottom: `1px solid ${C.border}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link href="/employee"><button style={{ fontSize: 13, color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>← 돌아가기</button></Link>
                    <div style={{ width: 1, height: 16, background: C.border }} />
                    <span style={{ fontSize: 15, fontWeight: 900, color: C.text }}>🤖 AI 프롬프트 관리</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, background: `${C.gold}15`, padding: '2px 8px', borderRadius: 20 }}>관리자 전용</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13 }}>
                        <RotateCcw className="w-3.5 h-3.5" /> 초기화
                    </button>
                    <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 5, background: saved ? 'rgba(74,222,128,0.15)' : `linear-gradient(135deg,${C.gold},#e8c87a)`, color: saved ? C.green : '#0a0e1a', border: 'none', borderRadius: 8, padding: '7px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 800 }}>
                        {saved ? <><CheckCircle2 className="w-3.5 h-3.5" /> 저장됨</> : <><Save className="w-3.5 h-3.5" /> 저장</>}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', maxWidth: 1200, margin: '0 auto', padding: '24px 24px' }}>
                {/* 좌측 네비 */}
                <div style={{ width: 220, flexShrink: 0, marginRight: 24 }}>
                    <div style={{ position: 'sticky', top: 84 }}>
                        {sections.map(s => (
                            <button key={s.id} onClick={() => setActiveSection(s.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', marginBottom: 4,
                                    borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, textAlign: 'left',
                                    background: activeSection === s.id ? 'rgba(201,168,76,0.1)' : 'transparent',
                                    color: activeSection === s.id ? C.gold : C.muted,
                                    transition: 'all 0.15s',
                                }}>
                                {s.icon} {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 우측 컨텐츠 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* ── AI 모델 선택 ── */}
                    {activeSection === 'model' && (
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 900, color: C.text, marginBottom: 4 }}>⚡ AI 모델 선택</h2>
                            <p style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>조문 검토 및 의견서 생성에 사용할 AI 모델을 선택하세요</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                {AI_MODEL_OPTIONS.map(m => (
                                    <button key={m.value} onClick={() => setConfig(p => ({ ...p, model: m.value }))}
                                        style={{
                                            padding: '14px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                                            background: config.model === m.value ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.02)',
                                            border: config.model === m.value ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
                                            transition: 'all 0.15s',
                                        }}>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: config.model === m.value ? C.gold : C.text, marginBottom: 2 }}>{m.label}</div>
                                        <div style={{ fontSize: 11, color: C.muted }}>{m.provider}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── 프롬프트 편집 ── */}
                    {activeSection === 'prompts' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {[
                                { key: 'firstReviewPrompt' as const, label: '📋 1차 조문검토 프롬프트', desc: '이슈 분석 + 검토의견 + 시나리오 생성용' },
                                { key: 'fullRevisionPrompt' as const, label: '📄 전체수정완본 프롬프트', desc: '수정본 + 변호사 의견 + 수정근거 생성용' },
                            ].map(p => (
                                <div key={p.key} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                                    <h3 style={{ fontSize: 14, fontWeight: 900, color: C.text, marginBottom: 2 }}>{p.label}</h3>
                                    <p style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>{p.desc}</p>
                                    <textarea
                                        value={config[p.key]}
                                        onChange={e => setConfig(prev => ({ ...prev, [p.key]: e.target.value }))}
                                        rows={12}
                                        style={{
                                            width: '100%', resize: 'vertical', fontFamily: "'SF Mono',monospace", fontSize: 12,
                                            lineHeight: 1.7, color: C.text, padding: '14px 16px', borderRadius: 10,
                                            background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`,
                                            outline: 'none', boxSizing: 'border-box',
                                        }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                        <span style={{ fontSize: 11, color: C.muted }}>{config[p.key].length}자</span>
                                        <button onClick={() => setConfig(prev => ({ ...prev, [p.key]: DEFAULT_PROMPT_CONFIG[p.key] }))}
                                            style={{ fontSize: 11, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                            기본값 복원
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── 시나리오 카테고리 관리 ── */}
                    {activeSection === 'scenarios' && (
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 900, color: C.text, marginBottom: 4 }}>📊 시나리오 카테고리 관리</h2>
                            <p style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>조문 검토 시 포함할 시나리오 유형을 관리하세요</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {categories.map(cat => (
                                    <div key={cat.id} style={{
                                        padding: '16px 18px', borderRadius: 12, background: cat.enabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                                        border: `1px solid ${cat.enabled ? cat.color + '40' : C.border}`, opacity: cat.enabled ? 1 : 0.5, transition: 'all 0.2s',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                            <span style={{ fontSize: 18 }}>{cat.icon}</span>
                                            <span style={{ fontSize: 14, fontWeight: 800, color: cat.color }}>{cat.label}</span>
                                            <button onClick={() => toggleCategory(cat.id)}
                                                style={{
                                                    marginLeft: 'auto', width: 40, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', position: 'relative',
                                                    background: cat.enabled ? cat.color : 'rgba(255,255,255,0.15)', transition: 'all 0.2s',
                                                }}>
                                                <div style={{
                                                    width: 16, height: 16, borderRadius: 8, background: '#fff', position: 'absolute', top: 2,
                                                    left: cat.enabled ? 22 : 2, transition: 'left 0.2s',
                                                }} />
                                            </button>
                                        </div>
                                        <textarea
                                            value={cat.description}
                                            onChange={e => updateCategoryDesc(cat.id, e.target.value)}
                                            rows={2}
                                            style={{
                                                width: '100%', resize: 'none', fontSize: 12, color: C.text, lineHeight: 1.6,
                                                padding: '8px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.02)',
                                                border: `1px solid ${C.border}`, outline: 'none', boxSizing: 'border-box',
                                            }}
                                        />
                                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                            {cat.examples.map((ex, i) => (
                                                <span key={i} style={{ fontSize: 10, color: C.muted, background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 20, border: `1px solid ${C.border}` }}>
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
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 900, color: C.text, marginBottom: 4 }}>🔄 AI 호출 플로우</h2>
                            <p style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>조문 검토 시 AI 프롬프트가 호출되는 순서</p>

                            {[
                                { step: '1', label: '조문 클릭', desc: '변호사가 특정 조문을 선택', color: C.blue, sub: '사전 생성 (페이지 로드 시)' },
                                { step: '2', label: '1차 조문검토 생성', desc: `AI 모델: ${config.model}`, color: C.purple, sub: '프롬프트: 1차 조문검토용' },
                                { step: '3', label: '이슈 분석 표시', desc: '검토의견 + 시나리오 + 예상 제재', color: '#f59e0b', sub: `시나리오 카테고리: ${categories.filter(c => c.enabled).length}종 활성` },
                                { step: '4', label: '변호사 편집', desc: '클릭→편집으로 내용 수정', color: C.green, sub: '수정된 내용 → 프라이버시 리포트 반영' },
                                { step: '5', label: '전체수정완본 탭 클릭', desc: 'AI 의견서 생성 시작', color: C.gold, sub: '프롬프트: 전체수정완본용' },
                                { step: '6', label: '의견서 완료', desc: '레터헤드 + 서명란 포함 공식 문서', color: '#f472b6', sub: '고객 즉시 공유 가능' },
                                { step: '7', label: '컨펌 & 발송', desc: '영업팀 전송 + 고객 이메일 발송', color: '#34d399', sub: 'API: /api/email' },
                            ].map((item, i, arr) => (
                                <div key={item.step}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 16, flexShrink: 0,
                                            background: `${item.color}20`, border: `2px solid ${item.color}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 12, fontWeight: 900, color: item.color,
                                        }}>{item.step}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{item.label}</div>
                                            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{item.desc}</div>
                                            <div style={{ fontSize: 11, color: `${item.color}aa`, marginTop: 2 }}>{item.sub}</div>
                                        </div>
                                    </div>
                                    {i < arr.length - 1 && (
                                        <div style={{ width: 2, height: 24, background: C.border, marginLeft: 15, marginTop: 4, marginBottom: 4 }} />
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
