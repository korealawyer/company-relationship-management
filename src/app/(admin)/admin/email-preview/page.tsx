'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, Send, Edit3, RefreshCw, CheckCircle2, Mail, Smartphone, Monitor, User, Bell, BellOff, Clock, BarChart3, MousePointerClick, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { leadStore, calcSubscription } from '@/lib/leadStore';
import { supabaseCompanyStore } from '@/lib/supabaseStore';
import { fillTemplate, DRIP_SEQUENCE } from '@/lib/dripStore';
import { LeadScoringService, getOptimalSendTimes } from '@/lib/leadScoring';

// ── 이메일 미리보기 + 개인화 편집 + 확정 발송 UI ─────────────

const BASE_SUBJECT = '[IBS 법률] {company}님의 개인정보처리방침 — 리스크 분석 결과';
const BASE_PREHEADER = '개인정보보호법 위반 {issueCount}건 발견. 지금 확인하세요.';

function buildHookEmailHtml(vars: Record<string, string>, customMsg: string, baseUrl: string = ''): string {
    const lawyerName = vars.lawyerName || '';
    const trackOpen = `${baseUrl}/api/track?lid=${vars.leadId}&type=open`;
    const reportUrl = `${baseUrl}/privacy-report?company=${encodeURIComponent(vars.company)}`;
    const trackClick = `${baseUrl}/api/track?lid=${vars.leadId}&type=click&url=${encodeURIComponent(reportUrl)}`;
    const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${vars.unsubscribeToken}`;
    return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Apple SD Gothic Neo',Pretendard,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#f1f5f9;padding:24px 0">

  <!-- 헤더 -->
  <div style="background:#04091a;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center">
    <p style="color:#c9a84c;font-size:24px;font-weight:900;margin:0">⚖️ IBS 법률사무소</p>
    <p style="color:#94a3b8;font-size:13px;margin:6px 0 0">프랜차이즈 전문 법률 서비스 · 45,000개사 자문 실적</p>
  </div>

  <!-- 리스크 요약 배너 -->
  <div style="background:#fef2f2;border-left:4px solid #f87171;padding:20px 32px;margin:0">
    <p style="color:#dc2626;font-size:15px;font-weight:900;margin:0 0 6px">⚠️ 개인정보처리방침 검토 결과 — ${vars.issueCount}건 시정 권고</p>
    <p style="color:#374151;font-size:13px;margin:0">개인정보보호법 위반 시 최대 과징금 <strong>3,000만원</strong>이 부과될 수 있는 사항이 확인되었습니다.</p>
  </div>

  <!-- 본문 -->
  <div style="background:#fff;padding:32px 32px 28px">
    <p style="color:#1e293b;font-size:15px;font-weight:bold;margin:0 0 20px">${vars.contactName} 담당자님께</p>

    ${lawyerName ? `
    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 16px">
      안녕하세요.<br/>
      <strong>IBS 법률사무소</strong> 개인정보보호 전문 <strong>${lawyerName} 변호사</strong>입니다.
    </p>
    ` : `
    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 16px">
      안녕하세요.<br/>
      <strong>IBS 법률사무소</strong> 개인정보보호 컴플라이언스 팀입니다.
    </p>
    `}

    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 16px">
      저희 법률사무소에서는 프랜차이즈 기업의 개인정보보호 컴플라이언스 강화를 위해,
      주요 기업의 개인정보처리방침에 대한 법률 검토를 실시하고 있습니다.
    </p>

    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 20px">
      이번에 <strong>${vars.company}</strong>의 개인정보처리방침을 검토한 결과,
      <strong style="color:#dc2626">개인정보보호법상 시정이 필요한 사항 ${vars.issueCount}건</strong>이 확인되어
      아래와 같이 안내드립니다.
    </p>

    ${customMsg ? `<div style="background:#fef9ec;border-left:4px solid #c9a84c;padding:16px;margin-bottom:24px;border-radius:0 8px 8px 0">
      <p style="color:#92400e;font-size:13px;font-weight:bold;margin:0 0 4px">💼 담당 변호사 의견</p>
      <p style="color:#374151;font-size:13px;margin:0;line-height:1.7">${customMsg.replace(/\n/g, '<br/>')}</p>
    </div>` : ''}

    <!-- 검토 결과 요약 -->
    <p style="color:#1e293b;font-size:13px;font-weight:bold;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0">📋 주요 검토 결과 요약</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:12px;border-bottom:2px solid #e2e8f0">검토 항목</th>
          <th style="padding:10px 12px;text-align:center;color:#64748b;font-size:12px;border-bottom:2px solid #e2e8f0">위험도</th>
          <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:12px;border-bottom:2px solid #e2e8f0">관련 법조문</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="padding:10px 12px;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9">수집항목 과다수집</td><td style="padding:10px;text-align:center"><span style="background:#fef2f2;color:#dc2626;font-size:11px;font-weight:bold;padding:2px 8px;border-radius:20px">고위험</span></td><td style="padding:10px 12px;font-size:12px;color:#64748b">개인정보보호법 제16조</td></tr>
        <tr><td style="padding:10px 12px;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9">제3자 제공 미명시</td><td style="padding:10px;text-align:center"><span style="background:#fef2f2;color:#dc2626;font-size:11px;font-weight:bold;padding:2px 8px;border-radius:20px">고위험</span></td><td style="padding:10px 12px;font-size:12px;color:#64748b">개인정보보호법 제17조</td></tr>
        <tr><td style="padding:10px 12px;font-size:13px;color:#1e293b">보유기간 일부 누락</td><td style="padding:10px;text-align:center"><span style="background:#fffbeb;color:#d97706;font-size:11px;font-weight:bold;padding:2px 8px;border-radius:20px">주의</span></td><td style="padding:10px 12px;font-size:12px;color:#64748b">개인정보보호법 제21조</td></tr>
      </tbody>
    </table>

    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 20px">
      상세 검토 결과를 별도로 준비해두었으니, 아래 버튼을 통해 확인해주시기 바랍니다.<br/>
      검토 결과에 대해 궁금하신 사항이 있으시면 언제든 연락 주시기 바랍니다.
    </p>

    <!-- CTA (클릭 추적 포함) -->
    <div style="text-align:center;padding:20px 0 8px">
      <a href="${trackClick}" style="background:linear-gradient(135deg,#c9a84c,#e8c87a);color:#0a0e1a;text-decoration:none;padding:16px 36px;border-radius:10px;font-weight:900;font-size:15px;display:inline-block">
        검토 결과 전문 보기 →
      </a>
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin:12px 0 0">클릭 시 귀사 개인정보처리방침 검토 보고서를 확인하실 수 있습니다</p>

    <!-- 서명 -->
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0">
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 4px">감사합니다.</p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px">귀사의 안전한 개인정보 관리를 위해 최선을 다하겠습니다.</p>
      <div style="display:flex;align-items:flex-start;gap:16px">
        ${lawyerName ? `
        <div>
          <p style="color:#1e293b;font-size:15px;font-weight:900;margin:0 0 4px">${lawyerName} 변호사</p>
          <p style="color:#64748b;font-size:12px;margin:0 0 2px">IBS 법률사무소 · 개인정보보호 전문</p>
          <p style="color:#64748b;font-size:12px;margin:0 0 2px">대한변호사협회 등록 · 개인정보관리사(CPPG)</p>
          <p style="color:#64748b;font-size:12px;margin:0">직통 02-1234-5678 | lawyer@ibs-law.co.kr</p>
        </div>
        ` : `
        <div>
          <p style="color:#1e293b;font-size:15px;font-weight:900;margin:0 0 4px">IBS 법률사무소 개인정보보호 팀</p>
          <p style="color:#64748b;font-size:12px;margin:0 0 2px">프랜차이즈 전문 법률 서비스</p>
          <p style="color:#64748b;font-size:12px;margin:0">02-1234-5678 | ibs@ibs-law.co.kr</p>
        </div>
        `}
      </div>
    </div>
  </div>

  <!-- 실적 배너 -->
  <div style="background:#0f172a;padding:20px 32px;display:flex;justify-content:space-around;text-align:center">
    <div><p style="color:#c9a84c;font-size:20px;font-weight:900;margin:0">1,000억+</p><p style="color:#64748b;font-size:11px;margin:4px 0 0">자문 기업 엑시트</p></div>
    <div><p style="color:#c9a84c;font-size:20px;font-weight:900;margin:0">80,000+</p><p style="color:#64748b;font-size:11px;margin:4px 0 0">법률 자문 건수</p></div>
    <div><p style="color:#c9a84c;font-size:20px;font-weight:900;margin:0">45,000+</p><p style="color:#64748b;font-size:11px;margin:4px 0 0">회원사</p></div>
  </div>

  <!-- 풋터 -->
  <div style="background:#04091a;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center">
    <p style="color:#64748b;font-size:11px;margin:0 0 4px">IBS 법률사무소 | 서울특별시 강남구 테헤란로 123, 14층</p>
    <p style="color:#475569;font-size:11px;margin:0">대표번호 02-1234-5678 | ibs@ibs-law.co.kr | <a href="${unsubscribeUrl}" style="color:#475569">수신거부</a></p>
  </div>

  <!-- 트래킹 픽셀 (이메일 열람 추적) -->
  <img src="${trackOpen}" width="1" height="1" style="display:none" alt="" />
</div>
</body>
</html>`;
}

