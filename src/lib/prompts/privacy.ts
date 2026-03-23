// ── 시나리오 카테고리 6종 ─────────────────────────────────────
export interface ScenarioCategory {
    id: string;
    label: string;
    icon: string;
    color: string;
    enabled: boolean;
    description: string;
    examples: string[];
}

export const DEFAULT_SCENARIO_CATEGORIES: ScenarioCategory[] = [
    {
        id: 'administrative',
        label: '행정처분',
        icon: '🏛️',
        color: '#dc2626',
        enabled: true,
        description: '개인정보보호위원회 정기감사·특별점검에 의한 행정적 제재',
        examples: [
            '과태료 최대 5,000만원/건',
            '과징금 매출액 3% 이하',
            '시정명령 + 위반사실 공표 (개보위 홈페이지 6개월)',
            '정기감사·특별점검 대상 지정',
        ],
    },
    {
        id: 'data_breach',
        label: '개인정보 유출사고',
        icon: '🔓',
        color: '#ef4444',
        enabled: true,
        description: '대규모 개인정보 유출 사고 발생 시 기업에 미치는 영향',
        examples: [
            '쿠팡 2023년 유출 → 과징금 55억원',
            '인터파크 유출 → 44억원 과징금',
            '스타벅스코리아 유출 → 집단소송 + 이미지 하락',
            '프랜차이즈 가맹점 POS 경유 유출 시 본사 연대책임',
        ],
    },
    {
        id: 'customer_claim',
        label: '고객(정보주체) 클레임',
        icon: '⚖️',
        color: '#d97706',
        enabled: true,
        description: '정보주체의 권리 행사 및 법적 대응에 따른 리스크',
        examples: [
            '개별 손해배상 소송 (판례 1인당 10~30만원 위자료)',
            '집단소송 — 회원 수 × 위자료 = 수십억 규모',
            '소비자단체 고발 → 언론보도 → 가맹점주 이탈',
            '스팸 신고 (별도 동의 없이 마케팅 시) → 방통위 조사',
        ],
    },
    {
        id: 'franchise_risk',
        label: '프랜차이즈 특유 리스크',
        icon: '🏪',
        color: '#7c3aed',
        enabled: true,
        description: '프랜차이즈 사업 구조에서 발생하는 고유한 법적 위험',
        examples: [
            '가맹점주가 본사 처리방침 미비를 이유로 가맹계약 해지 주장',
            '공정위 가맹사업법 점검 시 개인정보 관련 사항도 함께 적발',
            '경쟁 브랜드 "개인정보 인증 취득" 마케팅 → 비교 열위',
        ],
    },
    {
        id: 'business_impact',
        label: '사업 영향',
        icon: '📉',
        color: '#2563eb',
        enabled: true,
        description: '기업 성장·거래 관계에 직접 영향을 미치는 리스크',
        examples: [
            '대형 거래처(학교·관공서·대기업 납품) 개인정보 인증 요구 시 탈락',
            '해외 진출 시 GDPR/CCPA 적합성 부재로 진입 불가',
            '투자 유치·M&A 실사(Due Diligence) 시 법적 리스크 감점',
        ],
    },
    {
        id: 'ceo_personal',
        label: '대표이사 개인 리스크',
        icon: '👤',
        color: '#be185d',
        enabled: true,
        description: '법인이 아닌 대표자 개인에게 미치는 법적 리스크',
        examples: [
            '개보법 §74 — 형사처벌 (5년 이하 징역 / 5,000만원 이하 벌금)',
            '임원 해임 권고 (개보위 특별점검 후)',
            '대표이사 개인 민사 손해배상 청구',
        ],
    },
];

// ── 조문별 시나리오 카테고리 매핑 ──────────────────────────────
export const CLAUSE_SCENARIO_MAP: Record<string, string[]> = {
    '총칙': ['administrative'],
    '제1조': ['administrative', 'customer_claim'],
    '제2조': ['customer_claim', 'administrative'],
    '제3조': ['data_breach', 'customer_claim'],
    '제4조': ['data_breach', 'administrative', 'franchise_risk'],
    '제5조': ['business_impact', 'ceo_personal'],
};

// ── AI 프롬프트 템플릿 ────────────────────────────────────────
export interface PrivacyPromptConfig {
    model: string;
    firstReviewPrompt: string;
    fullRevisionPrompt: string;
}

