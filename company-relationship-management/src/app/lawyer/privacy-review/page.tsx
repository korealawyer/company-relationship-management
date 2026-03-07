'use client';
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, ArrowLeft, Scale, MessageSquare, List } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ── 업무용 색상 ────────────────────────────────────────────────
const R: Record<string, { border: string; bg: string; tag: string; text: string; label: string }> = {
    HIGH: { border: '#dc2626', bg: '#fef2f2', tag: '#fee2e2', text: '#991b1b', label: '🔴 고위험' },
    MEDIUM: { border: '#d97706', bg: '#fffbeb', tag: '#fef3c7', text: '#92400e', label: '🟡 주의' },
    LOW: { border: '#2563eb', bg: '#eff6ff', tag: '#dbeafe', text: '#1e40af', label: '🔵 저위험' },
    OK: { border: '#16a34a', bg: '#f0fdf4', tag: '#dcfce7', text: '#166534', label: '✅ 양호' },
};

// ── 조문 데이터 ────────────────────────────────────────────────
interface Clause {
    num: string; title: string; original: string;
    riskSummary: string; level: 'HIGH' | 'MEDIUM' | 'LOW' | 'OK';
    lawRef: string; scenario: string;
    aiFixed: string;       // AI 수정완료본 (신규)
}

const CLAUSES: Clause[] = [
    {
        num: '총칙', title: '총칙 (서문)', level: 'LOW',
        original: '(주)샐러디(이하 "당사"라 함)는 이용자의 개인정보를 중요시하며, 개인정보보호법 등 관련 법령을 준수하고 있습니다. 본 처리방침은 관련 법령 및 내부 운영방침에 따라 변경될 경우 공지사항을 통해 고지합니다.',
        riskSummary: '쟁점 낮음. 후속 조항과의 정합성 확인 필요.',
        lawRef: '개보법 §3',
        scenario: '후속 조항 구식 시 "준수" 선언만 남아 관리부실 프레임.',
        aiFixed: '(주)샐러디(이하 "당사")는 개인정보보호법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등 관련 법령을 준수하며, 본 처리방침은 법령 개정 또는 내부 정책 변경 시 홈페이지 공지사항을 통해 7일 전 사전 고지합니다.',
    },
    {
        num: '제1조', title: '수집하는 개인정보 항목', level: 'HIGH',
        original: '회사는 서비스 제공을 위해 다음 개인정보를 수집합니다.\n【필수】이름, 생년월일, 성별, 로그인ID, 비밀번호, 비밀번호 질문과 답변, 자택전화번호, 자택주소, 휴대전화번호, 이메일, 직업, 회사명, 회사전화번호\n【자동수집】서비스 이용기록, 접속로그, 접속IP정보, 결제기록, 선호메뉴, 선호매장, 멤버십카드 소지여부, 쿠키, 불량 이용 기록',
        riskSummary: '① 과다수집 의심 ② "비밀번호 질문/답변" 표현 ③ 필수·선택 미분리',
        lawRef: '개보법 §16',
        scenario: '자택전화·직업·회사명 등 서비스 불필요 항목 필수 수집 → 행정지도 대상.\n"비밀번호 질문/답변" 평문저장 오해 → §29 안전조치 이슈.\n고지-UI 불일치 발생 시 민원 즉시 제기 가능.',
        aiFixed: '【필수】이름, 로그인ID, 비밀번호, 휴대전화번호, 이메일\n【선택】생년월일, 성별, 자택주소\n【자동수집】서비스 이용기록, 접속로그, 접속IP, 쿠키\n【결제 시 추가수집】결제수단 정보, 거래내역\n\n※ 비밀번호 분실 시 본인확인은 "등록된 이메일 인증" 방식으로 처리하며, 별도 질문·답변은 수집하지 않습니다.',
    },
    {
        num: '제2조', title: '개인정보 수집·이용 목적', level: 'MEDIUM',
        original: '당사는 수집한 개인정보를 다음 목적에 이용합니다.\n- 서비스 제공 및 계약 이행\n- 회원 관리 및 본인 확인\n- 마케팅 및 광고 활용\n- 통계 분석',
        riskSummary: '"마케팅 및 광고 활용" 별도 동의 없이 필수 목적에 혼재.',
        lawRef: '개보법 §15',
        scenario: '"마케팅 및 광고 활용"을 필수 수집 목적에 포함 → 별도 동의 없이 광고 발송 해석 가능 → 과징금 사유.',
        aiFixed: '【필수 이용 목적】\n① 서비스 제공 및 계약 이행\n② 회원 관리 및 본인 확인\n③ 서비스 개선을 위한 통계 분석\n\n【선택 동의 목적 — 별도 동의 시에만 활용】\n④ 이벤트·프로모션·광고성 정보 발송 (SMS, 이메일, 앱 푸시)\n\n※ 선택 동의를 거부하시더라도 기본 서비스 이용에는 제한이 없습니다.',
    },
    {
        num: '제3조', title: '개인정보 보유·이용 기간', level: 'MEDIUM',
        original: '당사는 개인정보 수집 및 이용 목적 달성 시 지체 없이 파기합니다.\n다만, 관계법령에 의해 보존할 경우:\n- 계약 또는 청약철회 등의 기록: 5년\n- 소비자 불만 및 분쟁처리 기록: 3년',
        riskSummary: '쿠키 삭제 주기, 비활성 계정 처리, 마케팅 철회 후 기간 미명시.',
        lawRef: '개보법 §21',
        scenario: '쿠키 보유기간 미명시 → DPA 가이드라인 미준수.\n비활성 계정 처리 기준 없음 → 불필요 데이터 장기 보유.\n마케팅 동의 철회 즉시 파기 규정 없음 → 민원.',
        aiFixed: '【이용 목적 달성 시 즉시 파기】\n- 쿠키: 세션 쿠키는 브라우저 종료 시, 지속 쿠키는 1년 이내 자동 삭제\n- 비활성 계정: 최종 로그인일로부터 1년 경과 시 파기 (30일 전 사전 안내)\n- 마케팅 동의 철회 즉시 관련 정보 파기\n\n【법령에 따른 보존】\n- 계약·청약철회 기록: 5년 (전자상거래법)\n- 소비자 불만·분쟁 기록: 3년 (전자상거래법)\n- 접속 로그: 3개월 (통신비밀보호법)',
    },
    {
        num: '제4조', title: '개인정보의 제3자 제공', level: 'HIGH',
        original: '당사는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 법령에 의하거나 이용자의 동의가 있는 경우 예외로 합니다.',
        riskSummary: '실제 PG사·배달앱·광고플랫폼 등 제공 현황 전면 미명시.',
        lawRef: '개보법 §17',
        scenario: 'PG사(결제)·배달앱(주문)·광고플랫폼(Meta, Google)에 실제 제공 중이나 처리방침 미명시 → 미동의 제공으로 행정처분 (과징금 + 시정명령).',
        aiFixed: '【제3자 제공 현황】\n\n| 제공받는 자 | 제공 목적 | 제공 항목 | 보유기간 |\n|---|---|---|---|\n| (주)KG이니시스 | 결제 처리 | 이름, 카드정보, 거래금액 | 결제 완료 후 5년 |\n| 배달의민족 | 주문 중계 | 이름, 연락처, 주소 | 배달 완료 후 30일 |\n| Meta (Facebook) | 광고 최적화 | 이메일 해시값 (선택동의자만) | 동의 철회 시 즉시 삭제 |\n\n※ 위 경우 외 제3자 제공 없음. 선택 동의 거부 시 광고 제공 제외.',
    },
];

