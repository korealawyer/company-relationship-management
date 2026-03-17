'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Shield, Scale, Briefcase, FolderOpen,
    Download, Eye, Clock, CheckCircle2, AlertTriangle,
    Lock, Search, Filter, ChevronDown, ArrowRight,
    FileSignature, Gavel, Users, Phone, ExternalLink,
    Calendar, Tag, MoreVertical, Star,
} from 'lucide-react';
import Link from 'next/link';

/* ── 문서 유형 정의 ───────────────────────────────────────── */
type DocType = 'privacy' | 'contract' | 'opinion' | 'certificate' | 'regulation' | 'labor';
type DocStatus = 'completed' | 'reviewing' | 'pending_payment' | 'draft';

interface Document {
    id: string;
    type: DocType;
    title: string;
    company: string;
    date: string;
    status: DocStatus;
    riskScore?: number;
    issueCount?: number;
    highRiskCount?: number;
    lawyer: string;
    summary: string;
    href: string;
    starred?: boolean;
    isDemo?: boolean;  // 데모 문서 여부
}

const DOC_TYPE_META: Record<DocType, { label: string; icon: React.ElementType; color: string }> = {
    privacy: { label: '개인정보 진단', icon: Shield, color: '#dc2626' },
    contract: { label: '계약서 검토', icon: FileSignature, color: '#2563eb' },
    opinion: { label: '법률 의견서', icon: Scale, color: '#7c3aed' },
    certificate: { label: '내용증명', icon: Gavel, color: '#059669' },
    regulation: { label: '사규 검토', icon: Briefcase, color: '#d97706' },
    labor: { label: '노무 자문', icon: Users, color: '#0891b2' },
};

const STATUS_META: Record<DocStatus, { label: string; color: string; bg: string }> = {
    completed: { label: '완료', color: '#059669', bg: '#ecfdf5' },
    reviewing: { label: '검토 중', color: '#d97706', bg: '#fffbeb' },
    pending_payment: { label: '결제 대기', color: '#dc2626', bg: '#fef2f2' },
    draft: { label: '임시저장', color: '#6b7280', bg: '#f3f4f6' },
};

/* ── 목업 문서 데이터 ──────────────────────────────────────── */
const DOCUMENTS: Document[] = [
    {
        id: 'doc-1',
        type: 'privacy',
        title: '개인정보처리방침 법률 진단 리포트',
        company: '(주)놀부NBG',
        date: '2026.03.16',
        status: 'completed',
        riskScore: 78,
        issueCount: 4,
        highRiskCount: 2,
        lawyer: '김수현 변호사',
        summary: '개인정보 과다수집, 제3자 제공 동의 절차 부재 등 4건의 법적 위험 발견. 즉시 시정 권고.',
        href: '/dashboard',
        starred: true,
    },
    {
        id: 'doc-2',
        type: 'contract',
        title: '가맹계약서 독소조항 검토',
        company: '(주)놀부NBG',
        date: '2026.03.10',
        status: 'completed',
        issueCount: 3,
        highRiskCount: 1,
        lawyer: '이지원 변호사',
        summary: '위약금 조항 불공정 거래 해당 가능성, 계약 해지 시 잔여 기간 수수료 청구 조항 주의.',
        href: '/documents/doc-2',
        isDemo: true,
    },
    {
        id: 'doc-3',
        type: 'opinion',
        title: '프랜차이즈 가맹사업법 법률 의견서',
        company: '(주)놀부NBG',
        date: '2026.03.05',
        status: 'reviewing',
        lawyer: '김수현 변호사',
        summary: '정보공개서 등록 의무, 가맹금 예치 절차 적정성 검토 진행 중.',
        href: '/documents/doc-3',
        isDemo: true,
    },
    {
        id: 'doc-4',
        type: 'regulation',
        title: '취업규칙 근로기준법 적합성 검토',
        company: '(주)놀부NBG',
        date: '2026.02.28',
        status: 'completed',
        issueCount: 6,
        highRiskCount: 2,
        lawyer: '이지원 변호사',
        summary: '근로시간 산정 기준, 징계 절차 적법성 등 6건 검토 완료. 수정안 포함.',
        href: '/documents/doc-4',
        isDemo: true,
    },
    {
        id: 'doc-5',
        type: 'labor',
        title: '직원 해고 절차 적법성 자문',
        company: '(주)놀부NBG',
        date: '2026.02.20',
        status: 'completed',
        lawyer: '이지원 변호사',
        summary: '해고 예고의무, 해고사유서 교부의무 등 적법 절차 안내.',
        href: '/documents/doc-5',
        isDemo: true,
    },
    {
        id: 'doc-6',
        type: 'certificate',
        title: '임대차 계약 해지 통보 내용증명',
        company: '(주)놀부NBG',
        date: '2026.02.15',
        status: 'pending_payment',
        lawyer: '김수현 변호사',
        summary: '결제 후 담당 변호사가 최종 확인 및 발송을 진행합니다.',
        href: '/documents/doc-6',
        isDemo: true,
    },
];

