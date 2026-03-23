'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale, Clock, CheckCircle2, AlertTriangle, FileText,
    ChevronRight, ChevronLeft, Calendar, MapPin, User, Briefcase,
    TrendingUp, Filter, Search, ArrowUpRight, Gavel,
    ExternalLink, Loader2, Download, RefreshCw, Globe, X,
} from 'lucide-react';

// ── 대법원 사건 결과 타입 ──────────────────────────────────
interface CourtEvent {
    date: string;
    type: string;
    result: string;
    courtroom?: string;
}
interface CourtCaseResult {
    caseNumber: string;
    caseName: string;
    court: string;
    courtSection: string;
    caseType: string;
    filedDate: string;
    status: string;
    plaintiff: string;
    defendant: string;
    judge: string;
    nextDate: string | null;
    nextEvent: string | null;
    events: CourtEvent[];
}

// ── 소송 상태 타입 ──────────────────────────────────────────
type CaseStatus = 'active' | 'pending' | 'won' | 'settled' | 'closed';

interface LawCase {
    id: string;
    caseNumber: string;
    title: string;
    type: string;
    status: CaseStatus;
    court: string;
    judge: string;
    lawyer: string;
    plaintiff: string;
    defendant: string;
    filedDate: string;
    nextDate: string | null;
    nextEvent: string | null;
    amount: string;
    description: string;
    progress: number;
    updates: { date: string; content: string }[];
}

