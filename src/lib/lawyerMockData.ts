// ── 변호사 포털 로컬 타입 & 목업 데이터 ─────────────────────────────
// UI 컴포넌트(page.tsx)에서 분리된 타입 정의 및 샘플 데이터

// ── 타입 정의 ─────────────────────────────────────────────────────

export interface ConsultItem {
    id: string;
    companyName: string;
    category: string;
    urgency: 'urgent' | 'normal';
    title: string;
    content: string;
    created: string;
}

export interface ConsultRecord {
    id: string;
    status: '상담' | '수임' | '보류' | '완료';
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    category: '민사' | '형사' | '가사' | '부동산' | '노무' | '기업' | '기타';
    content: string;
    date: string;
    fee?: number;
    targetFee?: number;
    note?: string;
    isPublic: boolean;
    lawyer?: string;
}

export interface BillingRecord {
    id: string;
    date: string;
    clientName: string;
    type: '수임료' | '실비';
    item: string;
    chargeAmount: number;
    chargeVat: number;
    paidAmount: number;
    unpaidAmount: number;
    note?: string;
    caseTitle: string;
    caseNo: string;
    opponent: string;
    caseType: '계약' | '부동산' | '형사' | '노동' | '가사';
    assignedLawyer: string;
}

// ── 색상 맵 ───────────────────────────────────────────────────────

