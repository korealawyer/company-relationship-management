'use client';
import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Clock, ArrowLeft, Scale, FileText, Loader2, Download, Lock, FilePlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import EditableText from '@/components/crm/EditableText';
import { useRequireAuth } from '@/lib/AuthContext';
import {
    DEFAULT_SCENARIO_CATEGORIES, CLAUSE_SCENARIO_MAP,
    type ScenarioCategory, getScenarioCategories,
} from '@/lib/prompts/privacy';
import { supabaseCompanyStore } from '@/lib/supabaseStore';
import { useAutoSettings } from '@/hooks/useDataLayer';
import type { Company, Issue } from '@/lib/mockStore';

// ── 색상 ──────────────────────────────────────────────────
const R: Record<string, { border: string; bg: string; tag: string; text: string; label: string }> = {
    HIGH: { border: '#dc2626', bg: '#fef2f2', tag: '#fee2e2', text: '#991b1b', label: '🔴 고위험' },
    MEDIUM: { border: '#d97706', bg: '#fffbeb', tag: '#fef3c7', text: '#92400e', label: '🟡 주의' },
    LOW: { border: '#2563eb', bg: '#eff6ff', tag: '#dbeafe', text: '#1e40af', label: '🔵 저위험' },
    OK: { border: '#16a34a', bg: '#f0fdf4', tag: '#dcfce7', text: '#166534', label: '✅ 양호' },
};

// ── 조문 데이터 ───────────────────────────────────────────
interface Clause {
    num: string; title: string; original: string;
    riskSummary: string; level: 'HIGH' | 'MEDIUM' | 'LOW' | 'OK';
    lawRef: string; lawText: string; scenario: string; penalty: string;
    lawyerOpinion: string; recommendation: string;
    aiFixed: string; revisionOpinion: string; legalBasis: string[];
}

