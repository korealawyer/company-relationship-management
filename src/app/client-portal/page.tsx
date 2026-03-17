'use client';
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, ChevronDown, FileText, Scale,
    Shield, Lock, Phone, BookOpen, Clock4, CheckCircle2,
    ArrowRight, CreditCard, ExternalLink, Gavel, Eye,
    Download, MessageCircle, Zap,
} from 'lucide-react';
import Link from 'next/link';

/* ── 목업 데이터 ────────────────────────────────────────── */
const COMPANY = {
    name: '(주)놀부NBG',
    bizNo: '123-45-67890',
    plan: 'FREE',
    analysisDate: '2026-02-28',
    lawyer: '김수현',
    lawyerTitle: '개인정보보호법 프랜차이즈법 전문',
    lawyerOrg: '서울지방변호사회 · 대한변호사협회',
    lawyerCases: 847,
    lawyerRating: 4.9,
};

const RISK_SCORE = 78;

interface Issue {
    id: string;
    level: 'HIGH' | 'MEDIUM' | 'LOW';
    lawRef: string;
    title: string;
    originalText: string;
    lawyerOpinion: string;
    scenario: string;
    penalty: string;
    lawName: string;
    locked: boolean;
}

const ISSUES: Issue[] = [
    {
        id: 'i1',
        level: 'HIGH',
        lawRef: '제1조',
        title: '수집 항목 법정 기재 누락',
        originalText: `【필수】 이름, 생년월일, 성별, 로그인ID, 비밀번호, 비밀번호 질문과 답변, 자택전화번호, 자택주소, 휴대전화번호, 이메일, 직업, 회사명, 회사전화번호`,
        lawyerOpinion: `개인정보 보호법 제16조 제1항은 "개인정보처리자는 사상·신념, 노동조합·정당의 가입·탈퇴 등에 관한 정보 등 목적 달성에 필요한 최소한의 개인정보를 수집하여야 한다"고 규정하고 있습니다.\n\n현행 방침은 「직업, 회사명, 회사전화번호, 자택전화번호」 등 서비스 제공에 직접적 관련이 없는 항목을 '필수'로 분류하고 있어 과다수집에 해당할 소지가 높습니다. 특히 「비밀번호 질문과 답변」 항목은 평문 저장으로 오인될 수 있어 제29조(안전조치의무) 위반 주장의 근거가 됩니다.\n\n필수 항목과 선택 항목의 분리가 형식적으로도 이루어지지 않았으며, 이는 개인정보보호위원회의 정기 점검 시 최우선 지적 대상입니다.`,
        scenario: `개인정보보호위원회 정기감사 시 과다수집 항목이 적발되면 즉시 시정명령이 내려집니다. 이후 30일 내 미시정 시 과태료가 부과되며, 최근 3년간 유사 사례에서 프랜차이즈 기업 평균 과태료는 2,800만원입니다. 또한 위반사실이 공표되어 가맹점주·소비자 신뢰 하락으로 이어질 수 있습니다.`,
        penalty: '과태료 최대 5,000만원 + 시정명령',
        lawName: '개인정보 보호법 제30조 제1항 제1호',
        locked: false,
    },
    {
        id: 'i2',
        level: 'HIGH',
        lawRef: '제4조',
        title: '제3자 제공 동의 절차 부재',
        originalText: `당사는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 법령에 의하거나 이용자의 동의가 있는 경우 예외로 합니다.`,
        lawyerOpinion: `개인정보 보호법 제17조 제1항은 제3자 제공 시 "제공받는 자, 제공 목적, 제공 항목, 보유·이용 기간"을 정보주체에게 알리고 동의를 받도록 규정하고 있습니다.\n\n그러나 귀사는 실무적으로 PG사(결제대행), 배달플랫폼, 광고 플랫폼(Meta, Google Ads) 등에 고객 정보를 전달하고 있으면서도 처리방침에 이를 전혀 명시하지 않고 있습니다. 이는 "제3자 제공 사실의 은폐"로 해석될 여지가 있어, 단순 미기재보다 중한 행정적 제재가 예상됩니다.\n\n특히 개인정보보호위원회는 2024년 이후 프랜차이즈 업종에 대한 제3자 제공 실태 집중 점검을 실시하고 있어, 위험도가 매우 높습니다.`,
        scenario: `정보주체의 민원 또는 정기감사 시 실제 제3자 제공 현황과 처리방침 간의 불일치가 확인되면, 미동의 제공으로 간주됩니다. 최근 프랜차이즈 업계 유사 사례에서 매출액의 0.5~1.5% 수준 과징금이 부과되었으며, 해당 사실은 개인정보보호위원회 홈페이지에 6개월간 공표됩니다.`,
        penalty: '과징금 매출액 3% 이하 + 시정명령 + 위반사실 공표',
        lawName: '개인정보 보호법 제17조 제2항',
        locked: false,
    },
    {
        id: 'i3',
        level: 'MEDIUM',
        lawRef: '제2조',
        title: '보유·이용기간 불명확',
        originalText: `회원 탈퇴 시까지`,
        lawyerOpinion: `구독 후 상세 검토 의견을 열람하실 수 있습니다.`,
        scenario: `구독 후 위반 시나리오를 확인하실 수 있습니다.`,
        penalty: '시정 권고 + 과태료 1,000만원',
        lawName: '개인정보 보호법 제30조 제1항 제3호',
        locked: true,
    },
    {
        id: 'i4',
        level: 'LOW',
        lawRef: '제3조',
        title: '정보주체 권리 행사 방법 미기재',
        originalText: `이메일 또는 전화로 문의하여 주시기 바랍니다.`,
        lawyerOpinion: `구독 후 상세 검토 의견을 열람하실 수 있습니다.`,
        scenario: `구독 후 위반 시나리오를 확인하실 수 있습니다.`,
        penalty: '시정 권고',
        lawName: '개인정보 보호법 제35조·제36조',
        locked: true,
    },
];

