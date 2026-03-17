'use client';
import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    AlertTriangle, ChevronDown, ChevronUp,
    CheckCircle2, ArrowRight, Scale, FileWarning,
    Eye, BookOpen, ExternalLink, AlertCircle, FileText,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { store } from '@/lib/mockStore';

/* ── 리스크 레벨 ──────────────────────────────────────── */
const RISK: Record<string, { color: string; bg: string; border: string; label: string; dot: string }> = {
    HIGH:   { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: '고위험', dot: '#ef4444' },
    MEDIUM: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: '주의',   dot: '#f59e0b' },
    LOW:    { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: '저위험', dot: '#3b82f6' },
};

/* ── 이슈 타입 ────────────────────────────────────────── */
interface Issue {
    id: string; num: string; title: string;
    level: 'HIGH' | 'MEDIUM' | 'LOW';
    original: string; lawyerOpinion: string; scenario: string;
    lawRef: string; penalty: string; recommendation: string;
}

/* ── 10년차 변호사 문체 이슈 데이터 ───────────────────── */
const ISSUES: Issue[] = [
    {
        id: '1', num: '제1조', title: '수집하는 개인정보 항목', level: 'HIGH',
        original:
            `【필수】이름, 생년월일, 성별, 로그인ID, 비밀번호, 비밀번호 질문과 답변, 자택전화번호, 자택주소, 휴대전화번호, 이메일, 직업, 회사명, 회사전화번호`,
        lawyerOpinion:
            `개인정보보호법 제16조 제1항은 "개인정보처리자는 사상·신념, 노동조합·정당의 가입·탈퇴 등에 관한 정보 등 목적 달성에 필요한 최소한의 개인정보를 수집하여야 한다"고 규정하고 있습니다.\n\n현행 방침은 「직업, 회사명, 회사전화번호, 자택전화번호」 등 서비스 제공에 직접적 관련이 없는 항목을 '필수'로 분류하고 있어 과다수집에 해당할 소지가 높습니다. 특히 「비밀번호 질문과 답변」 항목은 평문 저장으로 오인될 수 있어 제29조(안전조치의무) 위반 추정의 근거가 됩니다.\n\n필수 항목과 선택 항목의 분리가 형식적으로도 이루어지지 않았으며, 이는 개인정보보호위원회의 정기 점검 시 최우선 지적 대상입니다.`,
        scenario:
            `개인정보보호위원회 정기감사 시 과다수집 항목이 적발되면 즉시 시정명령이 내려집니다. 이후 30일 내 미시정 시 과태료가 부과되며, 최근 3년간 유사 사례에서 프랜차이즈 기업 평균 과태료는 2,800만원입니다. 또한 위반사실이 공표되어 가맹점주·소비자 신뢰 하락으로 이어질 수 있습니다.`,
        lawRef: '개인정보보호법 제16조(개인정보의 수집 제한), 제29조(안전조치의무)',
        penalty: '과태료 최대 5,000만원 + 시정명령',
        recommendation: `필수 항목을 「이름, 로그인ID, 비밀번호, 휴대전화번호, 이메일」로 한정하고, 나머지는 선택 항목으로 분리하여야 합니다.`,
    },
    {
        id: '2', num: '제4조', title: '개인정보의 제3자 제공', level: 'HIGH',
        original:
            `당사는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 법령에 의하거나 이용자의 동의가 있는 경우 예외로 합니다.`,
        lawyerOpinion:
            `개인정보보호법 제17조 제1항은 제3자 제공 시 "제공받는 자, 제공 목적, 제공 항목, 보유·이용 기간"을 정보주체에게 알리고 동의를 받도록 규정하고 있습니다.\n\n그러나 귀사는 실무적으로 PG사(결제대행), 배달플랫폼, 광고 플랫폼(Meta, Google Ads) 등에 고객 정보를 전달하고 있으면서도 처리방침에 이를 전혀 명시하지 않고 있습니다. 이는 "제3자 제공 사실의 은폐"로 해석될 여지가 있어, 단순 미기재보다 중한 행정적 제재가 예상됩니다.\n\n특히 개인정보보호위원회는 2024년 이후 프랜차이즈 업종에 대한 제3자 제공 실태 집중 점검을 실시하고 있어, 위험도가 매우 높습니다.`,
        scenario:
            `정보주체의 민원 또는 정기감사 시 실제 제3자 제공 현황과 처리방침 간의 불일치가 확인되면, 미동의 제공으로 간주됩니다. 최근 프랜차이즈 업계 유사 사례에서 매출액의 0.5~1.5% 수준 과징금이 부과되었으며, 해당 사실은 개인정보보호위원회 홈페이지에 6개월간 공표됩니다.`,
        lawRef: '개인정보보호법 제17조(개인정보의 제공), 제75조(과태료)',
        penalty: '과징금 매출액 3% 이하 + 시정명령 + 위반사실 공표',
        recommendation: `실제 제3자 제공 현황을 조사하여 제공받는 자, 목적, 항목, 보유기간을 표 형태로 명시하여야 합니다.`,
    },
    {
        id: '3', num: '제2조', title: '개인정보 수집·이용 목적', level: 'MEDIUM',
        original: `- 서비스 제공 및 계약 이행\n- 회원 관리 및 본인 확인\n- 마케팅 및 광고 활용\n- 통계 분석`,
        lawyerOpinion:
            `개인정보보호법 제15조 제1항 제1호는 정보주체의 동의를 받을 때 수집·이용 목적을 명확히 알려야 한다고 규정합니다.\n\n현행 방침에서 "마케팅 및 광고 활용"을 필수 수집·이용 목적에 포함시킨 것은 문제입니다. 같은 법 제22조 제4항에 따라, 재화 또는 서비스의 홍보·판매 권유 등을 위한 개인정보 처리는 반드시 별도 동의를 받아야 합니다.\n\n현재 형태로는 필수 동의에 마케팅을 끼워넣은 "묻지마 동의(bundled consent)"로 판단될 수 있으며, 이는 동의 자체의 유효성을 훼손할 수 있습니다.`,
        scenario:
            `별도 동의 없이 마케팅이 진행될 경우, 정보주체가 스팸 신고를 하면 방송통신위원회 또는 개인정보보호위원회가 조사에 착수합니다. 동의 절차 흠결이 확인되면 해당 마케팅 활동 전체가 불법으로 간주될 수 있습니다.`,
        lawRef: '개인정보보호법 제15조(개인정보의 수집·이용), 제22조(동의를 받는 방법)',
        penalty: '과태료 3,000만원 이하',
        recommendation: `마케팅 목적을 필수 이용 목적에서 분리하고, 별도의 선택 동의 절차를 마련하여야 합니다.`,
    },
    {
        id: '4', num: '제3조', title: '개인정보 보유·이용 기간', level: 'MEDIUM',
        original:
            `당사는 개인정보 수집 및 이용 목적 달성 시 지체 없이 파기합니다.\n다만, 관계법령에 의해 보존할 경우: 계약 기록 5년, 불만 기록 3년`,
        lawyerOpinion:
            `개인정보보호법 제21조 제1항은 "보유기간의 경과, 처리 목적 달성 등 그 개인정보가 불필요하게 되었을 때에는 지체 없이 그 개인정보를 파기하여야 한다"고 규정합니다.\n\n현행 방침은 쿠키의 삭제 주기, 비활성 계정(장기 미이용자)의 처리 기준, 마케팅 동의 철회 후 정보 보유 기간 등 실무적으로 중요한 사항을 전혀 명시하지 않고 있습니다.\n\n특히 장기 미이용자(1년 이상 미접속) 계정의 개인정보는 별도 분리 저장하거나 파기하여야 하는데(정보통신망법 제29조), 이에 대한 기준이 없어 불필요한 개인정보를 장기 보관하는 결과를 초래하고 있습니다.`,
        scenario:
            `비활성 계정에서 개인정보 유출 사고가 발생할 경우, 불필요한 정보를 파기하지 않은 귀책사유가 더해져 손해배상 책임이 가중됩니다. 최근 판례에서 1인당 10~30만원의 위자료가 인정되고 있어, 대규모 회원 보유 기업일수록 재정적 리스크가 큽니다.`,
        lawRef: '개인정보보호법 제21조(개인정보의 파기), 정보통신망법 제29조(개인정보의 파기)',
        penalty: '과태료 2,000만원 이하 + 시정명령',
        recommendation: `쿠키, 비활성 계정, 마케팅 철회 후 각각의 파기 기준과 절차를 구체적으로 명시하여야 합니다.`,
    },
    {
        id: '5', num: '총칙', title: '처리방침 서문(총칙)', level: 'LOW',
        original:
            `(주)샐러디(이하 "당사"라 함)는 이용자의 개인정보를 중요시하며, 개인정보보호법 등 관련 법령을 준수하고 있습니다.`,
        lawyerOpinion:
            `서문 자체에 직접적인 법적 위반 요소는 없으나, 본 보고서에서 확인된 다수의 위반 사항과 모순됩니다. "관련 법령을 준수하고 있습니다"라는 선언적 문구를 사용하면서 실제로는 여러 조항에서 법령 미준수가 확인되었기 때문입니다.\n\n행정기관이 조사 시 이러한 모순적 표현은 "형식적 준법의지만 있을 뿐 실질적 관리가 부재하다"는 판단의 근거가 될 수 있으며, 이는 다른 위반 사항에 대한 과태료 산정 시 가중 요소로 작용할 수 있습니다.`,
        scenario:
            `단독으로는 제재 대상이 아니나, 다른 위반 사항과 결합 시 "관리 부실" 판단의 보강 근거로 활용됩니다. 개인정보보호위원회 시정명령 공문에서 자주 인용되는 항목입니다.`,
        lawRef: '개인정보보호법 제3조(개인정보 보호 원칙)',
        penalty: '직접 제재 없음 (타 위반 시 가중사유)',
        recommendation: `후속 조항의 준법성이 확보된 후, 서문도 함께 정비하여 일관성을 유지하여야 합니다.`,
    },
];

