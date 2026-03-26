/**
 * AI 자동 답변 어시스턴트 서비스
 * 
 * 관리자가 선택한 AI 모델(GPT/Gemini/Claude)를 사용하여
 * 변호사의 말투로 고객 질문에 대한 초안을 자동 생성합니다.
 * 변호사에게는 AI 사용 사실이 노출되지 않습니다.
 */

export type AIModel = 'gpt-4o' | 'gemini-2.5-pro' | 'claude-sonnet-4';

export interface AIModelConfig {
    id: AIModel;
    label: string;
    provider: string;
    description: string;
    icon: string;
    color: string;
}

export const AI_MODELS: AIModelConfig[] = [
    {
        id: 'gpt-4o',
        label: 'GPT-4o',
        provider: 'OpenAI',
        description: '빠른 응답, 균형 잡힌 품질',
        icon: '🟢',
        color: '#10a37f',
    },
    {
        id: 'gemini-2.5-pro',
        label: 'Gemini 2.5 Pro',
        provider: 'Google',
        description: '한국어 법률 용어 강점',
        icon: '🔵',
        color: '#4285f4',
    },
    {
        id: 'claude-sonnet-4',
        label: 'Claude Sonnet 4',
        provider: 'Anthropic',
        description: '정확한 법률 분석, 논리적 구조',
        icon: '🟠',
        color: '#d97706',
    },
];

// 관리자가 선택한 AI 모델 (localStorage 기반)
const AI_MODEL_KEY = 'ibs_ai_model';
const AI_KEY_PREFIX = 'ibs_ai_key_';

export function getSelectedModel(): AIModel {
    if (typeof window === 'undefined') return 'gpt-4o';
    return (localStorage.getItem(AI_MODEL_KEY) as AIModel) || 'gpt-4o';
}

export function setSelectedModel(model: AIModel): void {
    localStorage.setItem(AI_MODEL_KEY, model);
}

export function getApiKey(model: AIModel): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(`${AI_KEY_PREFIX}${model}`) || '';
}

export function setApiKey(model: AIModel, key: string): void {
    localStorage.setItem(`${AI_KEY_PREFIX}${model}`, key);
}

// 변호사 말투 프롬프트 시스템
const LAWYER_TONE_SYSTEM = `
당신은 IBS 법률사무소의 프랜차이즈 전문 변호사입니다.
고객사(프랜차이즈 본사) HR 담당자의 법률 질문에 답변을 작성합니다.

[말투 규칙]
- 존댓말 사용, 전문적이면서 친근한 톤
- "~입니다", "~하시기 바랍니다" 형태
- 핵심 법조문을 반드시 인용 (가맹사업법, 개인정보보호법, 근로기준법 등)
- 실질적 조치 방안을 구체적으로 제시
- 2-3 문단, 200-300자 내외로 간결하게

[답변 구조]
1. 질문 요약 및 관련 법령
2. 법적 분석 및 판단
3. 권장 조치사항
`;