const CLAUSES: Clause[] = [
    {
        num: '총칙', title: '총칙 (서문)', level: 'LOW',
        original: '(주)샐러디(이하 "당사"라 함)는 이용자의 개인정보를 중요시하며, 개인정보보호법 등 관련 법령을 준수하고 있습니다. 본 처리방침은 관련 법령 및 내부 운영방침에 따라 변경될 경우 공지사항을 통해 고지합니다.',
        riskSummary: '쟁점 낮음. 후속 조항과의 정합성 확인 필요.',
        lawRef: '개보법 §3',
        lawText: '제3조(개인정보 보호 원칙) 개인정보처리자는 개인정보의 처리 목적을 명확하게 하여야 하고, 그 목적에 필요한 범위에서 최소한의 개인정보만을 적법하고 정당하게 수집하여야 한다.',
        scenario: '서문에서 "관련 법령을 준수하고 있습니다"라고 선언하면서 실제 후속 조항에서 다수 위반 사항이 확인될 경우, 개인정보보호위원회는 이를 "형식적 준법의지만 있을 뿐 실질적 관리 부재"로 판단합니다. 이는 다른 위반 사항의 과태료 산정 시 가중 요소로 작용하며, 시정명령 공문에서 자주 인용됩니다.',
        penalty: '직접 제재 없음 (타 위반 시 가중사유)',
        lawyerOpinion: '서문 자체에 직접적인 법적 위반 요소는 없으나, 본 보고서에서 확인된 다수의 위반 사항과 모순됩니다. "관련 법령을 준수하고 있습니다"라는 선언적 문구를 사용하면서 실제로는 여러 조항에서 법령 미준수가 확인되었기 때문입니다.\n\n행정기관 조사 시 이러한 모순적 표현은 "형식적 준법의지만 있을 뿐 실질적 관리가 부재하다"는 판단의 근거가 될 수 있습니다.',
        recommendation: '후속 조항의 준법성이 확보된 후, 서문도 함께 정비하여 일관성을 유지하여야 합니다.',
        aiFixed: '(주)샐러디(이하 "당사")는 개인정보보호법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등 관련 법령을 준수하며, 본 처리방침은 법령 개정 또는 내부 정책 변경 시 홈페이지 공지사항을 통해 7일 전 사전 고지합니다.',
        revisionOpinion: '본 조항은 개인정보보호법 제3조(개인정보 보호 원칙)에 따라, 선언적 문구를 구체적 이행 약속으로 변경하였습니다. 특히 처리방침 변경 시 "7일 전 사전 고지" 의무를 명시하여, 정보주체의 알 권리를 실질적으로 보장하는 형태로 수정하였습니다.',
        legalBasis: ['개인정보보호법 제3조 (개인정보 보호 원칙)', '개인정보보호법 제30조 (개인정보 처리방침의 수립 및 공개)'],
    },
    {
        num: '제1조', title: '수집하는 개인정보 항목', level: 'HIGH',
        original: '회사는 서비스 제공을 위해 다음 개인정보를 수집합니다.\n【필수】이름, 생년월일, 성별, 로그인ID, 비밀번호, 비밀번호 질문과 답변, 자택전화번호, 자택주소, 휴대전화번호, 이메일, 직업, 회사명, 회사전화번호\n【자동수집】서비스 이용기록, 접속로그, 접속IP정보, 결제기록, 선호메뉴, 선호매장, 멤버십카드 소지여부, 쿠키, 불량 이용 기록',
        riskSummary: '① 과다수집 의심 ② "비밀번호 질문/답변" 표현 ③ 필수·선택 미분리',
        lawRef: '개보법 §16, §29',
        lawText: '제16조(개인정보의 수집 제한) ① 개인정보처리자는 제15조제1항 각 호의 어느 하나에 해당하여 개인정보를 수집하는 경우에는 그 목적에 필요한 최소한의 개인정보를 수집하여야 한다. 이 경우 최소한의 개인정보 수집이라는 입증책임은 개인정보처리자가 부담한다.',
        scenario: '개인정보보호위원회 정기감사 시 과다수집 항목이 적발되면 즉시 시정명령이 내려집니다. 최근 3년간 프랜차이즈 기업 평균 과태료는 2,800만원입니다.\n\n쿠팡의 경우 2023년 개인정보 유출로 과징금 55억원이 부과되었으며, 인터파크는 44억원이 부과되었습니다. 과다수집은 유출 시 피해 범위를 확대시키는 가중 사유입니다.\n\n또한 정보주체가 민원을 제기할 경우 집단소송으로 확대될 수 있으며, 판례상 1인당 10~30만원의 위자료가 인정되고 있어 대규모 회원 보유 기업일수록 재정적 리스크가 큽니다.',
        penalty: '과태료 최대 5,000만원 + 시정명령',
        lawyerOpinion: '개인정보보호법 제16조 제1항은 "개인정보처리자는 목적 달성에 필요한 최소한의 개인정보를 수집하여야 한다"고 규정하고 있습니다.\n\n현행 방침은 「직업, 회사명, 회사전화번호, 자택전화번호」 등 서비스 제공에 직접적 관련이 없는 항목을 \'필수\'로 분류하고 있어 과다수집에 해당할 소지가 높습니다. 특히 「비밀번호 질문과 답변」 항목은 평문 저장으로 오인될 수 있어 제29조(안전조치의무) 위반 추정의 근거가 됩니다.\n\n필수 항목과 선택 항목의 분리가 형식적으로도 이루어지지 않았으며, 이는 개인정보보호위원회의 정기 점검 시 최우선 지적 대상입니다.',
        recommendation: '필수 항목을 「이름, 로그인ID, 비밀번호, 휴대전화번호, 이메일」로 한정하고, 나머지는 선택 항목으로 분리하여야 합니다.',
        aiFixed: '【필수】이름, 로그인ID, 비밀번호, 휴대전화번호, 이메일\n【선택】생년월일, 성별, 자택주소\n【자동수집】서비스 이용기록, 접속로그, 접속IP, 쿠키\n【결제 시 추가수집】결제수단 정보, 거래내역\n\n※ 비밀번호 분실 시 본인확인은 "등록된 이메일 인증" 방식으로 처리하며, 별도 질문·답변은 수집하지 않습니다.',
        revisionOpinion: '개인정보보호법 제16조(개인정보의 수집 제한)에 따라 서비스 제공에 불필요한 항목(직업, 회사명 등)을 필수에서 제외하고 선택 항목으로 재분류하였습니다.\n\n「비밀번호 질문과 답변」은 제29조(안전조치의무) 위반 소지가 있어 이메일 인증 방식으로 대체하였습니다. 이는 개인정보보호위원회의 2024년 가이드라인에 부합하는 방식입니다.',
        legalBasis: ['개인정보보호법 제16조 (개인정보의 수집 제한)', '개인정보보호법 제29조 (안전조치의무)'],
    },
    {
        num: '제2조', title: '개인정보 수집·이용 목적', level: 'MEDIUM',
        original: '당사는 수집한 개인정보를 다음 목적에 이용합니다.\n- 서비스 제공 및 계약 이행\n- 회원 관리 및 본인 확인\n- 마케팅 및 광고 활용\n- 통계 분석',
        riskSummary: '"마케팅 및 광고 활용" 별도 동의 없이 필수 목적에 혼재.',
        lawRef: '개보법 §15, §22',
        lawText: '제22조(동의를 받는 방법) ④ 개인정보처리자는 정보주체에게 재화 또는 서비스를 홍보하거나 판매를 권유하기 위하여 개인정보의 처리에 대한 동의를 받으려는 때에는 정보주체가 이를 명확하게 인지할 수 있도록 알리고 동의를 받아야 한다.',
        scenario: '별도 동의 없이 마케팅이 진행될 경우, 정보주체가 스팸 신고를 하면 방송통신위원회 또는 개인정보보호위원회가 조사에 착수합니다. 동의 절차 흠결이 확인되면 해당 마케팅 활동 전체가 불법으로 간주될 수 있습니다.\n\n최근 프랜차이즈 업계에서는 가맹점주들이 본사의 마케팅 동의 절차 미비를 이유로 가맹계약 해지를 주장하는 사례가 증가하고 있습니다. 또한 경쟁 브랜드가 "개인정보 인증 취득"을 마케팅에 활용하면서 상대적 비교 열위에 놓일 수 있습니다.',
        penalty: '과태료 3,000만원 이하',
        lawyerOpinion: '개인정보보호법 제15조 제1항 제1호는 정보주체의 동의를 받을 때 수집·이용 목적을 명확히 알려야 한다고 규정합니다.\n\n현행 방침에서 "마케팅 및 광고 활용"을 필수 수집·이용 목적에 포함시킨 것은 문제입니다. 같은 법 제22조 제4항에 따라, 재화 또는 서비스의 홍보·판매 권유 등을 위한 개인정보 처리는 반드시 별도 동의를 받아야 합니다.\n\n현재 형태로는 필수 동의에 마케팅을 끼워넣은 "묻지마 동의(bundled consent)"로 판단될 수 있으며, 이는 동의 자체의 유효성을 훼손할 수 있습니다.',
        recommendation: '마케팅 목적을 필수 이용 목적에서 분리하고, 별도의 선택 동의 절차를 마련하여야 합니다.',
        aiFixed: '【필수 이용 목적】\n① 서비스 제공 및 계약 이행\n② 회원 관리 및 본인 확인\n③ 서비스 개선을 위한 통계 분석\n\n【선택 동의 목적 — 별도 동의 시에만 활용】\n④ 이벤트·프로모션·광고성 정보 발송 (SMS, 이메일, 앱 푸시)\n\n※ 선택 동의를 거부하시더라도 기본 서비스 이용에는 제한이 없습니다.',
        revisionOpinion: '개인정보보호법 제22조 제4항에 따라 마케팅 목적 수집·이용은 반드시 별도 동의를 받아야 합니다. 본 수정안에서는 필수 이용 목적과 선택 동의 목적을 명확히 분리하고, 선택 동의 거부 시에도 서비스 이용에 제한이 없음을 명시하였습니다.',
        legalBasis: ['개인정보보호법 제15조 (개인정보의 수집·이용)', '개인정보보호법 제22조 (동의를 받는 방법)'],
    },
    {
        num: '제3조', title: '개인정보 보유·이용 기간', level: 'MEDIUM',
        original: '당사는 개인정보 수집 및 이용 목적 달성 시 지체 없이 파기합니다.\n다만, 관계법령에 의해 보존할 경우:\n- 계약 또는 청약철회 등의 기록: 5년\n- 소비자 불만 및 분쟁처리 기록: 3년',
        riskSummary: '쿠키 삭제 주기, 비활성 계정 처리, 마케팅 철회 후 기간 미명시.',
        lawRef: '개보법 §21, 정보통신망법 §29',
        lawText: '제21조(개인정보의 파기) ① 개인정보처리자는 보유기간의 경과, 개인정보의 처리 목적 달성 등 그 개인정보가 불필요하게 되었을 때에는 지체 없이 그 개인정보를 파기하여야 한다.',
        scenario: '비활성 계정에서 개인정보 유출 사고가 발생할 경우, 불필요한 정보를 파기하지 않은 귀책사유가 더해져 손해배상 책임이 가중됩니다.\n\n최근 판례에서 1인당 10~30만원의 위자료가 인정되고 있어, 회원 10만명 기업 기준 최대 30억원 규모의 집단소송이 가능합니다.\n\n또한 대표이사 개인에 대한 민사 손해배상 청구도 병행될 수 있으며, 개보법 §74에 따라 고의·중과실 시 5년 이하 징역 또는 5,000만원 이하 벌금의 형사처벌 가능성도 있습니다.',
        penalty: '과태료 2,000만원 이하 + 시정명령',
        lawyerOpinion: '개인정보보호법 제21조 제1항은 "보유기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때 지체 없이 파기하여야 한다"고 규정합니다.\n\n현행 방침은 쿠키의 삭제 주기, 비활성 계정(장기 미이용자)의 처리 기준, 마케팅 동의 철회 후 정보 보유 기간 등 실무적으로 중요한 사항을 전혀 명시하지 않고 있습니다.\n\n특히 장기 미이용자(1년 이상 미접속) 계정의 개인정보는 별도 분리 저장하거나 파기하여야 하는데(정보통신망법 제29조), 이에 대한 기준이 없어 불필요한 정보를 장기 보관하는 결과를 초래하고 있습니다.',
        recommendation: '쿠키, 비활성 계정, 마케팅 철회 후 각각의 파기 기준과 절차를 구체적으로 명시하여야 합니다.',
        aiFixed: '【이용 목적 달성 시 즉시 파기】\n- 쿠키: 세션 쿠키는 브라우저 종료 시, 지속 쿠키는 1년 이내 자동 삭제\n- 비활성 계정: 최종 로그인일로부터 1년 경과 시 파기 (30일 전 사전 안내)\n- 마케팅 동의 철회 즉시 관련 정보 파기\n\n【법령에 따른 보존】\n- 계약·청약철회 기록: 5년 (전자상거래법)\n- 소비자 불만·분쟁 기록: 3년 (전자상거래법)\n- 접속 로그: 3개월 (통신비밀보호법)',
        revisionOpinion: '개인정보보호법 제21조 및 정보통신망법 제29조에 따라, 기존에 누락된 쿠키 삭제 주기, 비활성 계정 처리 기준, 마케팅 동의 철회 후 파기 기한을 구체적으로 명시하였습니다. 특히 비활성 계정의 경우 30일 전 사전 안내 의무를 포함하여 정보주체의 권리를 보장하였습니다.',
        legalBasis: ['개인정보보호법 제21조 (개인정보의 파기)', '정보통신망법 제29조 (개인정보의 파기)'],
    },
    {
        num: '제4조', title: '개인정보의 제3자 제공', level: 'HIGH',
        original: '당사는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 법령에 의하거나 이용자의 동의가 있는 경우 예외로 합니다.',
        riskSummary: '실제 PG사·배달앱·광고플랫폼 등 제공 현황 전면 미명시.',
        lawRef: '개보법 §17, §75',
        lawText: '제17조(개인정보의 제공) ① 개인정보처리자는 정보주체의 동의를 받은 경우, 제공받는 자의 이용 목적, 제공하는 개인정보의 항목, 제공받는 자의 보유 및 이용 기간을 정보주체에게 알려야 한다.',
        scenario: '정보주체의 민원 또는 정기감사 시 실제 제3자 제공 현황과 처리방침 간의 불일치가 확인되면, 미동의 제공으로 간주됩니다.\n\n쿠팡의 2023년 사례에서 매출액 기반 과징금 55억원이 부과되었으며, 위반사실이 개인정보보호위원회 홈페이지에 6개월간 공표됩니다. 프랜차이즈 기업의 경우 이러한 공표는 가맹점주 이탈과 소비자 신뢰 하락으로 직결됩니다.\n\n대형 납품처(학교·관공서·대기업)는 거래 업체의 개인정보 관리 인증을 요구하는 추세이며, 위반 이력이 있으면 거래 자체가 불가할 수 있습니다. 해외 진출 시에도 GDPR/CCPA 적합성이 부재하면 시장 진입 자체가 차단됩니다.',
        penalty: '과징금 매출액 3% 이하 + 시정명령 + 위반사실 공표',
        lawyerOpinion: '개인정보보호법 제17조 제1항은 제3자 제공 시 "제공받는 자, 제공 목적, 제공 항목, 보유·이용 기간"을 정보주체에게 알리고 동의를 받도록 규정하고 있습니다.\n\n그러나 귀사는 실무적으로 PG사(결제대행), 배달플랫폼, 광고 플랫폼(Meta, Google Ads) 등에 고객 정보를 전달하고 있으면서도 처리방침에 이를 전혀 명시하지 않고 있습니다. 이는 "제3자 제공 사실의 은폐"로 해석될 여지가 있어, 단순 미기재보다 중한 행정적 제재가 예상됩니다.\n\n특히 개인정보보호위원회는 2024년 이후 프랜차이즈 업종에 대한 제3자 제공 실태 집중 점검을 실시하고 있어, 위험도가 매우 높습니다.',
        recommendation: '실제 제3자 제공 현황을 조사하여 제공받는 자, 목적, 항목, 보유기간을 표 형태로 명시하여야 합니다.',
        aiFixed: '【제3자 제공 현황】\n\n| 제공받는 자 | 제공 목적 | 제공 항목 | 보유기간 |\n|---|---|---|---|\n| (주)KG이니시스 | 결제 처리 | 이름, 카드정보, 거래금액 | 결제 완료 후 5년 |\n| 배달의민족 | 주문 중계 | 이름, 연락처, 주소 | 배달 완료 후 30일 |\n| Meta (Facebook) | 광고 최적화 | 이메일 해시값 (선택동의자만) | 동의 철회 시 즉시 삭제 |\n\n※ 위 경우 외 제3자 제공 없음. 선택 동의 거부 시 광고 제공 제외.',
        revisionOpinion: '개인정보보호법 제17조에 따라 실제 제3자 제공 현황을 표 형태로 명시하였습니다. 제공받는 자, 목적, 항목, 보유기간을 구체적으로 기재하여 정보주체의 알 권리를 보장하였습니다. 특히 광고 목적 제공은 선택 동의자에 한정하고, 동의 철회 시 즉시 삭제 의무를 명시하였습니다.',
        legalBasis: ['개인정보보호법 제17조 (개인정보의 제공)', '개인정보보호법 제75조 (과태료)'],
    },
];

