'use client';
import React, { useState } from 'react';
import { Volume2, Sparkles, RefreshCw } from 'lucide-react';
import { Company, type CaseStatus } from '@/lib/types';
import { STATUS_COLOR, STATUS_TEXT, STATUS_LABEL } from '@/lib/constants';
import { useEmployeeCRM } from '@/hooks/useEmployeeCRM';

const C = {
    surface: '#ffffff',
    border: '#d1d5db',
    borderLight: '#e5e7eb',
    heading: '#0f172a',
    body: '#1e293b',
    sub: '#475569',
    faint: '#94a3b8',
    accent: '#4f46e5',
    amber: '#d97706',
};

/* ── helpers ─────────────────────────────────────────────── */
function getLegacyScript(c: Company): string {
    const hi = c.contactName ? `${c.contactName} 님` : '담당자님';
    const issues = (c.issues || []).slice(0, 3);
    const it = issues.length > 0
        ? issues.map((i, x) => `  ${x + 1}. [${i.level}] ${i.title}`).join('\n')
        : '  (분석 결과 대기 중)';
    if (['analyzed'].includes(c.status))
        return `안녕하세요, ${hi}.\n법률사무소 IBS 영업팀입니다.\n\n${c.name}의 개인정보처리방침을 검토한 결과,\n아래와 같은 법적 리스크가 확인되었습니다:\n\n${it}\n\n사전 대응을 권고드립니다.`;
    if (['lawyer_confirmed', 'emailed'].includes(c.status))
        return `${hi}, 법률사무소 IBS입니다.\n앞서 발송드린 ${c.name} 개인정보 진단 보고서는 확인하셨을까요?\n\n주요 리스크:\n${it}\n\n전담 변호사의 상세 검토 의견이 준비되어 있습니다.`;
    if (['client_replied', 'client_viewed'].includes(c.status))
        return `${hi}, 법률사무소 IBS입니다.\n보고서를 검토해 주셔서 감사합니다.\n\n계약 진행을 위한 서류가 준비되어 있습니다.`;
    return `${hi}, 법률사무소 IBS 영업팀입니다.\n${c.name} 건 관련 안내드리고자 연락드렸습니다.`;
}

export interface ScriptTabProps {
    co: Company;
    setToast: (s: string) => void;
}

export default function ScriptTab({ co, setToast }: ScriptTabProps) {
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const { updateCompany } = useEmployeeCRM();

    // Use AI custom script if available, fallback to legacy script
    const script = co.customScript?.call || getLegacyScript(co);

    const copyScript = () => {
        navigator.clipboard.writeText(script).then(() => {
            setCopied(true);
            setToast('📋 복사됨');
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleGenerateAiScript = async () => {
        setIsGenerating(true);
        setToast('브랜드 맞춤형 AI 스크립트 생성 중...');
        try {
            const res = await fetch('/api/sales/generate-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId: co.id,
                    brandName: co.name,
                    issues: co.issues
                })
            });
            const data = await res.json();
            if (data.success && data.script) {
                updateCompany(co.id, {
                    customScript: {
                        ...co.customScript,
                        call: data.script,
                        lastEditedAt: new Date().toISOString()
                    }
                });
                setToast('✨ AI 스크립트 생성 및 저장 완료');
            } else {
                setToast('❌ 스크립트 생성 실패: ' + (data.error || '알 수 없는 오류'));
            }
        } catch (error) {
            console.error('AI 스크립트 생성 오류:', error);
            setToast('❌ 스크립트 생성 중 단절 발생');
        } finally {
            setIsGenerating(false);
        }
    };

    const isCustom = !!co.customScript?.call;

    return (
        <div className="rounded-xl p-4 flex flex-col w-full h-full" style={{ background: C.surface, border: `1px solid ${C.borderLight}` }}>
            <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: C.borderLight }}>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: isCustom ? '#e0e7ff' : '#f1f5f9', color: isCustom ? '#4338ca' : C.sub }}>
                        {isCustom ? '✨ 브랜드 맞춤형 스크립트 (v2.0)' : '기본 템플릿'}
                    </span>
                    {co.customScript?.lastEditedAt && (
                        <span className="text-[10px]" style={{ color: C.faint }}>
                            업데이트: {new Date(co.customScript.lastEditedAt).toLocaleString()}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleGenerateAiScript}
                        disabled={isGenerating}
                        className="flex items-center gap-1 text-[10px] px-3 py-1 rounded-lg font-bold transition-colors"
                        style={{
                            background: isGenerating ? '#f1f5f9' : '#eef2ff',
                            color: isGenerating ? C.faint : '#4f46e5',
                            border: `1px solid ${isGenerating ? C.borderLight : '#c7d2fe'}`,
                        }}
                    >
                        {isGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {isGenerating ? '생성 중...' : 'AI 재작성'}
                    </button>
                    <button
                        onClick={copyScript}
                        className="text-[10px] px-3 py-1 rounded-lg font-bold transition-colors"
                        style={{
                            background: copied ? '#ecfdf5' : '#f1f5f9',
                            color: copied ? '#059669' : C.sub,
                            border: `1px solid ${copied ? '#a7f3d0' : C.borderLight}`,
                        }}
                    >
                        {copied ? '✅ 복사됨' : '📋 복사'}
                    </button>
                </div>
            </div>

            <div className="text-[13px] leading-[1.8] whitespace-pre-wrap flex-1 overflow-y-auto" style={{ color: C.heading }}>
                {script}
            </div>
        </div>
    );
}