/* ── 요약 통계 ─────────────────────────────────────────── */
function StatsRow({ documents }: { documents: Document[] }) {
    const total = documents.length;
    const completed = documents.filter(d => d.status === 'completed').length;
    const reviewing = documents.filter(d => d.status === 'reviewing').length;
    const pending = documents.filter(d => d.status === 'pending_payment').length;

    const stats = [
        { label: '전체 문서', value: total, icon: <FolderOpen className="w-4 h-4" />, color: '#c9a84c' },
        { label: '완료', value: completed, icon: <CheckCircle2 className="w-4 h-4" />, color: '#059669' },
        { label: '검토 중', value: reviewing, icon: <Clock className="w-4 h-4" />, color: '#d97706' },
        { label: '결제 대기', value: pending, icon: <AlertTriangle className="w-4 h-4" />, color: '#dc2626' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {stats.map(s => (
                <div key={s.label} className="p-4 rounded-2xl"
                    style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: `${s.color}10` }}>
                            <span style={{ color: s.color }}>{s.icon}</span>
                        </div>
                    </div>
                    <div className="text-2xl font-black" style={{ color: '#111827' }}>{s.value}</div>
                    <div className="text-xs font-medium" style={{ color: '#6b7280' }}>{s.label}</div>
                </div>
            ))}
        </div>
    );
}