/* ── 이슈 카드 ─────────────────────────────────────────── */
function IssueCard({ issue, index, company }: { issue: Issue; index: number; company: string }) {
    const [open, setOpen] = useState(index < 2);
    const r = RISK[issue.level];

    return (
        <motion.div
            id={`issue-${issue.id}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * index }}
            className="rounded-xl overflow-hidden mb-5"
            style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderLeft: `4px solid ${r.dot}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
        >
            {/* 헤더 */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-4 px-6 py-5 text-left transition-all"
                style={{ background: open ? r.bg : 'transparent' }}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                        <span className="text-xs font-black px-2.5 py-1 rounded-md"
                            style={{ background: r.bg, color: r.color, border: `1px solid ${r.border}` }}>
                            {issue.num}
                        </span>
                        <span className="text-[15px] font-black" style={{ color: '#111827' }}>{issue.title}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full ml-auto"
                            style={{ background: r.bg, color: r.color, border: `1px solid ${r.border}` }}>
                            {r.label}
                        </span>
                    </div>
                    <p className="text-[13px] leading-relaxed truncate" style={{ color: '#6b7280' }}>
                        {issue.lawyerOpinion.split('\n')[0].substring(0, 80)}...
                    </p>
                </div>
                {open
                    ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: '#9ca3af' }} />
                    : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: '#9ca3af' }} />}
            </button>

            {/* 상세 */}
            {open && (
                <div className="px-6 pb-6 space-y-5" style={{ borderTop: `1px solid ${r.border}` }}>
                    {/* 현행 조항 원문 */}
                    <div className="pt-5">
                        <div className="flex items-center gap-2 mb-3">
                            <FileWarning className="w-4 h-4" style={{ color: r.color }} />
                            <span className="text-xs font-black tracking-wide" style={{ color: r.color }}>현행 조항 원문</span>
                        </div>
                        <div className="rounded-lg p-4 text-[13px] leading-relaxed whitespace-pre-line"
                            style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', fontFamily: "'Noto Serif KR', serif" }}>
                            {issue.original}
                        </div>
                    </div>
                    {/* 변호사 검토 의견 */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Scale className="w-4 h-4" style={{ color: '#92400e' }} />
                            <span className="text-xs font-black tracking-wide" style={{ color: '#92400e' }}>변호사 검토 의견</span>
                        </div>
                        <div className="rounded-lg p-5 text-[13.5px] leading-[1.9] whitespace-pre-line"
                            style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#1f2937', fontFamily: "'Noto Serif KR', serif" }}>
                            {issue.lawyerOpinion}
                        </div>
                    </div>
                    {/* 위반 시 예상 시나리오 */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4" style={{ color: '#dc2626' }} />
                            <span className="text-xs font-black tracking-wide" style={{ color: '#dc2626' }}>위반 시 예상 시나리오</span>
                        </div>
                        <div className="rounded-lg p-5 text-[13.5px] leading-[1.9] whitespace-pre-line"
                            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#1f2937', fontFamily: "'Noto Serif KR', serif" }}>
                            {issue.scenario}
                        </div>
                    </div>
                    {/* 관련 법령 + 예상 제재 */}
                    <div className="grid sm:grid-cols-2 gap-3">
                        <div className="rounded-lg p-4" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                            <p className="text-[11px] font-bold mb-1" style={{ color: '#0369a1' }}>관련 법령</p>
                            <p className="text-[13px] font-semibold" style={{ color: '#0c4a6e' }}>{issue.lawRef}</p>
                        </div>
                        <div className="rounded-lg p-4" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                            <p className="text-[11px] font-bold mb-1" style={{ color: '#dc2626' }}>예상 제재</p>
                            <p className="text-[13px] font-black" style={{ color: '#991b1b' }}>{issue.penalty}</p>
                        </div>
                    </div>
                    {/* 수정 권고 (블러) */}
                    <div className="relative rounded-lg overflow-hidden">
                        <div className="p-4 text-[13px] leading-relaxed"
                            style={{ color: '#374151', filter: 'blur(4px)', userSelect: 'none' }}>
                            <strong>수정 권고:</strong> {issue.recommendation}
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                            style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(1px)' }}>
                            <p className="text-[13px] font-black" style={{ color: '#92400e' }}>수정 권고안은 구독 후 열람 가능합니다</p>
                            <Link href={`/checkout?plan=pro&company=${encodeURIComponent(company)}`}>
                                <button className="text-xs font-bold px-4 py-2 rounded-lg text-white"
                                    style={{ background: 'linear-gradient(135deg,#92400e,#c9a84c)' }}>
                                    수정 권고안 전체 보기 &rarr;
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

/* ── 위험 점수 게이지 ──────────────────────────────────── */
function RiskGauge({ score }: { score: number }) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const color = score >= 70 ? '#dc2626' : score >= 40 ? '#d97706' : '#16a34a';
    const label = score >= 70 ? '즉시 조치 필요' : score >= 40 ? '주의 권고' : '양호';
    return (
        <div className="flex flex-col items-center">
            <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10" />
                <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="10"
                    strokeDasharray={circumference} strokeDashoffset={circumference - progress}
                    strokeLinecap="round" transform="rotate(-90 70 70)"
                    style={{ transition: 'stroke-dashoffset 1.5s ease' }} />
                <text x="70" y="64" textAnchor="middle" fill="#111827" style={{ fontSize: '32px', fontWeight: 900 }}>{score}</text>
                <text x="70" y="84" textAnchor="middle" fill={color} style={{ fontSize: '12px', fontWeight: 800 }}>{label}</text>
            </svg>
        </div>
    );
}

/* ── 메인 페이지 ───────────────────────────────────────── */
export default function PrivacyReportPage() {
    const searchParams = useSearchParams();
    const company = searchParams.get('company') || '(주)샐러디';
    const companyId = searchParams.get('companyId') || '';

    const crmCompany = useMemo(() => {
        if (typeof window === 'undefined') return null;
        const all = store.getAll();
        if (companyId) return all.find(c => c.id === companyId) || null;
        return all.find(c => c.name === company) || null;
    }, [company, companyId]);

    const dynamicIssues: Issue[] = useMemo(() => {
        if (!crmCompany || crmCompany.issues.length === 0) return ISSUES;
        return ISSUES.map((base, idx) => {
            const ci = crmCompany.issues[idx];
            if (!ci) return base;
            return { ...base, level: (ci.level === 'HIGH' ? 'HIGH' : ci.level === 'MEDIUM' ? 'MEDIUM' : 'LOW') as Issue['level'], title: ci.title || base.title, lawRef: ci.law || base.lawRef };
        });
    }, [crmCompany]);

    const displayCompany = crmCompany?.name || company;
    const riskScore = crmCompany?.riskScore || 78;
    const highCount = dynamicIssues.filter(i => i.level === 'HIGH').length;
    const medCount  = dynamicIssues.filter(i => i.level === 'MEDIUM').length;
    const lowCount  = dynamicIssues.filter(i => i.level === 'LOW').length;
    const totalPenalty = (crmCompany && typeof crmCompany.riskScore === 'number' && !isNaN(crmCompany.riskScore))
        ? `약 ${(crmCompany.riskScore * 1500000).toLocaleString()}원`
        : '약 1억 3,000만원';

    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

    return (
        <div className="min-h-screen" style={{ background: '#f8f7f4' }}>

            {/* 상단 헤더 */}
            <div className="sticky top-0 z-50 backdrop-blur-md" style={{ background: 'rgba(248,247,244,0.92)', borderBottom: '1px solid #e5e7eb' }}>
                <div className="max-w-[1280px] mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1e293b' }}>
                            <span className="text-[10px] font-black text-white">IBS</span>
                        </div>
                        <span className="text-[13px] font-bold" style={{ color: '#6b7280' }}>법률사무소 IBS &middot; 개인정보 진단 보고서</span>
                    </div>
                    <span className="text-[13px]" style={{ color: '#9ca3af' }}>{dateStr}</span>
                </div>
            </div>

            {/* 메인 2단 레이아웃 */}
            <div className="max-w-[1280px] mx-auto px-6 pt-10 pb-20 flex gap-8">

                {/* ═══ 좌측 메인 ═══════════════════════════ */}
                <main className="flex-1 min-w-0">

                    {/* 타이틀 */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-xs font-black px-2.5 py-1 rounded-md"
                                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                                &#x26A0; 위험 감지
                            </span>
                        </div>
                        <h1 className="text-[28px] font-black mb-1" style={{ color: '#111827', letterSpacing: '-0.02em' }}>
                            {displayCompany}
                        </h1>
                        <p className="text-[15px]" style={{ color: '#6b7280' }}>
                            개인정보처리방침 법률 진단 결과 보고서
                        </p>
                    </motion.div>

                    {/* 3개 스탯 박스 */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="grid grid-cols-3 gap-3 mb-10">
                        {[
                            { label: '고위험', count: highCount, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                            { label: '주의',   count: medCount,  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                            { label: '저위험', count: lowCount,  color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
                        ].map(s => (
                            <div key={s.label} className="rounded-xl px-5 py-4 flex items-center gap-3"
                                style={{ background: s.bg, borderLeft: `4px solid ${s.color}`, border: `1px solid ${s.border}` }}>
                                <span className="text-2xl font-black" style={{ color: s.color }}>{s.count}건</span>
                                <span className="text-[13px] font-bold" style={{ color: s.color }}>{s.label}</span>
                            </div>
                        ))}
                    </motion.div>

                    {/* 변호사 총괄 검토 의견 */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="w-5 h-5" style={{ color: '#92400e' }} />
                            <h2 className="text-[16px] font-black" style={{ color: '#111827' }}>검토 의견</h2>
                            <div className="flex-1 h-px ml-3" style={{ background: '#d4a574' }} />
                        </div>
                        <div className="rounded-xl p-6 text-[14px] leading-[2] whitespace-pre-line"
                            style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#374151', fontFamily: "'Noto Serif KR', serif", boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            {`본 보고서는 귀사의 개인정보처리방침을 개인정보보호법 제30조, 정보통신망법 제27조의2 및 개인정보보호위원회 고시에 따라 검토한 결과입니다.\n\n검토 결과, 총 ${dynamicIssues.length}건의 법적 위험 요소가 확인되었으며, 이 중 ${highCount}건은 즉시 시정이 필요한 고위험 사항입니다. 특히 개인정보 과다수집(제1조)과 제3자 제공 미명시(제4조)는 개인정보보호위원회의 최우선 점검 항목에 해당하여, 조속한 시정을 강력히 권고드립니다.\n\n현행 방침을 그대로 유지할 경우, 정기감사 또는 정보주체 민원 시 과태료·과징금 합산 ${totalPenalty} 규모의 행정처분이 예상됩니다. 아울러 위반사실 공표에 따른 기업 이미지 훼손과 가맹점주·소비자 신뢰 하락이 우려됩니다.`}
                        </div>
                    </motion.div>

                    {/* 이슈 리스트 */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="flex items-center gap-2 mb-6">
                            <Eye className="w-5 h-5" style={{ color: '#374151' }} />
                            <h2 className="text-[16px] font-black" style={{ color: '#111827' }}>발견된 법적 위험 상세</h2>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full ml-auto"
                                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                                총 {dynamicIssues.length}건
                            </span>
                        </div>
                        {dynamicIssues.map((issue, i) => (
                            <IssueCard key={issue.id} issue={issue} index={i} company={displayCompany} />
                        ))}
                    </motion.div>

                    {/* 면책 */}
                    <div className="mt-12 pt-6" style={{ borderTop: '1px solid #e5e7eb' }}>
                        <p className="text-[11px] leading-relaxed" style={{ color: '#9ca3af' }}>
                            본 보고서는 자동 분석 결과이며, 정식 법률 의견서를 대체하지 않습니다.
                            구독 시 전담 변호사가 귀사 상황에 맞는 정확한 검토와 수정본을 제공합니다.
                            &copy; {today.getFullYear()} IBS 법률사무소. All rights reserved.
                        </p>
                    </div>
                </main>

                {/* ═══ 우측 사이드바 ═══════════════════════ */}
                <aside className="w-[300px] flex-shrink-0 hidden lg:block">
                    <div className="sticky top-20">
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>

                            {/* 위험 점수 */}
                            <div className="rounded-2xl p-6 mb-4 text-center"
                                style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <p className="text-[11px] font-bold mb-3" style={{ color: '#6b7280' }}>위험 점수</p>
                                <RiskGauge score={riskScore} />
                            </div>

                            {/* 핵심 수치 */}
                            <div className="rounded-2xl p-5 mb-4 space-y-3"
                                style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                {[
                                    { icon: AlertCircle, label: '예상 과태료', value: totalPenalty, color: '#dc2626' },
                                    { icon: Scale, label: '위반 가능 법령', value: `${highCount + medCount}개`, color: '#d97706' },
                                    { icon: FileText, label: '시정명령 대상', value: `${highCount + medCount}건`, color: '#2563eb' },
                                ].map(m => (
                                    <div key={m.label} className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg" style={{ background: `${m.color}10` }}>
                                            <m.icon className="w-4 h-4" style={{ color: m.color }} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[11px]" style={{ color: '#9ca3af' }}>{m.label}</p>
                                            <p className="text-[14px] font-black" style={{ color: '#111827' }}>{m.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            <Link href={`/checkout?plan=pro&company=${encodeURIComponent(displayCompany)}`}>
                                <button className="w-full py-3.5 rounded-xl font-black text-[14px] mb-2 flex items-center justify-center gap-2"
                                    style={{ background: 'linear-gradient(135deg,#1e293b,#334155)', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                                    전문 변호사 수정 시작 <ArrowRight className="w-4 h-4" />
                                </button>
                            </Link>
                            <div className="flex items-center justify-center gap-1.5 mb-6">
                                <CheckCircle2 className="w-3 h-3" style={{ color: '#16a34a' }} />
                                <p className="text-[11px] font-bold" style={{ color: '#16a34a' }}>48시간 내 수정 완료 보장</p>
                            </div>

                            {/* 이슈 네비게이션 */}
                            <div className="rounded-2xl p-5"
                                style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <p className="text-[11px] font-black mb-3" style={{ color: '#6b7280' }}>이슈 바로가기</p>
                                <div className="space-y-2">
                                    {dynamicIssues.map(issue => {
                                        const r = RISK[issue.level];
                                        return (
                                            <button key={issue.id}
                                                onClick={() => document.getElementById(`issue-${issue.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-left w-full hover:bg-gray-50"
                                                style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.dot }} />
                                                <span className="text-[12px] font-semibold" style={{ color: '#374151' }}>
                                                    {issue.num} {issue.title}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 전체 요금제 */}
                            <div className="mt-4 text-center">
                                <Link href="/pricing" className="text-[12px] font-bold inline-flex items-center gap-1" style={{ color: '#92400e' }}>
                                    전체 요금제 비교 <ExternalLink className="w-3 h-3" />
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </aside>
            </div>

            {/* 모바일 하단 CTA */}
            <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 p-4"
                style={{ background: 'rgba(248,247,244,0.95)', backdropFilter: 'blur(8px)', borderTop: '1px solid #e5e7eb' }}>
                <Link href={`/checkout?plan=pro&company=${encodeURIComponent(displayCompany)}`}>
                    <button className="w-full py-3.5 rounded-xl font-black text-[14px] flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg,#1e293b,#334155)', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                        전문 변호사 수정 시작 <ArrowRight className="w-4 h-4" />
                    </button>
                </Link>
            </div>
        </div>
    );
}
