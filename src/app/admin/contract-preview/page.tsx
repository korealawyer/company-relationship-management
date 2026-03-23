'use client';
import React, { useState, Suspense } from 'react';
import { ArrowLeft, Send, Monitor, Smartphone, CheckCircle2, RefreshCw, Edit3, FileText } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// ── 법률자문 계약서 HTML 템플릿 ──────────────────────────────────
function buildContractHtml(vars: Record<string, string>): string {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`;
    return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Apple SD Gothic Neo',Pretendard,sans-serif">
<div style="max-width:700px;margin:0 auto;background:#ffffff;padding:0">

  <!-- 헤더 -->
  <div style="background:#04091a;padding:32px 40px;text-align:center">
    <p style="color:#c9a84c;font-size:22px;font-weight:900;margin:0">⚖️ IBS 법률사무소</p>
    <p style="color:#94a3b8;font-size:13px;margin:6px 0 0">법률자문 계약서</p>
  </div>

  <!-- 제목 -->
  <div style="padding:40px 40px 0">
    <h1 style="color:#1e293b;font-size:20px;font-weight:900;margin:0 0 8px;text-align:center">법 률 자 문 계 약 서</h1>
    <p style="color:#64748b;font-size:13px;text-align:center;margin:0 0 32px">(개인정보보호 컴플라이언스)</p>
  </div>

  <!-- 계약 내용 -->
  <div style="padding:0 40px 40px;color:#374151;font-size:14px;line-height:2">

    <p style="margin:0 0 20px">
      <strong>${vars.company}</strong> (이하 "갑"이라 한다)과 
      <strong>법률사무소 IBS</strong> (이하 "을"이라 한다)는 다음과 같이 법률자문 계약을 체결한다.
    </p>

    <div style="background:#f8f9fc;border-radius:12px;padding:24px;margin:0 0 24px">
      <p style="font-weight:900;color:#1e293b;margin:0 0 16px;font-size:15px">제1조 (자문의 범위)</p>
      <p style="margin:0 0 8px">을은 갑에 대하여 다음 각 호의 법률자문을 제공한다.</p>
      <ol style="margin:0;padding-left:20px">
        <li style="margin:0 0 6px">개인정보처리방침 적법성 검토 및 수정</li>
        <li style="margin:0 0 6px">개인정보보호법 위반사항 시정권고 및 대응</li>
        <li style="margin:0 0 6px">개인정보 유출사고 발생 시 법적 대응</li>
        <li style="margin:0 0 6px">개인정보보호 관련 임직원 교육</li>
        <li style="margin:0">기타 개인정보보호 관련 법률 자문</li>
      </ol>
    </div>

    <div style="background:#f8f9fc;border-radius:12px;padding:24px;margin:0 0 24px">
      <p style="font-weight:900;color:#1e293b;margin:0 0 16px;font-size:15px">제2조 (계약기간)</p>
      <p style="margin:0">본 계약의 기간은 계약 체결일로부터 <strong>1년</strong>으로 하며, 
      기간 만료 1개월 전까지 어느 일방이 서면 해지 통보를 하지 않는 한 동일 조건으로 자동 연장된다.</p>
    </div>

    <div style="background:#f8f9fc;border-radius:12px;padding:24px;margin:0 0 24px">
      <p style="font-weight:900;color:#1e293b;margin:0 0 16px;font-size:15px">제3조 (자문료)</p>
      <p style="margin:0 0 8px">1. 갑은 을에게 월 자문료로 금 <strong>${vars.monthlyFee}</strong>원(부가세 별도)을 지급한다.</p>
      <p style="margin:0 0 8px">2. 자문료는 매월 초 을이 발행하는 세금계산서에 따라 발행일로부터 10일 이내 을의 지정 계좌로 입금한다.</p>
      <p style="margin:0">3. 가맹점 수 변동에 따라 분기별로 자문료를 재산정할 수 있다.</p>
    </div>

    <div style="background:#f8f9fc;border-radius:12px;padding:24px;margin:0 0 24px">
      <p style="font-weight:900;color:#1e293b;margin:0 0 16px;font-size:15px">제4조 (비밀유지)</p>
      <p style="margin:0">갑과 을은 본 계약의 이행 과정에서 알게 된 상대방의 영업비밀 및 기밀정보를 
      계약기간 및 계약 종료 후 3년간 제3자에게 누설하거나 본 계약의 목적 외로 사용하지 아니한다.</p>
    </div>

    <div style="background:#f8f9fc;border-radius:12px;padding:24px;margin:0 0 24px">
      <p style="font-weight:900;color:#1e293b;margin:0 0 16px;font-size:15px">제5조 (해지)</p>
      <p style="margin:0 0 8px">1. 갑 또는 을은 상대방이 본 계약상 의무를 위반한 경우, 서면 통보 후 30일 이내 시정되지 않으면 본 계약을 해지할 수 있다.</p>
      <p style="margin:0">2. 제1항에 의한 해지 시, 이미 지급된 자문료는 반환하지 아니한다.</p>
    </div>

    <div style="background:#fffbeb;border-left:4px solid #c9a84c;padding:20px 24px;margin:0 0 24px;border-radius:0 12px 12px 0">
      <p style="font-weight:900;color:#92400e;margin:0 0 8px;font-size:15px">제6조 (관할법원)</p>
      <p style="margin:0;color:#374151">본 계약에 관한 분쟁은 서울중앙지방법원을 관할법원으로 한다.</p>
    </div>

    <!-- 서명란 -->
    <p style="text-align:center;color:#64748b;font-size:13px;margin:32px 0 24px">
      본 계약의 성립을 증명하기 위하여 계약서 2부를 작성하고, 갑과 을이 서명 날인한 후 각 1부씩 보관한다.
    </p>
    
    <p style="text-align:center;font-weight:bold;color:#1e293b;margin:0 0 32px;font-size:15px">
      ${formattedDate}
    </p>

    <div style="display:flex;justify-content:space-between;gap:40px">
      <div style="flex:1;padding:24px;border:2px solid #e2e8f0;border-radius:12px;text-align:center">
        <p style="color:#94a3b8;font-size:12px;font-weight:bold;margin:0 0 12px">【 갑 】</p>
        <p style="color:#1e293b;font-size:14px;font-weight:900;margin:0 0 4px">${vars.company}</p>
        <p style="color:#64748b;font-size:12px;margin:0 0 16px">${vars.contactName} 대표이사</p>
        <div style="border-top:2px dashed #e2e8f0;padding-top:12px">
          <p style="color:#94a3b8;font-size:11px;margin:0">전자서명 대기 중</p>
        </div>
      </div>
      <div style="flex:1;padding:24px;border:2px solid #c9a84c;border-radius:12px;text-align:center;background:#fffbeb">
        <p style="color:#92400e;font-size:12px;font-weight:bold;margin:0 0 12px">【 을 】</p>
        <p style="color:#1e293b;font-size:14px;font-weight:900;margin:0 0 4px">법률사무소 IBS</p>
        <p style="color:#64748b;font-size:12px;margin:0 0 16px">${vars.lawyerName} 변호사</p>
        <div style="border-top:2px dashed #c9a84c;padding-top:12px">
          <p style="color:#92400e;font-size:11px;margin:0;font-weight:bold">✅ 서명 완료</p>
        </div>
      </div>
    </div>

  </div>

  <!-- 풋터 -->
  <div style="background:#04091a;padding:20px 40px;text-align:center">
    <p style="color:#64748b;font-size:11px;margin:0 0 4px">IBS 법률사무소 | 서울특별시 강남구 테헤란로 123, 14층</p>
    <p style="color:#475569;font-size:11px;margin:0">대표번호 02-1234-5678 | ibs@ibs-law.co.kr</p>
  </div>

</div>
</body>
</html>`;
}