/* ── 문서 카드 ─────────────────────────────────────────── */
function DocumentCard({ doc }: { doc: Document }) {
    const typeMeta = DOC_TYPE_META[doc.type];
    const statusMeta = STATUS_META[doc.status];
    const TypeIcon = typeMeta.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative rounded-2xl overflow-hidden transition-all"
            style={{
                background: doc.isDemo ? '#fafaf8' : '#fff',
                border: doc.isDemo ? '1px dashed #d1cdc4' : '1px solid #e8e5de',
                opacity: doc.isDemo ? 0.85 : 1,
            }}
            whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', opacity: 1 }}
        >
            {/* 데모 배지 */}
            {doc.isDemo && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black"
                    style={{ background: '#dbeafe', color: '#2563eb', border: '1px solid #93c5fd' }}>
                    샘플
                </div>
            )}
            {/* 내 문서 배지 */}
            {!doc.isDemo && doc.starred && (
                <div className="absolute top-3 right-14 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black"
                    style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                    ✨ 내 문서
                </div>
            )}
            {/* 상단 컬러 바 */}
            <div className="h-1" style={{ background: doc.isDemo ? '#d1d5db' : typeMeta.color }} />

            <div className="p-5">
                {/* 헤더: 유형 + 상태 + 날짜 */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: `${typeMeta.color}10` }}>
                            <TypeIcon className="w-4.5 h-4.5" style={{ color: typeMeta.color }} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold tracking-wider uppercase"
                                style={{ color: typeMeta.color }}>{typeMeta.label}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                    style={{ color: statusMeta.color, background: statusMeta.bg }}>
                                    {statusMeta.label}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {doc.starred && (
                            <Star className="w-3.5 h-3.5 fill-current" style={{ color: '#c9a84c' }} />
                        )}
                        <span className="text-[10px]" style={{ color: '#9ca3af' }}>{doc.date}</span>
                    </div>
                </div>

                {/* 제목 */}
                <h3 className="font-bold text-[15px] leading-snug mb-2" style={{ color: '#111827' }}>
                    {doc.title}
                </h3>

                {/* 요약 */}
                <p className="text-xs leading-relaxed mb-3" style={{ color: '#6b7280' }}>
                    {doc.summary}
                </p>

                {/* 위험 점수 & 이슈 카운트 (있으면) */}
                {(doc.riskScore || doc.issueCount) && (
                    <div className="flex items-center gap-3 mb-3 pb-3"
                        style={{ borderBottom: '1px solid #f0ede6' }}>
                        {doc.riskScore && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                                style={{ background: doc.riskScore >= 70 ? '#fef2f2' : '#fffbeb' }}>
                                <AlertTriangle className="w-3 h-3"
                                    style={{ color: doc.riskScore >= 70 ? '#dc2626' : '#d97706' }} />
                                <span className="text-xs font-bold"
                                    style={{ color: doc.riskScore >= 70 ? '#dc2626' : '#d97706' }}>
                                    위험도 {doc.riskScore}점
                                </span>
                            </div>
                        )}
                        {doc.issueCount && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs" style={{ color: '#6b7280' }}>
                                    이슈 <strong style={{ color: '#111827' }}>{doc.issueCount}건</strong>
                                </span>
                                {doc.highRiskCount && doc.highRiskCount > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                        style={{ background: '#fef2f2', color: '#dc2626' }}>
                                        고위험 {doc.highRiskCount}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 하단: 변호사 + 액션 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{ background: '#f0ede6', color: '#6b7280' }}>
                            {doc.lawyer[0]}
                        </div>
                        <span className="text-xs" style={{ color: '#9ca3af' }}>{doc.lawyer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {doc.status === 'completed' && (
                            <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all hover:opacity-80"
                                style={{ background: '#f8f7f4', color: '#6b7280', border: '1px solid #e8e5de' }}>
                                <Download className="w-3 h-3" /> PDF
                            </button>
                        )}
                        <Link href={doc.href}>
                            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                                style={{
                                    background: doc.status === 'pending_payment'
                                        ? 'linear-gradient(135deg, #c9a84c, #e8c87a)'
                                        : '#111827',
                                    color: '#fff',
                                }}>
                                {doc.status === 'pending_payment' ? (
                                    <><Lock className="w-3 h-3" /> 결제하기</>
                                ) : (
                                    <><Eye className="w-3 h-3" /> 열람</>
                                )}
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/* ── 메인 페이지 ───────────────────────────────────────── */
export default function MyDocumentsPage() {
    const [filterType, setFilterType] = useState<DocType | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<DocStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // ── 세션에서 회사명 읽기 ────────────────────────────────
    const [companyName, setCompanyName] = useState('');
    useEffect(() => {
        try {
            const raw = localStorage.getItem('ibs_auth_v1');
            if (raw) {
                const s = JSON.parse(raw);
                if (s?.companyName) setCompanyName(s.companyName);
            }
        } catch { /* ignore */ }
    }, []);

    const docs = useMemo(() =>
        DOCUMENTS.map(d => ({ ...d, company: companyName || d.company })),
        [companyName]
    );

    const filtered = docs.filter(doc => {
        if (filterType !== 'all' && doc.type !== filterType) return false;
        if (filterStatus !== 'all' && doc.status !== filterStatus) return false;
        if (searchQuery && !doc.title.includes(searchQuery) && !doc.summary.includes(searchQuery)) return false;
        return true;
    });

    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: '#f8f7f4' }}>
            <div className="max-w-6xl mx-auto px-4">

                {/* ── 페이지 헤더 ── */}
                <div className="py-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <FolderOpen className="w-5 h-5" style={{ color: '#c9a84c' }} />
                                <span className="text-xs font-bold" style={{ color: '#c9a84c' }}>{companyName || '기업명'}</span>
                            </div>
                            <h1 className="text-2xl font-black" style={{ color: '#111827' }}>문서함</h1>
                            <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
                                법률 검토 결과, 의견서, 계약서 등 모든 문서를 한 곳에서 관리합니다.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                                style={{ background: '#fff', color: '#374151', border: '1px solid #e8e5de' }}>
                                <Download className="w-3.5 h-3.5" /> 전체 다운로드
                            </button>
                            <Link href="/consultation">
                                <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                                    style={{ background: '#111827', color: '#fff' }}>
                                    <FileText className="w-3.5 h-3.5" /> 새 의뢰하기
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── 통계 ── */}
                <StatsRow documents={docs} />

                {/* ── 필터 & 검색 바 ── */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-5">
                    {/* 검색 */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
                        <input
                            type="text"
                            placeholder="문서 제목 또는 내용으로 검색..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                            style={{
                                background: '#fff',
                                border: '1px solid #e8e5de',
                                color: '#111827',
                                outline: 'none',
                            }}
                        />
                    </div>

                    {/* 유형 필터 */}
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => setFilterType('all')}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={{
                                background: filterType === 'all' ? '#111827' : '#fff',
                                color: filterType === 'all' ? '#fff' : '#6b7280',
                                border: `1px solid ${filterType === 'all' ? '#111827' : '#e8e5de'}`,
                            }}
                        >전체</button>
                        {Object.entries(DOC_TYPE_META).map(([key, meta]) => (
                            <button
                                key={key}
                                onClick={() => setFilterType(key as DocType)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                style={{
                                    background: filterType === key ? `${meta.color}10` : '#fff',
                                    color: filterType === key ? meta.color : '#6b7280',
                                    border: `1px solid ${filterType === key ? meta.color + '40' : '#e8e5de'}`,
                                }}
                            >{meta.label}</button>
                        ))}
                    </div>
                </div>

                {/* 상태 필터 */}
                <div className="flex gap-1.5 mb-6">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={{
                            background: filterStatus === 'all' ? '#f0ede6' : 'transparent',
                            color: filterStatus === 'all' ? '#111827' : '#9ca3af',
                        }}
                    >전체 상태</button>
                    {Object.entries(STATUS_META).map(([key, meta]) => (
                        <button
                            key={key}
                            onClick={() => setFilterStatus(key as DocStatus)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={{
                                background: filterStatus === key ? meta.bg : 'transparent',
                                color: filterStatus === key ? meta.color : '#9ca3af',
                            }}
                        >{meta.label}</button>
                    ))}
                </div>

                {/* ── 문서 리스트 ── */}
                {filtered.length === 0 ? (
                    <div className="text-center py-20 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                        <FolderOpen className="w-12 h-12 mx-auto mb-3" style={{ color: '#d1d5db' }} />
                        <p className="font-bold mb-1" style={{ color: '#6b7280' }}>문서가 없습니다</p>
                        <p className="text-sm" style={{ color: '#9ca3af' }}>조건에 맞는 문서가 없거나 아직 의뢰 내역이 없습니다.</p>
                        <Link href="/consultation">
                            <button className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold"
                                style={{ background: '#111827', color: '#fff' }}>
                                첫 의뢰 시작하기 →
                            </button>
                        </Link>
                    </div>
                ) : (
                    <>
                    {/* 내 문서 섹션 */}
                    {filtered.some(d => !d.isDemo) && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1.5 h-5 rounded-full" style={{ background: '#c9a84c' }} />
                                <h2 className="text-sm font-black" style={{ color: '#111827' }}>내 법률 문서</h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                {filtered.filter(d => !d.isDemo).map((doc, i) => (
                                    <motion.div key={doc.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}>
                                        <DocumentCard doc={doc} />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 샘플 문서 섹션 */}
                    {filtered.some(d => d.isDemo) && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1.5 h-5 rounded-full" style={{ background: '#93c5fd' }} />
                                <h2 className="text-sm font-black" style={{ color: '#6b7280' }}>이런 서비스도 제공합니다</h2>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                    style={{ background: '#dbeafe', color: '#2563eb' }}>샘플</span>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                {filtered.filter(d => d.isDemo).map((doc, i) => (
                                    <motion.div key={doc.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 + 0.2 }}>
                                        <DocumentCard doc={doc} />
                                    </motion.div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 rounded-xl text-center"
                                style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                                <p className="text-[11px]" style={{ color: '#0369a1' }}>
                                    💡 위 샘플은 구독 시 실제 의뢰 가능한 서비스 예시입니다. <Link href="/consultation" className="font-bold underline">의뢰하기 →</Link>
                                </p>
                            </div>
                        </div>
                    )}
                    </>
                )}

                {/* ── 하단 CTA 배너 ── */}
                <div className="mt-10 p-8 rounded-2xl text-center"
                    style={{
                        background: 'linear-gradient(135deg, #f8f7f4, #f0ede6)',
                        border: '1px solid #e8e5de',
                    }}>
                    <p className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: '#c9a84c' }}>
                        추가 법률 서비스
                    </p>
                    <h3 className="text-lg font-black mb-2" style={{ color: '#111827' }}>
                        새로운 법률 검토가 필요하신가요?
                    </h3>
                    <p className="text-sm mb-5" style={{ color: '#6b7280' }}>
                        계약서 검토부터 법률 의견서까지, 전문 변호사가 24~48시간 내 답변드립니다.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Link href="/consultation">
                            <button className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2"
                                style={{ background: '#111827', color: '#fff' }}>
                                <FileText className="w-4 h-4" /> 의뢰하기
                            </button>
                        </Link>
                        <a href="tel:02-555-1234">
                            <button className="px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2"
                                style={{ background: '#fff', color: '#374151', border: '1px solid #e8e5de' }}>
                                <Phone className="w-4 h-4" /> 전화 상담
                            </button>
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
}
