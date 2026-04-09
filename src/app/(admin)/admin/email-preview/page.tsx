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
import { buildHookEmailHtml } from '@/lib/emailTemplates';

// ── 이메일 미리보기 + 개인화 편집 + 확정 발송 UI ─────────────

const BASE_SUBJECT = '[IBS 법률] {company}님의 개인정보처리방침 — 리스크 분석 결과';
const BASE_PREHEADER = '개인정보보호법 위반 {issueCount}건 발견. 지금 확인하세요.';


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

    const vars: Record<string, string> = useMemo(() => {
        const totalCount = lead?.issues?.length || lead?.issueCount || 5;
        const highCount = lead?.issues?.filter((iss: any) => iss.level === 'HIGH' || iss.riskLevel === 'HIGH')?.length || 2;
        
        let dynamicIssueText = '개인정보 수집 항목의 과다수집(제16조 위반), 제3자 제공 현황 미명시(제17조 위반)';
        if (lead?.issues && lead.issues.length > 0) {
            const sortedIssues = [...lead.issues].sort((a, b) => {
                if ((a.level === 'HIGH' || a.riskLevel === 'HIGH') && !(b.level === 'HIGH' || b.riskLevel === 'HIGH')) return -1;
                if (!(a.level === 'HIGH' || a.riskLevel === 'HIGH') && (b.level === 'HIGH' || b.riskLevel === 'HIGH')) return 1;
                return 0;
            });
            const topIssues = sortedIssues.slice(0, 2);
            dynamicIssueText = topIssues.map(iss => {
                const lawRef = iss.law || iss.law_ref || '';
                const shortLawMatches = lawRef.match(/제\d+조/);
                const shortLaw = shortLawMatches ? shortLawMatches[0] : '';
                const cleanTitle = (iss.title || '').replace(/^조항\s*\d+\.\s*/, '');
                return `${cleanTitle}${shortLaw ? `(${shortLaw} 위반)` : ''}`;
            }).join(', ');
        }
        
        return {
            company: lead?.companyName || lead?.name || companyParam || '(주)샘플회사',
            contactName: lead?.contactName || '담당자',
            lawyerName: lead?.lawyerName || lead?.assigned_lawyer_id || '',
            leadId,
            issueCount: String(totalCount),
            riskLevel: lead?.riskLevel || 'HIGH',
            riskScore: String(lead?.riskScore || 0),
            storeCount: String(lead?.storeCount || 0),
            bizType: lead?.bizType || '',
            monthlyFee: sub.monthly.toLocaleString(),
            unsubscribeToken: typeof window !== 'undefined' ? btoa(`unsub_${leadId}`) : `unsub_${leadId}`,
            summaryOpinion: lead?.summary_opinion || lead?.summaryOpinion || `귀사의 개인정보처리방침을 검토한 결과, 개인정보보호법상 시정이 필요한 사항 ${totalCount}건이 확인되었습니다. 특히 ${dynamicIssueText} 등 고위험 사항 ${highCount}건은 개인정보보호위원회 정기감사 시 즉시 시정명령 및 과징금 부과 대상에 해당합니다. 최근 쿠팡 55억원, 인터파크 44억원 등 대규모 과징금 사례가 이어지고 있어 조속한 시정이 필요합니다.`
        };
    }, [lead, leadId, companyParam, sub.monthly]);

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
    const htmlPreview = useMemo(() => buildHookEmailHtml(vars, customMsg, baseUrl, lead?.issues || []), [vars, customMsg, baseUrl, lead?.issues]);
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
                    <div className={`mx-auto ${viewMode === 'mobile' ? 'max-w-[400px]' : 'max-w-4xl'} overflow-hidden shadow-2xl rounded-tr-xl rounded-tl-xl border border-slate-200 bg-white transition-all`}>
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