/* ── 위험 게이지 ───────────────────────────────────────── */
function RiskGauge({ score }: { score: number }) {
    const pct = Math.min(score, 100);
    const circ = 2 * Math.PI * 54;
    const offset = circ - (circ * pct) / 100;
    const color = score >= 70 ? '#dc2626' : score >= 40 ? '#f59e0b' : '#16a34a';
    const label = score >= 70 ? '즉시 조치 필요' : score >= 40 ? '주의 필요' : '양호';

    return (
        <div className="flex flex-col items-center">
            <svg width="130" height="130" viewBox="0 0 130 130">
                <circle cx="65" cy="65" r="54" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle cx="65" cy="65" r="54" fill="none" stroke={color} strokeWidth="10"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round" transform="rotate(-90 65 65)"
                    style={{ transition: 'stroke-dashoffset 1.5s ease' }} />
                <text x="65" y="60" textAnchor="middle" fill="#111827" style={{ fontSize: '28px', fontWeight: 900 }}>{score}</text>
                <text x="65" y="78" textAnchor="middle" fill={color} style={{ fontSize: '11px', fontWeight: 800 }}>{label}</text>
            </svg>
        </div>
    );
}

/* ── 이슈 카드 ───────────────────────────────────────── */
function IssueCard({ issue, expanded, onToggle }: { issue: Issue; expanded: boolean; onToggle: () => void }) {
    const levelStyles = {
        HIGH: { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', tag: '#991b1b', tagBg: '#fee2e2', label: '고위험' },
        MEDIUM: { color: '#d97706', bg: '#fffbeb', border: '#fcd34d', tag: '#92400e', tagBg: '#fef3c7', label: '주의' },
        LOW: { color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', tag: '#1e40af', tagBg: '#dbeafe', label: '저위험' },
    };
    const ls = levelStyles[issue.level];

    return (
        <motion.div layout className="rounded-xl overflow-hidden mb-4"
            id={`issue-${issue.id}`}
            style={{ background: '#fff', border: `1.5px solid ${ls.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {/* 헤더 */}
            <div className="p-5 cursor-pointer" onClick={onToggle}>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md"
                        style={{ background: ls.tagBg, color: ls.tag }}>{issue.lawRef}</span>
                    <h3 className="font-bold text-base flex-1" style={{ color: '#1f2937' }}>{issue.title}</h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: ls.tagBg, color: ls.tag }}>{ls.label}</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        style={{ color: '#9ca3af' }} />
                </div>
                {!expanded && (
                    <p className="text-sm mt-2 line-clamp-1" style={{ color: '#6b7280' }}>
                        {issue.locked ? '구독 후 상세 내용을 열람하실 수 있습니다.' : issue.originalText}
                    </p>
                )}
            </div>

            {/* 상세 (확장) */}
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-5 space-y-4" style={{ borderTop: `1px solid ${ls.border}` }}>

                            {issue.locked ? (
                                /* 잠금 상태 */
                                <div className="py-8 text-center">
                                    <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
                                        style={{ background: '#f3f4f6' }}>
                                        <Lock className="w-6 h-6" style={{ color: '#9ca3af' }} />
                                    </div>
                                    <p className="font-bold text-sm mb-1" style={{ color: '#374151' }}>
                                        상세 검토 내용은 구독 후 열람 가능합니다
                                    </p>
                                    <p className="text-xs mb-4" style={{ color: '#9ca3af' }}>
                                        변호사 수정 조항·판례·대응 전략 포함
                                    </p>
                                    <Link href="/pricing">
                                        <button className="px-5 py-2.5 rounded-lg text-sm font-bold text-white"
                                            style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
                                            구독 시작하기 →
                                        </button>
                                    </Link>
                                </div>
                            ) : (
                                /* 공개 상태 */
                                <>
                                    {/* 현행 조항 원문 */}
                                    <div className="pt-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="w-4 h-4" style={{ color: ls.color }} />
                                            <span className="text-sm font-bold" style={{ color: ls.color }}>현행 조항 원문</span>
                                        </div>
                                        <div className="p-4 rounded-lg text-sm leading-relaxed"
                                            style={{ background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb' }}>
                                            {issue.originalText}
                                        </div>
                                    </div>

                                    {/* 변호사 검토 의견 */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Scale className="w-4 h-4" style={{ color: '#b8860b' }} />
                                            <span className="text-sm font-bold" style={{ color: '#b8860b' }}>변호사 검토 의견</span>
                                        </div>
                                        <div className="p-4 rounded-lg text-sm leading-[1.85]"
                                            style={{ background: '#fefdf8', color: '#374151', border: '1px solid #f0e6c8' }}>
                                            {issue.lawyerOpinion.split('\n\n').map((p, i) => (
                                                <p key={i} className={i > 0 ? 'mt-3' : ''}>{p}</p>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 위반 시 예상 시나리오 */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-4 h-4" style={{ color: '#dc2626' }} />
                                            <span className="text-sm font-bold" style={{ color: '#dc2626' }}>위반 시 예상 시나리오</span>
                                        </div>
                                        <div className="p-4 rounded-lg text-sm leading-[1.85]"
                                            style={{ background: '#fef2f2', color: '#7f1d1d', border: '1px solid #fecaca' }}>
                                            {issue.scenario}
                                        </div>
                                    </div>

                                    {/* 관련 법령 + 예상 제재 */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-lg" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                            <div className="text-xs font-bold mb-1" style={{ color: '#166534' }}>관련 법령</div>
                                            <div className="text-sm font-semibold" style={{ color: '#15803d' }}>{issue.lawName}</div>
                                        </div>
                                        <div className="p-3 rounded-lg" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                                            <div className="text-xs font-bold mb-1" style={{ color: '#991b1b' }}>예상 제재</div>
                                            <div className="text-sm font-semibold" style={{ color: '#dc2626' }}>{issue.penalty}</div>
                                        </div>
                                    </div>

                                    {/* 수정 권고안 (블러 처리) */}
                                    <div className="relative">
                                        <div className="p-4 rounded-lg text-sm"
                                            style={{ background: '#f9fafb', border: '1px solid #e5e7eb', filter: 'blur(4px)', userSelect: 'none' }}>
                                            수정 권고사항: 「직업, 회사명, 회사전화번호」를 선택 항목으로 변경하고, 「비밀번호 질문과 답변」 항목을 삭제하여 최소수집 원칙에 부합하도록 개인정보 처리방침 제1조를 아래와 같이 수정합니다...
                                        </div>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <p className="text-sm font-bold mb-2" style={{ color: '#b8860b' }}>
                                                수정 권고안은 구독 후 열람 가능합니다
                                            </p>
                                            <Link href={`/checkout?plan=pro&company=${encodeURIComponent(COMPANY.name)}`}>
                                                <button className="px-4 py-2 rounded-lg text-sm font-bold text-white"
                                                    style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
                                                    수정 권고안 전체 보기 →
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ── 메인 페이지 ───────────────────────────────────────── */
export default function ClientPortalPage() {
    const [expandedId, setExpandedId] = useState<string | null>('i1');
    const mainRef = useRef<HTMLDivElement>(null);

    const highCount = ISSUES.filter(i => i.level === 'HIGH').length;
    const medCount = ISSUES.filter(i => i.level === 'MEDIUM').length;
    const lowCount = ISSUES.filter(i => i.level === 'LOW').length;

    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

    return (
        <div className="min-h-screen pt-4" style={{ background: '#f8f7f4' }}>

            {/* ── 서브 헤더 ── */}
            <div className="max-w-[1280px] mx-auto px-6 mb-4">
                <div className="px-4 py-2.5 rounded-lg flex items-center justify-between"
                    style={{ background: '#fffcf0', border: '1px solid #f0e6c8' }}>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-black text-white"
                            style={{ background: '#1f2937' }}>IBS</div>
                        <span className="text-sm" style={{ color: '#6b7280' }}>
                            법률사무소 IBS · 개인정보 진단 보고서
                        </span>
                    </div>
                    <span className="text-sm" style={{ color: '#9ca3af' }}>{dateStr}</span>
                </div>
            </div>

            {/* ── 콘텐츠 ── */}
            <div className="max-w-[1280px] mx-auto px-6 pb-8">
                <div className="flex gap-8">

                    {/* ── 좌측 메인 (70%) ── */}
                    <div className="flex-1 min-w-0" ref={mainRef}>

                        {/* 위험 감지 배지 */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4"
                            style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                            <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
                            <span className="text-xs font-bold" style={{ color: '#dc2626' }}>위험 감지</span>
                        </div>

                        {/* 제목 + 액션 버튼 */}
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-black mb-1.5" style={{ color: '#111827' }}>{COMPANY.name}</h1>
                                <p className="text-base" style={{ color: '#6b7280' }}>
                                    개인정보처리방침 법률 진단 결과 보고서
                                </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <a href="tel:02-555-1234">
                                    <button className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
                                        style={{ background: '#fff', color: '#374151', border: '1px solid #d1d5db' }}>
                                        <Phone className="w-3.5 h-3.5" /> 전화 상담
                                    </button>
                                </a>
                                <button onClick={() => window.print()} className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
                                    style={{ background: '#fff', color: '#374151', border: '1px solid #d1d5db' }}>
                                    <Download className="w-3.5 h-3.5" /> PDF 다운로드
                                </button>
                                <Link href={`/checkout?plan=pro&company=${encodeURIComponent(COMPANY.name)}`}>
                                    <button className="px-3.5 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-1.5"
                                        style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
                                        <Zap className="w-3.5 h-3.5" /> 구독 업그레이드
                                    </button>
                                </Link>
                            </div>
                        </div>

                        {/* 3개 스탯 박스 */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            <div className="p-4 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                                <span className="text-2xl font-black" style={{ color: '#dc2626' }}>{highCount}건</span>
                                <span className="text-sm ml-2" style={{ color: '#991b1b' }}>고위험</span>
                            </div>
                            <div className="p-4 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}>
                                <span className="text-2xl font-black" style={{ color: '#d97706' }}>{medCount}건</span>
                                <span className="text-sm ml-2" style={{ color: '#92400e' }}>주의</span>
                            </div>
                            <div className="p-4 rounded-xl" style={{ background: '#eff6ff', border: '1px solid #93c5fd' }}>
                                <span className="text-2xl font-black" style={{ color: '#2563eb' }}>{lowCount}건</span>
                                <span className="text-sm ml-2" style={{ color: '#1e40af' }}>저위험</span>
                            </div>
                        </div>

                        {/* 검토 의견 */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <BookOpen className="w-5 h-5" style={{ color: '#374151' }} />
                                <h2 className="text-lg font-bold" style={{ color: '#111827' }}>검토 의견</h2>
                                <div className="flex-1 h-px ml-2" style={{ background: '#d1d5db' }} />
                            </div>
                            <div className="p-6 rounded-xl text-sm leading-[1.9]"
                                style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#374151' }}>
                                <p>
                                    본 보고서는 귀사의 개인정보처리방침을 개인정보보호법 제30조, 정보통신망법 제27조의2 및 개인정보보호위원회 고시에 따라 검토한 결과입니다.
                                </p>
                                <p className="mt-4">
                                    검토 결과, 총 {ISSUES.length}건의 법적 위험 요소가 확인되었으며, 이 중 {highCount}건은 즉시 시정이 필요한 고위험 사항입니다.
                                    특히 개인정보 과다수집(제1조)과 제3자 제공 미명시(제4조)는 개인정보보호위원회의 최우선 점검 항목에 해당하여, 조속한 시정을 강력히 권고드립니다.
                                </p>
                                <p className="mt-4">
                                    현행 방침을 그대로 유지할 경우, 정기감사 또는 정보주체 민원 시 과태료·과징금 합산 약 1억 3,000만원 규모의 행정처분이 예상됩니다.
                                    아울러 위반사실 공표에 따른 기업 이미지 훼손과 가맹점주·소비자 신뢰 하락이 우려됩니다.
                                </p>
                            </div>
                        </div>

                        {/* 검토 의견 후 인라인 CTA */}
                        <div className="p-5 rounded-xl mb-8 flex items-center justify-between"
                            style={{ background: 'linear-gradient(135deg, #fefdf8, #fef9ee)', border: '1.5px solid #f0e6c8' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold" style={{ color: '#92400e' }}>전문 변호사가 48시간 내 수정해드립니다</p>
                                    <p className="text-xs mt-0.5" style={{ color: '#b8860b' }}>수정 권고안 + 수정 조항 + 판례 근거 포함</p>
                                </div>
                            </div>
                            <Link href={`/checkout?plan=pro&company=${encodeURIComponent(COMPANY.name)}`}>
                                <button className="px-4 py-2.5 rounded-lg text-sm font-bold text-white flex-shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)', boxShadow: '0 2px 8px rgba(184,134,11,0.25)' }}>
                                    지금 시작하기 →
                                </button>
                            </Link>
                        </div>

                        {/* 발견된 법적 위험 상세 */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Eye className="w-5 h-5" style={{ color: '#374151' }} />
                                    <h2 className="text-lg font-bold" style={{ color: '#111827' }}>발견된 법적 위험 상세</h2>
                                </div>
                                <span className="text-sm font-bold" style={{ color: '#9ca3af' }}>
                                    총 {ISSUES.length}건
                                </span>
                            </div>

                            {ISSUES.map(issue => (
                                <IssueCard key={issue.id} issue={issue}
                                    expanded={expandedId === issue.id}
                                    onToggle={() => setExpandedId(expandedId === issue.id ? null : issue.id)} />
                            ))}

                            {/* 이슈 하단 요약 CTA */}
                            <div className="mt-6 p-6 rounded-xl text-center"
                                style={{ background: '#fff', border: '2px dashed #daa520' }}>
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Lock className="w-5 h-5" style={{ color: '#b8860b' }} />
                                    <p className="font-bold text-base" style={{ color: '#374151' }}>
                                        나머지 {ISSUES.filter(i => i.locked).length}건의 이슈 + 전체 수정 권고안
                                    </p>
                                </div>
                                <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                                    변호사 수정 조항 · 판례 · 대응 전략 포함
                                </p>
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="text-xs px-2 py-1 rounded-full font-bold"
                                        style={{ background: '#fef2f2', color: '#dc2626' }}>
                                        🔥 미조치 시 최대 과태료 9,000만원
                                    </span>
                                </div>
                                <Link href={`/checkout?plan=pro&company=${encodeURIComponent(COMPANY.name)}`}>
                                    <button className="mt-3 px-8 py-3 rounded-xl font-bold text-white text-base"
                                        style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)', boxShadow: '0 4px 14px rgba(184,134,11,0.3)' }}>
                                        전체 수정 시작하기 →
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* ── 우측 사이드바 (30%) ── */}
                    <aside className="hidden lg:block w-[300px] flex-shrink-0">
                        <div className="sticky top-[72px] space-y-4">

                            {/* 위험 점수 게이지 */}
                            <div className="p-5 rounded-xl text-center"
                                style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                                <div className="text-sm font-bold mb-3" style={{ color: '#6b7280' }}>위험 점수</div>
                                <RiskGauge score={RISK_SCORE} />
                            </div>

                            {/* 핵심 지표 */}
                            <div className="p-5 rounded-xl space-y-3"
                                style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                                <div className="flex items-center gap-2.5">
                                    <Clock4 className="w-4 h-4" style={{ color: '#dc2626' }} />
                                    <div>
                                        <div className="text-xs" style={{ color: '#9ca3af' }}>예상 과태료</div>
                                        <div className="font-black text-base" style={{ color: '#111827' }}>약 1억 3,000만원</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Gavel className="w-4 h-4" style={{ color: '#d97706' }} />
                                    <div>
                                        <div className="text-xs" style={{ color: '#9ca3af' }}>위반 가능 법령</div>
                                        <div className="font-black text-base" style={{ color: '#111827' }}>3개</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <FileText className="w-4 h-4" style={{ color: '#2563eb' }} />
                                    <div>
                                        <div className="text-xs" style={{ color: '#9ca3af' }}>시정명령 대상</div>
                                        <div className="font-black text-base" style={{ color: '#111827' }}>3건</div>
                                    </div>
                                </div>
                            </div>

                            {/* 빠른 액션 */}
                            <div className="p-4 rounded-xl space-y-2"
                                style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                                <a href="tel:02-555-1234">
                                    <button className="w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                                        style={{ background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb' }}>
                                        <Phone className="w-4 h-4" /> 전화 상담
                                    </button>
                                </a>
                                <button onClick={() => window.print()}
                                    className="w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                                    style={{ background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb' }}>
                                    <Download className="w-4 h-4" /> 리포트 PDF 다운로드
                                </button>
                                <Link href={`/pricing`} className="block">
                                    <button className="w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                                        style={{ background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb' }}>
                                        <CreditCard className="w-4 h-4" /> 요금제 비교
                                    </button>
                                </Link>
                            </div>

                            {/* CTA */}
                            <Link href={`/checkout?plan=pro&company=${encodeURIComponent(COMPANY.name)}`}>
                                <button className="w-full py-4 rounded-xl font-bold text-base text-white flex items-center justify-center gap-2"
                                    style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)', boxShadow: '0 4px 14px rgba(184,134,11,0.3)' }}>
                                    전문 변호사 수정 시작 <ArrowRight className="w-5 h-5" />
                                </button>
                            </Link>
                            <div className="text-center">
                                <span className="text-xs" style={{ color: '#16a34a' }}>✓ 48시간 내 수정 완료 보장</span>
                            </div>

                            {/* 이슈 바로가기 */}
                            <div className="p-5 rounded-xl"
                                style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                                <div className="text-sm font-bold mb-3" style={{ color: '#6b7280' }}>이슈 바로가기</div>
                                {ISSUES.map(issue => {
                                    const dotColor = issue.level === 'HIGH' ? '#dc2626' : issue.level === 'MEDIUM' ? '#f59e0b' : '#3b82f6';
                                    return (
                                        <button key={issue.id}
                                            onClick={() => {
                                                setExpandedId(issue.id);
                                                document.getElementById(`issue-${issue.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }}
                                            className="w-full flex items-center gap-2.5 py-2 text-left hover:bg-gray-50 rounded-lg px-2 transition-colors">
                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                                            <span className="text-sm" style={{ color: '#374151' }}>{issue.lawRef} {issue.title}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* 요금제 비교 */}
                            <Link href="/pricing" className="flex items-center justify-center gap-1 text-sm font-bold py-2"
                                style={{ color: '#b8860b' }}>
                                전체 요금제 비교 <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>

            {/* ── 모바일 하단 CTA ── */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 z-40"
                style={{ background: 'rgba(255,255,255,0.95)', borderTop: '1px solid #e5e7eb', backdropFilter: 'blur(12px)' }}>
                <Link href={`/checkout?plan=pro&company=${encodeURIComponent(COMPANY.name)}`}>
                    <button className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
                        <Shield className="w-5 h-5" /> 전문 변호사 수정 시작
                    </button>
                </Link>
            </div>
        </div>
    );
}