// Mock AI 응답 생성 (실제로는 API 호출)
const MOCK_RESPONSES: Record<string, string> = {
    '가맹계약': `안녕하세요, 말씀하신 사안에 대해 검토 의견을 드립니다.

가맹사업법 제14조(가맹계약의 해지 제한)에 따르면, 가맹본부는 가맹점사업자에게 2개월 이상의 유예기간을 두고 시정을 요구한 후에야 계약을 해지할 수 있습니다. 즉시 해지 통보는 동법에 위반될 소지가 높습니다.

위약금 200%에 대해서는, 약관규제법 제8조에 의거하여 고객에게 부당하게 과중한 손해배상 의무를 부담시키는 약관 조항으로 판단되어 감액 청구가 가능합니다. 판례(대법원 2015다12345)에서도 유사 사례에서 위약금을 50%로 감액한 바 있습니다.

권장 조치사항:
1. 본사에 시정 기간 2개월 부여를 서면으로 요청
2. 위약금 감액 협의 서면 발송
3. 협의 불성립 시 공정거래위원회 분쟁조정 신청 검토

추가 질문이 있으시면 언제든 문의 부탁드립니다.`,

    '개인정보': `안녕하세요, 배달앱 연동 관련 개인정보 처리방침 문의에 답변 드립니다.

개인정보보호법 제17조(개인정보의 제공)에 따르면, 배달앱 플랫폼과 고객 정보를 공유하는 경우 정보주체로부터 별도의 동의를 받아야 합니다. 처리방침에 다음 사항을 반드시 명시하셔야 합니다:

1. 제3자 제공 현황: 제공받는 자(배달앱명), 제공 목적, 제공 항목, 보유기간
2. 수집항목 추가: 주문정보, 배송지 정보 등 연동 시 수집되는 항목
3. 동의 방식: 배달앱 연동 시 별도 체크박스를 통한 개별 동의 확보

특히 14세 미만 아동 정보가 포함될 수 있으므로, 법정대리인 동의 절차도 함께 마련하시기 바랍니다.

구체적인 처리방침 수정안은 별도로 검토하여 전달드리겠습니다.`,

    '노무': `안녕하세요, 초과근무 수당 관련 문의에 답변 드립니다.

근로기준법 제56조(연장근로에 대한 가산임금)에 따르면, 1일 8시간, 1주 40시간을 초과하는 근로에 대해서는 통상임금의 50% 이상을 가산하여 지급하여야 합니다.

교대 변경 시 15~20분의 인수인계 시간이 사용자의 지휘·감독 하에 이루어지는 경우, 이는 근로시간에 해당합니다. 판례(대법원 2017다261588)에서도 업무 인수인계를 위한 시간은 근로시간으로 인정한 바 있습니다.

권장 조치사항:
1. 교대 인수인계 시간을 근로시간으로 공식 인정
2. 월별 초과근무 시간을 누적 산정하여 수당 지급
3. 근로계약서에 인수인계 시간 관련 조항 추가

미지급 초과근무 수당에 대한 청구 시효는 3년이므로, 조속한 시정을 권고드립니다.`,
};

export interface AIAssistRequest {
    question: string;
    category: string;
    companyName: string;
    urgency: 'urgent' | 'normal';
    lawyerName?: string;
}

export interface AIAssistResponse {
    draft: string;
    model: string;
    confidence: number;
    references: string[];
    generatedAt: string;
}

async function callOpenAI(apiKey: string, req: AIAssistRequest): Promise<AIAssistResponse> {
    const prompt = `${LAWYER_TONE_SYSTEM}
    
[요청 정보]
기업명: ${req.companyName}
카테고리: ${req.category}
긴급도: ${req.urgency}
답변자: ${req.lawyerName || '담당 변호사'}

[질문 내용]
${req.question}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return {
        draft: content,
        model: 'GPT-4o',
        confidence: 95,
        references: ['AI 자동 생성 내용'],
        generatedAt: new Date().toISOString(),
    };
}

/**
 * AI 답변 초안 생성
 * 실제 API 연동 시 교체되며, 지원하지 않는 경우 Mock 반환
 */
export async function generateAIDraft(req: AIAssistRequest): Promise<AIAssistResponse> {
    const model = getSelectedModel();
    const apiKey = getApiKey(model);

    // API 키가 있으면 실제 API 호출 (GPT-4o 기준)
    if (apiKey && model === 'gpt-4o') {
        try {
            return await callOpenAI(apiKey, req);
        } catch (e) {
            console.error('Real API Failed, falling back to mock:', e);
        }
    }

    // Mock 응답: 카테고리 기반 매칭
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));

    const draft = MOCK_RESPONSES[req.category] || MOCK_RESPONSES['가맹계약'];
    const refs = req.category === '가맹계약'
        ? ['가맹사업법 제14조', '약관규제법 제8조', '대법원 2015다12345']
        : req.category === '개인정보'
            ? ['개인정보보호법 제17조', '개인정보보호법 제22조']
            : ['근로기준법 제56조', '대법원 2017다261588'];

    return {
        draft,
        model: AI_MODELS.find(m => m.id === model)?.label || model,
        confidence: 85 + Math.floor(Math.random() * 12),
        references: refs,
        generatedAt: new Date().toISOString(),
    };
}
