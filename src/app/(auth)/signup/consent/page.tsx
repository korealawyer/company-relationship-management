'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, CheckCircle2, ChevronDown, ChevronUp,
    ArrowRight, ArrowLeft, FileText, Lock, Eye,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/* ── 약관 데이터 ─────────────────────────────────────────── */
interface ConsentItem {
    id: string;
    label: string;
    required: boolean;
    summary: string;
    fullText: string;
}

const CONSENT_ITEMS: ConsentItem[] = [
    {
        id: 'terms',
        label: '서비스 이용약관 동의',
        required: true,
        summary: '법률사무소 IBS 플랫폼 이용에 관한 기본 약관입니다.',
        fullText: `제1조 (목적)
본 약관은 법률사무소 IBS(이하 "회사")가 운영하는 온라인 법률자문 플랫폼(이하 "서비스")의 이용조건 및 절차, 회사와 이용자의 권리·의무 및 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
① "서비스"란 회사가 제공하는 법률자문, 문서검토, 사건관리, AI 계약서 분석 등 일체의 온라인 서비스를 말합니다.
② "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 법인 또는 개인을 말합니다.
③ "기업회원"이란 사업자등록번호를 보유한 법인 또는 개인사업자로서 유료 구독 서비스를 이용하는 자를 말합니다.

제3조 (약관의 효력 및 변경)
① 본 약관은 서비스 화면에 게시하여 공지함으로써 효력이 발생합니다.
② 회사는 합리적인 사유가 발생할 경우 약관을 변경할 수 있으며, 변경된 약관은 제1항과 같은 방법으로 공지합니다.

제4조 (서비스의 제공)
① 회사는 이용자에게 다음 서비스를 제공합니다:
  • 개인정보처리방침 진단 및 수정 자문
  • 가맹계약서 검토 및 법률 의견
  • AI 기반 계약서 위험도 분석
  • 실시간 법률 챗봇 상담
  • 사건 관리 및 문서 허브
② 서비스의 세부 내용은 구독 플랜에 따라 상이합니다.

제5조 (이용자의 의무)
이용자는 서비스 이용 시 관련 법령, 본 약관의 규정 및 이용안내 등을 준수하여야 합니다.`,
    },
    {
        id: 'privacy',
        label: '개인정보 수집·이용 동의',
        required: true,
        summary: '서비스 제공을 위한 개인정보 수집 및 이용에 동의합니다.',
        fullText: `1. 수집하는 개인정보 항목
  • 필수항목: 회사명(상호), 대표자명, 사업자등록번호, 담당자명, 이메일, 연락처
  • 선택항목: 회사 주소, 업종, 임직원 수, 가맹점 수

2. 개인정보의 수집·이용 목적
  • 서비스 제공 및 계약의 이행: 법률자문 제공, 문서검토, 계약 체결
  • 회원 관리: 본인확인, 불만처리, 고지사항 전달
  • 서비스 개선: 이용 통계 분석, 서비스 품질 향상

3. 개인정보의 보유·이용 기간
  • 회원 탈퇴 시까지 (단, 법령에 따른 보존기간이 있는 경우 해당 기간까지)
  • 계약 관련: 5년 (상법)
  • 결제 관련: 5년 (전자상거래법)

4. 동의 거부 권리 및 불이익
  • 이용자는 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다.
  • 다만, 필수항목에 대한 동의 거부 시 서비스 이용이 제한됩니다.

5. 개인정보 보호 조치
  • 개인정보 암호화 저장 (AES-256)
  • SSL/TLS 통신 보안
  • 접근 권한 최소화 및 정기 감사`,
    },
    {
        id: 'billing',
        label: '자동결제 및 환불정책 동의',
        required: true,
        summary: '월간 구독료 자동결제 및 환불 정책에 동의합니다.',
        fullText: `1. 자동결제
  • 최초 가입 시 30일간 무료 체험이 제공됩니다.
  • 무료 체험 종료 후 등록된 결제 수단으로 월 구독료가 자동 청구됩니다.
  • 결제일은 유료 전환일을 기준으로 매월 동일일에 결제됩니다.

2. 결제 수단
  • 신용카드, 체크카드 (PortOne v2 결제 시스템)
  • 세금계산서 발행 가능 (결제 완료 후)

3. 환불 정책
  • 구독 해지 시 잔여 기간에 대해 일할 계산하여 환불합니다.
  • 환불은 해지 요청일로부터 7-14 영업일 내 처리됩니다.
  • 무료 체험 기간 내 해지 시 별도 요금이 부과되지 않습니다.

4. 요금 변경
  • 요금이 변경되는 경우 최소 30일 전에 이메일로 사전 통지합니다.
  • 변경된 요금에 동의하지 않는 경우 위약금 없이 해지할 수 있습니다.`,
    },
    {
        id: 'marketing',
        label: '마케팅 정보 수신 동의',
        required: false,
        summary: '법률 뉴스레터, 서비스 업데이트, 프로모션 안내를 수신합니다.',
        fullText: `1. 수신 내용
  • 법률 뉴스레터: 프랜차이즈법, 개인정보보호법 등 최신 법률 동향
  • 서비스 업데이트: 신규 기능 출시, 플랫폼 개선 사항
  • 프로모션: 할인 이벤트, 추가 서비스 안내
  • 세미나/웨비나: 기업 법무 관련 교육 프로그램

2. 수신 채널
  • 이메일, SMS, 앱 푸시 알림

3. 동의 철회
  • 언제든지 수신 거부할 수 있으며, 설정에서 변경 가능합니다.
  • 수신 거부 시에도 서비스 이용에는 영향이 없습니다.`,
    },
];