export const STATUS_COLORS: Record<ConsultRecord['status'], { bg: string; text: string; border: string }> = {
    '상담': { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    '수임': { bg: '#dcfce7', text: '#16a34a', border: '#86efac' },
    '보류': { bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
    '완료': { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
};

// ── 목업 데이터 ───────────────────────────────────────────────────

/** 상담 검토 탭 - 고객사 질문 목록 */
export const CONSULTS: ConsultItem[] = [
    {
        id: 'q1',
        companyName: '(주)놀부NBG',
        category: '가맹계약',
        urgency: 'urgent',
        title: '가맹계약 중도 해지 통보 대응',
        content: '본사에서 계약 해지를 요구하고 있습니다. 계약서 제8조 위약금이 200%인데 유효한가요? 가맹계약서와 관련 서류를 첨부합니다.',
        created: '2026-03-17 09:00',
    },
    {
        id: 'q2',
        companyName: '(주)BBQ',
        category: '개인정보',
        urgency: 'normal',
        title: '배달앱 연동 개인정보 처리방침',
        content: '배달앱과 연동하여 고객 정보를 수집하는데 처리방침에 무엇을 추가해야 하나요? 현재 방침 PDF 첨부합니다.',
        created: '2026-03-17 08:30',
    },
    {
        id: 'q3',
        companyName: '(주)메가커피',
        category: '노무',
        urgency: 'normal',
        title: '암묵적 초과근무 수당 지급 의무',
        content: '교대 변경 시 15~20분 초과근무가 발생하는데 수당을 지급해야 하나요? 현재 1,500개 가맹점에 적용 중입니다.',
        created: '2026-03-17 07:45',
    },
    {
        id: 'q4',
        companyName: '(주)파리바게뜨',
        category: '가맹계약',
        urgency: 'urgent',
        title: '가맹점 영업지역 침해 분쟁',
        content: '인근 200m에 동일 브랜드 가맹점이 추가 개설됩니다. 계약서상 영업지역 보호 조항이 있는데 법적 대응이 가능한가요?',
        created: '2026-03-16 16:00',
    },
];

/** 내 상담관리 탭 - 상담 레코드 샘플 */
export const SAMPLE_CONSULTS: ConsultRecord[] = [
    {
        id: 'c1',
        status: '상담',
        clientName: '김○○',
        clientPhone: '010-1234-5678',
        clientEmail: 'kim@email.com',
        category: '민사',
        content: '프랜차이즈 계약 해지 관련 손해배상 청구 상담. 계약 위반 사항 검토 필요.',
        date: '2026-03-23',
        fee: 0,
        targetFee: 5000000,
        note: '',
        isPublic: false,
        lawyer: '김수현',
    },
    {
        id: 'c2',
        status: '수임',
        clientName: '(주)○○푸드',
        clientPhone: '02-1234-5678',
        clientEmail: 'ceo@food.co.kr',
        category: '기업',
        content: '가맹점 영업지역 침해 분쟁. 본사 상대 손해배상 소송 진행 중.',
        date: '2026-03-20',
        fee: 3300000,
        targetFee: 5500000,
        note: '1차 준비서면 제출 완료',
        isPublic: true,
    },
    {
        id: 'c3',
        status: '보류',
        clientName: '이○○',
        clientPhone: '010-9876-5432',
        clientEmail: '',
        category: '가사',
        content: '이혼 소송 및 재산분할 청구. 자녀 양육권 분쟁 포함.',
        date: '2026-03-18',
        fee: 0,
        targetFee: 3000000,
        note: '의뢰인 연락 두절',
        isPublic: false,
    },
    {
        id: 'c4',
        status: '상담',
        clientName: '박○○',
        clientPhone: '010-5555-7777',
        clientEmail: 'park@biz.com',
        category: '노무',
        content: '부당해고 구제신청 관련 법률 자문. 해고 사유 적법성 검토.',
        date: '2026-03-22',
        fee: 0,
        targetFee: 2000000,
        note: '',
        isPublic: false,
    },
    {
        id: 'c5',
        status: '완료',
        clientName: '최○○',
        clientPhone: '010-3333-4444',
        clientEmail: 'choi@mail.com',
        category: '형사',
        content: '사기죄 고소장 작성 및 수사 지원. 증거 자료 분석 완료.',
        date: '2026-03-10',
        fee: 2200000,
        targetFee: 2200000,
        note: '사건 종결',
        isPublic: true,
    },
];

/** 청구/미수 탭 - 청구 레코드 샘플 */
export const SAMPLE_BILLING: BillingRecord[] = [
    {
        id: 'b1',
        date: '2026-03-05',
        clientName: '(주)놀부NBG',
        type: '수임료',
        item: '착수금',
        chargeAmount: 3000000,
        chargeVat: 300000,
        paidAmount: 0,
        unpaidAmount: 3300000,
        caseTitle: '가맹계약 해지 손배',
        caseNo: '2026가합12345',
        opponent: '놀부NBG본사',
        caseType: '계약',
        assignedLawyer: '김수현',
    },
    {
        id: 'b2',
        date: '2026-03-06',
        clientName: '(주)BBQ',
        type: '수임료',
        item: '착수금',
        chargeAmount: 2000000,
        chargeVat: 200000,
        paidAmount: 2200000,
        unpaidAmount: 0,
        caseTitle: '영업지역 침해',
        caseNo: '2026가합67890',
        opponent: '제너시스BBQ',
        caseType: '형사',
        assignedLawyer: '이영진',
    },
    {
        id: 'b3',
        date: '2026-03-10',
        clientName: '(주)메가커피',
        type: '수임료',
        item: '성공보수',
        chargeAmount: 5000000,
        chargeVat: 500000,
        paidAmount: 2750000,
        unpaidAmount: 2750000,
        caseTitle: '노무 분쟁',
        caseNo: '2026민사34567',
        opponent: '메가엠지씨커피',
        caseType: '노동',
        assignedLawyer: '박지훈',
    },
    {
        id: 'b4',
        date: '2026-03-12',
        clientName: '(주)파리바게뜨',
        type: '실비',
        item: '소송비용',
        chargeAmount: 500000,
        chargeVat: 50000,
        paidAmount: 550000,
        unpaidAmount: 0,
        caseTitle: '가맹점 분쟁',
        caseNo: '2026가합11111',
        opponent: 'SPC삼립',
        caseType: '부동산',
        assignedLawyer: '김수현',
    },
    {
        id: 'b5',
        date: '2026-03-15',
        clientName: '이○○',
        type: '수임료',
        item: '착수금',
        chargeAmount: 1500000,
        chargeVat: 150000,
        paidAmount: 0,
        unpaidAmount: 1650000,
        caseTitle: '이혼소송',
        caseNo: '2026드합22222',
        opponent: '-',
        caseType: '가사',
        assignedLawyer: '최민영',
    },
];