// ── 샘플 데이터 24건 (8건/페이지 × 3페이지) ──────────────
function getCases(co: string): LawCase[] {
    return [
        // ── Page 1 ──
        { id:'C001', caseNumber:'2026가합12345', title:'가맹계약 해지 손해배상 청구', type:'민사 · 손해배상', status:'active',
          court:'서울중앙지방법원 제12민사부', judge:'김영수 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'김○○ (전 가맹점주)', filedDate:'2026-01-15', nextDate:'2026-04-08', nextEvent:'제3차 변론기일',
          amount:'1억 2,000만원', description:'가맹계약 일방 해지 후 경업금지 위반 및 영업비밀 유출에 따른 손해배상 청구', progress:45,
          updates:[{date:'2026-03-10',content:'피고 측 답변서 제출 완료.'},{date:'2026-02-20',content:'제2차 변론기일 진행.'},{date:'2026-01-15',content:'소장 접수 및 사건번호 배정.'}] },

        { id:'C002', caseNumber:'2025나67890', title:'개인정보 유출 과징금 취소 소송', type:'행정 · 과징금', status:'active',
          court:'서울행정법원 제5부', judge:'박진영 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'개인정보보호위원회', filedDate:'2025-11-20', nextDate:'2026-03-25', nextEvent:'증인신문',
          amount:'3,000만원', description:'가맹점 고객 개인정보 유출 사건 관련 과징금 부과처분 취소 청구', progress:60,
          updates:[{date:'2026-03-05',content:'증인 2명 채택. 3/25 증인신문 예정.'},{date:'2026-02-10',content:'보안 감사 보고서 추가 증거 제출.'}] },

        { id:'C003', caseNumber:'2026가단34567', title:'가맹점 인테리어 하자 보수 청구', type:'민사 · 하자보수', status:'pending',
          court:'수원지방법원', judge:'미배정', lawyer:'박준호 변호사',
          plaintiff:'이○○ (가맹점주)', defendant:co, filedDate:'2026-03-01', nextDate:'2026-04-15', nextEvent:'제1차 변론기일',
          amount:'4,500만원', description:'가맹점 인테리어 시공 하자에 대한 보수비용 및 영업손실 청구', progress:10,
          updates:[{date:'2026-03-12',content:'답변서 작성 중.'},{date:'2026-03-01',content:'소장 수령.'}] },

        { id:'C004', caseNumber:'2025가합78901', title:'프랜차이즈 광고비 분담금 분쟁', type:'민사 · 부당이득', status:'won',
          court:'서울중앙지방법원', judge:'이현정 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'○○마케팅 외 3인', filedDate:'2025-06-10', nextDate:null, nextEvent:null,
          amount:'8,700만원', description:'지역 광고 대행사의 광고비 횡령 및 부당이득 반환 청구', progress:100,
          updates:[{date:'2026-02-28',content:'판결 확정. 원고 전부 승소.'},{date:'2026-01-20',content:'선고기일. 원고 승소 판결.'}] },

        { id:'C005', caseNumber:'2025노12345', title:'직원 부당해고 구제 신청', type:'노동 · 부당해고', status:'settled',
          court:'중앙노동위원회', judge:'조정위원회', lawyer:'박준호 변호사',
          plaintiff:'박○○ (전 직원)', defendant:co, filedDate:'2025-09-15', nextDate:null, nextEvent:null,
          amount:'2,400만원', description:'영업부 직원 해고 관련 부당해고 구제 신청', progress:100,
          updates:[{date:'2026-01-10',content:'조정 합의 성립. 합의금 2,400만원 지급 완료.'}] },

        { id:'C006', caseNumber:'2026가합23456', title:'상표권 침해 금지 가처분', type:'지식재산 · 상표권', status:'active',
          court:'서울중앙지방법원 제50민사부', judge:'최영희 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'○○푸드 외 2인', filedDate:'2026-02-10', nextDate:'2026-04-02', nextEvent:'심문기일',
          amount:'5억원', description:'유사 상호 및 간판 사용 업체의 상표권 침해 중지 청구', progress:35,
          updates:[{date:'2026-03-15',content:'상대방 의견서 제출.'},{date:'2026-02-10',content:'가처분 신청 접수.'}] },

        { id:'C007', caseNumber:'2025가합56789', title:'공정거래법 위반 시정명령 취소', type:'행정 · 공정거래', status:'active',
          court:'서울고등법원 제7행정부', judge:'안성호 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'공정거래위원회', filedDate:'2025-10-05', nextDate:'2026-03-28', nextEvent:'제5차 변론기일',
          amount:'1억 5,000만원', description:'가맹사업법 위반 관련 공정위 시정명령 취소 소송', progress:70,
          updates:[{date:'2026-03-10',content:'경제 분석 감정결과 법원 제출.'},{date:'2025-12-01',content:'감정인 선임.'}] },

        { id:'C008', caseNumber:'2026가단45678', title:'임대차 보증금 반환 청구', type:'민사 · 임대차', status:'pending',
          court:'서울남부지방법원', judge:'미배정', lawyer:'박준호 변호사',
          plaintiff:co, defendant:'○○부동산개발', filedDate:'2026-03-05', nextDate:'2026-04-22', nextEvent:'제1차 변론기일',
          amount:'2억 3,000만원', description:'폐업 가맹점 매장 임대차 보증금 반환 분쟁', progress:5,
          updates:[{date:'2026-03-14',content:'임대인 측 연락 시도.'},{date:'2026-03-05',content:'소장 접수.'}] },

        // ── Page 2 ──
        { id:'C009', caseNumber:'2025가합11111', title:'원자재 공급계약 채무불이행', type:'민사 · 채무불이행', status:'active',
          court:'서울중앙지방법원 제15민사부', judge:'한미영 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'○○식자재유통', filedDate:'2025-08-20', nextDate:'2026-04-10', nextEvent:'제6차 변론기일',
          amount:'2억 1,000만원', description:'원자재 공급 지연 및 품질 하자에 따른 손해배상 청구', progress:75,
          updates:[{date:'2026-03-12',content:'감정결과 원고 유리.'},{date:'2026-01-15',content:'감정인 지정.'}] },

        { id:'C010', caseNumber:'2026가합22222', title:'가맹점주 영업지역 침해 소송', type:'민사 · 영업권', status:'active',
          court:'인천지방법원 제3민사부', judge:'정수빈 판사', lawyer:'박준호 변호사',
          plaintiff:'최○○ (가맹점주)', defendant:co, filedDate:'2026-02-01', nextDate:'2026-04-05', nextEvent:'제2차 변론기일',
          amount:'9,500만원', description:'동일 영업지역 내 신규 가맹점 출점에 따른 영업권 침해 주장', progress:25,
          updates:[{date:'2026-03-08',content:'영업지역 설정 근거 자료 제출.'},{date:'2026-02-01',content:'소장 접수.'}] },

        { id:'C011', caseNumber:'2025가합33333', title:'식품위생법 위반 영업정지 취소', type:'행정 · 영업정지', status:'won',
          court:'서울행정법원 제3부', judge:'윤정아 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'서울특별시 강남구청', filedDate:'2025-05-10', nextDate:null, nextEvent:null,
          amount:'—', description:'가맹점 위생점검 결과 영업정지 15일 처분 취소 소송', progress:100,
          updates:[{date:'2025-12-15',content:'원고 승소 판결 확정. 영업정지 취소.'},{date:'2025-09-20',content:'선고기일.'}] },

        { id:'C012', caseNumber:'2026가단44444', title:'배달앱 수수료 부당인상 이의', type:'민사 · 부당이득', status:'pending',
          court:'서울중앙지방법원', judge:'미배정', lawyer:'박준호 변호사',
          plaintiff:co, defendant:'○○딜리버리 주식회사', filedDate:'2026-03-10', nextDate:'2026-05-01', nextEvent:'제1차 변론기일',
          amount:'3억 2,000만원', description:'배달 플랫폼 수수료 일방 인상에 따른 부당이득 반환 청구', progress:3,
          updates:[{date:'2026-03-10',content:'소장 접수 완료.'}] },

        { id:'C013', caseNumber:'2025가합55555', title:'가맹점 로열티 미납 청구', type:'민사 · 대여금', status:'won',
          court:'대전지방법원 제2민사부', judge:'서동욱 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'정○○ 외 5인', filedDate:'2025-04-01', nextDate:null, nextEvent:null,
          amount:'1억 8,500만원', description:'가맹점주 5인 로열티 및 광고분담금 미납분 청구 소송', progress:100,
          updates:[{date:'2026-01-30',content:'전부 승소. 강제집행 개시.'},{date:'2025-11-10',content:'선고기일.'}] },

        { id:'C014', caseNumber:'2025가합66666', title:'퇴직금 지급 청구', type:'노동 · 퇴직금', status:'settled',
          court:'서울남부지방법원', judge:'조정위원회', lawyer:'박준호 변호사',
          plaintiff:'한○○ 외 3인 (전 직원)', defendant:co, filedDate:'2025-07-20', nextDate:null, nextEvent:null,
          amount:'4,200만원', description:'본사 구조조정에 따른 퇴직 직원 퇴직금 및 미지급 수당 청구', progress:100,
          updates:[{date:'2025-12-05',content:'합의 완료. 합의금 4,200만원 분납 합의.'}] },

        { id:'C015', caseNumber:'2026가합77777', title:'정보공개서 허위기재 과태료 이의', type:'행정 · 과태료', status:'active',
          court:'서울행정법원 제8부', judge:'배지훈 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'공정거래위원회', filedDate:'2026-01-20', nextDate:'2026-04-18', nextEvent:'제3차 변론기일',
          amount:'5,000만원', description:'정보공개서 매출액 기재 오류 관련 과태료 부과처분 취소', progress:40,
          updates:[{date:'2026-03-05',content:'회계 감정 결과 제출.'},{date:'2026-01-20',content:'소장 접수.'}] },

        { id:'C016', caseNumber:'2025가합88888', title:'가맹점 식중독 사고 구상금', type:'민사 · 구상금', status:'settled',
          court:'부산지방법원 제5민사부', judge:'강민수 판사', lawyer:'박준호 변호사',
          plaintiff:co, defendant:'○○식품 (납품업체)', filedDate:'2025-03-15', nextDate:null, nextEvent:null,
          amount:'6,300만원', description:'가맹점 식중독 사고 피해 보상금 기지급분 납품업체 구상 청구', progress:100,
          updates:[{date:'2025-10-20',content:'조정 합의. 구상금 5,800만원 수령.'},{date:'2025-07-10',content:'조정기일.'}] },

        // ── Page 3 ──
        { id:'C017', caseNumber:'2026가합99999', title:'특허 침해 손해배상 청구', type:'지식재산 · 특허', status:'active',
          court:'특허법원', judge:'오영진 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'○○테크 주식회사', filedDate:'2026-02-20', nextDate:'2026-05-10', nextEvent:'기술설명회',
          amount:'15억원', description:'자동화 조리 시스템 특허 침해에 대한 손해배상 청구', progress:15,
          updates:[{date:'2026-03-10',content:'기술설명회 일정 확정.'},{date:'2026-02-20',content:'소장 접수.'}] },

        { id:'C018', caseNumber:'2025가합10101', title:'물류센터 화재 보험금 청구', type:'민사 · 보험금', status:'active',
          court:'서울중앙지방법원 제20민사부', judge:'임지현 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'○○화재해상보험', filedDate:'2025-09-01', nextDate:'2026-04-12', nextEvent:'감정결과 변론',
          amount:'12억원', description:'중앙 물류센터 화재 사고 관련 보험금 지급 거절에 대한 소송', progress:55,
          updates:[{date:'2026-03-01',content:'화재 원인 감정결과 접수.'},{date:'2025-12-10',content:'감정인 선임.'}] },

        { id:'C019', caseNumber:'2026가단20202', title:'근로계약 위반 손해배상', type:'노동 · 근로계약', status:'pending',
          court:'서울동부지방법원', judge:'미배정', lawyer:'박준호 변호사',
          plaintiff:'윤○○ (전 점장)', defendant:co, filedDate:'2026-03-12', nextDate:'2026-05-08', nextEvent:'제1차 변론기일',
          amount:'7,800만원', description:'가맹점 점장 근로계약 위반 및 부당전보에 따른 손해배상 청구', progress:3,
          updates:[{date:'2026-03-12',content:'소장 수령. 사건 검토 중.'}] },

        { id:'C020', caseNumber:'2025가합30303', title:'세무조사 부과처분 취소', type:'행정 · 세무', status:'won',
          court:'서울행정법원 제10부', judge:'김태희 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'국세청 서울지방국세청', filedDate:'2025-03-01', nextDate:null, nextEvent:null,
          amount:'7억 2,000만원', description:'법인세 추징 부과처분 취소 소송. 이전가격 산정 방법 다툼', progress:100,
          updates:[{date:'2025-11-30',content:'전부 승소. 추징세액 환급 완료.'},{date:'2025-09-15',content:'선고기일.'}] },

        { id:'C021', caseNumber:'2026가합40404', title:'영업비밀 유출 가처분', type:'민사 · 영업비밀', status:'active',
          court:'서울중앙지방법원 제45민사부', judge:'나현수 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'전○○ (전 임원) 외 2인', filedDate:'2026-03-01', nextDate:'2026-04-03', nextEvent:'심문기일',
          amount:'10억원', description:'퇴사 임원의 경쟁사 이직 및 영업비밀(레시피DB) 유출 금지 가처분', progress:20,
          updates:[{date:'2026-03-10',content:'가처분 심문기일 지정.'},{date:'2026-03-01',content:'가처분 신청.'}] },

        { id:'C022', caseNumber:'2025가합50505', title:'하도급법 위반 과징금 취소', type:'행정 · 하도급', status:'settled',
          court:'서울고등법원 제3행정부', judge:'홍성준 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'공정거래위원회', filedDate:'2025-06-01', nextDate:null, nextEvent:null,
          amount:'2억원', description:'인테리어 하도급 대금 미지급 관련 과징금 부과 처분 취소 소송', progress:100,
          updates:[{date:'2026-02-10',content:'조정 합의. 과징금 50% 감경.'},{date:'2025-11-20',content:'조정기일.'}] },

        { id:'C023', caseNumber:'2025가합60606', title:'임직원 횡령 형사고소', type:'형사 · 횡령', status:'active',
          court:'서울중앙지방검찰청', judge:'담당: 3차장검사실', lawyer:'박준호 변호사',
          plaintiff:co, defendant:'장○○ (전 재무팀장)', filedDate:'2025-12-01', nextDate:'2026-04-20', nextEvent:'피의자 소환조사',
          amount:'3억 5,000만원', description:'재무팀장의 법인카드 사적 사용 및 허위 거래처 횡령 고소', progress:30,
          updates:[{date:'2026-03-05',content:'회계 포렌식 보고서 검찰 제출.'},{date:'2025-12-01',content:'고소장 접수.'}] },

        { id:'C024', caseNumber:'2026가합70707', title:'가맹사업 정보공개서 등록 거부 취소', type:'행정 · 등록거부', status:'pending',
          court:'서울행정법원', judge:'미배정', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'공정거래위원회', filedDate:'2026-03-15', nextDate:'2026-05-15', nextEvent:'제1차 변론기일',
          amount:'—', description:'신규 브랜드 정보공개서 등록 거부처분 취소 소송', progress:2,
          updates:[{date:'2026-03-15',content:'소장 접수.'}] },
    ];
}

