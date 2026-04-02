import { Company, CompanyMemo } from '../types';
import { getPromptConfig } from '@/lib/prompts/privacy';

export interface AIMemoResult {
    summary: string;
    keyPoints: string[];
    nextAction: string;
    nextActionType: 'send_contract' | 'schedule_meeting' | 'follow_up_call' | 'send_email' | 'escalate';
    confidence: number;   // 0~100
}

export const AIMemoService = {
    async analyze(company: Company, memos: CompanyMemo[]): Promise<AIMemoResult> {
        if (!memos || memos.length === 0) {
            return {
                summary: '아직 기록된 메모나 통화 내역이 없습니다.',
                keyPoints: [],
                nextAction: '첫 연락 시도 및 정보 파악',
                nextActionType: 'send_email',
                confidence: 50
            };
        }

        try {
            const promptConfig = getPromptConfig();
            const systemPrompt = promptConfig.salesMemoSummaryPrompt;
            const model = promptConfig.promptModels?.salesMemoSummaryPrompt || promptConfig.model || 'gpt-4o';
            
            // 브라우저 localStorage에서 관리자가 설정한 API 키 가져오기 (ai-assist 로직 재사용)
            let apiKey = '';
            try {
                // localStorage 직접 접근하여 키 가져오기
                if (typeof window !== 'undefined') {
                    apiKey = localStorage.getItem(`ibs_ai_key_${model}`) || '';
                }
            } catch (e) {
                console.error('Failed to get API key from localStorage', e);
            }

            const res = await fetch('/api/sales/analyze-memo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt,
                    model,
                    apiKey, // 서버에 키 전달
                    companyData: { status: company.status, name: company.name },
                    memos: memos.map(m => ({
                        author: m.author,
                        content: m.content,
                        created_at: m.createdAt
                    }))
                })
            });

            if (!res.ok) {
                console.error('[AIMemoService] HTTP error from server:', res.status);
                throw new Error(`HTTP error ${res.status}`);
            }

            const data = await res.json();
            
            if (data.success && data.result) {
                // Return explicitly parsed to expected format
                return {
                    summary: data.result.summary || '요약 정보 없음',
                    keyPoints: Array.isArray(data.result.keyPoints) ? data.result.keyPoints : [],
                    nextAction: data.result.nextAction || '추가 정보 필요',
                    nextActionType: data.result.nextActionType || 'follow_up_call',
                    confidence: typeof data.result.confidence === 'number' ? data.result.confidence : 50
                };
            } else {
                throw new Error(data.error || 'Unknown AI error structure');
            }
        } catch (error) {
            console.error('[AIMemoService] Failed AI LLM integration. Returned generic fallback.', error);
            return {
                summary: 'AI 분석 서버 통신 또는 처리 중 오류가 발생했습니다. (자세한 내용은 콘솔 확인)',
                keyPoints: ['분석 서버 실패'],
                nextAction: '직접 확인 후 팔로업 진행',
                nextActionType: 'follow_up_call',
                confidence: 50
            };
        }
    },
};
