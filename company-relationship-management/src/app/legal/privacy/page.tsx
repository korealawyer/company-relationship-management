'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Shield, ChevronDown, ChevronUp, FileText, UserCheck, Database,
    Lock, Globe, Clock, Users, Phone, Mail, AlertTriangle, ArrowUp,
} from 'lucide-react';
import Link from 'next/link';

/* ── 목차 데이터 ─────────────────────────────────────────────── */
const TOC = [
    { id: 'purpose', label: '제1조 (개인정보의 처리 목적)' },
    { id: 'items', label: '제2조 (수집하는 개인정보 항목)' },
    { id: 'method', label: '제3조 (개인정보의 수집 방법)' },
    { id: 'period', label: '제4조 (개인정보의 보유 및 이용 기간)' },
    { id: 'thirdparty', label: '제5조 (개인정보의 제3자 제공)' },
    { id: 'outsourcing', label: '제6조 (개인정보 처리 위탁)' },
    { id: 'rights', label: '제7조 (정보주체의 권리·의무 및 행사 방법)' },
    { id: 'destroy', label: '제8조 (개인정보의 파기)' },
    { id: 'security', label: '제9조 (개인정보의 안전성 확보 조치)' },
    { id: 'cookie', label: '제10조 (쿠키의 설치·운영 및 거부)' },
    { id: 'officer', label: '제11조 (개인정보 보호책임자)' },
    { id: 'remedy', label: '제12조 (권익침해 구제 방법)' },
    { id: 'change', label: '제13조 (개인정보처리방침 변경)' },
];