// ── 탭① 1차 조문검토 행 ───────────────────────────────────
function FirstReviewRow({ c, data, onChange, categories }: {
    c: Clause; data: Record<string, string>; onChange: (k: string, v: string) => void;
    categories: ScenarioCategory[];
}) {
    const col = R[c.level];
    const hasIssue = c.level !== 'OK';
    const scenarioCats = (CLAUSE_SCENARIO_MAP[c.num] || [])
        .map(id => categories.find(cat => cat.id === id && cat.enabled))
        .filter(Boolean) as ScenarioCategory[];

    return (
        <div style={{ borderBottom: '2px solid #e5e7eb', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontWeight: 800, fontSize: 11, background: col.tag, color: col.text, borderRadius: 4, padding: '2px 8px' }}>{c.num}</span>
                <span style={{ fontWeight: 900, fontSize: 13, color: '#111827' }}>{c.title}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: col.tag, color: col.text }}>{col.label}</span>
            </div>

            {hasIssue && (
                <>



                    {/* 시나리오 설명 */}
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>⚠ 위반 시 예상 시나리오</div>
                    <EditableText
                        value={data[`${c.num}_scenario`] ?? c.scenario}
                        onChange={v => onChange(`${c.num}_scenario`, v)}
                        style={{ background: '#fef2f2', borderColor: '#fecaca', marginBottom: 12 }}
                    />

                    {/* 예상 제재 + 수정 권고 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>💰 예상 제재</div>
                            <EditableText
                                value={data[`${c.num}_penalty`] ?? c.penalty}
                                onChange={v => onChange(`${c.num}_penalty`, v)}
                                style={{ background: '#fef2f2', borderColor: '#fecaca', fontWeight: 800, color: '#991b1b' }}
                            />
                        </div>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>📌 수정 권고</div>
                            <EditableText
                                value={data[`${c.num}_recommendation`] ?? c.recommendation}
                                onChange={v => onChange(`${c.num}_recommendation`, v)}
                                style={{ background: '#f0f9ff', borderColor: '#bae6fd', color: '#0c4a6e' }}
                            />
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}

// ── 탭② 전체수정완본 행 ───────────────────────────────────
function FullRevisionRow({ c, data, onChange }: {
    c: Clause; data: Record<string, string>; onChange: (k: string, v: string) => void;
}) {
    return (
        <div style={{ borderBottom: '2px solid #e5e7eb', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontWeight: 800, fontSize: 11, background: '#dcfce7', color: '#166534', borderRadius: 4, padding: '2px 8px' }}>수정완료</span>
                <span style={{ fontWeight: 900, fontSize: 13, color: '#166534' }}>{c.num} — {c.title}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#dcfce7', color: '#166534' }}>✅ 수정</span>
            </div>

            {/* ① 수정 완료본 */}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#166534', marginBottom: 4 }}>📄 수정 완료본</div>
            <EditableText
                value={data[`${c.num}_fixed`] ?? c.aiFixed}
                onChange={v => onChange(`${c.num}_fixed`, v)}
                style={{ borderColor: '#86efac', marginBottom: 12 }}
            />

            {/* ② 변호사 검토의견 */}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>⚖ 변호사 검토의견</div>
            <EditableText
                value={data[`${c.num}_revOpinion`] ?? c.revisionOpinion}
                onChange={v => onChange(`${c.num}_revOpinion`, v)}
                style={{ background: '#fffbeb', borderColor: '#fde68a', marginBottom: 12 }}
            />

            {/* ③ 수정 근거 */}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>📋 수정 근거</div>
            <div style={{ fontSize: 12, color: '#1e40af', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '8px 12px', lineHeight: 1.7 }}>
                {c.legalBasis.map((b, i) => <div key={i}>· {b}</div>)}
            </div>

        </div>
    );
}