export const DEFAULT_PROMPT_CONFIG: PrivacyPromptConfig = {
    model: 'gpt-4o',
    firstReviewPrompt: `당신은 대한민국 개인정보보호법 전문 변호사(경력 10년 이상)입니다.

[역할]
- 기업의 개인정보처리방침 조문을 법률적으로 분석합니다.
- 변호사 페르소나로 작성하며, 전문적이면서도 기업 담당자가 위험성을 명확히 체감할 수 있는 톤으로 작성합니다.

[분석 항목]
각 조문에 대해 반드시 아래 항목을 포함하여 분석하세요:

1. **위험 요약** (riskSummary): 해당 조문의 핵심 쟁점을 2-3줄로 요약
2. **관련 법조문** (lawRef): 위반 가능성이 있는 구체적 법 조항 인용
3. **검토의견** (lawyerOpinion): 10년차 변호사 톤으로 법률적 분석 의견 작성. 반드시 아래 내용 포함:
   - 관련 법령의 정확한 조문 인용
   - 현행 방침의 구체적 문제점
   - 개인정보보호위원회의 최근 집행 동향
4. **시나리오** (scenario): 고객이 긴장감을 느낄 수 있는 구체적 위반 시나리오. 반드시 아래 카테고리 중 해당되는 것을 포함:
   - 행정처분: 과태료/과징금 금액, 위반사실 공표
   - 개인정보 유출사고: 쿠팡(55억), 인터파크(44억) 등 실제 사례 인용
   - 고객 클레임: 집단소송 규모, 1인당 위자료 판례
   - 프랜차이즈 특유 리스크: 가맹점주 이탈, 경쟁사 비교 불리
   - 사업 영향: 거래처 탈락, 해외진출 차단, 투자유치 감점
   - 대표이사 개인 리스크: 형사처벌, 개인 손해배상
5. **예상 제재** (penalty): 구체적 과태료/과징금 금액대
6. **수정 권고** (recommendation): 시정 방향 제시

[출력 형식]
JSON 배열로 출력하세요.`,

    fullRevisionPrompt: `당신은 대한민국 개인정보보호법 전문 변호사(경력 15년)입니다.
기업 고객에게 즉시 공유할 수 있는 공식 법률 의견서를 작성합니다.

[역할]
- 변호사 페르소나: 10년차 이상 경력 변호사가 직접 작성한 것처럼
- 각 조문에 대해 수정 완료본 + 변호사 검토의견 + 수정 근거를 작성
- 이 문서는 고객 기업에 바로 전달되는 공식 문서입니다

[문서 구성]
각 조문별로 아래 3개 섹션을 작성:

1. **수정 완료본** (revisedText): 원문을 법적으로 완벽하게 수정한 최종 텍스트
   - 개인정보보호법, 정보통신망법, 전자상거래법 등 관련 법령 완전 반영
   - 필수/선택 분리, 보유기간 명시, 제3자 제공 테이블 등 실무 포맷

2. **변호사 검토의견** (opinion): 왜 이렇게 수정했는지 법적 근거와 함께 설명
   - "본 조항은 개인정보보호법 제○조에 따라..."와 같은 법률 문체
   - 수정 전 문제점과 수정 후 개선점을 대비하여 설명
   - 개인정보보호위원회 최근 판례·행정처분 사례 인용

3. **수정 근거** (legalBasis): 관련 법조문 목록
   - 법명 + 조항번호 + 조항명 형식

[톤]
- 법률 전문가 톤: 정확하고 권위있는 문체
- 고객이 읽었을 때 "이 변호사가 꼼꼼하게 검토했구나"라고 느낄 수 있도록
- 불필요한 수식어 배제, 핵심 법적 쟁점에 집중`,
};

// ── localStorage 기반 설정 저장/로드 ───────────────────────────
const STORAGE_KEY = 'ibs_privacy_prompts';
const SCENARIO_STORAGE_KEY = 'ibs_scenario_categories';

export function getPromptConfig(): PrivacyPromptConfig {
    if (typeof window === 'undefined') return DEFAULT_PROMPT_CONFIG;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return { ...DEFAULT_PROMPT_CONFIG, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return DEFAULT_PROMPT_CONFIG;
}

export function savePromptConfig(config: Partial<PrivacyPromptConfig>): void {
    if (typeof window === 'undefined') return;
    const current = getPromptConfig();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...config }));
}

export function getScenarioCategories(): ScenarioCategory[] {
    if (typeof window === 'undefined') return DEFAULT_SCENARIO_CATEGORIES;
    try {
        const raw = localStorage.getItem(SCENARIO_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return DEFAULT_SCENARIO_CATEGORIES;
}

export function saveScenarioCategories(cats: ScenarioCategory[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(cats));
}

// ── AI 모델 옵션 ──────────────────────────────────────────────
export const AI_MODEL_OPTIONS = [
    { value: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI' },
    { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus', provider: 'Anthropic' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'Google' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'Google' },
];