// ── 메인 페이지 ──────────────────────────────────────────────

function ContractPreviewInner() {
    const searchParams = useSearchParams();
    const companyName = searchParams.get('company') || '(주)샘플기업';
    const contactName = searchParams.get('contact') || '김대표';
    const email = searchParams.get('email') || 'legal@sample.co.kr';
    const storeCount = searchParams.get('stores') || '100';

    // 매장 수에 따른 월 자문료 간이 계산
    const stores = parseInt(storeCount);
    const monthlyFee = stores <= 50 ? '330,000' : stores <= 200 ? '550,000' : stores <= 500 ? '880,000' : '1,100,000';

    const vars: Record<string, string> = {
        company: companyName,
        contactName,
        monthlyFee,
        lawyerName: '김수현',
    };

    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [note, setNote] = useState('');

    const htmlPreview = buildContractHtml(vars);

    const handleSend = async () => {
        setSending(true);
        await new Promise(r => setTimeout(r, 1500));
        setSent(true);
        setSending(false);
    };

    return (
        <div className="min-h-screen" style={{ background: '#04091a' }}>
            {/* 상단 바 */}
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
                style={{ background: 'rgba(13,27,62,0.97)', borderBottom: '1px solid rgba(255,255,255,0.08)', height: 60, boxShadow: 'none' }}>
                <div className="flex items-center gap-4">
                    <Link href="/sales/call">
                        <button className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'rgba(240,244,255,0.5)' }}>
                            <ArrowLeft className="w-4 h-4" /> 영업 전화
                        </button>
                    </Link>
                    <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                    <div>
                        <span className="text-sm font-black" style={{ color: '#f0f4ff' }}>📄 계약서 미리보기 — {companyName}</span>
                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: 'rgba(255,255,255,0.08)', color: '#f0f4ff' }}>
                            {storeCount}개 가맹점
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* 뷰 토글 */}
                    <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                        {(['desktop', 'mobile'] as const).map(m => (
                            <button key={m} onClick={() => setViewMode(m)}
                                className="px-3 py-1.5 text-xs font-bold"
                                style={{ background: viewMode === m ? 'rgba(201,168,76,0.15)' : 'transparent', color: viewMode === m ? '#c9a84c' : 'rgba(240,244,255,0.4)' }}>
                                {m === 'desktop' ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                    {sent ? (
                        <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold"
                            style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac' }}>
                            <CheckCircle2 className="w-4 h-4" /> 발송 완료!
                        </div>
                    ) : (
                        <button onClick={handleSend} disabled={sending}
                            className="flex items-center gap-2 px-5 py-2 rounded-lg font-black text-sm disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)', color: '#ffffff' }}>
                            {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            계약서 발송
                        </button>
                    )}
                </div>
            </div>

            {/* 메인 레이아웃 */}
            <div className="flex pt-[60px] h-screen">
                {/* 좌: 수신 정보 + 메모 */}
                <div className="w-80 flex-shrink-0 overflow-y-auto p-5 space-y-4"
                    style={{ borderRight: '1px solid rgba(255,255,255,0.08)', background: 'rgba(13,27,62,0.9)' }}>

                    {/* 수신 정보 */}
                    <div>
                        <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: 'rgba(240,244,255,0.4)' }}>수신 정보</p>
                        <div className="space-y-2.5">
                            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <p className="text-[10px] font-bold mb-1" style={{ color: 'rgba(240,244,255,0.4)' }}>기업명</p>
                                <p className="text-sm font-bold" style={{ color: '#f0f4ff' }}>{companyName}</p>
                            </div>
                            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <p className="text-[10px] font-bold mb-1" style={{ color: 'rgba(240,244,255,0.4)' }}>담당자</p>
                                <p className="text-sm font-bold" style={{ color: '#f0f4ff' }}>{contactName}</p>
                            </div>
                            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <p className="text-[10px] font-bold mb-1" style={{ color: 'rgba(240,244,255,0.4)' }}>이메일</p>
                                <p className="text-sm font-bold" style={{ color: '#f0f4ff' }}>{email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

                    {/* 계약 조건 요약 */}
                    <div>
                        <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: 'rgba(240,244,255,0.4)' }}>계약 조건</p>
                        <div className="space-y-2">
                            {[
                                { label: '자문 유형', value: '개인정보보호 컴플라이언스' },
                                { label: '계약 기간', value: '1년 (자동 연장)' },
                                { label: '월 자문료', value: `${monthlyFee}원 (VAT 별도)` },
                                { label: '가맹점 수', value: `${storeCount}개` },
                                { label: '서명 방식', value: '전자서명 (카카오/PASS)' },
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <span className="text-xs font-medium" style={{ color: 'rgba(240,244,255,0.5)' }}>{item.label}</span>
                                    <span className="text-xs font-bold" style={{ color: '#f0f4ff' }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

                    {/* 메모 */}
                    <div>
                        <label className="text-xs font-black uppercase tracking-wider mb-2 block" style={{ color: '#94a3b8' }}>
                            ✏️ 발송 메모 (선택)
                        </label>
                        <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
                            placeholder="계약서 발송 시 함께 전달할 메모..."
                            className="w-full p-3 rounded-xl outline-none text-sm resize-none"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', lineHeight: 1.6 }} />
                    </div>

                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

                    {/* 안내 */}
                    <div className="p-3 rounded-xl" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                        <div className="flex items-center gap-1.5 mb-1">
                            <FileText className="w-3.5 h-3.5" style={{ color: '#2563eb' }} />
                            <p className="text-xs font-bold" style={{ color: '#2563eb' }}>계약서 발송 안내</p>
                        </div>
                        <p className="text-[11px] leading-relaxed" style={{ color: '#475569' }}>
                            발송 시 고객에게 이메일로 계약서가 전달되며,
                            카카오/PASS 전자서명 링크가 포함됩니다.
                            서명 완료 시 자동 알림이 발송됩니다.
                        </p>
                    </div>

                    {sent && (
                        <div className="p-3 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#16a34a' }} />
                                <p className="text-xs font-bold" style={{ color: '#16a34a' }}>발송 완료</p>
                            </div>
                            <p className="text-[11px]" style={{ color: '#6b7280' }}>
                                {companyName} ({email})으로 계약서가 발송되었습니다.
                                전자서명 상태를 자동으로 추적합니다.
                            </p>
                        </div>
                    )}
                </div>

                {/* 우: HTML 미리보기 */}
                <div className="flex-1 overflow-y-auto p-6" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <div className="mb-4 text-center">
                        <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                            style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c' }}>
                            📄 법률자문 계약서 미리보기
                        </span>
                    </div>
                    <div className={`mx-auto ${viewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'} rounded-2xl overflow-hidden shadow-2xl`}>
                        <iframe
                            srcDoc={htmlPreview}
                            className="w-full"
                            style={{ height: viewMode === 'mobile' ? '800px' : '1100px', border: 'none', background: '#ffffff' }}
                            title="계약서 미리보기"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ContractPreviewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#04091a' }}><p className="text-sm" style={{ color: '#94a3b8' }}>로딩 중...</p></div>}>
            <ContractPreviewInner />
        </Suspense>
    );
}
