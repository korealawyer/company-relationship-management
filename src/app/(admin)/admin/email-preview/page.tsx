'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, Send, Edit3, RefreshCw, CheckCircle2, Mail, Smartphone, Monitor, User, Bell, BellOff, Clock, BarChart3, MousePointerClick, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { leadStore, calcSubscription } from '@/lib/leadStore';
import { fillTemplate, DRIP_SEQUENCE } from '@/lib/dripStore';
import { LeadScoringService, getOptimalSendTimes } from '@/lib/leadScoring';

// ── 이메일 미리보기 + 개인화 편집 + 확정 발송 UI ─────────────

const BASE_SUBJECT = '[IBS 법률] {company}님의 개인정보처리방침 — 리스크 분석 결과';
const BASE_PREHEADER = '개인정보보호법 위반 {issueCount}건 발견. 지금 확인하세요.';

function buildHookEmailHtml(vars: Record<string, string>, customMsg: string, baseUrl: string = ''): string {
    const lawyerName = vars.lawyerName || '김정래';
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

    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 16px">
      안녕하세요.<br/>
      <strong>IBS 법률사무소</strong> 개인정보보호 전문 <strong>${lawyerName} 변호사</strong>입니다.
    </p>

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
      <p style="color:#374151;font-size:13px;margin:0;line-height:1.7">${customMsg}</p>
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
        <div>
          <p style="color:#1e293b;font-size:15px;font-weight:900;margin:0 0 4px">${lawyerName} 변호사</p>
          <p style="color:#64748b;font-size:12px;margin:0 0 2px">IBS 법률사무소 · 개인정보보호 전문</p>
          <p style="color:#64748b;font-size:12px;margin:0 0 2px">대한변호사협회 등록 · 개인정보관리사(CPPG)</p>
          <p style="color:#64748b;font-size:12px;margin:0">직통 02-1234-5678 | lawyer@ibs-law.co.kr</p>
        </div>
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
    const lead = useMemo(() => leadStore.getById(leadId), [leadId]);
    const sub = useMemo(() => calcSubscription(lead?.storeCount || 0), [lead?.storeCount]);

    const vars: Record<string, string> = useMemo(() => ({
        company: lead?.companyName || '(주)샘플회사',
        contactName: lead?.contactName || '담당자',
        leadId,
        issueCount: String(lead?.issueCount || 0),
        riskLevel: lead?.riskLevel || 'HIGH',
        riskScore: String(lead?.riskScore || 0),
        storeCount: String(lead?.storeCount || 0),
        bizType: lead?.bizType || '',
        monthlyFee: sub.monthly.toLocaleString(),
        unsubscribeToken: typeof window !== 'undefined' ? btoa(`unsub_${leadId}`) : `unsub_${leadId}`,
    }), [lead, leadId, sub.monthly]);

    const [subject, setSubject] = useState(fillTemplate(BASE_SUBJECT, vars));
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
        <div className="min-h-screen" style={{ background: '#04091a' }}>
            {/* 상단 바 */}
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
                style={{ background: 'rgba(13,27,62,0.97)', borderBottom: '1px solid rgba(201,168,76,0.15)', height: 60 }}>
                <div className="flex items-center gap-4">
                    <Link href="/employee">
                        <button className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(240,244,255,0.5)' }}>
                            <ArrowLeft className="w-4 h-4" /> 리드 목록
                        </button>
                    </Link>
                    <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                    <div>
                        <span className="text-sm font-black" style={{ color: '#f0f4ff' }}>이메일 미리보기 — {lead?.companyName}</span>
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                            {lead?.riskLevel} {lead?.issueCount}건
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
                            style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>
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

            {/* 메인 레이아웃 */}
            <div className="flex pt-[60px] h-screen">
                {/* 좌: 편집 패널 */}
                <div className="w-80 flex-shrink-0 overflow-y-auto p-5 space-y-4"
                    style={{ borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(4,9,26,0.6)' }}>
                    <div>
                        <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: 'rgba(240,244,255,0.3)' }}>수신 정보</p>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(240,244,255,0.3)' }} />
                                <span style={{ color: '#f0f4ff' }}>{lead?.contactName}</span>
                                <span style={{ color: 'rgba(240,244,255,0.4)' }}>({lead?.contactEmail})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(240,244,255,0.3)' }} />
                                <span style={{ color: 'rgba(240,244,255,0.6)' }}>{lead?.companyName}</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

                    {/* 제목 편집 */}
                    <div>
                        <label className="text-xs font-black uppercase tracking-wider mb-2 block" style={{ color: 'rgba(240,244,255,0.3)' }}>
                            이메일 제목
                        </label>
                        <textarea value={subject} onChange={e => setSubject(e.target.value)} rows={3}
                            className="w-full p-3 rounded-lg outline-none text-sm resize-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', lineHeight: 1.5 }} />
                    </div>

                    {/* 변호사 추가 메시지 */}
                    <div>
                        <label className="text-xs font-black uppercase tracking-wider mb-2 block" style={{ color: 'rgba(240,244,255,0.3)' }}>
                            ✏️ 개인화 메시지 (선택)
                        </label>
                        <textarea value={customMsg} onChange={e => setCustomMsg(e.target.value)} rows={5}
                            placeholder="담당자에게 전할 메시지를 입력하면 이메일 본문에 포함됩니다..."
                            className="w-full p-3 rounded-lg outline-none text-sm resize-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', lineHeight: 1.6 }} />
                    </div>

                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

                    {/* 개인화 URL */}
                    <div>
                        <label className="text-xs font-black uppercase tracking-wider mb-2 block" style={{ color: 'rgba(240,244,255,0.3)' }}>
                            개인화 URL
                        </label>
                        <div className="p-3 rounded-lg text-xs break-all"
                            style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)', color: '#c9a84c' }}>
                            /landing?cid={leadId}
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'rgba(240,244,255,0.3)' }}>클릭 시 해당 기업 분석 결과 랜딩 열림</p>
                    </div>

                    {/* 드립 캠페인 안내 */}
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)' }}>
                        <p className="text-xs font-black mb-1" style={{ color: '#818cf8' }}>📅 드립 캠페인 예약</p>
                        <p className="text-xs" style={{ color: 'rgba(240,244,255,0.5)' }}>미결제 시 D+1·4·8·14·21·30일 법률자료 자동 발송</p>
                    </div>

                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

                    {/* 최적 발송 시간 */}
                    <div>
                        <p className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: 'rgba(240,244,255,0.3)' }}>
                            <Clock className="w-3.5 h-3.5" /> 최적 발송 시간
                        </p>
                        <div className="space-y-1.5">
                            {optimalTimes.map((t, i) => (
                                <button key={i} onClick={() => setScheduledTime(`${t.day} ${t.hour}:00`)}
                                    className="w-full p-2.5 rounded-lg text-left flex items-center justify-between transition-all"
                                    style={{
                                        background: scheduledTime === `${t.day} ${t.hour}:00` ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.03)',
                                        border: scheduledTime === `${t.day} ${t.hour}:00` ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                    }}>
                                    <div>
                                        <p className="text-xs font-bold" style={{ color: '#f0f4ff' }}>{t.day} {t.hour}:00</p>
                                        <p className="text-[10px]" style={{ color: 'rgba(240,244,255,0.4)' }}>{t.reason}</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>
                                        {t.openRate}
                                    </span>
                                </button>
                            ))}
                        </div>
                        {scheduledTime && (
                            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#4ade80' }}>
                                <CheckCircle2 className="w-3 h-3" /> {scheduledTime} 예약 발송
                            </p>
                        )}
                    </div>

                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

                    {/* 푸시 알림 설정 */}
                    <div>
                        <button onClick={handlePushToggle}
                            className="w-full p-3 rounded-lg flex items-center justify-between transition-all"
                            style={{
                                background: pushEnabled ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
                                border: pushEnabled ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(255,255,255,0.06)',
                            }}>
                            <div className="flex items-center gap-2">
                                {pushEnabled ? <Bell className="w-4 h-4" style={{ color: '#4ade80' }} /> : <BellOff className="w-4 h-4" style={{ color: 'rgba(240,244,255,0.3)' }} />}
                                <div className="text-left">
                                    <p className="text-xs font-bold" style={{ color: pushEnabled ? '#4ade80' : 'rgba(240,244,255,0.5)' }}>
                                        {pushEnabled ? '실시간 알림 ON' : '실시간 알림 OFF'}
                                    </p>
                                    <p className="text-[10px]" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                        이메일 열람 시 핸드폰 푸시 알림
                                    </p>
                                </div>
                            </div>
                            <div className="w-8 h-4 rounded-full relative transition-all"
                                style={{ background: pushEnabled ? '#4ade80' : 'rgba(255,255,255,0.15)' }}>
                                <div className="w-3 h-3 rounded-full absolute top-0.5 transition-all"
                                    style={{ background: '#fff', left: pushEnabled ? '17px' : '2px' }} />
                            </div>
                        </button>
                    </div>

                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

                    {/* 실시간 추적 대시보드 */}
                    <div>
                        <p className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: 'rgba(240,244,255,0.3)' }}>
                            <BarChart3 className="w-3.5 h-3.5" /> 추적 현황
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                <Eye className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: '#3b82f6' }} />
                                <p className="text-lg font-black" style={{ color: '#3b82f6' }}>{trackingData.opens}</p>
                                <p className="text-[9px]" style={{ color: 'rgba(240,244,255,0.4)' }}>열람</p>
                            </div>
                            <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
                                <MousePointerClick className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: '#a855f7' }} />
                                <p className="text-lg font-black" style={{ color: '#a855f7' }}>{trackingData.clicks}</p>
                                <p className="text-[9px]" style={{ color: 'rgba(240,244,255,0.4)' }}>클릭</p>
                            </div>
                            <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                                <TrendingUp className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: '#4ade80' }} />
                                <p className="text-lg font-black" style={{ color: '#4ade80' }}>{trackingData.score}</p>
                                <p className="text-[9px]" style={{ color: 'rgba(240,244,255,0.4)' }}>스코어</p>
                            </div>
                        </div>
                        {trackingData.lastOpenAt && (
                            <p className="text-[10px] mt-2" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                마지막 열람: {new Date(trackingData.lastOpenAt).toLocaleString('ko-KR')}
                            </p>
                        )}
                    </div>
                </div>

                {/* 우: HTML 미리보기 */}
                <div className="flex-1 overflow-y-auto p-6" style={{ background: '#e2e8f0' }}>
                    <div className="mb-4 text-center">
                        <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                            style={{ background: 'rgba(0,0,0,0.1)', color: '#64748b' }}>
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
});

export default function EmailPreviewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen" style={{ background: '#04091a' }} />}>
            <EmailPreviewContent />
        </Suspense>
    );
}