const EmailPreviewContent = React.memo(function EmailPreviewContent() {
    const searchParams = useSearchParams();
    const leadId = searchParams?.get('leadId') || 'lead_001';
    const companyParam = searchParams?.get('company');

    const [lead, setLead] = useState<any>(null);

    useEffect(() => {
        if (leadId) {
            // Supabase에서 실시간 리드 정보 가져오기 (mock leadStore 대신)
            supabaseCompanyStore.getById(leadId).then((data: any) => {
                if (data) setLead(data);
            });
        }
    }, [leadId]);

    const sub = useMemo(() => calcSubscription(lead?.storeCount || 0), [lead?.storeCount]);

    const vars: Record<string, string> = useMemo(() => ({
        company: lead?.companyName || lead?.name || companyParam || '(주)샘플회사',
        contactName: lead?.contactName || '담당자',
        lawyerName: lead?.lawyerName || lead?.assigned_lawyer_id || '',
        leadId,
        issueCount: String(lead?.issueCount || lead?.issues?.length || 0),
        riskLevel: lead?.riskLevel || 'HIGH',
        riskScore: String(lead?.riskScore || 0),
        storeCount: String(lead?.storeCount || 0),
        bizType: lead?.bizType || '',
        monthlyFee: sub.monthly.toLocaleString(),
        unsubscribeToken: typeof window !== 'undefined' ? btoa(`unsub_${leadId}`) : `unsub_${leadId}`,
    }), [lead, leadId, sub.monthly]);

    const [subject, setSubject] = useState(fillTemplate(BASE_SUBJECT, vars));
    const [isSubjectEdited, setIsSubjectEdited] = useState(false);
    const [customMsg, setCustomMsg] = useState('');
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [editTab, setEditTab] = useState<'subject' | 'message'>('subject');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [scheduledTime, setScheduledTime] = useState('');
    const [trackingData, setTrackingData] = useState<{ opens: number; clicks: number; score: number; lastOpenAt?: string }>({ opens: 0, clicks: 0, score: 0 });

    const baseUrl = useMemo(() => typeof window !== 'undefined' ? window.location.origin : '', []);
    const htmlPreview = useMemo(() => buildHookEmailHtml(vars, customMsg, baseUrl), [vars, customMsg, baseUrl]);
    const optimalTimes = useMemo(() => getOptimalSendTimes(vars.bizType), [vars.bizType]);

    // vars (특히 company Name 등)가 뒤늦게 로딩될 경우 제목 자동 업데이트 (사용자가 명시적으로 수정하기 전까지만)
    useEffect(() => {
        if (!isSubjectEdited && lead) {
            setSubject(fillTemplate(BASE_SUBJECT, vars));
        }
    }, [vars, isSubjectEdited, lead]);

    // 추적 데이터 폴링
    useEffect(() => {
        const poll = () => {
            const score = LeadScoringService.getScore(leadId);
            if (score) {
                setTrackingData({ opens: score.openCount, clicks: score.clickCount, score: score.score, lastOpenAt: score.lastOpenAt });
            }
        };
        poll();
        const iv = setInterval(poll, 3000);
        return () => clearInterval(iv);
    }, [leadId]);

    // 푸시 알림 구독
    const handlePushToggle = useCallback(async () => {
        if (pushEnabled) {
            setPushEnabled(false);
            return;
        }
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const reg = await navigator.serviceWorker.ready;
                const sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: 'BDummy_VAPID_Key_Replace_In_Production_1234567890',
                });
                const json = sub.toJSON();
                await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        endpoint: json.endpoint,
                        keys: json.keys,
                        userId: 'lawyer_admin',
                    }),
                });
                setPushEnabled(true);
            }
        } catch (e) {
            console.error('Push 구독 실패:', e);
            // 시뮬레이션 모드에서는 그냥 토글
            setPushEnabled(true);
        }
    }, [pushEnabled]);

    const handleSend = useCallback(async () => {
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
    }, [leadId, customMsg, subject]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            {/* 상단 바 */}
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-[60px] bg-white/90 border-b border-slate-200 backdrop-blur-md shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/admin/clients">
                        <button className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-amber-600 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> 리드 목록
                        </button>
                    </Link>
                    <div className="h-4 w-px bg-slate-200" />
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-800">이메일 미리보기 — {vars.company}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-red-50 text-red-600 border border-red-100">
                            {lead?.riskLevel || 'HIGH'} {vars.issueCount}건
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* 뷰 토글 */}
                    <div className="flex rounded-lg overflow-hidden border border-slate-200 bg-white p-0.5 shadow-sm">
                        {(['desktop', 'mobile'] as const).map(m => (
                            <button key={m} onClick={() => setViewMode(m)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === m ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                                {m === 'desktop' ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                    {sent ? (
                        <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                            <CheckCircle2 className="w-4 h-4" /> 발송 완료!
                        </div>
                    ) : (
                        <button onClick={handleSend} disabled={sending}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-sm">
                            {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            발송 확정
                        </button>
                    )}
                </div>
            </div>

            {/* 메인 레이아웃 */}
            <div className="flex pt-[60px] h-screen">
                {/* 좌: 편집 패널 */}
                <div className="w-80 flex-shrink-0 overflow-y-auto p-5 space-y-5 bg-white border-r border-slate-200">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-slate-400">수신 정보</p>
                        <div className="space-y-2.5 text-sm">
                            <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <User className="w-4 h-4 flex-shrink-0 text-slate-400" />
                                <span className="font-bold text-slate-700">{vars.contactName}</span>
                                <span className="text-slate-400 text-xs">({lead?.contactEmail || '이메일 미상'})</span>
                            </div>
                            <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <Mail className="w-4 h-4 flex-shrink-0 text-slate-400" />
                                <span className="font-bold text-slate-700">{vars.company}</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* 제목 편집 */}
                    <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block text-slate-500">
                            이메일 제목
                        </label>
                        <textarea 
                            value={subject} 
                            onChange={e => {
                                setSubject(e.target.value);
                                setIsSubjectEdited(true);
                            }} 
                            rows={3}
                            className="w-full p-3 rounded-xl outline-none text-[13px] resize-none bg-white border border-slate-200 text-slate-800 shadow-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-medium leading-relaxed" />
                    </div>

                    {/* 변호사 추가 메시지 */}
                    <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block text-slate-500">
                            개인화 메시지
                        </label>
                        <textarea value={customMsg} onChange={e => setCustomMsg(e.target.value)} rows={5}
                            placeholder="의뢰인에게 전할 의견을 입력하세요..."
                            className="w-full p-3 rounded-xl outline-none text-[13px] resize-none bg-white border border-slate-200 text-slate-800 shadow-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-medium leading-relaxed" />
                        <p className="text-[10px] mt-1.5 font-medium text-amber-600 flex items-center gap-1">
                            <Edit3 className="w-3 h-3" /> 이 메시지는 이메일 본문에 별도 블록으로 강조되어 들어갑니다.
                        </p>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* 드립 캠페인 및 개인화 링크 안내 */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
                            <p className="text-[10px] font-bold text-indigo-500 mb-1">📅 자동 드립 캠페인</p>
                            <p className="text-[9px] font-medium text-indigo-700">D+1,4,8,14일 미응답시<br/>자동 리마인드 발송</p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                            <p className="text-[10px] font-bold text-emerald-600 mb-1">🔗 고유 랜딩 발급됨</p>
                            <p className="text-[9px] font-medium text-emerald-800">이메일 내 버튼에<br/>전용 트래킹 URL 적용</p>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* 최적 발송 시간 */}
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5 text-slate-400">
                            <Clock className="w-3.5 h-3.5" /> 분석된 타겟 송신 시간
                        </p>
                        <div className="space-y-2">
                            {optimalTimes.map((t, i) => {
                                const isSelected = scheduledTime === `${t.day} ${t.hour}:00`;
                                return (
                                    <button key={i} onClick={() => setScheduledTime(`${t.day} ${t.hour}:00`)}
                                        className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-all border ${isSelected ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}>
                                        <div>
                                            <p className={`text-xs font-bold ${isSelected ? 'text-amber-700' : 'text-slate-700'}`}>{t.day} {t.hour}:00</p>
                                            <p className="text-[10px] mt-0.5 text-slate-400 font-medium">{t.reason}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${isSelected ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                            오픈율 {t.openRate}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        {scheduledTime && (
                            <p className="text-xs mt-3 flex items-center gap-1.5 text-amber-600 font-bold bg-amber-50 p-2 rounded-lg border border-amber-100">
                                <CheckCircle2 className="w-3.5 h-3.5" /> 해당 일시에 예약 발송됩니다.
                            </p>
                        )}
                    </div>

                    {/* 실시간 알림 */}
                    <button onClick={handlePushToggle}
                        className={`w-full mt-4 p-3.5 rounded-xl flex items-center justify-between transition-all border ${pushEnabled ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}>
                        <div className="flex items-center gap-2.5">
                            {pushEnabled ? <Bell className="w-4 h-4 text-blue-600" /> : <BellOff className="w-4 h-4 text-slate-400" />}
                            <div className="text-left">
                                <p className={`text-[12px] font-bold ${pushEnabled ? 'text-blue-700' : 'text-slate-600'}`}>
                                    {pushEnabled ? '오픈/클릭 실시간 알림 ON' : '푸시 알림 끄기'}
                                </p>
                            </div>
                        </div>
                        <div className={`w-8 h-4.5 rounded-full relative transition-all ${pushEnabled ? 'bg-blue-500' : 'bg-slate-200'}`}>
                            <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${pushEnabled ? 'left-[16px]' : 'left-[2px]'}`} />
                        </div>
                    </button>
                    
                    {/* 데이터 요약표 */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-slate-500 flex items-center gap-1.5">
                                <BarChart3 className="w-3 h-3" /> 최근 반응 지표
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-medium mb-1">최근 오픈</p>
                                    <p className="text-xs font-bold text-slate-700">{trackingData.lastOpenAt ? new Date(trackingData.lastOpenAt).toLocaleDateString() : '기록 없음'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-medium mb-1">관심도 점수</p>
                                    <p className="text-xs font-bold text-blue-600">{trackingData.score} 점</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 우: HTML 미리보기 */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-100">
                    <div className="mb-6 flex justify-center">
                        <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">발송 제목</span>
                            <span className="text-[13px] font-medium text-slate-800">{subject}</span>
                        </div>
                    </div>
                    <div className={`mx-auto ${viewMode === 'mobile' ? 'max-w-[400px]' : 'max-w-3xl'} overflow-hidden shadow-2xl rounded-tr-xl rounded-tl-xl border border-slate-200 bg-white transition-all`}>
                        {/* Browser Window Chrome */}
                        <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-slate-300" />
                                <div className="w-3 h-3 rounded-full bg-slate-300" />
                                <div className="w-3 h-3 rounded-full bg-slate-300" />
                            </div>
                            <div className="mx-auto px-4 py-1 bg-white border border-slate-200 rounded-md text-[10px] text-slate-400 w-1/2 text-center truncate">
                                preview.ibs-law.co.kr
                            </div>
                        </div>
                        <iframe
                            srcDoc={htmlPreview}
                            className="w-full bg-white"
                            style={{ height: viewMode === 'mobile' ? '700px' : '800px', border: 'none' }}
                            title="이메일 미리보기"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});

export default function EmailPreviewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
            <EmailPreviewContent />
        </Suspense>
    );
}
