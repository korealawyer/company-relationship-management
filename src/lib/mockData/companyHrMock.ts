export const COMPANY = {
    name: '테크스타트업 (주)',
    bizType: 'IT / 소프트웨어',
    plan: 'Premium',
    since: '2023.01.15',
    manager: '이대표',
    headCount: 250,
    storeCount: 15
};

export const MONTHLY = [
    { month: '1월', qna: 12, contract: 5, lit: 0, total: 17, legal: 8, hr: 5, other: 4 },
    { month: '2월', qna: 15, contract: 8, lit: 1, total: 24, legal: 10, hr: 8, other: 6 },
    { month: '3월', qna: 8, contract: 3, lit: 0, total: 11, legal: 5, hr: 4, other: 2 },
    { month: '4월', qna: 22, contract: 12, lit: 2, total: 36, legal: 15, hr: 12, other: 9 },
    { month: '5월', qna: 18, contract: 7, lit: 0, total: 25, legal: 12, hr: 8, other: 5 },
    { month: '6월', qna: 25, contract: 15, lit: 1, total: 41, legal: 18, hr: 15, other: 8 },
];

export const BY_TYPE = [
    { name: '노무', label: '노무', value: 45, count: 45, pct: 45, color: '#3b82f6' },
    { name: 'IP/특허', label: 'IP/특허', value: 25, count: 25, pct: 25, color: '#f59e0b' },
    { name: '계약', label: '계약', value: 20, count: 20, pct: 20, color: '#10b981' },
    { name: '기타', label: '기타', value: 10, count: 10, pct: 10, color: '#6366f1' },
];

export const BY_GROUP = [
    { group: '경영지원', qna: 45, contract: 20, count: 65, avg: 3.5, pct: 40 },
    { group: '개발팀', qna: 15, contract: 5, count: 20, avg: 1.2, pct: 20 },
    { group: '영업팀', qna: 30, contract: 15, count: 45, avg: 2.8, pct: 30 },
    { group: '마케팅', qna: 10, contract: 2, count: 12, avg: 0.8, pct: 10 },
];

export const THIS_MONTH = {
    total: 41,
    qna: 25,
    contract: 15,
    lit: 1,
    costSaved: '3,250,000',
    avgResponse: '1시간 45분',
    satisfaction: 98,
    pending: 3
};