// ── 상태 배지 ──────────────────────────────────────────────
const STATUS_MAP: Record<CaseStatus, { label: string; color: string; bg: string }> = {
    active: { label: '진행 중', color: '#3b82f6', bg: '#eff6ff' },
    pending: { label: '준비 중', color: '#f59e0b', bg: '#fffbeb' },
    won: { label: '승소', color: '#22c55e', bg: '#f0fdf4' },
    settled: { label: '합의', color: '#8b5cf6', bg: '#f5f3ff' },
    closed: { label: '종결', color: '#6b7280', bg: '#f9fafb' },
};

// ── KPI 카드 ───────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color }: {
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    label: string; value: string | number; sub: string; color: string;
}) {
    return (
        <div className="p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}15` }}>
                <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="text-2xl font-black mb-0.5" style={{ color }}>{value}</div>
            <div className="text-xs font-bold" style={{ color: '#6b7280' }}>{label}</div>
            <div className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>{sub}</div>
        </div>
    );
}

// ── 메인 페이지 ────────────────────────────────────────────
export default function CasesPage() {
    const [selectedCase, setSelectedCase] = useState<LawCase | null>(null);
    const [filterStatus, setFilterStatus] = useState<CaseStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // ── 세션에서 회사명 읽기 ────────────────────────────────
    const [companyName, setCompanyName] = useState('');
    React.useEffect(() => {
        try {
            const raw = localStorage.getItem('ibs_auth_v1');
            if (raw) {
                const s = JSON.parse(raw);
                if (s?.companyName) setCompanyName(s.companyName);
            }
        } catch { /* ignore */ }
    }, []);

    const CASES = getCases(companyName || '(주)기업명');

    // ── 대법원 사건검색 상태 ────────────────────────────────
    const [courtSearchOpen, setCourtSearchOpen] = useState(true);
    const [courtQuery, setCourtQuery] = useState('');
    const [courtLoading, setCourtLoading] = useState(false);
    const [courtResult, setCourtResult] = useState<CourtCaseResult | null>(null);
    const [courtError, setCourtError] = useState('');
    const [courtFetchedAt, setCourtFetchedAt] = useState('');

    const searchCourt = async () => {
        if (!courtQuery.trim()) return;
        setCourtLoading(true);
        setCourtError('');
        setCourtResult(null);
        try {
            const res = await fetch('/api/court-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caseNumber: courtQuery.trim() }),
            });
            const json = await res.json();
            if (!res.ok) {
                setCourtError(json.error || '검색에 실패했습니다.');
            } else {
                setCourtResult(json.data);
                setCourtFetchedAt(new Date(json.fetchedAt).toLocaleString('ko-KR'));
            }
        } catch {
            setCourtError('서버 연결에 실패했습니다.');
        } finally {
            setCourtLoading(false);
        }
    };

    // ── 페이지네이션 ────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 8;

    const filtered = CASES.filter(c => {
        if (filterStatus !== 'all' && c.status !== filterStatus) return false;
        if (searchQuery && !c.title.includes(searchQuery) && !c.caseNumber.includes(searchQuery)) return false;
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // 필터/검색 변경 시 페이지 리셋
    React.useEffect(() => { setCurrentPage(1); }, [filterStatus, searchQuery]);

    const activeCount = CASES.filter(c => c.status === 'active').length;
    const wonCount = CASES.filter(c => c.status === 'won').length;
    const totalAmount = '58억 4,100만원';

    return (
        <div className="min-h-screen pt-20 pb-12" style={{ background: '#f8f7f4' }}>
            <div className="max-w-6xl mx-auto px-4">

                {/* 헤더 */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <Scale className="w-5 h-5" style={{ color: '#c9a84c' }} />
                                <span className="text-xs font-bold" style={{ color: '#c9a84c' }}>{companyName || '기업명'}</span>
                            </div>
                            <h1 className="text-2xl font-black" style={{ color: '#111827' }}>
                                소송 관리 <span style={{ color: '#c9a84c' }}>대시보드</span>
                            </h1>
                            <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
                                진행 중 {activeCount}건 · 총 {CASES.length}건 · 담당: 김수현·박준호 변호사
                            </p>
                        </div>
                        <button onClick={() => setCourtSearchOpen(!courtSearchOpen)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-md"
                            style={courtSearchOpen
                                ? { background: '#111827', color: '#fff' }
                                : { background: '#fff', color: '#111827', border: '1px solid #e8e5de' }
                            }>
                            <Globe className="w-4 h-4" style={{ color: courtSearchOpen ? '#c9a84c' : '#3b82f6' }} />
                            대법원 사건검색
                        </button>
                    </div>
                </motion.div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <KpiCard icon={Briefcase} label="진행 중 소송" value={activeCount} sub="변론기일 예정 2건" color="#3b82f6" />
                    <KpiCard icon={CheckCircle2} label="승소/합의" value={`${wonCount + 1}건`} sub="승소율 66.7%" color="#22c55e" />
                    <KpiCard icon={TrendingUp} label="청구/회수 총액" value={totalAmount} sub="확정 회수 8,700만원" color="#c9a84c" />
                    <KpiCard icon={Calendar} label="다음 기일" value="3/25" sub="행정법원 증인신문" color="#f59e0b" />
                </div>

                {/* ── 대법원 나의사건검색 패널 ── */}
                <AnimatePresence>
                    {courtSearchOpen && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="mb-6 overflow-hidden">
                            <div className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #dde5f0' }}>
                                {/* 헤더 */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)' }}>
                                            <Globe className="w-5 h-5" style={{ color: '#fff' }} />
                                        </div>
                                        <div>
                                            <p className="font-black text-sm" style={{ color: '#111827' }}>대법원 나의사건검색</p>
                                            <p className="text-[10px]" style={{ color: '#9ca3af' }}>safind.scourt.go.kr 연동 · 실시간 크롤링</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setCourtSearchOpen(false)}>
                                        <X className="w-4 h-4" style={{ color: '#9ca3af' }} />
                                    </button>
                                </div>

                                {/* 검색 바 */}
                                <div className="flex gap-2 mb-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
                                        <input value={courtQuery}
                                            onChange={e => setCourtQuery(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && searchCourt()}
                                            placeholder="사건번호 입력 (예: 2026가합12345)"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                                            style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827' }} />
                                    </div>
                                    <button onClick={searchCourt} disabled={courtLoading || !courtQuery.trim()}
                                        className="px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                                        style={{ background: '#1e3a8a', color: '#fff', opacity: courtLoading || !courtQuery.trim() ? 0.5 : 1 }}>
                                        {courtLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                                        {courtLoading ? '크롤링 중...' : '사건 조회'}
                                    </button>
                                </div>

                                {/* 빠른 검색 칩 */}
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    <span className="text-[10px] font-bold" style={{ color: '#9ca3af' }}>등록 사건:</span>
                                    {['2026가합12345', '2025나67890', '2026가단34567', '2025가합78901'].map(cn => (
                                        <button key={cn} onClick={() => { setCourtQuery(cn); }}
                                            className="text-[10px] px-2 py-0.5 rounded-lg font-mono transition-all hover:opacity-80"
                                            style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #dbeafe' }}>
                                            {cn}
                                        </button>
                                    ))}
                                </div>

                                {/* 에러 */}
                                {courtError && (
                                    <div className="p-3 rounded-xl flex items-center gap-2 mb-4"
                                        style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#dc2626' }} />
                                        <p className="text-xs" style={{ color: '#dc2626' }}>{courtError}</p>
                                    </div>
                                )}

                                {/* 결과 */}
                                {courtResult && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />
                                            <span className="text-xs font-bold" style={{ color: '#22c55e' }}>크롤링 성공</span>
                                            <span className="text-[10px]" style={{ color: '#9ca3af' }}>{courtFetchedAt} 기준</span>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            {/* 사건 정보 */}
                                            <div className="p-4 rounded-xl" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                                                <p className="font-black text-sm mb-3" style={{ color: '#111827' }}>📋 사건 정보</p>
                                                {[
                                                    { k: '사건번호', v: courtResult.caseNumber },
                                                    { k: '사건명', v: courtResult.caseName },
                                                    { k: '법원', v: `${courtResult.court} ${courtResult.courtSection}` },
                                                    { k: '사건유형', v: courtResult.caseType },
                                                    { k: '접수일', v: courtResult.filedDate },
                                                    { k: '진행상태', v: courtResult.status },
                                                    { k: '재판장', v: courtResult.judge },
                                                    { k: '원고', v: courtResult.plaintiff },
                                                    { k: '피고', v: courtResult.defendant },
                                                ].map(row => (
                                                    <div key={row.k} className="flex justify-between py-1.5"
                                                        style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                        <span className="text-[11px]" style={{ color: '#6b7280' }}>{row.k}</span>
                                                        <span className="text-[11px] font-bold text-right max-w-[60%]" style={{ color: '#111827' }}>{row.v}</span>
                                                    </div>
                                                ))}
                                                {courtResult.nextDate && (
                                                    <div className="mt-3 p-2.5 rounded-lg flex items-center gap-2"
                                                        style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                                                        <Calendar className="w-3.5 h-3.5" style={{ color: '#92400e' }} />
                                                        <span className="text-[11px] font-bold" style={{ color: '#92400e' }}>
                                                            다음 기일: {courtResult.nextDate} ({courtResult.nextEvent})
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 기일 내역 */}
                                            <div className="p-4 rounded-xl" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                                                <p className="font-black text-sm mb-3" style={{ color: '#111827' }}>📅 기일/결과 내역</p>
                                                <div className="space-y-0">
                                                    {courtResult.events.map((ev, i) => (
                                                        <div key={i} className="flex gap-3">
                                                            <div className="flex flex-col items-center">
                                                                <div className="w-2 h-2 rounded-full mt-1.5"
                                                                    style={{ background: i === 0 ? '#3b82f6' : '#d1d5db' }} />
                                                                {i < courtResult.events.length - 1 && (
                                                                    <div className="w-px flex-1 mt-0.5" style={{ background: '#e5e7eb' }} />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 pb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-mono" style={{ color: '#9ca3af' }}>{ev.date}</span>
                                                                    {ev.courtroom && (
                                                                        <span className="text-[9px] px-1.5 py-0.5 rounded"
                                                                            style={{ background: '#eff6ff', color: '#3b82f6' }}>{ev.courtroom}</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs font-bold" style={{ color: '#111827' }}>{ev.type}</p>
                                                                <p className="text-[10px]" style={{ color: '#6b7280' }}>{ev.result}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 데이터 출처 */}
                                        <div className="flex items-center justify-between mt-4 p-3 rounded-xl"
                                            style={{ background: '#eff6ff', border: '1px solid #dbeafe' }}>
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} />
                                                <span className="text-[10px]" style={{ color: '#1e40af' }}>
                                                    출처: 대법원 사건검색시스템 (safind.scourt.go.kr)
                                                </span>
                                            </div>
                                            <a href="https://safind.scourt.go.kr" target="_blank" rel="noopener noreferrer"
                                                className="text-[10px] flex items-center gap-1 font-bold" style={{ color: '#3b82f6' }}>
                                                원본 보기 <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 필터 + 검색 */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                    <div className="flex gap-1 p-1 rounded-xl flex-1" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                        {([
                            { key: 'all', label: '전체' },
                            { key: 'active', label: '진행 중' },
                            { key: 'pending', label: '준비 중' },
                            { key: 'won', label: '승소' },
                            { key: 'settled', label: '합의' },
                        ] as { key: CaseStatus | 'all'; label: string }[]).map(f => (
                            <button key={f.key} onClick={() => setFilterStatus(f.key)}
                                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                                style={filterStatus === f.key
                                    ? { background: '#111827', color: '#fff' }
                                    : { color: '#6b7280' }
                                }>
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
                        <input
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="사건번호 · 사건명 검색"
                            className="pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none w-full sm:w-56"
                            style={{ background: '#fff', border: '1px solid #e8e5de', color: '#111827' }}
                        />
                    </div>
                </div>

                {/* 소송 리스트 + 디테일 */}
                <div className="grid lg:grid-cols-5 gap-5">

                    {/* 리스트 */}
                    <div className={`space-y-3 ${selectedCase ? 'lg:col-span-2' : 'lg:col-span-5'}`}>
                        {paginated.map((c, i) => {
                            const s = STATUS_MAP[c.status];
                            const isSelected = selectedCase?.id === c.id;
                            return (
                                <motion.button key={c.id}
                                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => setSelectedCase(isSelected ? null : c)}
                                    className="w-full text-left p-5 rounded-2xl transition-all hover:shadow-md"
                                    style={{
                                        background: isSelected ? '#111827' : '#fff',
                                        border: `1px solid ${isSelected ? '#111827' : '#e8e5de'}`,
                                    }}>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                                style={{ background: isSelected ? `${s.color}30` : s.bg, color: s.color }}>
                                                {s.label}
                                            </span>
                                            <span className="text-[10px] font-mono"
                                                style={{ color: isSelected ? '#9ca3af' : '#9ca3af' }}>
                                                {c.caseNumber}
                                            </span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 flex-shrink-0"
                                            style={{ color: isSelected ? '#9ca3af' : '#d1d5db' }} />
                                    </div>
                                    <p className="font-bold text-sm mb-1"
                                        style={{ color: isSelected ? '#fff' : '#111827' }}>
                                        {c.title}
                                    </p>
                                    <p className="text-xs mb-3"
                                        style={{ color: isSelected ? '#9ca3af' : '#6b7280' }}>
                                        {c.type} · {c.lawyer}
                                    </p>
                                    {/* 진행률 바 */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 rounded-full"
                                            style={{ background: isSelected ? 'rgba(255,255,255,0.1)' : '#f3f4f6' }}>
                                            <div className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${c.progress}%`,
                                                    background: c.status === 'won' ? '#22c55e' : c.status === 'settled' ? '#8b5cf6' : 'linear-gradient(90deg,#c9a84c,#e8c87a)',
                                                }} />
                                        </div>
                                        <span className="text-[10px] font-bold"
                                            style={{ color: isSelected ? '#c9a84c' : '#9ca3af' }}>
                                            {c.progress}%
                                        </span>
                                    </div>
                                    {c.nextDate && (
                                        <div className="flex items-center gap-1.5 mt-3 text-[10px]"
                                            style={{ color: isSelected ? '#fbbf24' : '#f59e0b' }}>
                                            <Calendar className="w-3 h-3" />
                                            다음 기일: {c.nextDate} ({c.nextEvent})
                                        </div>
                                    )}
                                </motion.button>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div className="text-center py-16 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                <Scale className="w-10 h-10 mx-auto mb-3" style={{ color: '#d1d5db' }} />
                                <p className="text-sm font-bold" style={{ color: '#9ca3af' }}>검색 결과가 없습니다</p>
                            </div>
                        )}

                        {/* 페이지네이션 */}
                        {filtered.length > PAGE_SIZE && (
                            <div className="flex items-center justify-between pt-4 mt-2 px-1"
                                style={{ borderTop: '1px solid #e8e5de' }}>
                                <span className="text-xs" style={{ color: '#9ca3af' }}>
                                    총 {filtered.length}건 중 {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filtered.length)}건
                                </span>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg transition-all disabled:opacity-30"
                                        style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                        <ChevronLeft className="w-4 h-4" style={{ color: '#6b7280' }} />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                        <button key={p} onClick={() => setCurrentPage(p)}
                                            className="w-9 h-9 rounded-lg text-xs font-bold transition-all"
                                            style={currentPage === p
                                                ? { background: '#111827', color: '#fff' }
                                                : { background: '#fff', color: '#6b7280', border: '1px solid #e8e5de' }
                                            }>
                                            {p}
                                        </button>
                                    ))}
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg transition-all disabled:opacity-30"
                                        style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                        <ChevronRight className="w-4 h-4" style={{ color: '#6b7280' }} />
                                    </button>
                                </div>
                                <span className="text-xs font-bold" style={{ color: '#c9a84c' }}>
                                    {currentPage} / {totalPages} 페이지
                                </span>
                            </div>
                        )}
                    </div>

                    {/* 디테일 패널 */}
                    <AnimatePresence>
                        {selectedCase && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                className="lg:col-span-3 space-y-4">
                                {/* 사건 상세 */}
                                <div className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-xs font-mono mb-1" style={{ color: '#9ca3af' }}>{selectedCase.caseNumber}</p>
                                            <h2 className="text-lg font-black" style={{ color: '#111827' }}>{selectedCase.title}</h2>
                                        </div>
                                        <span className="text-xs font-black px-3 py-1 rounded-full"
                                            style={{ background: STATUS_MAP[selectedCase.status].bg, color: STATUS_MAP[selectedCase.status].color }}>
                                            {STATUS_MAP[selectedCase.status].label}
                                        </span>
                                    </div>
                                    <p className="text-sm mb-5" style={{ color: '#6b7280' }}>{selectedCase.description}</p>

                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { icon: MapPin, label: '관할법원', value: selectedCase.court },
                                            { icon: Gavel, label: '재판부', value: selectedCase.judge },
                                            { icon: User, label: '원고', value: selectedCase.plaintiff },
                                            { icon: User, label: '피고', value: selectedCase.defendant },
                                            { icon: Calendar, label: '접수일', value: selectedCase.filedDate },
                                            { icon: TrendingUp, label: '청구금액', value: selectedCase.amount },
                                        ].map(item => (
                                            <div key={item.label} className="p-3 rounded-xl" style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <item.icon className="w-3 h-3" style={{ color: '#9ca3af' }} />
                                                    <span className="text-[10px] font-bold" style={{ color: '#9ca3af' }}>{item.label}</span>
                                                </div>
                                                <p className="text-xs font-bold" style={{ color: '#111827' }}>{item.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 다음 기일 */}
                                {selectedCase.nextDate && (
                                    <div className="p-5 rounded-2xl flex items-center gap-4" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#fef3c7' }}>
                                            <Calendar className="w-5 h-5" style={{ color: '#92400e' }} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold" style={{ color: '#92400e' }}>다음 기일</p>
                                            <p className="text-sm font-black" style={{ color: '#111827' }}>{selectedCase.nextDate}</p>
                                            <p className="text-xs" style={{ color: '#92400e' }}>{selectedCase.nextEvent}</p>
                                        </div>
                                    </div>
                                )}

                                {/* 진행 경과 */}
                                <div className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                    <h3 className="font-black text-sm mb-4" style={{ color: '#111827' }}>📋 진행 경과</h3>
                                    <div className="space-y-4">
                                        {selectedCase.updates.map((u, i) => (
                                            <div key={i} className="flex gap-3">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-2.5 h-2.5 rounded-full mt-1.5"
                                                        style={{ background: i === 0 ? '#3b82f6' : '#d1d5db' }} />
                                                    {i < selectedCase.updates.length - 1 && (
                                                        <div className="w-px flex-1 mt-1" style={{ background: '#e5e7eb' }} />
                                                    )}
                                                </div>
                                                <div className="flex-1 pb-4">
                                                    <p className="text-[10px] font-mono mb-1" style={{ color: '#9ca3af' }}>{u.date}</p>
                                                    <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>{u.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ── 담당 변호사 & 자동 진행 알림 ── */}
                                <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                    {/* 변호사 헤더 */}
                                    <div className="p-4 flex items-center gap-3" style={{ background: '#111827' }}>
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black tracking-tight"
                                            style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#111827' }}>
                                            IBS
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-white">IBS 법률사무소</p>
                                            <p className="text-[10px]" style={{ color: '#9ca3af' }}>사건 진행 자동 알림 · 02-598-8518</p>
                                        </div>
                                        <div className="px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ background: 'rgba(34,197,94,0.15)' }}>
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
                                            <span className="text-[10px] font-bold" style={{ color: '#22c55e' }}>자동 알림 ON</span>
                                        </div>
                                    </div>

                                    {/* 자동 진행 알림 목록 */}
                                    <div className="p-4 space-y-2.5">
                                        <p className="text-[10px] font-bold mb-3" style={{ color: '#9ca3af' }}>
                                            🔔 최근 자동 알림 (변호사 → 의뢰인)
                                        </p>
                                        {[
                                            { time: '오늘 09:00', type: 'action', icon: '📋',
                                              text: '다음 변론기일(4/8) 준비를 위해 관련 판례 3건을 추가 분석 중입니다.' },
                                            { time: '03.15 17:30', type: 'doc', icon: '📎',
                                              text: '상대방 의견서 접수. 검토 후 대응 준비서면 초안을 문서함에 공유드릴 예정입니다.' },
                                            { time: '03.12 14:00', type: 'alert', icon: '⚡',
                                              text: '피고 측 답변서 제출 완료. 핵심 쟁점: 경업금지 조항 유효성 — 우리 입장 유리합니다.' },
                                            { time: '03.10 10:00', type: 'schedule', icon: '📅',
                                              text: '제3차 변론기일이 2026-04-08로 지정되었습니다. 별도 출석은 불필요합니다.' },
                                        ].map((n, i) => (
                                            <motion.div key={i}
                                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.08 }}
                                                className="p-3 rounded-xl flex gap-2.5"
                                                style={{ background: i === 0 ? '#fffbeb' : '#f9fafb', border: `1px solid ${i === 0 ? '#fde68a' : '#f3f4f6'}` }}>
                                                <span className="text-sm mt-0.5">{n.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>{n.text}</p>
                                                    <p className="text-[9px] mt-1" style={{ color: '#9ca3af' }}>{n.time}</p>
                                                </div>
                                                {i === 0 && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md h-fit flex-shrink-0"
                                                        style={{ background: '#fef3c7', color: '#92400e' }}>NEW</span>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* 하단 안내 */}
                                    <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid #f3f4f6', background: '#fafaf8' }}>
                                        <p className="text-[10px]" style={{ color: '#9ca3af' }}>
                                            진행 상황이 변경되면 자동으로 알림을 보내드립니다
                                        </p>
                                        <a href="tel:025551234" className="px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                            style={{ background: '#f3f4f6', color: '#6b7280', border: '1px solid #e8e5de' }}>
                                            📞 긴급 연락
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}