// ── 메인 ──────────────────────────────────────────────────
export default function PrivacyReviewPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        }>
            <PrivacyReviewContent />
        </Suspense>
    );
}

function PrivacyReviewContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { loading, authorized } = useRequireAuth(['super_admin', 'admin', 'lawyer', 'sales']);
    const { settings: autoSettings } = useAutoSettings();
    const company = searchParams?.get('company') || '(주)샐러디';
    const leadId = searchParams?.get('leadId') || undefined;
    const [tab, setTab] = useState<'first' | 'full'>('first');
    const [data, setData] = useState<Record<string, string>>({});
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [confirmedTab, setConfirmedTab] = useState<'first' | 'full' | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [categories, setCategories] = useState<ScenarioCategory[]>(DEFAULT_SCENARIO_CATEGORIES);
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [requestingFiles, setRequestingFiles] = useState(false);
    const [docsList, setDocsList] = useState({ contract: false, rules: false, security: false, other: false });
    const [customReqMsg, setCustomReqMsg] = useState('');
    const [toastMsg, setToastMsg] = useState('');
    const [clauses, setClauses] = useState<Clause[]>(CLAUSES);
    const [fetching, setFetching] = useState(true);
    const t0 = useRef(Date.now());

    // ── 레거시 데이터를 위한 법조문 원문 폴백 (PDF 내용 기반) ───────────────────────
    const getFallbackLawText = (lawRef: string = ''): string => {
        if (!lawRef) return '알 수 없는 법령 참조입니다.';
        if (lawRef.includes('§15') || lawRef.includes('제15조')) {
            return '개인정보보호법 제15조(개인정보의 수집·이용) ① 개인정보처리자는 다음 각 호의 어느 하나에 해당하는 경우에는 그 목적에 필요한 최소한의 개인정보를 수집할 수 있으며, 수집한 목적의 범위에서 이용할 수 있다. 1. 정보주체의 동의를 받은 경우 ...';
        }
        if (lawRef.includes('§16') || lawRef.includes('제16조')) {
            return '개인정보보호법 제16조(개인정보의 수집 제한) ① 개인정보처리자는 제15조제1항 각 호의 어느 하나에 해당하여 개인정보를 수집하는 경우에는 그 목적에 필요한 최소한의 개인정보를 수집하여야 한다. 이 경우 최소한의 개인정보 수집이라는 입증책임은 개인정보처리자가 부담한다.';
        }
        if (lawRef.includes('§17') || lawRef.includes('제17조')) {
            return '개인정보보호법 제17조(개인정보의 제공) ① 개인정보처리자는 다음 각 호의 어느 하나에 해당하는 경우에는 정보주체의 개인정보를 제3자에게 제공(공유를 포함한다. 이하 같다)할 수 있다. 1. 정보주체의 동의를 받은 경우 ...';
        }
        if (lawRef.includes('§21') || lawRef.includes('제21조')) {
            return '개인정보보호법 제21조(개인정보의 파기) ① 개인정보처리자는 보유기간의 경과, 개인정보의 처리 목적 달성 등 그 개인정보가 불필요하게 되었을 때에는 지체 없이 그 개인정보를 파기하여야 한다. 다만, 다른 법령에 따라 보존하여야 하는 경우에는 그러하지 아니하다.';
        }
        if (lawRef.includes('§22') || lawRef.includes('제22조')) {
            return '개인정보보호법 제22조(동의를 받는 방법) ④ 개인정보처리자는 정보주체에게 재화 또는 서비스를 홍보하거나 판매를 권유하기 위하여 개인정보의 처리에 대한 동의를 받으려는 때에는 정보주체가 이를 명확하게 인지할 수 있도록 알리고 동의를 받아야 한다.';
        }
        if (lawRef.includes('§29') || lawRef.includes('제29조')) {
            return '개인정보보호법 제29조(안전조치의무) 개인정보처리자는 개인정보가 분실·도난·유출·위조·변조 또는 훼손되지 아니하도록 내부 관리계획 수립, 접속기록 보관 등 대통령령으로 정하는 바에 따라 안전성 확보에 필요한 기술적·관리적 및 물리적 조치를 하여야 한다.';
        }
        if (lawRef.includes('§3') || lawRef.includes('제3조')) {
            return '개인정보보호법 제3조(개인정보 보호 원칙) ① 개인정보처리자는 개인정보의 처리 목적을 명확하게 하여야 하고, 그 목적에 필요한 최소한의 개인정보만을 적법하고 정당하게 수집하여야 한다.';
        }
        return `해당 조항(${lawRef})의 구체적인 제정 내용은 개인정보보호법 원문을 참고하시기 바랍니다.`;
    };

    useEffect(() => {
        setCategories(getScenarioCategories());
        
        if (leadId) {
            supabaseCompanyStore.getById(leadId).then((data: any) => {
                if (data && data.issues && data.issues.length > 0) {
                    const mapped = data.issues.map((iss: any, i: number) => {
                        const anyIss = iss;
                        const lawRef = iss.law || anyIss.lawRef || '';
                        const isMissing = anyIss.title === '개인정보처리방침 누락 (매우 심각)' || anyIss.title?.includes('방침 누락') || anyIss.title?.includes('방침 부재') || anyIss.originalText?.includes('없음 / 미기재');
                        return {
                            num: `조항 ${i + 1}`,
                            title: anyIss.title || anyIss.lawTitle || iss.law || '이슈',
                            original: anyIss.originalText || anyIss.originalContent || '',
                            riskSummary: isMissing ? '■ 개인정보 보호 조치의 "원시적 불능" 상태\n법정 필수 공개 문서인 처리방침이 존재하지 않아, 고객은 자신의 데이터가 어떻게 쓰이는지 알 권리를 원천 박탈당했습니다. 이는 귀사의 모든 데이터 수집 활동을 불법으로 간주하게 만드는 핵심 위반 쟁점입니다.' : (anyIss.riskDesc || anyIss.riskSummary || ''),
                            level: (anyIss.level || anyIss.riskLevel || 'HIGH') as any,
                            lawRef: lawRef,
                            lawText: anyIss.lawText || (isMissing ? '제30조(개인정보 처리방침의 수립 및 공개) ① 개인정보처리자는 개인정보를 처리하는 경우에는 개인정보 처리방침을 정하여야 한다. ② 제1항에 따른 개인정보 처리방침을 수립하거나 변경하는 경우에는 정보주체가 쉽게 확인할 수 있도록 공개하여야 한다.' : getFallbackLawText(lawRef)),
                            scenario: isMissing ? '🚨 [최악의 시나리오 전개]\n① 블랙 컨슈머 또는 경쟁사가 KISA에 "개인정보 무단 수집"으로 악의적 신고.\n② 규제 당국의 조사관이 방침 누락 확인 후 "고의적 은폐"로 간주하여 고강도 전체 감사로 확대.\n③ 방어할 법적 근거가 단 하나도 없어, 보유한 전체 고객 데이터에 비례하는 천문학적 과징금 철퇴 및 영업 정지 위기 직면.' : (anyIss.scenario || ''),
                            penalty: isMissing ? '징벌적 과징금(전체 매출액의 최대 3%) + 최고 책임자 징역/벌금형 + 위반 사실 대국민 공표' : (anyIss.penalty || ''),
                            lawyerOpinion: anyIss.lawyerNote || anyIss.revisionOpinion || '',
                            recommendation: isMissing ? '[즉시 도입 요망] 제공된 IBS 긴급 제정 초안을 당장 복사하여, 귀사 웹사이트 하단(Footer)에 "개인정보 처리방침"이라는 이름으로 굵고 명확한 하이퍼링크를 통해 즉각 노출하십시오.' : (anyIss.recommendation || iss.customDraft || ''),
                            aiFixed: anyIss.aiFixed || iss.customDraft || '',
                            revisionOpinion: isMissing ? '사업을 영위함에 있어 가장 기초적이고 절대로 누락되어서는 안 될 핵심 법적 의무를 위반하고 있는 "매우 치명적인 상황"입니다. 처벌 리스크 방어를 위해 오늘 당장 제정안을 마련해야 합니다.' : (anyIss.revisionOpinion || ''),
                            legalBasis: Array.isArray(anyIss.legalBasis) ? anyIss.legalBasis : (isMissing ? ['개인정보 보호법 제30조 (개인정보 처리방침의 수립 및 공개)', '개인정보 보호법 제75조 (과태료)'] : [anyIss.legalBasis || iss.law || '']),
                        } as Clause;
                    });
                    setClauses(mapped);
                } else {
                    setClauses([]);
                }
                setFetching(false);
            });
        } else {
            setFetching(false);
        }
    }, [leadId]);

    useEffect(() => {
        const id = setInterval(() => setElapsed(Math.floor((Date.now() - t0.current) / 1000)), 1000);
        return () => clearInterval(id);
    }, []);

    if (fetching || loading || !authorized) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: 14, color: '#6b7280' }}>로딩 중...</div></div>;

    const upd = (k: string, v: string) => setData(p => ({ ...p, [k]: v }));
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(elapsed % 60).padStart(2, '0');
    const timerCol = elapsed > 60 ? '#dc2626' : elapsed > 40 ? '#d97706' : '#16a34a';
    const highN = clauses.filter(c => c.level === 'HIGH').length;
    const medN = clauses.filter(c => c.level === 'MEDIUM').length;

    // 전체수정완본 탭 클릭 시 AI 생성 시뮬레이션
    const handleFullTab = () => {
        setTab('full');
        if (!generated) {
            setGenerating(true);
            setTimeout(() => { setGenerating(false); setGenerated(true); }, 2000);
        }
    };

    const handleDownloadPDF = () => {
        window.print();
    };

    const handleSendRequest = () => {
        setRequestingFiles(true);
        setTimeout(() => {
            setRequestingFiles(false);
            setRequestModalOpen(false);
            setToastMsg('고객사에 추가 서류 요청이 발송되었습니다');
            setDocsList({ contract: false, rules: false, security: false, other: false });
            setCustomReqMsg('');
            setTimeout(() => setToastMsg(''), 3000);
        }, 1500);
    };

    // ── 1차 조문검토 컨펌 ────────────────────────────────────────
    // 변호사 컨펌 = "조문 검토됨" 상태를 기록하는 것이 전부
    // → 영업팀이 CRM에서 확인 후 이메일 미리보기 → 발송 (영업팀 역할)
    const handleFirstConfirm = async () => {
        setConfirming(true);
        try {
            if (leadId) {
                console.log('[handleFirstConfirm] Updating Supabase row for lead:', leadId);
                
                const newIssues = clauses.filter(c => c.level !== 'OK').map(c => ({
                    level: c.level as 'HIGH' | 'MEDIUM' | 'LOW',
                    law: c.lawRef,
                    title: c.title,
                    originalText: c.original,
                    riskDesc: data[`${c.num}_risk`] ?? c.riskSummary,
                    customDraft: data[`${c.num}_fixed`] ?? c.aiFixed,
                    lawyerNote: data[`${c.num}_revOpinion`] ?? c.revisionOpinion ?? data[`${c.num}_opinion`] ?? c.lawyerOpinion,
                    scenario: c.scenario,
                    penalty: c.penalty,
                    recommendation: c.recommendation,
                    lawText: c.lawText,
                    reviewChecked: true,
                    aiDraftGenerated: true
                }));

                await supabaseCompanyStore.update(leadId, { 
                    lawyerConfirmed: true, 
                    lawyerConfirmedAt: new Date().toISOString(),
                    status: 'lawyer_confirmed',
                    issues: newIssues as any
                });
                console.log('[handleFirstConfirm] Successfully updated lawyerConfirmed, status, and issues.');

                if (autoSettings?.autoSendEmail) {
                    try {
                        const emailRes = await fetch('/api/email', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ type: 'company_hook', leadId, customSubject: `[IBS 법률] ${company} 개인정보처리방침 리스크 진단 결과` }),
                        });
                        console.log('[handleFirstConfirm] autoSendEmail response:', emailRes.status);
                        await supabaseCompanyStore.update(leadId, { status: 'emailed', emailSentAt: new Date().toISOString() });
                    } catch(e) {
                         console.error('[handleFirstConfirm] Auto email send failed:', e);
                    }
                } else {
                    try {
                        const emailRes = await fetch('/api/email', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ type: 'clause_review_done', leadId, company, highRiskCount: highN, medRiskCount: medN }),
                        });
                        console.log('[handleFirstConfirm] clause_review_done email response:', emailRes.status);
                    } catch(e) {
                        console.error('[handleFirstConfirm] clause_review_done email failed:', e);
                    }
                }

                alert('CRM 반영이 성공적으로 완료되었습니다.');
                
                // 다음 검토 대기 기업 확인
                const allCompanies = await supabaseCompanyStore.getAll();
                const nextPending = allCompanies.find((c: any) => 
                    ['assigned', 'reviewing'].includes(c.status) && c.id !== leadId
                );

                if (nextPending) {
                    router.push(`/lawyer/privacy-review?leadId=${nextPending.id}&company=${encodeURIComponent(nextPending.name)}`);
                } else {
                    router.push('/lawyer');
                }
            } else {
                setConfirmedTab('first');
            }
        } catch (error) {
            console.error('[handleFirstConfirm] Critical Error updating Supabase:', error);
            alert('데이터베이스 반영 중 오류가 발생했습니다. 개발자 콘솔을 확인해주세요.');
        } finally {
            setConfirming(false);
        }
    };

    // ── 전체수정완본 컨펌 ────────────────────────────────────────
    // 계약 완료 후 변호사가 최종 완본 컨펌 → 고객 HR 문서함으로 자동 전달
    const handleFullConfirm = async () => {
        setConfirming(true);
        try {
            if (leadId) {
                const newIssues = clauses.filter(c => c.level !== 'OK').map(c => ({
                    level: c.level as 'HIGH' | 'MEDIUM' | 'LOW',
                    law: c.lawRef,
                    title: c.title,
                    originalText: c.original,
                    riskDesc: data[`${c.num}_risk`] ?? c.riskSummary,
                    customDraft: data[`${c.num}_fixed`] ?? c.aiFixed,
                    lawyerNote: data[`${c.num}_revOpinion`] ?? c.revisionOpinion ?? data[`${c.num}_opinion`] ?? c.lawyerOpinion,
                    scenario: c.scenario,
                    penalty: c.penalty,
                    recommendation: c.recommendation,
                    lawText: c.lawText,
                    reviewChecked: true,
                    aiDraftGenerated: true
                }));

                await supabaseCompanyStore.update(leadId, { 
                    issues: newIssues as any
                });
            }

            const res = await fetch('/api/email', {
                method: 'POST', headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    type: 'full_revision_to_client',
                    leadId: leadId || 'lead_001',
                    company,
                    revisionData: data,
                    documentTitle: `${company} 개인정보처리방침 수정완본`,
                    documentNo: `IBS-PR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
                }),
            });
            console.log('[handleFullConfirm] Email response:', res.status);
            setConfirmedTab('full');
        } catch(error) { 
            console.error('[handleFullConfirm] Error:', error);
            alert('오류가 발생했습니다. 다시 시도해주세요.'); 
        } finally {
            setConfirming(false);
        }
    };

    // ── 컨펌 완료 화면 ───────────────────────────────────────────
    if (confirmedTab === 'first') return (
        <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', background: '#fff', borderRadius: 20, padding: '48px 64px', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', maxWidth: 460 }}>
                <CheckCircle2 size={56} color="#16a34a" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', margin: '0 0 6px' }}>1차 조문검토 컨펌 완료</h2>
                <p style={{ color: '#374151', margin: '0 0 20px', fontWeight: 700, fontSize: 15 }}>{company}</p>
                {/* 다음 단계 안내 — 영업팀 역할 */}
                <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 8, letterSpacing: 0.5 }}>다음 단계 (영업팀)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</span>
                            <span style={{ fontSize: 12, color: '#374151' }}>변호사 1차 조문검토 완료 — CRM 반영됨</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
                            <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>영업팀 → 이메일 미리보기 확인</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</span>
                            <span style={{ fontSize: 12, color: '#374151' }}>영업팀 → 고객에게 이메일 발송</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button onClick={() => { setConfirmedTab(null); setTab('full'); }} style={{ background: '#f8f9fc', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>전체수정완본 보기</button>
                    <Link href="/lawyer"><button style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>변호사 대시보드 →</button></Link>
                </div>
            </div>
        </div>
    );

    if (confirmedTab === 'full') return (
        <div style={{ minHeight: '100vh', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', background: '#fff', borderRadius: 20, padding: '48px 64px', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', maxWidth: 460 }}>
                <FileText size={56} color="#2563eb" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1d4ed8', margin: '0 0 6px' }}>수정완본 고객 전달 완료</h2>
                <p style={{ color: '#374151', margin: '0 0 20px', fontWeight: 700 }}>{company}</p>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
                    <div style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 700, marginBottom: 6 }}>📤 고객 HR 문서함으로 전달됨</div>
                    <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.8 }}>
                        · {company} 개인정보처리방침 수정완본<br />
                        · 변호사 검토의견서 포함<br />
                        · 고객 대시보드 문서함에서 확인 가능
                    </div>
                </div>
                <Link href="/lawyer"><button style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>변호사 대시보드 →</button></Link>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
            <style>{`
                @media print {
                    @page { size: A4; margin: 15mm; }
                    body, html { background: #fff !important; }
                    aside, nav, header:not(.print-header), footer, #sidebar, .sidebar { display: none !important; }
                    main, #__next, body > div, .main-content { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
                    .no-print { display: none !important; }
                    .print-row { page-break-inside: avoid; break-inside: avoid; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
            {/* ── 상단 헤더 ── */}
            <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 100, background: '#1e3a8a', borderBottom: '3px solid #2563eb', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link href="/lawyer"><button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', color: '#e0e7ff', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}><ArrowLeft size={13} /> 목록</button></Link>
                    <div>
                        <span style={{ fontWeight: 900, color: '#fff', fontSize: 15 }}>{company}</span>
                        <span style={{ color: '#93c5fd', fontSize: 13, marginLeft: 10 }}>개인정보처리방침 검토</span>
                        <span style={{ color: '#fca5a5', fontSize: 12, marginLeft: 10 }}>🔴 {highN}건</span>
                        <span style={{ color: '#fcd34d', fontSize: 12, marginLeft: 6 }}>🟡 {medN}건</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 14px' }}>
                        <Clock size={13} color={timerCol} />
                        <span style={{ fontWeight: 900, color: timerCol, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{mm}:{ss}</span>
                    </div>
                    
                    <button onClick={handleDownloadPDF}
                        className="no-print"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 9, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <Download size={15} />
                        PDF 다운로드
                    </button>

                    {/* 탭별 다른 컨펌 버튼 */}
                    {tab === 'first' ? (
                        <button onClick={handleFirstConfirm} disabled={confirming}
                            title="조문검토 결과를 영업팀 CRM과 고객 프라이버시 리포트에 자동 반영합니다"
                            style={{ display: 'flex', alignItems: 'center', gap: 7, background: confirming ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 24px', fontWeight: 900, fontSize: 14, cursor: confirming ? 'not-allowed' : 'pointer', boxShadow: '0 2px 12px rgba(22,163,74,0.4)' }}>
                            <CheckCircle2 size={16} />
                            {confirming ? '반영 중...' : '✅ 조문검토 컨펌 → CRM 반영'}
                        </button>
                    ) : (
                        <button onClick={handleFullConfirm} disabled={confirming}
                            title="수정완본을 고객 HR 문서함으로 전달합니다 (계약 완료 후 사용)"
                            style={{ display: 'flex', alignItems: 'center', gap: 7, background: confirming ? '#93c5fd' : '#1d4ed8', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 24px', fontWeight: 900, fontSize: 14, cursor: confirming ? 'not-allowed' : 'pointer', boxShadow: '0 2px 12px rgba(29,78,216,0.4)' }}>
                            <FileText size={16} />
                            {confirming ? '전달 중...' : '📤 완본 컨펌 → 고객 HR 전달'}
                        </button>
                    )}
                </div>
            </div>

            {/* ── 컬럼 헤더 (좌: 고정 / 우: 탭) ── */}
            <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'sticky', top: 58, zIndex: 90 }}>
                <div style={{ padding: '10px 20px', background: '#1e40af', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#bfdbfe', letterSpacing: 1 }}>📖 원문 + 법조문</span>
                </div>
                <div style={{ display: 'flex' }}>
                    <button onClick={() => setTab('first')} style={{
                        flex: 1, padding: '10px 16px', fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        background: tab === 'first' ? 'linear-gradient(135deg, #16a34a, #15803d)' : '#1e40af',
                        color: tab === 'first' ? '#fff' : '#93c5fd',
                        borderBottom: tab === 'first' ? '3px solid #4ade80' : '3px solid transparent',
                    }}>
                        📋 1차 조문검토
                    </button>
                    <button onClick={handleFullTab} style={{
                        flex: 1, padding: '10px 16px', fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        background: tab === 'full' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#1e40af',
                        color: tab === 'full' ? '#fff' : '#93c5fd',
                        borderBottom: tab === 'full' ? '3px solid #60a5fa' : '3px solid transparent',
                    }}>
                        📄 전체수정완본
                    </button>
                </div>
            </div>

            {/* ── 조문별 행 (좌우 정렬) ── */}
            {tab === 'first' ? (
                <>
                    {/* 종합 검토의견 (우측 첫 행) */}
                    <div className="print-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '3px solid #d97706' }}>
                        <div style={{ padding: '16px 18px', background: '#fafafa', borderRight: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                                <Scale size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                                <div style={{ fontSize: 12, fontWeight: 700 }}>← 원문 조항별 검토</div>
                                <div style={{ fontSize: 11, marginTop: 2 }}>아래에서 각 조문을 확인하세요</div>
                            </div>
                        </div>
                        <div style={{ padding: '16px 18px', background: '#fffbeb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <span style={{ fontSize: 18 }}>⚖</span>
                                <span style={{ fontSize: 15, fontWeight: 900, color: '#92400e' }}>종합 검토의견</span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: 20 }}>프라이버시 리포트 반영</span>
                            </div>
                            <EditableText
                                value={data['summary_opinion'] ?? (
                                    clauses.length === 1 && (clauses[0].title === '개인정보처리방침 누락 (매우 심각)' || clauses[0].title?.includes('방침 누락') || clauses[0].title?.includes('방침 부재') || clauses[0].original?.includes('없음 / 미기재'))
                                    ? '[긴급 법무 검토 요망] 귀사는 고객의 개인정보를 수집·처리하고 있음에도 불구하고, 이를 규제하는 "개인정보 처리방침" 자체가 전면 누락되어 있습니다. 이는 단순한 행정적 절차 누락이 아닌, 기업의 준법 경영 의지가 전혀 없는 것으로 간주되는 최고 수준의 리스크입니다.\n\n단 한 건의 해킹 사고나 악성 고객의 피싱/신고만으로도 귀사의 수집 행위 전체가 즉시 탈법으로 간주되며, 어떠한 법리적 방어권도 행사할 수 없습니다. 대표이사 형사고발, 막대한 징벌적 과징금 타격, 언론 보도로 인한 기업 신뢰도 추락을 막기 위해 오늘 당장 KISA 가이드라인에 부합하는 방침 제정 및 적용이 필수적입니다.'
                                    : `귀사의 개인정보처리방침을 검토한 결과, 개인정보보호법상 시정이 필요한 사항 ${CLAUSES.filter(c => c.level === 'HIGH').length + CLAUSES.filter(c => c.level === 'MEDIUM').length}건이 확인되었습니다. 특히 개인정보 수집 항목의 과다수집(제16조 위반), 제3자 제공 현황 미명시(제17조 위반) 등 고위험 사항 ${CLAUSES.filter(c => c.level === 'HIGH').length}건은 개인정보보호위원회 정기감사 시 즉시 시정명령 및 과징금 부과 대상에 해당합니다. 최근 쿠팡 55억원, 인터파크 44억원 등 대규모 과징금 사례가 이어지고 있어 조속한 시정이 필요합니다.`
                                )}
                                onChange={v => upd('summary_opinion', v)}
                                style={{ background: '#ffffff', borderColor: '#fde68a', fontSize: 13 }}
                                minRows={2}
                            />
                        </div>
                    </div>
                    {clauses.map((c, i) => {
                    const col = R[c.level];
                    const hasIssue = c.level !== 'OK';
                    return (
                        <div key={i} className="print-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #d1d5db' }}>
                            {/* 좌: 원문 */}
                            <div style={{ padding: '20px', borderLeft: `4px solid ${col.border}`, borderRight: '1px solid #e5e7eb', background: hasIssue ? col.bg : '#fafafa', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* 1. 위반 기준 (법령) */}
                                <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <div style={{ background: '#fef3c7', borderBottom: '1px solid #fde68a', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Scale size={15} color="#d97706" />
                                        <span style={{ fontWeight: 800, fontSize: 13, color: '#92400e' }}>위반 법조문: {c.lawRef || '법령 정보 없음'}</span>
                                    </div>
                                    <div style={{ padding: '14px 16px', fontSize: 12, color: '#44403c', lineHeight: 1.8, whiteSpace: 'pre-line', background: '#fffbeb' }}>
                                        {c.lawText || '법조문 텍스트가 전달되지 않았습니다.'}
                                    </div>
                                </div>
                                
                                {/* 2. 회사 원문 (비교 대상) */}
                                <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <div style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <FileText size={15} color="#475569" />
                                            <span style={{ fontWeight: 800, fontSize: 13, color: '#334155' }}>고객사 방침 원문</span>
                                        </div>
                                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: col.tag, color: col.text, border: `1px solid ${col.border}` }}>
                                            {c.title || c.num}
                                        </span>
                                    </div>
                                    <div style={{ padding: '14px 16px', fontSize: 13, color: '#1e293b', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                                        {c.original || '회사 방침 원본 데이터가 전달되지 않았습니다.'}
                                    </div>
                                </div>

                                {/* 3. 진단 요약 */}
                                {hasIssue && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: col.tag, border: `1px solid ${col.border}40`, borderRadius: 8, padding: '12px 16px' }}>
                                        <div style={{ fontSize: 16 }}>🎯</div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: col.text, marginBottom: 4 }}>위반 쟁점 요약</div>
                                            <div style={{ fontSize: 12, color: col.text, lineHeight: 1.6, fontWeight: 600 }}>{c.riskSummary}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* 우: 1차 조문검토 */}
                            <div style={{ background: '#f9fafb' }}>
                                <FirstReviewRow c={c} data={data} onChange={upd} categories={categories} />
                            </div>
                        </div>
                    );
                })
                    }
                </>
            ) : generating ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    <div style={{ padding: '80px 20px', background: '#fafafa', borderRight: '1px solid #e5e7eb', textAlign: 'center', color: '#9ca3af' }}>
                        <Scale size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                        <div style={{ fontSize: 12, fontWeight: 700 }}>원문은 좌측에 그대로 표시됩니다</div>
                    </div>
                    <div style={{ padding: '80px 40px', textAlign: 'center' }}>
                        <Loader2 size={40} color="#2563eb" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                        <p style={{ fontSize: 16, fontWeight: 900, color: '#1d4ed8', marginBottom: 4 }}>AI 의견서 생성 중...</p>
                        <p style={{ fontSize: 13, color: '#6b7280' }}>변호사 페르소나로 법률 의견서를 작성하고 있습니다</p>
                        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                    </div>
                </div>
            ) : (
                <>
                    {clauses.map((c, i) => {
                        const col = R[c.level];
                        const hasIssue = c.level !== 'OK';
                        return (
                            <div key={i} className="print-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #d1d5db' }}>
                                {/* 좌: 원문 + 법조문 (1차조문검토와 동일) */}
                                <div style={{ padding: '20px', borderLeft: `4px solid ${col.border}`, borderRight: '1px solid #e5e7eb', background: hasIssue ? col.bg : '#fafafa', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {/* 1. 위반 기준 (법령) */}
                                    <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                        <div style={{ background: '#fef3c7', borderBottom: '1px solid #fde68a', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Scale size={15} color="#d97706" />
                                            <span style={{ fontWeight: 800, fontSize: 13, color: '#92400e' }}>위반 법조문: {c.lawRef || '법령 정보 없음'}</span>
                                        </div>
                                        <div style={{ padding: '14px 16px', fontSize: 12, color: '#44403c', lineHeight: 1.8, whiteSpace: 'pre-line', background: '#fffbeb' }}>
                                            {c.lawText || '법조문 텍스트가 전달되지 않았습니다.'}
                                        </div>
                                    </div>
                                    
                                    {/* 2. 회사 원문 (비교 대상) */}
                                    <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                        <div style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <FileText size={15} color="#475569" />
                                                <span style={{ fontWeight: 800, fontSize: 13, color: '#334155' }}>고객사 방침 원문</span>
                                            </div>
                                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: col.tag, color: col.text, border: `1px solid ${col.border}` }}>
                                                {c.title || c.num}
                                            </span>
                                        </div>
                                        <div style={{ padding: '14px 16px', fontSize: 13, color: '#1e293b', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                                            {c.original || '회사 방침 원본 데이터가 전달되지 않았습니다.'}
                                        </div>
                                    </div>
                                </div>
                                {/* 우: 수정완본 (의견서 스타일) */}
                                <div style={{ background: '#f9fafb' }}>
                                    {i === 0 && (
                                        <div style={{ background: '#0f172a', padding: '14px 18px', color: '#fff' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: 15, fontWeight: 900, color: '#c9a84c' }}>⚖️ IBS 법률사무소</div>
                                                    <div style={{ fontSize: 10, color: '#94a3b8' }}>개인정보보호 전문 법률 의견서</div>
                                                </div>
                                                <div style={{ textAlign: 'right', fontSize: 10, color: '#94a3b8' }}>
                                                    <div>문서번호: IBS-PR-{new Date().getFullYear()}-{String(Math.floor(Math.random() * 1000)).padStart(3, '0')}</div>
                                                    <div>작성일: {new Date().toLocaleDateString('ko-KR')}</div>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: 8, fontSize: 12, color: '#e2e8f0' }}>
                                                수신: <strong>{company}</strong> 귀중
                                            </div>
                                        </div>
                                    )}
                                    <FullRevisionRow c={c} data={data} onChange={upd} />
                                </div>
                            </div>
                        );
                    })}
                    {/* 서명란 (우측에만) */}
                    <div className="print-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                        <div style={{ background: '#fafafa', borderRight: '1px solid #e5e7eb' }} />
                        <div style={{ padding: '20px 18px', background: '#fff', borderTop: '2px solid #e5e7eb' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>위와 같이 검토 의견을 제출합니다.</div>
                                <div style={{ fontSize: 15, fontWeight: 900, color: '#1e293b', marginBottom: 2 }}>IBS 법률사무소</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>담당 변호사: 김수현</div>
                                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>대한변호사협회 등록 | 개인정보관리사(CPPG)</div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* 추가 자료 요청 모달 */}
            <AnimatePresence>
                {requestModalOpen && (
                    <div className="no-print" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setRequestModalOpen(false)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            style={{ position: 'relative', width: 440, background: '#fff', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}
                        >
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FilePlus size={18} color="#2563eb" />
                                    추가 자료 요청
                                </h3>
                                <button onClick={() => setRequestModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div style={{ padding: 24 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12 }}>요청할 누락 서류 선택 (다중 선택 가능)</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                                    {[
                                        { id: 'contract', label: '근로계약서' },
                                        { id: 'rules', label: '취업규칙' },
                                        { id: 'security', label: '보안서약서' },
                                        { id: 'other', label: '기타 추가 문서' },
                                    ].map(item => (
                                        <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1e293b', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={(docsList as any)[item.id]} onChange={e => setDocsList(p => ({ ...p, [item.id]: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#2563eb' }} />
                                            {item.label}
                                        </label>
                                    ))}
                                </div>
                                
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>추가 요청 메시지</div>
                                <textarea
                                    value={customReqMsg}
                                    onChange={e => setCustomReqMsg(e.target.value)}
                                    placeholder="고객사에 전달할 상세 요청사항을 입력하세요..."
                                    style={{ width: '100%', height: 100, padding: 12, border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, color: '#1e293b', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#f8fafc' }}>
                                <button onClick={() => setRequestModalOpen(false)} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>취소</button>
                                <button
                                    onClick={handleSendRequest}
                                    disabled={requestingFiles}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', border: 'none', background: '#2563eb', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: requestingFiles ? 'not-allowed' : 'pointer' }}
                                >
                                    {requestingFiles ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <FilePlus size={16} />}
                                    {requestingFiles ? '발송 중...' : '요청 발송'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast 알림 */}
            <AnimatePresence>
                {toastMsg && (
                    <motion.div
                        className="no-print"
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 50, x: '-50%' }}
                        style={{ position: 'fixed', bottom: 40, left: '50%', background: '#1e293b', color: '#fff', padding: '14px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, zIndex: 10000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <CheckCircle2 size={18} color="#4ade80" />
                        {toastMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 추가 자료 요청 FAB */}
            <button
                className="no-print"
                onClick={() => setRequestModalOpen(true)}
                style={{
                    position: 'fixed', right: 32, bottom: 32, zIndex: 9000,
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#0f172a', color: '#fff', border: 'none', borderRadius: 30,
                    padding: '14px 24px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.3)',
                    transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <FilePlus size={18} />
                추가 자료 요청
            </button>
        </div>
    );
}
