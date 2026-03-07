'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, Send, Edit3, RefreshCw, CheckCircle2, Mail, Smartphone, Monitor, User } from 'lucide-react';
import Link from 'next/link';
import { leadStore, calcSubscription } from '@/lib/leadStore';
import { fillTemplate, DRIP_SEQUENCE } from '@/lib/dripStore';

// ── 이메일 미리보기 + 개인화 편집 + 확정 발송 UI ─────────────

const BASE_SUBJECT = '[IBS 법률] {company}님의 개인정보처리방침 — AI 리스크 분석 결과';
const BASE_PREHEADER = '개인정보보호법 위반 {issueCount}건 발견. 지금 확인하세요.';

function buildHookEmailHtml(vars: Record<string, string>, customMsg: string): string {
    return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Apple SD Gothic Neo',Pretendard,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#f1f5f9;padding:24px 0">

  <!-- 헤더 -->
  <div style="background:#04091a;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center">
    <p style="color:#c9a84c;font-size:24px;font-weight:900;margin:0">⚖️ IBS 법률사무소</p>
    <p style="color:#94a3b8;font-size:13px;margin:6px 0 0">프랜차이즈 전문 법률 서비스 · 45,000개사 자문 실적</p>
  </div>

  <!-- 리스크 배너 -->
  <div style="background:#fef2f2;border-left:4px solid #f87171;padding:20px 32px;margin:0">
    <p style="color:#dc2626;font-size:15px;font-weight:900;margin:0 0 6px">🔴 ${vars.riskLevel} 리스크 — ${vars.issueCount}건 위반 가능성 발견</p>
    <p style="color:#374151;font-size:13px;margin:0">과징금 최대 <strong>3,000만원</strong> 부과 가능 항목이 포함되어 있습니다.</p>
  </div>

  <!-- 본문 -->
  <div style="background:#fff;padding:28px 32px">
    <p style="color:#1e293b;font-size:15px;margin:0 0 16px">${vars.contactName} 담당자님께,</p>
    <p style="color:#374151;line-height:1.7;margin:0 0 20px">
      안녕하세요. IBS 법률사무소입니다.<br/>
      <strong>${vars.company}</strong>의 개인정보처리방침을 AI로 분석한 결과를 전달드립니다.
    </p>

    ${customMsg ? `<div style="background:#fef9ec;border-left:4px solid #c9a84c;padding:16px;margin-bottom:20px;border-radius:0 8px 8px 0">
      <p style="color:#92400e;font-size:13px;font-weight:bold;margin:0 0 4px">변호사 메모</p>
      <p style="color:#374151;font-size:13px;margin:0;line-height:1.6">${customMsg}</p>
    </div>` : ''}

    <!-- 분석 결과 테이블 -->
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:12px;border-bottom:2px solid #e2e8f0">항목</th>
          <th style="padding:10px 12px;text-align:center;color:#64748b;font-size:12px;border-bottom:2px solid #e2e8f0">리스크</th>
          <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:12px;border-bottom:2px solid #e2e8f0">근거</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="padding:10px 12px;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9">수집항목 과다수집</td><td style="padding:10px;text-align:center"><span style="background:#fef2f2;color:#dc2626;font-size:11px;font-weight:bold;padding:2px 8px;border-radius:20px">고위험</span></td><td style="padding:10px 12px;font-size:12px;color:#64748b">개보법 §16</td></tr>
        <tr><td style="padding:10px 12px;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9">제3자 제공 미명시</td><td style="padding:10px;text-align:center"><span style="background:#fef2f2;color:#dc2626;font-size:11px;font-weight:bold;padding:2px 8px;border-radius:20px">고위험</span></td><td style="padding:10px 12px;font-size:12px;color:#64748b">개보법 §17</td></tr>
        <tr><td style="padding:10px 12px;font-size:13px;color:#1e293b">보유기간 일부 누락</td><td style="padding:10px;text-align:center"><span style="background:#fffbeb;color:#d97706;font-size:11px;font-weight:bold;padding:2px 8px;border-radius:20px">주의</span></td><td style="padding:10px 12px;font-size:12px;color:#64748b">개보법 §21</td></tr>
      </tbody>
    </table>

    <!-- CTA -->
    <div style="text-align:center;padding:20px 0 8px">
      <a href="http://localhost:3000/landing?cid=${vars.leadId}" style="background:linear-gradient(135deg,#c9a84c,#e8c87a);color:#0a0e1a;text-decoration:none;padding:16px 36px;border-radius:10px;font-weight:900;font-size:15px;display:inline-block">
        무료 분석 결과 전체 보기 →
      </a>
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin:12px 0 0">버튼 클릭 시 사업자번호로 로그인하여 전체 결과를 확인하실 수 있습니다</p>
  </div>

  <!-- 실적 배너 -->
  <div style="background:#0f172a;padding:20px 32px;display:flex;justify-content:space-around;text-align:center">
    <div><p style="color:#c9a84c;font-size:20px;font-weight:900;margin:0">1,000억+</p><p style="color:#64748b;font-size:11px;margin:4px 0 0">자문 기업 엑시트</p></div>
    <div><p style="color:#c9a84c;font-size:20px;font-weight:900;margin:0">80,000+</p><p style="color:#64748b;font-size:11px;margin:4px 0 0">법률 자문 건수</p></div>
    <div><p style="color:#c9a84c;font-size:20px;font-weight:900;margin:0">45,000+</p><p style="color:#64748b;font-size:11px;margin:4px 0 0">회원사</p></div>
  </div>

  <!-- 풋터 -->
  <div style="background:#04091a;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center">
    <p style="color:#475569;font-size:11px;margin:0">IBS 법률사무소 | 대표번호 02-1234-5678 | <a href="#" style="color:#475569">수신거부</a></p>
  </div>
</div>
</body>
</html>`;
}

export default function EmailPreviewPage({
    searchParams,
}: { searchParams: Promise<{ leadId?: string; embed?: string }> }) {
    const params = React.use(searchParams);
    const leadId = params.leadId || 'lead_001';
    const isEmbed = params.embed === 'true';
    const lead = leadStore.getById(leadId);
    const sub = calcSubscription(lead?.storeCount || 0);

    const vars: Record<string, string> = {
        company: lead?.companyName || '(주)샘플회사',
        contactName: lead?.contactName || '담당자',
        leadId,
        issueCount: String(lead?.issueCount || 0),
        riskLevel: lead?.riskLevel || 'HIGH',
        riskScore: String(lead?.riskScore || 0),
        storeCount: String(lead?.storeCount || 0),
        bizType: lead?.bizType || '',
        monthlyFee: sub.monthly.toLocaleString(),
    };

    const [subject, setSubject] = useState(fillTemplate(BASE_SUBJECT, vars));
    const [customMsg, setCustomMsg] = useState('');
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [editTab, setEditTab] = useState<'subject' | 'message'>('subject');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const htmlPreview = buildHookEmailHtml(vars, customMsg);

    const handleSend = async () => {
        setSending(true);
        try {
            await fetch('/api/email', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ type: 'company_hook', leadId, lawyerNote: customMsg, customSubject: subject }),
            });
            setSent(true);
        } catch { alert('발송 오류'); }
        setSending(false);
    };

    return (
        <div className={isEmbed ? 'px-2 py-3' : 'min-h-screen px-4 py-8 max-w-[1600px] mx-auto'} style={{ background: '#f8f9fc' }}>
            {/* 상단 헤더 — embed 시 숨김 */}
            {!isEmbed && (
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/leads">
                            <button className="flex items-center gap-1.5 text-sm font-medium rounded-lg px-3 py-1.5 transition-colors hover:bg-slate-100" style={{ color: '#64748b' }}>
                                <ArrowLeft className="w-4 h-4" /> 리드 목록
                            </button>
                        </Link>
                        <div className="h-5 w-px" style={{ background: '#d1d5db' }} />
                        <div>
                            <span className="text-base font-black" style={{ color: '#1e293b' }}>이메일 미리보기 — {lead?.companyName}</span>
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                                {lead?.riskLevel} {lead?.issueCount}건
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* 뷰 토글 */}
                        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #d1d5db' }}>
                            {(['desktop', 'mobile'] as const).map(m => (
                                <button key={m} onClick={() => setViewMode(m)}
                                    className="px-3 py-1.5 text-xs font-bold transition-colors"
                                    style={{ background: viewMode === m ? '#fffbeb' : '#ffffff', color: viewMode === m ? '#b8960a' : '#94a3b8', borderRight: m === 'desktop' ? '1px solid #d1d5db' : 'none' }}>
                                    {m === 'desktop' ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                        {sent ? (
                            <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold"
                                style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac' }}>
                                <CheckCircle2 className="w-4 h-4" /> 발송 완료!
                            </div>
                        ) : (
                            <button onClick={handleSend} disabled={sending}
                                className="flex items-center gap-2 px-5 py-2 rounded-lg font-black text-sm disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a' }}>
                                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                발송 확정
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* 메인 레이아웃 */}
            <div className="flex gap-5" style={{ minHeight: 'calc(100vh - 160px)' }}>
                {/* 좌: 편집 패널 */}
                <div className="w-80 flex-shrink-0 overflow-y-auto p-5 space-y-4 rounded-2xl"
                    style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div>
                        <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>수신 정보</p>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
                                <span style={{ color: '#1e293b' }}>{lead?.contactName}</span>
                                <span style={{ color: '#64748b' }}>({lead?.contactEmail})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
                                <span style={{ color: '#475569' }}>{lead?.companyName}</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-px" style={{ background: '#e5e7eb' }} />

                    {/* 제목 편집 */}
                    <div>
                        <label className="text-xs font-black uppercase tracking-wider mb-2 block" style={{ color: '#94a3b8' }}>
                            이메일 제목
                        </label>
                        <textarea value={subject} onChange={e => setSubject(e.target.value)} rows={3}
                            className="w-full p-3 rounded-lg outline-none text-sm resize-none"
                            style={{ background: '#f8f9fc', border: '1px solid #e5e7eb', color: '#1e293b', lineHeight: 1.5 }} />
                    </div>

                    {/* 변호사 추가 메시지 */}
                    <div>
                        <label className="text-xs font-black uppercase tracking-wider mb-2 block" style={{ color: '#94a3b8' }}>
                            ✏️ 개인화 메시지 (선택)
                        </label>
                        <textarea value={customMsg} onChange={e => setCustomMsg(e.target.value)} rows={5}
                            placeholder="담당자에게 전할 메시지를 입력하면 이메일 본문에 포함됩니다..."
                            className="w-full p-3 rounded-lg outline-none text-sm resize-none"
                            style={{ background: '#f8f9fc', border: '1px solid #e5e7eb', color: '#1e293b', lineHeight: 1.6 }} />
                    </div>

                    <div className="h-px" style={{ background: '#e5e7eb' }} />

                    {/* 개인화 URL */}
                    <div>
                        <label className="text-xs font-black uppercase tracking-wider mb-2 block" style={{ color: '#94a3b8' }}>
                            개인화 URL
                        </label>
                        <div className="p-3 rounded-lg text-xs break-all"
                            style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b8960a' }}>
                            /landing?cid={leadId}
                        </div>
                        <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>클릭 시 해당 기업 분석 결과 랜딩 열림</p>
                    </div>

                    {/* 드립 캠페인 안내 */}
                    <div className="p-3 rounded-lg" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                        <p className="text-xs font-black mb-1" style={{ color: '#3b82f6' }}>📅 드립 캠페인 예약</p>
                        <p className="text-xs" style={{ color: '#64748b' }}>미결제 시 D+1·4·8·14·21·30일 법률자료 자동 발송</p>
                    </div>
                </div>

                {/* 우: HTML 미리보기 */}
                <div className="flex-1 overflow-y-auto p-6 rounded-2xl" style={{ background: '#e2e8f0', border: '1px solid #d1d5db' }}>
                    <div className="mb-4 text-center">
                        <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                            style={{ background: '#ffffff', color: '#64748b', border: '1px solid #d1d5db' }}>
                            제목: {subject}
                        </span>
                    </div>
                    <div className={`mx-auto ${viewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'} rounded-2xl overflow-hidden shadow-2xl`}>
                        <iframe
                            srcDoc={htmlPreview}
                            className="w-full"
                            style={{ height: viewMode === 'mobile' ? '700px' : '900px', border: 'none' }}
                            title="이메일 미리보기"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