// ── 조문 행 컴포넌트 ───────────────────────────────────────────
function ClauseRow({ c, note, onNote }: { c: Clause; note: string; onNote: (v: string) => void }) {
    const col = R[c.level];
    const hasIssue = c.level !== 'OK';
    // 텍스트 박스 공통 스타일 (원문·수정본 동일하게 유지)
    const textBox: React.CSSProperties = {
        fontSize: 13,
        color: '#1e293b',
        lineHeight: 1.8,
        whiteSpace: 'pre-line',
        background: '#ffffff',
        borderRadius: 6,
        padding: '10px 14px',
        border: '1px solid #e5e7eb',
        fontFamily: "'Noto Sans KR','Apple SD Gothic Neo',sans-serif",
        letterSpacing: '0.01em',
    };
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #e5e7eb' }}>

            {/* ─── 좌: 원문 + 이슈/시나리오 ─────────────────── */}
            <div style={{
                padding: '16px 18px',
                borderRight: '2px solid #e5e7eb',
                borderLeft: `4px solid ${col.border}`,
                background: hasIssue ? col.bg : '#fafafa',
            }}>
                {/* 헤더 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 11, background: '#f3f4f6', color: '#374151', borderRadius: 4, padding: '2px 8px' }}>
                        {c.num}
                    </span>
                    <span style={{ fontWeight: 900, fontSize: 13, color: '#111827' }}>{c.title}</span>
                    <span style={{
                        marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px',
                        borderRadius: 20, background: col.tag, color: col.text, flexShrink: 0,
                    }}>{col.label}</span>
                </div>

                {/* 원문 — 공통 스타일 */}
                <div style={{ ...textBox, marginBottom: hasIssue ? 10 : 0 }}>{c.original}</div>

                {/* 이슈 + 시나리오 */}
                {hasIssue && (
                    <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: col.text, textTransform: 'uppercase', letterSpacing: 1 }}>
                            ⚠ {c.lawRef} 위반 가능
                        </div>
                        <div style={{
                            fontSize: 12, color: col.text, background: col.tag, borderRadius: 5,
                            padding: '6px 10px', lineHeight: 1.6, fontWeight: 600,
                        }}>{c.riskSummary}</div>
                        <div style={{
                            fontSize: 11, color: '#4b5563', background: 'rgba(0,0,0,0.03)',
                            borderRadius: 5, padding: '6px 10px', lineHeight: 1.7, whiteSpace: 'pre-line',
                        }}>{c.scenario}</div>
                    </div>
                )}
            </div>

            {/* ─── 우: AI수정완료본(원문과 동일 스타일) + 변호사 지시 ─── */}
            <div style={{ padding: '16px 18px', background: hasIssue ? '#f0fdf4' : '#fafafa', borderLeft: '4px solid #16a34a' }}>
                {/* 수정본 헤더 — 원문과 동일한 위치·크기 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 11, background: '#dcfce7', color: '#166534', borderRadius: 4, padding: '2px 8px' }}>
                        수정완료본
                    </span>
                    <span style={{ fontWeight: 900, fontSize: 13, color: '#166534' }}>{c.title}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#dcfce7', color: '#166534', flexShrink: 0 }}>✅ AI 수정</span>
                </div>

                {/* 수정본 텍스트 — 원문과 동일 스타일 */}
                <div style={{ ...textBox, borderColor: '#86efac', marginBottom: hasIssue ? 10 : 0 }}>{c.aiFixed}</div>

                {/* 변호사 지시 — 이슈 있는 것만 */}
                {hasIssue && (
                    <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: '#1d4ed8', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                            ✏ 변호사 추가 지시
                        </label>
                        <textarea
                            value={note}
                            onChange={e => onNote(e.target.value)}
                            placeholder="수정본에 추가 지시사항이 있으면 입력..."
                            rows={2}
                            style={{
                                width: '100%', resize: 'vertical',
                                fontSize: 13, color: '#111827', lineHeight: 1.7,
                                border: note ? '1.5px solid #2563eb' : '1.5px solid #bfdbfe',
                                borderRadius: 6, padding: '7px 11px',
                                background: note ? '#eff6ff' : '#f8faff',
                                outline: 'none', fontFamily: 'inherit',
                                boxSizing: 'border-box', transition: 'all 0.12s',
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// ── 메인 ──────────────────────────────────────────────────────
export default function PrivacyReviewPage({
    searchParams,
}: { searchParams: Promise<{ leadId?: string; company?: string; embed?: string }> }) {
    const params = React.use(searchParams);
    const leadId = params.leadId || 'lead_001';
    const company = params.company || '(주)샐러디';
    const isEmbed = params.embed === 'true';

    const router = useRouter();
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [finalNote, setFinalNote] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [t0] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
        return () => clearInterval(id);
    }, []);

    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(elapsed % 60).padStart(2, '0');
    const timerCol = elapsed > 60 ? '#dc2626' : elapsed > 40 ? '#d97706' : '#16a34a';
    const highN = CLAUSES.filter(c => c.level === 'HIGH').length;
    const medN = CLAUSES.filter(c => c.level === 'MEDIUM').length;
    const noteN = Object.values(notes).filter(v => v.trim()).length;

    const handleConfirm = async () => {
        setConfirming(true);
        try {
            const payload = JSON.stringify({ perClause: notes, final: finalNote });
            await fetch('/api/email', {
                method: 'POST', headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ type: 'sales_notify', leadId, lawyerNote: payload })
            });
            await fetch('/api/email', {
                method: 'POST', headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ type: 'company_hook', leadId, lawyerNote: finalNote })
            });
            setConfirmed(true);
        } catch { alert('오류'); return; }
        setConfirming(false);
    };

    const handleConfirmAndGoList = async () => {
        setConfirming(true);
        try {
            const payload = JSON.stringify({ perClause: notes, final: finalNote });
            await fetch('/api/email', {
                method: 'POST', headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ type: 'sales_notify', leadId, lawyerNote: payload })
            });
            await fetch('/api/email', {
                method: 'POST', headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ type: 'company_hook', leadId, lawyerNote: finalNote })
            });
            router.push('/admin/leads');
        } catch { alert('오류'); }
        setConfirming(false);
    };

    if (confirmed) return (
        <div style={{ minHeight: '100vh', background: '#f8f9fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', background: '#fff', borderRadius: 20, padding: '48px 64px', boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>
                <CheckCircle2 size={56} color="#16a34a" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', margin: '0 0 8px' }}>컨펌 완료!</h2>
                <p style={{ color: '#6b7280', margin: '0 0 4px' }}>{company}</p>
                <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 24 }}>소요 {mm}:{ss} · 지시 {noteN}건 영업팀 전달</p>
                <Link href="/admin/leads">
                    <button style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                        영업 리드 목록 →
                    </button>
                </Link>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fc', fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
            <div style={{ maxWidth: 1600, margin: '0 auto', padding: isEmbed ? '8px' : '32px 16px' }}>

                {/* ── 상단 헤더 ─ embed 시 숨김 ──────────────────────────────────────────── */}
                {!isEmbed && (
                    <div style={{
                        background: '#ffffff', borderRadius: 16, border: '1px solid #e5e7eb',
                        padding: '14px 24px', marginBottom: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <Link href="/admin/leads">
                                <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                                    <ArrowLeft size={13} /> 목록
                                </button>
                            </Link>
                            <div>
                                <span style={{ fontWeight: 900, color: '#1e293b', fontSize: 15 }}>{company}</span>
                                <span style={{ color: '#64748b', fontSize: 13, marginLeft: 10 }}>개인정보처리방침 검토</span>
                                <span style={{ color: '#dc2626', fontSize: 12, marginLeft: 10, fontWeight: 700 }}>🔴 {highN}건</span>
                                <span style={{ color: '#d97706', fontSize: 12, marginLeft: 6, fontWeight: 700 }}>🟡 {medN}건</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            {/* 타이머 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f8f9fc', borderRadius: 8, padding: '5px 14px', border: '1px solid #e5e7eb' }}>
                                <Clock size={13} color={timerCol} />
                                <span style={{ fontWeight: 900, color: timerCol, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{mm}:{ss}</span>
                            </div>
                            {/* 지시수 배지 */}
                            {noteN > 0 && (
                                <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '3px 10px', border: '1px solid #bfdbfe' }}>
                                    지시 {noteN}건
                                </span>
                            )}
                            {/* 목록 보기 */}
                            <Link href="/admin/leads" style={{ textDecoration: 'none' }}>
                                <button style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    background: '#f8f9fc', color: '#64748b',
                                    border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px',
                                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                }}>
                                    <List size={14} />
                                    목록 보기
                                </button>
                            </Link>
                            {/* 컨펌 완료 · 목록 보기 */}
                            <button onClick={handleConfirmAndGoList} disabled={confirming} style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                background: confirming ? '#e0e7ff' : '#ffffff', color: '#2563eb',
                                border: '1.5px solid #93c5fd', borderRadius: 8, padding: '8px 14px',
                                fontWeight: 800, fontSize: 13, cursor: confirming ? 'not-allowed' : 'pointer',
                                boxShadow: '0 1px 6px rgba(37,99,235,0.1)',
                            }}>
                                <MessageSquare size={14} />
                                {confirming ? '처리 중...' : '컨펌 완료 · 목록 보기'}
                            </button>
                            {/* 컨펌 완료 · 다음 회사 */}
                            <button onClick={handleConfirm} disabled={confirming} style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                background: confirming ? '#86efac' : 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff',
                                border: 'none', borderRadius: 9, padding: '9px 24px',
                                fontWeight: 900, fontSize: 15, cursor: confirming ? 'not-allowed' : 'pointer',
                                boxShadow: '0 2px 12px rgba(22,163,74,0.25)',
                            }}>
                                <CheckCircle2 size={17} />
                                {confirming ? '처리 중...' : '컨펌 완료 · 다음 회사'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── 컬럼 레이블 ─────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f1f5f9', borderRadius: '12px 12px 0 0', border: '1px solid #e5e7eb', borderBottom: 'none' }}>
                    <div style={{ padding: '10px 20px', borderRight: '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 1.5 }}>◀ 원문 + 이슈 / 시나리오</span>
                    </div>
                    <div style={{ padding: '10px 20px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', letterSpacing: 1.5 }}>AI 수정완료본 + 변호사 지시 ▶</span>
                    </div>
                </div>

                {/* ── 조문 대조표 ────────────────────────────────────── */}
                <div style={{ border: '1px solid #e5e7eb', borderTop: 'none', background: '#f9fafb' }}>
                    {CLAUSES.map((c, i) => (
                        <ClauseRow
                            key={i} c={c}
                            note={notes[c.num] || ''}
                            onNote={v => setNotes(prev => ({ ...prev, [c.num]: v }))}
                        />
                    ))}
                </div>

                {/* ── 변호사 최종 지시 + 컨펌 ────────────────────────── */}
                <div style={{ maxWidth: 880, margin: '32px auto 48px', background: '#fff', borderRadius: 16, padding: '28px 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <Scale size={19} color="#b8960a" />
                        <span style={{ fontSize: 17, fontWeight: 900, color: '#1e293b' }}>변호사 최종 지시</span>
                        <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>영업팀 전달 · 이메일 자동 발송</span>
                    </div>

                    {/* 항목별 지시 요약 */}
                    {noteN > 0 && (
                        <div style={{ marginBottom: 14, background: '#fffbeb', borderRadius: 8, padding: '12px 16px', border: '1px solid #fde68a' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#b8960a', marginBottom: 8 }}>📋 항목별 지시 요약 ({noteN}건)</div>
                            {Object.entries(notes).filter(([, v]) => v.trim()).map(([num, val]) => (
                                <div key={num} style={{ fontSize: 13, color: '#374151', marginBottom: 5, lineHeight: 1.5 }}>
                                    <strong style={{ color: '#b8960a' }}>[{num}]</strong> {val}
                                </div>
                            ))}
                        </div>
                    )}

                    <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>종합 의견 (선택)</label>
                    <textarea
                        value={finalNote}
                        onChange={e => setFinalNote(e.target.value)}
                        placeholder="전체 검토 의견, 추가 주의사항, 영업팀 전달 내용..."
                        rows={4}
                        style={{ width: '100%', resize: 'vertical', fontSize: 14, color: '#111827', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', background: '#f8f9fc', outline: 'none', fontFamily: 'inherit', lineHeight: 1.7, boxSizing: 'border-box', marginBottom: 20 }}
                    />
                    <div style={{ display: 'flex', gap: 12 }}>
                        {/* 목록 보기 — 컨펌 없이 이동 */}
                        <Link href="/admin/leads" style={{ flex: 1, textDecoration: 'none' }}>
                            <button style={{
                                width: '100%', padding: '18px', borderRadius: 12,
                                background: '#f8f9fc', color: '#64748b',
                                border: '1.5px solid #e5e7eb', fontWeight: 800, fontSize: 16,
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                transition: 'all 0.15s',
                            }}>
                                <List size={20} />
                                목록 보기
                            </button>
                        </Link>
                        {/* 컨펌 완료 · 목록 보기 — 컨펌 후 목록 이동 */}
                        <button onClick={handleConfirmAndGoList} disabled={confirming} style={{
                            flex: 1, padding: '18px', borderRadius: 12,
                            background: confirming ? '#e0e7ff' : '#ffffff', color: '#2563eb',
                            border: '2px solid #93c5fd', fontWeight: 900, fontSize: 16,
                            cursor: confirming ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                            boxShadow: '0 2px 12px rgba(37,99,235,0.12)',
                            transition: 'all 0.15s',
                        }}>
                            <MessageSquare size={20} />
                            {confirming ? '처리 중...' : '컨펌 완료 · 목록 보기'}
                        </button>
                        {/* 컨펌 완료 · 다음 회사 */}
                        <button onClick={handleConfirm} disabled={confirming} style={{
                            flex: 1, padding: '18px', borderRadius: 12,
                            background: confirming ? '#86efac' : 'linear-gradient(135deg,#16a34a,#15803d)',
                            color: '#fff', border: 'none', fontWeight: 900, fontSize: 16,
                            cursor: confirming ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                            boxShadow: '0 4px 20px rgba(22,163,74,0.25)',
                        }}>
                            <CheckCircle2 size={22} />
                            {confirming ? '처리 중...' : '컨펌 완료 · 다음 회사'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