/* ── 섹션 래퍼 ────────────────────────────────────────────────── */
function Section({
    id, title, icon, children,
}: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
    const [open, setOpen] = useState(true);
    return (
        <motion.section
            id={id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(201,168,76,0.12)' }}
                    >
                        {icon}
                    </div>
                    <h2 className="font-black text-sm sm:text-base" style={{ color: '#f0f4ff' }}>
                        {title}
                    </h2>
                </div>
                {open
                    ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(240,244,255,0.3)' }} />
                    : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(240,244,255,0.3)' }} />}
            </button>
            {open && (
                <div className="px-6 pb-6 text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.65)' }}>
                    {children}
                </div>
            )}
        </motion.section>
    );
}

/* ── 테이블 래퍼 ──────────────────────────────────────────────── */
function InfoTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
    return (
        <div className="overflow-x-auto my-4 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <table className="w-full text-xs sm:text-sm">
                <thead>
                    <tr style={{ background: 'rgba(201,168,76,0.08)' }}>
                        {headers.map((h, i) => (
                            <th key={i} className="px-4 py-3 text-left font-bold whitespace-nowrap" style={{ color: '#c9a84c', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            {row.map((cell, ci) => (
                                <td key={ci} className="px-4 py-3 align-top" style={{ color: 'rgba(240,244,255,0.6)' }}>
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════ */
/*  메인 페이지                                                      */
/* ══════════════════════════════════════════════════════════════ */
export default function PrivacyPolicyPage() {
    const [showToc, setShowToc] = useState(false);

    return (
        <div className="min-h-screen pb-20" style={{ background: '#04091a' }}>

            {/* ── 히어로 ──────────────────────────────────────────────── */}
            <div className="relative overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 65%)',
                    }}
                />
                <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
                            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}
                        >
                            <Shield className="w-4 h-4" style={{ color: '#c9a84c' }} />
                            <span className="text-sm font-bold" style={{ color: '#c9a84c' }}>
                                개인정보처리방침
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black mb-3" style={{ color: '#f0f4ff' }}>
                            개인정보처리방침
                        </h1>
                        <p className="text-sm mb-2" style={{ color: 'rgba(240,244,255,0.5)' }}>
                            IBS 법률사무소(이하 &quot;회사&quot;)는 「개인정보 보호법」 제30조에 따라<br className="hidden sm:inline" />
                            정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록<br className="hidden sm:inline" />
                            다음과 같이 개인정보처리방침을 수립·공개합니다.
                        </p>
                        <p className="text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>
                            시행일: 2026년 3월 5일 · 최종 개정: 2026년 3월 5일
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* ── 본문 컨테이너 ─────────────────────────────────────────── */}
            <div className="max-w-4xl mx-auto px-4">

                {/* 목차 토글 (모바일 친화) */}
                <div className="mb-8">
                    <button
                        onClick={() => setShowToc(!showToc)}
                        className="w-full flex items-center justify-between px-5 py-4 rounded-xl text-sm font-bold"
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            color: '#c9a84c',
                        }}
                    >
                        <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4" /> 목차 보기
                        </span>
                        {showToc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showToc && (
                        <motion.nav
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 px-5 py-4 rounded-xl space-y-1.5"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                            {TOC.map((item) => (
                                <a
                                    key={item.id}
                                    href={`#${item.id}`}
                                    className="block text-xs sm:text-sm py-1.5 px-3 rounded-lg transition-colors hover:bg-white/5"
                                    style={{ color: 'rgba(240,244,255,0.55)' }}
                                >
                                    {item.label}
                                </a>
                            ))}
                        </motion.nav>
                    )}
                </div>

                {/* ── 조문 ────────────────────────────────────────────────── */}
                <div className="space-y-4">

                    {/* 제1조 */}
                    <Section id="purpose" title="제1조 (개인정보의 처리 목적)" icon={<FileText className="w-4 h-4" style={{ color: '#c9a84c' }} />}>
                        <p className="mb-3">회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리한 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행합니다.</p>
                        <InfoTable
                            headers={['구분', '처리 목적']}
                            rows={[
                                ['회원 가입 및 관리', '회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정 이용 방지, 각종 고지·통지'],
                                ['법률 상담 서비스', '프랜차이즈 법률 상담, 개인정보처리방침 AI 분석 리포트 제공, 계약서 리스크 분석'],
                                ['서비스 제공', '콘텐츠 제공, 맞춤 서비스 제공, 본인 인증, 소속 인증(초대코드·사업자번호)'],
                                ['마케팅 및 광고', '이벤트·광고성 정보 제공 및 참여 기회 제공 (동의 시에 한함)'],
                                ['민원 처리', '민원인의 신원 확인, 민원 사항 확인, 사실 조사를 위한 연락·통지, 처리 결과 통보'],
                            ]}
                        />
                    </Section>

                    {/* 제2조 */}
                    <Section id="items" title="제2조 (수집하는 개인정보 항목)" icon={<Database className="w-4 h-4" style={{ color: '#c9a84c' }} />}>
                        <InfoTable
                            headers={['수집 시점', '필수 항목', '선택 항목']}
                            rows={[
                                ['회원 가입', '이름, 이메일 주소, 비밀번호', '소속 회사명, 초대코드, 사업자등록번호, 직책'],
                                ['법률 상담 요청', '이름, 연락처(이메일 또는 전화번호), 상담 내용', '회사명, 사업자등록번호'],
                                ['서비스 이용 과정', 'IP 주소, 쿠키, 서비스 이용 기록, 접속 로그, 기기 정보(OS, 브라우저 종류)', '—'],
                            ]}
                        />
                        <div
                            className="mt-3 p-3 rounded-lg text-xs flex items-start gap-2"
                            style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.15)' }}
                        >
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#fb923c' }} />
                            <span style={{ color: '#fb923c' }}>
                                회사는 만 14세 미만 아동의 개인정보를 수집하지 않습니다. 만 14세 미만인 경우 회원 가입이 불가합니다.
                            </span>
                        </div>
                    </Section>

                    {/* 제3조 */}
                    <Section id="method" title="제3조 (개인정보의 수집 방법)" icon={<UserCheck className="w-4 h-4" style={{ color: '#c9a84c' }} />}>
                        <p>회사는 다음과 같은 방법으로 개인정보를 수집합니다.</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1.5">
                            <li>홈페이지를 통한 회원 가입, 법률 상담 신청, 서비스 이용</li>
                            <li>전화, 이메일을 통한 상담 과정에서 수집</li>
                            <li>서비스 이용 과정에서 자동으로 수집되는 정보 (쿠키, 로그 등)</li>
                            <li>초대코드 입력, 사업자번호 조회, 소속 신청 등 인증 절차</li>
                        </ul>
                    </Section>

                    {/* 제4조 */}
                    <Section id="period" title="제4조 (개인정보의 보유 및 이용 기간)" icon={<Clock className="w-4 h-4" style={{ color: '#c9a84c' }} />}>
                        <p className="mb-3">
                            회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용 기간 내에서 개인정보를 처리·보유합니다.
                        </p>
                        <InfoTable
                            headers={['구분', '보유 기간', '근거 법령']}
                            rows={[
                                ['회원 가입 정보', '회원 탈퇴 시까지', '개인정보 보호법'],
                                ['계약 또는 청약 철회 기록', '5년', '전자상거래 등에서의 소비자보호에 관한 법률'],
                                ['대금 결제 및 재화 공급 기록', '5년', '전자상거래 등에서의 소비자보호에 관한 법률'],
                                ['소비자 불만 또는 분쟁 처리 기록', '3년', '전자상거래 등에서의 소비자보호에 관한 법률'],
                                ['웹사이트 방문 기록(로그)', '3개월', '통신비밀보호법'],
                            ]}
                        />
                    </Section>

                    {/* 제5조 */}
                    <Section id="thirdparty" title="제5조 (개인정보의 제3자 제공)" icon={<Users className="w-4 h-4" style={{ color: '#c9a84c' }} />}>
                        <p>
                            회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며,
                            정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
                        </p>
                        <div
                            className="mt-3 p-3 rounded-lg text-xs"
                            style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)', color: '#4ade80' }}
                        >
                            현재 개인정보를 제3자에게 제공하고 있지 않습니다.
                        </div>
                    </Section>

                    {/* 제6조 */}
                    <Section id="outsourcing" title="제6조 (개인정보 처리 위탁)" icon={<Globe className="w-4 h-4" style={{ color: '#c9a84c' }} />}>
                        <p className="mb-3">
                            회사는 원활한 개인정보 업무 처리를 위하여 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.
                        </p>
                        <InfoTable
                            headers={['수탁업체', '위탁 업무', '보유 및 이용 기간']}
                            rows={[
                                ['Google Cloud (Firebase)', '클라우드 서버 운영 및 데이터 호스팅', '위탁 계약 종료 시까지'],
                                ['Vercel Inc.', '웹 애플리케이션 호스팅', '위탁 계약 종료 시까지'],
                            ]}
                        />
                        <p className="text-xs mt-2" style={{ color: 'rgba(240,244,255,0.4)' }}>
                            위탁 계약 시 개인정보가 안전하게 관리될 수 있도록 필요한 사항을 규정하고 있으며, 수탁자가 개인정보를 안전하게 처리하는지를 감독합니다.
                        </p>
                    </Section>

                    {/* 제7조 */}
                    <Section id="rights" title="제7조 (정보주체의 권리·의무 및 행사 방법)" icon={<UserCheck className="w-4 h-4" style={{ color: '#c9a84c' }} />}>
                        <p>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
                        <ul className="list-disc pl-5 mt-3 space-y-1.5">
                            <li>개인정보 열람 요구</li>
                            <li>오류 등이 있을 경우 정정 요구</li>
                            <li>삭제 요구</li>
                            <li>처리 정지 요구</li>
                        </ul>
                        <p className="mt-3">
                            권리 행사는 회사에 대해 「개인정보 보호법」 시행령 제41조 제1항에 따라 서면, 전자우편, FAX 등을 통하여 할 수 있으며,
                            회사는 이에 대해 지체 없이 조치하겠습니다.
                        </p>
                        <p className="mt-2">
                            정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 회사는 정정 또는 삭제를 완료할 때까지
                            당해 개인정보를 이용하거나 제공하지 않습니다.
                        </p>
                    </Section>

                    {/* 제8조 */}
                    <Section id="destroy" title="제8조 (개인정보의 파기)" icon={<AlertTriangle className="w-4 h-4" style={{ color: '#c9a84c' }} />}>
                        <p className="mb-3">
                            회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
                        </p>
                        <p className="font-bold mb-2" style={{ color: '#f0f4ff' }}>파기 절차</p>
                        <p className="mb-3">
                            불필요한 개인정보 및 개인정보 파일은 개인정보 보호책임자의 책임 하에 내부 방침 절차에 따라 파기합니다.
                        </p>
                        <p className="font-bold mb-2" style={{ color: '#f0f4ff' }}>파기 방법</p>
                        <ul className="list-disc pl-5 space-y-1.5">
                            <li><strong style={{ color: 'rgba(240,244,255,0.8)' }}>전자적 파일 형태:</strong> 복원이 불가능한 방법으로 영구 삭제</li>
                            <li><strong style={{ color: 'rgba(240,244,255,0.8)' }}>기록물, 인쇄물, 서면 등:</strong> 분쇄기로 분쇄하거나 소각</li>
                        </ul>
                    </Section>

                    {/* 제9조 */}
                    <Section id="security" title="제9조 (개인정보의 안전성 확보 조치)" icon={<Lock className="w-4 h-4" style={{ color: '#c9a84c' }} />}>
                        <p className="mb-3">
                            회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong style={{ color: 'rgba(240,244,255,0.8)' }}>관리적 조치:</strong> 내부 관리 계획 수립·시행, 개인정보 취급 직원 최소화 및 교육</li>
                            <li><strong style={{ color: 'rgba(240,244,255,0.8)' }}>기술적 조치:</strong> 개인정보 처리 시스템 접근 권한 관리, 접근 통제 시스템 설치, 고유 식별정보 등의 암호화, 보안 프로그램 설치</li>
                            <li><strong style={{ color: 'rgba(240,244,255,0.8)' }}>물리적 조치:</strong> 전산실, 자료 보관실 등의 접근 통제</li>
                            <li><strong style={{ color: 'rgba(240,244,255,0.8)' }}>비밀번호 암호화:</strong> 이용자의 비밀번호는 암호화되어 저장 및 관리되고 있어, 본인만이 알 수 있으며 중요 데이터는 파일 및 전송 데이터를 암호화하여 보호</li>
                        </ul>
                    </Section>

                    {/* 제10조 */}
                    <Section id="cookie" title="제10조 (쿠키의 설치·운영 및 거부)" icon={<Globe className="w-4 h-4" style={{ color: '#c9a84c' }} />}>
                        <p className="mb-3">
                            회사는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 이용 정보를 저장하고 수시로 불러오는 &apos;쿠키(Cookie)&apos;를 사용합니다.
                        </p>
                        <p className="font-bold mb-2" style={{ color: '#f0f4ff' }}>쿠키의 사용 목적</p>
                        <ul className="list-disc pl-5 space-y-1.5 mb-3">
                            <li>회원 로그인 유지 및 인증 상태 관리</li>
                            <li>서비스 이용 패턴 분석을 통한 최적화된 정보 제공</li>
                        </ul>
                        <p className="font-bold mb-2" style={{ color: '#f0f4ff' }}>쿠키의 거부 방법</p>
                        <p>
                            이용자는 웹 브라우저의 옵션 설정을 통해 쿠키의 허용, 차단 등의 설정을 할 수 있습니다.
                            다만, 쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 발생할 수 있습니다.
                        </p>
                        <div className="mt-3 p-3 rounded-lg text-xs space-y-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p style={{ color: 'rgba(240,244,255,0.5)' }}>• Chrome: 설정 → 개인정보 및 보안 → 쿠키 및 기타 사이트 데이터</p>
                            <p style={{ color: 'rgba(240,244,255,0.5)' }}>• Edge: 설정 → 개인 정보, 검색 및 서비스 → 쿠키</p>
                            <p style={{ color: 'rgba(240,244,255,0.5)' }}>• Safari: 환경설정 → 개인정보 보호</p>
                        </div>
                    </Section>

                    {/* 제11조 */}
                    <Section id="officer" title="제11조 (개인정보 보호책임자)" icon={<Users className="w-4 h-4" style={{ color: '#c9a84c' }} />}>
                        <p className="mb-3">
                            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만 처리 및
                            피해 구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                        </p>
                        <div
                            className="p-5 rounded-xl grid sm:grid-cols-2 gap-4"
                            style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)' }}
                        >
                            <div>
                                <p className="text-xs font-bold mb-3" style={{ color: '#c9a84c' }}>개인정보 보호책임자</p>
                                <div className="space-y-2 text-xs">
                                    <p><span style={{ color: 'rgba(240,244,255,0.4)' }}>성명:</span> <span style={{ color: '#f0f4ff' }}>유정훈 대표변호사</span></p>
                                    <p><span style={{ color: 'rgba(240,244,255,0.4)' }}>직위:</span> <span style={{ color: '#f0f4ff' }}>대표</span></p>
                                    <p className="flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5" style={{ color: 'rgba(240,244,255,0.3)' }} />
                                        <span style={{ color: '#f0f4ff' }}>privacy@ibslaw.co.kr</span>
                                    </p>
                                    <p className="flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5" style={{ color: 'rgba(240,244,255,0.3)' }} />
                                        <span style={{ color: '#f0f4ff' }}>02-555-1234</span>
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold mb-3" style={{ color: '#c9a84c' }}>개인정보 보호 담당부서</p>
                                <div className="space-y-2 text-xs">
                                    <p><span style={{ color: 'rgba(240,244,255,0.4)' }}>부서명:</span> <span style={{ color: '#f0f4ff' }}>IT·컴플라이언스팀</span></p>
                                    <p><span style={{ color: 'rgba(240,244,255,0.4)' }}>담당자:</span> <span style={{ color: '#f0f4ff' }}>개인정보 보호 담당자</span></p>
                                    <p className="flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5" style={{ color: 'rgba(240,244,255,0.3)' }} />
                                        <span style={{ color: '#f0f4ff' }}>compliance@ibslaw.co.kr</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* 제12조 */}
                    <Section id="remedy" title="제12조 (권익침해 구제 방법)" icon={<Shield className="w-4 h-4" style={{ color: '#c9a84c' }} />}>
                        <p className="mb-3">
                            정보주체는 개인정보 침해로 인한 구제를 받기 위하여 개인정보 분쟁조정위원회, 한국인터넷진흥원 개인정보 침해신고센터 등에
                            분쟁 해결이나 상담 등을 신청할 수 있습니다.
                        </p>
                        <div className="space-y-2 text-xs">
                            {[
                                { name: '개인정보 분쟁조정위원회', url: 'www.kopico.go.kr', tel: '1833-6972' },
                                { name: '개인정보 침해신고센터', url: 'privacy.kisa.or.kr', tel: '(국번없이) 118' },
                                { name: '대검찰청 사이버수사과', url: 'www.spo.go.kr', tel: '(국번없이) 1301' },
                                { name: '경찰청 사이버안전국', url: 'ecrm.cyber.go.kr', tel: '(국번없이) 182' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold" style={{ color: 'rgba(240,244,255,0.7)' }}>{item.name}</p>
                                        <p style={{ color: 'rgba(240,244,255,0.4)' }}>{item.url} | {item.tel}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* 제13조 */}
                    <Section id="change" title="제13조 (개인정보처리방침 변경)" icon={<Clock className="w-4 h-4" style={{ color: '#c9a84c' }} />}>
                        <p>이 개인정보처리방침은 2026년 3월 5일부터 적용됩니다.</p>
                        <p className="mt-2">
                            이전의 개인정보처리방침은 아래에서 확인하실 수 있습니다.
                        </p>
                        <p className="mt-2 text-xs" style={{ color: 'rgba(240,244,255,0.35)' }}>
                            — 2026년 3월 5일 시행 (현행)
                        </p>
                    </Section>
                </div>

                {/* ── 하단 안내 ────────────────────────────────────────────── */}
                <div className="mt-12 text-center space-y-4">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(240,244,255,0.4)' }}
                    >
                        <Shield className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        본 방침에 대한 문의사항이 있으시면&nbsp;
                        <a href="mailto:privacy@ibslaw.co.kr" style={{ color: '#c9a84c' }}>privacy@ibslaw.co.kr</a>
                        &nbsp;로 연락해 주세요.
                    </div>
                    <div className="flex justify-center gap-4 text-xs" style={{ color: 'rgba(240,244,255,0.35)' }}>
                        <Link href="/" className="hover:underline">홈으로</Link>
                        <span>·</span>
                        <Link href="/legal/terms" className="hover:underline">이용약관</Link>
                    </div>
                </div>

                {/* ── 위로 가기 버튼 ──────────────────────────────────────── */}
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-8 right-8 w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-50 transition-transform hover:scale-110"
                    style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a' }}
                    aria-label="위로 가기"
                >
                    <ArrowUp className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