/* ── 체크박스 컴포넌트 ───────────────────────────────────── */
function ConsentCheckbox({
    item, checked, expanded, onToggle, onExpand,
}: {
    item: ConsentItem;
    checked: boolean;
    expanded: boolean;
    onToggle: () => void;
    onExpand: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden transition-all"
            style={{
                background: checked
                    ? 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(13,27,62,0.6))'
                    : 'rgba(13,27,62,0.6)',
                border: `1px solid ${checked ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}
        >
            <div className="p-5">
                <div className="flex items-start gap-4">
                    {/* 체크박스 */}
                    <button
                        onClick={onToggle}
                        className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                        style={{
                            background: checked ? '#22c55e' : 'rgba(255,255,255,0.05)',
                            border: `2px solid ${checked ? '#22c55e' : 'rgba(255,255,255,0.15)'}`,
                        }}
                    >
                        {checked && <CheckCircle2 className="w-4 h-4" style={{ color: '#fff' }} />}
                    </button>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-sm" style={{ color: '#f0f4ff' }}>
                                {item.label}
                            </h3>
                            {item.required ? (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>필수</span>
                            ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,244,255,0.35)' }}>선택</span>
                            )}
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,244,255,0.45)' }}>
                            {item.summary}
                        </p>
                    </div>

                    {/* 펼치기 */}
                    <button
                        onClick={onExpand}
                        className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all"
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            color: 'rgba(240,244,255,0.45)',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}
                    >
                        <Eye className="w-3 h-3" />
                        {expanded ? '접기' : '전체 보기'}
                        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                </div>
            </div>

            {/* 전체 약관 텍스트 */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5">
                            <div className="rounded-xl p-4 max-h-60 overflow-y-auto text-xs leading-relaxed whitespace-pre-line"
                                style={{
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    color: 'rgba(240,244,255,0.55)',
                                }}>
                                {item.fullText}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ── 메인 페이지 ─────────────────────────────────────────── */
export default function ConsentPage() {
    const router = useRouter();
    const [consents, setConsents] = useState<Record<string, boolean>>({});
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const toggle = (id: string) => setConsents(p => ({ ...p, [id]: !p[id] }));
    const toggleExpand = (id: string) => setExpandedId(p => p === id ? null : id);

    const allRequired = CONSENT_ITEMS.filter(i => i.required).every(i => consents[i.id]);
    const allChecked = CONSENT_ITEMS.every(i => consents[i.id]);

    const selectAll = () => {
        if (allChecked) {
            setConsents({});
        } else {
            const all: Record<string, boolean> = {};
            CONSENT_ITEMS.forEach(i => { all[i.id] = true; });
            setConsents(all);
        }
    };

    const handleSubmit = async () => {
        if (!allRequired) return;
        setSubmitting(true);
        // 동의 타임스탬프 저장 (Mock)
        const consentData = {
            timestamp: new Date().toISOString(),
            items: CONSENT_ITEMS.map(i => ({
                id: i.id,
                label: i.label,
                agreed: !!consents[i.id],
                required: i.required,
            })),
            ip: '(클라이언트 IP)',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        };
        console.log('동의 데이터:', consentData);
        await new Promise(r => setTimeout(r, 1500));
        router.push('/checkout');
    };

    return (
        <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: '#04091a' }}>
            <div className="max-w-2xl mx-auto">

                {/* 뒤로가기 */}
                <div className="mb-8">
                    <Link href="/signup">
                        <button className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg"
                            style={{ color: 'rgba(240,244,255,0.6)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <ArrowLeft className="w-4 h-4" /> 회원가입으로 돌아가기
                        </button>
                    </Link>
                </div>

                {/* 타이틀 */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                        style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}
                    >
                        <Shield className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        <span className="text-sm font-bold" style={{ color: '#c9a84c' }}>이용약관 동의</span>
                    </motion.div>
                    <h1 className="text-3xl font-black mb-2" style={{ color: '#f0f4ff' }}>
                        서비스 이용약관에 동의해 주세요
                    </h1>
                    <p className="text-sm" style={{ color: 'rgba(240,244,255,0.4)' }}>
                        안전한 법률 서비스 이용을 위해 아래 약관을 확인하고 동의해 주세요
                    </p>
                </div>

                {/* 전체 동의 */}
                <motion.button
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={selectAll}
                    className="w-full p-5 rounded-2xl mb-4 flex items-center gap-4 transition-all"
                    style={{
                        background: allChecked
                            ? 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(13,27,62,0.8))'
                            : 'rgba(13,27,62,0.6)',
                        border: `2px solid ${allChecked ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    }}
                >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{
                            background: allChecked ? '#c9a84c' : 'rgba(255,255,255,0.05)',
                            border: `2px solid ${allChecked ? '#c9a84c' : 'rgba(255,255,255,0.15)'}`,
                        }}>
                        {allChecked && <CheckCircle2 className="w-5 h-5" style={{ color: '#04091a' }} />}
                    </div>
                    <div className="text-left">
                        <p className="font-black text-base" style={{ color: allChecked ? '#e8c87a' : '#f0f4ff' }}>
                            전체 동의하기
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(240,244,255,0.35)' }}>
                            필수 및 선택 항목을 모두 포함합니다
                        </p>
                    </div>
                </motion.button>

                {/* 개별 약관 리스트 */}
                <div className="space-y-3 mb-8">
                    {CONSENT_ITEMS.map((item, i) => (
                        <motion.div key={item.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * (i + 1) }}
                        >
                            <ConsentCheckbox
                                item={item}
                                checked={!!consents[item.id]}
                                expanded={expandedId === item.id}
                                onToggle={() => toggle(item.id)}
                                onExpand={() => toggleExpand(item.id)}
                            />
                        </motion.div>
                    ))}
                </div>

                {/* 보안 안내 */}
                <div className="rounded-xl p-4 mb-6 flex items-start gap-3"
                    style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)' }}>
                    <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#818cf8' }} />
                    <div>
                        <p className="text-xs font-bold mb-1" style={{ color: '#818cf8' }}>안전한 데이터 보호</p>
                        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(240,244,255,0.4)' }}>
                            귀하의 동의 내역은 타임스탬프, IP 주소와 함께 안전하게 저장됩니다.
                            모든 데이터는 AES-256 암호화로 보호되며, SSL/TLS 보안 통신을 사용합니다.
                        </p>
                    </div>
                </div>

                {/* 동의 진행 버튼 */}
                <button
                    onClick={handleSubmit}
                    disabled={!allRequired || submitting}
                    className="w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3"
                    style={{
                        background: !allRequired
                            ? 'rgba(255,255,255,0.05)'
                            : 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                        color: !allRequired ? 'rgba(240,244,255,0.3)' : '#04091a',
                        cursor: !allRequired ? 'not-allowed' : submitting ? 'wait' : 'pointer',
                        boxShadow: allRequired ? '0 6px 30px rgba(201,168,76,0.4)' : 'none',
                        opacity: submitting ? 0.7 : 1,
                    }}
                >
                    {submitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-amber-900 border-t-transparent rounded-full animate-spin" />
                            동의 처리 중...
                        </>
                    ) : (
                        <>
                            <FileText className="w-5 h-5" />
                            동의하고 결제 진행
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>

                {/* 하단 안내 */}
                <div className="flex flex-wrap justify-center gap-3 mt-5">
                    {['필수 항목만 동의 시 진행 가능', '동의 내역 변경 가능', 'SSL 암호화 보호'].map(b => (
                        <span key={b} className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(240,244,255,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {b}
                        </span>
                    ))}
                </div>

                {/* 단계 인디케이터 */}
                <div className="flex items-center justify-center gap-2 mt-8">
                    {['회원가입', '이용약관', '결제', '온보딩'].map((step, i) => (
                        <React.Fragment key={step}>
                            <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                                    style={{
                                        background: i <= 1 ? (i === 1 ? '#c9a84c' : 'rgba(34,197,94,0.2)') : 'rgba(255,255,255,0.05)',
                                        color: i <= 1 ? (i === 1 ? '#04091a' : '#4ade80') : 'rgba(240,244,255,0.25)',
                                        border: i === 1 ? '2px solid #c9a84c' : `1px solid ${i === 0 ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                    }}>
                                    {i === 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                                </div>
                                <span className="text-[10px] font-bold"
                                    style={{ color: i <= 1 ? (i === 1 ? '#c9a84c' : '#4ade80') : 'rgba(240,244,255,0.25)' }}>
                                    {step}
                                </span>
                            </div>
                            {i < 3 && (
                                <div className="w-6 h-px" style={{ background: i < 1 ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)' }} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}