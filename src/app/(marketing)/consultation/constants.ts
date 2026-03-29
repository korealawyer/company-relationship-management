import { FileText, Shield, FileSignature, Scale, Users, Briefcase, LucideIcon } from 'lucide-react';

export interface ConsultService {
    id: string;
    category: string;
    icon: LucideIcon;
    color: string;
    title: string;
    subtitle: string;
    desc: string;
    price: number;
    turnaround: string;
    includes: string[];
    popular: boolean;
}

export const SERVICES: ConsultService[] = [
    {
        id: 'contract-review',
        category: '계약·검토',
        icon: FileText,
        color: '#60a5fa',
        title: '계약서 검토',
        subtitle: '가맹계약 · 임대차 · 용역 · 근로계약',
        desc: '계약서에 숨은 독소 조항을 잡습니다. 서명 전에 확인하세요.',
        price: 150000,
        turnaround: '24시간',
        includes: ['조항별 리스크 분석', '수정 권고안', '담당 변호사 서면 의견'],
        popular: false,
    },
    {
        id: 'privacy-policy',
        category: '개인정보',
        icon: Shield,
        color: '#fcd34d',
        title: '개인정보처리방침 검토·작성',
        subtitle: '가맹점 · 온라인 쇼핑몰 · 기업 HR',
        desc: '과태료 최대 5천만원. 한 번 제대로 잡아두면 반복청구 없습니다.',
        price: 180000,
        turnaround: '48시간',
        includes: ['법정 기재사항 전체 점검', '위반 항목 수정안 제공', '처리방침 완성본 작성'],
        popular: true,
    },
    {
        id: 'content-certificate',
        category: '문서 작성',
        icon: FileSignature,
        color: '#34d399',
        title: '내용증명 작성',
        subtitle: '채권추심 · 계약 해지 · 경고장',
        desc: '법적 효력 있는 내용증명 한 장이 분쟁을 막습니다.',
        price: 100000,
        turnaround: '24시간',
        includes: ['사실 관계 정리', '법적 근거 명시', '발송 방법 안내'],
        popular: false,
    },
    {
        id: 'legal-opinion',
        category: '법률 의견',
        icon: Scale,
        color: '#a78bfa',
        title: '법률 의견서',
        subtitle: '투자 · 분쟁 · 세무 · 계약 해석',
        desc: '이 결정, 법적으로 문제없는지 변호사 의견으로 확인하세요.',
        price: 220000,
        turnaround: '48시간',
        includes: ['관련 법령 검토', '판례 중심 분석', '리스크 등급 평가', '서면 의견서 발행'],
        popular: false,
    },
    {
        id: 'labor-consult',
        category: '노무',
        icon: Users,
        color: '#fb923c',
        title: '노무 상담 (1건)',
        subtitle: '해고 · 임금체불 · 취업규칙 · 징계',
        desc: '노무 분쟁, 첫 단추를 잘못 끼우면 역으로 당합니다.',
        price: 120000,
        turnaround: '24시간',
        includes: ['사실관계 분석', '대응 전략 제시', '필요 서류 안내'],
        popular: false,
    },
    {
        id: 'regulation-review',
        category: '문서 작성',
        icon: Briefcase,
        color: '#38bdf8',
        title: '사규·취업규칙 검토',
        subtitle: '스타트업 · 프랜차이즈 본사 · 중소기업',
        desc: '직원이 늘기 전에 규정을 먼저 잡으세요. 나중에는 훨씬 복잡합니다.',
        price: 200000,
        turnaround: '48시간',
        includes: ['근로기준법 기준 전체 점검', '위반 조항 수정안', '표준 규정집 제공'],
        popular: false,
    },
];
