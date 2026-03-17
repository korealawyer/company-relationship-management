'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone, PhoneOff, CheckCircle2, Mail, FileText,
    Clock, Building2, Globe, User, MessageSquare, Send, MessageCircle,
    Pause, Play, Volume2, ChevronRight, ArrowUpDown,
    Search, ExternalLink, AlertCircle, Copy, Check,
    Filter, Zap, TrendingUp, Headphones,
    BarChart3, Target, Newspaper, Bell, BrainCircuit,
    CalendarClock, MailCheck, Sparkles, Flame, RefreshCw,
    ChevronDown, ChevronUp, X, Star, Hash, ArrowRight,
} from 'lucide-react';
import {
    store, Company, CaseStatus,
    STATUS_LABEL, STATUS_COLOR, STATUS_TEXT, SALES_REPS,
} from '@/lib/mockStore';
import {
    CallQueueManager, AutoEmailService, FollowUpService,
    RiskAlertService, AIMemoService, NewsLeadService, AutoKakaoService,
    type AIMemoResult, type CallQueueItem, type RiskAlert, type KakaoScheduleItem, NEWS_FEED,
} from '@/lib/salesAutomation';
import Link from 'next/link';

/* ── CRM 라이트 색상 ──────────────────────────── */
const C = {
    bg:'#f8f9fc',surface:'#ffffff',card:'#ffffff',cardHover:'#f1f5f9',
    elevated:'#f8fafc',border:'#d1d5db',borderLight:'#e5e7eb',
    heading:'#0f172a',body:'#1e293b',sub:'#475569',muted:'#64748b',faint:'#94a3b8',
    accent:'#4f46e5',accentSoft:'#6366f1',green:'#059669',greenSoft:'#10b981',
    red:'#dc2626',amber:'#d97706',blue:'#2563eb',purple:'#7c3aed',
    cyan:'#0891b2',rowHover:'#f1f5f9',
};

const CALLABLE: CaseStatus[] = [
    'analyzed','sales_confirmed','lawyer_confirmed','emailed',
    'client_replied','client_viewed','contract_sent','contract_signed',
];

function getScript(c: Company): string {
    const hi = c.contactName ? `${c.contactName} 님` : '담당자님';
    const issues = (c.issues||[]).slice(0,3);
    const it = issues.length>0 ? issues.map((i,x)=>`  ${x+1}. [${i.level}] ${i.title}`).join('\n') : '  (분석 결과 대기 중)';
    if (['analyzed','sales_confirmed'].includes(c.status))
        return `안녕하세요, ${hi}.\n법률사무소 IBS 영업팀입니다.\n\n${c.name}의 개인정보처리방침을 검토한 결과,\n아래와 같은 법적 리스크가 확인되었습니다:\n\n${it}\n\n사전 대응을 권고드립니다.`;
    if (['lawyer_confirmed','emailed'].includes(c.status))
        return `${hi}, 법률사무소 IBS입니다.\n앞서 발송드린 ${c.name} 개인정보 진단 보고서는 확인하셨을까요?\n\n주요 리스크:\n${it}\n\n전담 변호사의 상세 검토 의견이 준비되어 있습니다.`;
    if (['client_replied','client_viewed'].includes(c.status))
        return `${hi}, 법률사무소 IBS입니다.\n보고서를 검토해 주셔서 감사합니다.\n\n계약 진행을 위한 서류가 준비되어 있습니다.`;
    return `${hi}, 법률사무소 IBS 영업팀입니다.\n${c.name} 건 관련 안내드리고자 연락드렸습니다.`;
}

function riskColor(s: number) {
    if (s>=70) return {bar:'#dc2626',text:'#dc2626',bg:'#fef2f2'};
    if (s>=40) return {bar:'#d97706',text:'#92400e',bg:'#fffbeb'};
    return {bar:'#059669',text:'#065f46',bg:'#ecfdf5'};
}

function Badge({status}:{status:CaseStatus}) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap"
        style={{background:STATUS_COLOR[status],color:STATUS_TEXT[status]}}>{STATUS_LABEL[status]}</span>;
}

function useTimer() {
    const [sec,setSec]=useState(0);
    const [running,setRunning]=useState(false);
    const ref=useRef<ReturnType<typeof setInterval>|null>(null);
    const start=useCallback(()=>{setSec(0);setRunning(true);},[]);
    const pause=useCallback(()=>setRunning(false),[]);
    const resume=useCallback(()=>setRunning(true),[]);
    const reset=useCallback(()=>{setSec(0);setRunning(false);},[]);
    useEffect(()=>{
        if(running) ref.current=setInterval(()=>setSec(s=>s+1),1000);
        else if(ref.current) clearInterval(ref.current);
        return ()=>{if(ref.current) clearInterval(ref.current);};
    },[running]);
    const fmt=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
    return {sec,fmt,running,start,pause,resume,reset};
}

/* ══ 인라인 확장 패널 ══════════════════════════════ */
function InlinePanel({ co, isOnCall, onStartCall, onEndCall, onClose, timer, callResult, onCallResult, onRefresh, setToast }: {
    co: Company; isOnCall: boolean; onStartCall:()=>void; onEndCall:()=>void; onClose:()=>void;
    timer: ReturnType<typeof useTimer>; callResult: string; onCallResult:(r:'connected'|'no_answer'|'callback')=>void;
    onRefresh:()=>void; setToast:(s:string)=>void;
}) {
    const [tab, setTab] = useState<'script'|'info'|'memo'>('script');
    const [note, setNote] = useState(co.callNote||'');
    const [aiResult, setAiResult] = useState<AIMemoResult|null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => { setNote(co.callNote||''); setAiResult(null); setTab('script'); }, [co.id]);

    const copyScript = () => {
        navigator.clipboard.writeText(getScript(co)).then(()=>{setCopied(true);setToast('📋 복사됨');setTimeout(()=>setCopied(false),2000);});
    };
    const saveMemo = () => { store.update(co.id,{callNote:note}); onRefresh(); setToast('💾 저장'); };
    const saveWithAI = async () => {
        if(!note.trim()) return;
        store.update(co.id,{callNote:note}); setAiLoading(true);
        try {
            const r = await AIMemoService.analyze(co,note);
            setAiResult(r); store.update(co.id,{aiMemoSummary:r.summary,aiNextAction:r.nextAction,aiNextActionType:r.nextActionType});
            setToast('🤖 AI 분석 완료');
        } catch { setToast('⚠️ 실패'); } finally { setAiLoading(false); onRefresh(); }
    };
    const rc = riskColor(co.riskScore);
    const script = getScript(co);

    return (
        <motion.tr initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} transition={{duration:0.25}}>
            <td colSpan={10} className="p-0">
                <div style={{background:isOnCall?'#f0fdf4':'#f8fafc',borderTop:`2px solid ${isOnCall?'#059669':'#4f46e5'}`,borderBottom:`2px solid ${isOnCall?'#a7f3d0':'#c7d2fe'}`}}>
                    {/* ── 패널 헤더 ── */}
                    <div className="flex items-center justify-between px-5 py-2" style={{borderBottom:`1px solid ${C.borderLight}`}}>
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:isOnCall?'#ecfdf5':'#eef2ff'}}>
                                {isOnCall?<Headphones className="w-3.5 h-3.5" style={{color:'#059669'}}/>:<Building2 className="w-3.5 h-3.5" style={{color:'#4f46e5'}}/>}
                            </div>
                            <span className="text-sm font-black" style={{color:C.heading}}>{co.name}</span>
                            <span className="text-xs" style={{color:C.sub}}>{co.contactName||'담당자'} · {co.contactPhone||co.phone}</span>
                            <Badge status={co.status}/>
                            {isOnCall && <>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-lg ml-1" style={{background:'#ecfdf5'}}>
                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:'#059669'}}/>
                                    <span className="font-mono text-base font-black" style={{color:'#059669'}}>{timer.fmt}</span>
                                </div>
                                {[{k:'connected' as const,l:'✅연결',c:'#059669',bg:'#ecfdf5',bd:'#a7f3d0'},
                                  {k:'no_answer' as const,l:'📵부재',c:'#92400e',bg:'#fffbeb',bd:'#fde68a'},
                                  {k:'callback' as const,l:'📋콜백',c:'#4f46e5',bg:'#eef2ff',bd:'#c7d2fe'}].map(r=>(
                                    <button key={r.k} onClick={()=>onCallResult(r.k)} className="px-2 py-1 rounded-lg text-[10px] font-bold"
                                        style={{background:callResult===r.k?r.bg:'#f8f9fc',color:callResult===r.k?r.c:C.faint,border:`1px solid ${callResult===r.k?r.bd:C.borderLight}`}}>{r.l}</button>
                                ))}
                            </>}
                        </div>
                        <div className="flex items-center gap-2">
                            {[{k:'script' as const,l:'📞 스크립트'},{k:'info' as const,l:'📊 회사정보'},{k:'memo' as const,l:'📝 메모'}].map(t=>(
                                <button key={t.k} onClick={()=>setTab(t.k)} className="px-2 py-1 rounded-lg text-[10px] font-bold"
                                    style={{background:tab===t.k?'#eef2ff':'transparent',color:tab===t.k?'#4f46e5':C.muted,border:`1px solid ${tab===t.k?'#c7d2fe':'transparent'}`}}>{t.l}</button>
                            ))}
                            <div className="w-px h-5 mx-1" style={{background:C.borderLight}}/>
                            {!isOnCall ? (
                                <button onClick={onStartCall} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black hover:scale-105 transition-transform" style={{background:'#ecfdf5',color:'#059669',border:'1px solid #a7f3d0'}}><Phone className="w-3.5 h-3.5"/>통화 시작</button>
                            ) : <>
                                <button onClick={timer.running?timer.pause:timer.resume} className="p-2 rounded-lg" style={{background:'#f8f9fc',border:`1px solid ${C.borderLight}`}}>
                                    {timer.running?<Pause className="w-3.5 h-3.5" style={{color:C.sub}}/>:<Play className="w-3.5 h-3.5" style={{color:'#059669'}}/>}
                                </button>
                                <button onClick={onEndCall} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black" style={{background:'#fef2f2',color:'#dc2626',border:'1px solid #fca5a5'}}><PhoneOff className="w-3.5 h-3.5"/>종료</button>
                            </>}
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" style={{color:C.faint}}/></button>
                        </div>
                    </div>

                    {/* ── 탭 콘텐츠 ── */}
                    <div className="px-5 py-3" style={{maxHeight:280,overflowY:'auto'}}>
                        {/* 스크립트 탭 */}
                        {tab==='script' && (
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 rounded-xl p-4" style={{background:C.surface,border:`1px solid ${C.borderLight}`}}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2"><Volume2 className="w-3.5 h-3.5" style={{color:C.accent}}/><span className="text-xs font-black" style={{color:C.heading}}>통화 스크립트</span><Badge status={co.status}/></div>
                                        <button onClick={copyScript} className="text-[10px] px-3 py-1 rounded-lg font-bold" style={{background:copied?'#ecfdf5':'#f1f5f9',color:copied?'#059669':C.sub,border:`1px solid ${copied?'#a7f3d0':C.borderLight}`}}>{copied?'✅ 복사됨':'📋 복사'}</button>
                                    </div>
                                    <div className="text-[12px] leading-[1.9] whitespace-pre-line" style={{color:C.body}}>{script}</div>
                                    {co.issues&&co.issues.length>0&&<div className="mt-3 pt-2" style={{borderTop:`1px solid ${C.borderLight}`}}>
                                        <p className="text-[10px] font-bold mb-1" style={{color:'#dc2626'}}>⚠️ 주요 이슈 ({co.issues.length}건)</p>
                                        {co.issues.slice(0,4).map((iss,j)=>(<div key={j} className="text-[11px] py-0.5 flex items-center gap-1.5" style={{color:C.body}}>
                                            <span className="text-[8px] px-1.5 rounded font-bold" style={{background:iss.level==='HIGH'?'#fef2f2':'#fffbeb',color:iss.level==='HIGH'?'#dc2626':'#92400e'}}>{iss.level}</span>{iss.title}
                                        </div>))}
                                    </div>}
                                </div>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {[{l:'담당자',v:co.contactName||'미등록'},{l:'전화',v:co.contactPhone||co.phone},{l:'이메일',v:co.contactEmail||co.email},{l:'매장수',v:`${co.storeCount}개`}].map(i=>(
                                            <div key={i.l} className="px-2.5 py-2 rounded-lg" style={{background:C.surface,border:`1px solid ${C.borderLight}`}}>
                                                <div className="text-[8px] font-bold" style={{color:C.faint}}>{i.l}</div>
                                                <div className="text-[10px] font-medium truncate" style={{color:C.body}}>{i.v}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="rounded-xl p-3" style={{background:C.surface,border:`1px solid ${C.borderLight}`}}>
                                        <p className="text-[10px] font-bold mb-1" style={{color:C.heading}}>위험도</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{background:'#e5e7eb'}}><div className="h-full rounded-full" style={{width:`${co.riskScore}%`,background:rc.bar}}/></div>
                                            <span className="text-sm font-black" style={{color:rc.text}}>{co.riskScore}</span>
                                        </div>
                                    </div>
                                    {co.assignedLawyer&&<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{background:'#f3e8ff',border:'1px solid #e9d5ff'}}><span className="text-[10px] font-bold" style={{color:'#7c3aed'}}>⚖️ {co.assignedLawyer}</span></div>}
                                </div>
                            </div>
                        )}

                        {/* 회사정보 탭 */}
                        {tab==='info' && (
                            <div className="grid grid-cols-4 gap-3">
                                <div className="col-span-2 space-y-2">
                                    <p className="text-[11px] font-black" style={{color:C.heading}}>📋 기업 정보</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[{l:'기업명',v:co.name},{l:'사업자',v:co.biz},{l:'대표',v:(co as any).ceo||'—'},{l:'담당자',v:co.contactName||'미등록'},{l:'이메일',v:co.contactEmail||co.email},{l:'전화',v:co.contactPhone||co.phone},{l:'매장수',v:`${co.storeCount}개`},{l:'업종',v:co.bizType||'—'},{l:'변호사',v:co.assignedLawyer||'미배정'}].map(i=>(
                                            <div key={i.l} className="px-2.5 py-2 rounded-lg" style={{background:C.surface,border:`1px solid ${C.borderLight}`}}>
                                                <div className="text-[8px] font-bold" style={{color:C.faint}}>{i.l}</div>
                                                <div className="text-[11px] font-medium truncate" style={{color:C.body}}>{i.v}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[11px] font-black" style={{color:C.heading}}>⚠️ 이슈 ({co.issues?.length||0}건)</p>
                                    <div className="space-y-1 overflow-y-auto" style={{maxHeight:220}}>
                                        {(co.issues||[]).map((iss,j)=>(
                                            <div key={j} className="px-2.5 py-1.5 rounded-lg text-[10px] flex items-start gap-1.5" style={{background:iss.level==='HIGH'?'#fef2f2':'#fffbeb',border:`1px solid ${iss.level==='HIGH'?'#fca5a5':'#fde68a'}`}}>
                                                <span className="text-[8px] px-1 rounded font-bold mt-0.5" style={{background:iss.level==='HIGH'?'#dc2626':'#d97706',color:'#fff'}}>{iss.level}</span>
                                                <span style={{color:C.body}}>{iss.title}</span>
                                            </div>
                                        ))}
                                        {(!co.issues||co.issues.length===0)&&<p className="text-[10px]" style={{color:C.faint}}>이슈 없음</p>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[11px] font-black" style={{color:C.heading}}>⚡ 빠른 액션</p>
                                    <div className="space-y-1.5">
                                        {co.status==='lawyer_confirmed'&&<button onClick={()=>{store.sendEmail(co.id);onRefresh();setToast('✉️ 이메일 발송');}} className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold" style={{background:'#eff6ff',color:'#2563eb',border:'1px solid #93c5fd'}}><Mail className="w-3 h-3"/>이메일 발송</button>}
                                        {(co.status==='client_replied'||co.status==='client_viewed')&&<button onClick={()=>{store.sendContract(co.id,'email');onRefresh();setToast('📄 계약서 발송');}} className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold" style={{background:'#fffbeb',color:'#92400e',border:'1px solid #fde68a'}}><FileText className="w-3 h-3"/>계약서 발송</button>}
                                        {co.status==='contract_sent'&&<button onClick={()=>{store.signContract(co.id);onRefresh();setToast('✅ 서명 확인');}} className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold" style={{background:'#ecfdf5',color:'#059669',border:'1px solid #a7f3d0'}}><CheckCircle2 className="w-3 h-3"/>서명 확인</button>}
                                        <Link href={`/privacy-report?company=${encodeURIComponent(co.name)}`} target="_blank"><button className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold" style={{background:C.surface,color:C.sub,border:`1px solid ${C.border}`}}><ExternalLink className="w-3 h-3"/>진단 보고서</button></Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 메모 탭 */}
                        {tab==='memo' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="통화 내용을 기록하세요..."
                                        className="flex-1 rounded-xl text-[12px] p-4 font-medium leading-relaxed" style={{background:C.surface,border:`1px solid ${C.borderLight}`,color:C.body,outline:'none',resize:'none',minHeight:180}} />
                                    <div className="flex gap-2">
                                        <button onClick={saveMemo} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold" style={{background:'#eef2ff',color:'#4f46e5',border:'1px solid #c7d2fe'}}><Send className="w-3.5 h-3.5"/>저장</button>
                                        <button onClick={saveWithAI} disabled={aiLoading} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold" style={{background:'#f3e8ff',color:'#7c3aed',border:'1px solid #d8b4fe'}}>{aiLoading?<RefreshCw className="w-3.5 h-3.5 animate-spin"/>:<BrainCircuit className="w-3.5 h-3.5"/>}{aiLoading?'분석중...':'AI 분석 저장'}</button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {aiResult&&<div className="rounded-xl p-4" style={{background:'#faf5ff',border:'1px solid #e9d5ff'}}>
                                        <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4" style={{color:'#7c3aed'}}/><span className="text-xs font-black" style={{color:C.heading}}>AI 분석 결과</span><span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{background:'#f3e8ff',color:'#7c3aed'}}>신뢰도 {aiResult.confidence}%</span></div>
                                        <p className="text-[11px] mb-2 leading-relaxed" style={{color:C.body}}>{aiResult.summary}</p>
                                        {aiResult.keyPoints&&aiResult.keyPoints.length>0&&<div className="mb-2">{aiResult.keyPoints.map((p,i)=>(<div key={i} className="text-[10px] py-0.5" style={{color:C.sub}}>• {p}</div>))}</div>}
                                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{background:'#ecfdf5',border:'1px solid #a7f3d0'}}><Zap className="w-3 h-3" style={{color:'#059669'}}/><span className="text-[10px] font-bold" style={{color:'#059669'}}>추천: {aiResult.nextAction}</span></div>
                                    </div>}
                                    {!aiResult&&<div className="rounded-xl p-6 text-center" style={{background:C.surface,border:`1px solid ${C.borderLight}`}}>
                                        <BrainCircuit className="w-8 h-8 mx-auto mb-2" style={{color:C.faint}}/>
                                        <p className="text-xs font-bold" style={{color:C.muted}}>메모 작성 후 AI 분석</p>
                                        <p className="text-[10px] mt-1" style={{color:C.faint}}>통화 내용 요약 + 다음 액션 추천</p>
                                    </div>}
                                    {co.aiMemoSummary&&!aiResult&&<div className="rounded-xl p-3" style={{background:'#f0fdf4',border:'1px solid #a7f3d0'}}>
                                        <p className="text-[10px] font-bold mb-1" style={{color:'#059669'}}>📌 이전 AI 분석</p>
                                        <p className="text-[10px]" style={{color:C.body}}>{co.aiMemoSummary}</p>
                                    </div>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </td>
        </motion.tr>
    );
}

/* ══ 메인 페이지 ══════════════════════════════════ */
export default function SalesCallPage() {
    const [companies,setCompanies]=useState<Company[]>([]);
    const [search,setSearch]=useState('');
    const [selectedId,setSelectedId]=useState<string|null>(null);
    const [toast,setToast]=useState('');
    const [callResult,setCallResult]=useState<'connected'|'no_answer'|'callback'|''>('');
    const [activeCallId,setActiveCallId]=useState<string|null>(null);
    const [statusFilter,setStatusFilter]=useState<CaseStatus|'all'>('all');
    const [sortKey,setSortKey]=useState<'risk'|'name'|'status'>('risk');
    const [sortAsc,setSortAsc]=useState(false);
    const [showNews,setShowNews]=useState(false);
    const [riskAlerts,setRiskAlerts]=useState<RiskAlert[]>([]);
    const [callQueue,setCallQueue]=useState<CallQueueItem[]>([]);
    const [showCallbackModal,setShowCallbackModal]=useState(false);
    const [callbackTime,setCallbackTime]=useState('');
    const [kakaoTarget,setKakaoTarget]=useState<Company|null>(null);
    const [kakaoTemplate,setKakaoTemplate]=useState(0);
    const [kakaoSending,setKakaoSending]=useState(false);
    const [kakaoStatuses,setKakaoStatuses]=useState<Record<string,KakaoScheduleItem>>({});
    const timer=useTimer();

    const refresh=useCallback(()=>{setCompanies(store.getAll().filter(c=>CALLABLE.includes(c.status)));},[]);
    useEffect(()=>{refresh();const id=setInterval(refresh,2000);return()=>clearInterval(id);},[refresh]);
    useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),3000);return()=>clearTimeout(t);},[toast]);
    useEffect(()=>{if(companies.length>0){setRiskAlerts(RiskAlertService.generateAlerts(companies));setCallQueue(CallQueueManager.getQueue());};},[companies]);

    // ── 이메일 발송 상태인 기업에 카카오 자동 예약 ──
    useEffect(()=>{
        companies.forEach(c=>{
            if(['emailed','client_viewed','client_replied'].includes(c.status)){
                const existing=AutoKakaoService.getStatus(c.id);
                if(!existing) AutoKakaoService.scheduleAfterEmail(c);
            }
        });
    },[companies]);

    // ── 2초마다 카카오 발송 대기 체크 + 자동 발송 시뮬 ──
    useEffect(()=>{
        const poll=setInterval(()=>{
            // 상태 갱신
            const map:Record<string,KakaoScheduleItem>={};
            AutoKakaoService.getAll().forEach(k=>{map[k.companyId]=k;});
            setKakaoStatuses(map);
            // 발송 시점 도래한 아이템 자동 발송
            const pending=AutoKakaoService.getPendingSends();
            pending.forEach(p=>{
                AutoKakaoService.markSent(p.companyId);
                setToast(`💬 카카오 알림톡 자동 발송 → ${p.companyName}`);
            });
        },2000);
        return()=>clearInterval(poll);
    },[]);

    const filtered=companies.filter(c=>{
        if(statusFilter!=='all'&&c.status!==statusFilter)return false;
        const q=search.toLowerCase();
        return c.name.toLowerCase().includes(q)||c.biz.includes(q)||(c.contactName||'').includes(q);
    }).sort((a,b)=>{
        let d=0;
        if(sortKey==='risk')d=(b.riskScore||0)-(a.riskScore||0);
        else if(sortKey==='name')d=a.name.localeCompare(b.name);
        else d=CALLABLE.indexOf(a.status)-CALLABLE.indexOf(b.status);
        return sortAsc?-d:d;
    });

    const statusCounts:Record<string,number>={all:companies.length};
    companies.forEach(c=>{statusCounts[c.status]=(statusCounts[c.status]||0)+1;});

    const selected=companies.find(c=>c.id===selectedId)||null;

    const selectCompany=(id:string)=>{
        if(selectedId===id){setSelectedId(null);return;}
        setSelectedId(id);setCallResult('');
    };

    const startCall=()=>{if(!selectedId)return;setActiveCallId(selectedId);setCallResult('');timer.start();};

    const handleCallResult=(r:'connected'|'no_answer'|'callback')=>{
        setCallResult(r);
        setToast(r==='connected'?'✅ 연결됨':r==='no_answer'?'📵 부재중':'📋 콜백요청');
    };

    const endCall=()=>{
        if(!selected)return;
        const result=callResult||'connected';
        store.update(selected.id,{lastCallResult:result,lastCallAt:new Date().toISOString(),callAttempts:(selected.callAttempts||0)+1});
        if(result==='no_answer'){CallQueueManager.scheduleNoAnswer(selected);setToast('📵 부재중 → 24시간 후 자동 재배치');}
        else if(result==='callback'){setShowCallbackModal(true);}
        else{CallQueueManager.removeFromQueue(selected.id);if(selected.status==='analyzed')store.salesConfirm(selected.id,SALES_REPS[0]);}
        setActiveCallId(null);timer.reset();setCallResult('');refresh();
        if(result!=='callback'){
            const idx=filtered.findIndex(co=>co.id===selected.id);
            const next=filtered[idx+1];
            if(next)setTimeout(()=>{setSelectedId(next.id);},400);
            else setSelectedId(null);
        }
    };

    const confirmCallback=()=>{
        if(selected&&callbackTime){
            CallQueueManager.scheduleCallback(selected,callbackTime);
            setToast(`📋 콜백 예약: ${new Date(callbackTime).toLocaleString('ko-KR')}`);
            setShowCallbackModal(false);setCallbackTime('');
        }
    };

    const toggleSort=(k:typeof sortKey)=>{if(sortKey===k)setSortAsc(!sortAsc);else{setSortKey(k);setSortAsc(false);}};
    const calledCount=companies.filter(c=>c.callNote).length;
    const highRiskCount=companies.filter(c=>c.riskScore>=70).length;
    const newsItems=NewsLeadService.getRelevantNews(companies);

    const SortHeader=({label,k}:{label:string;k:typeof sortKey})=>(
        <th className="text-left text-[11px] font-bold py-3 px-3 cursor-pointer select-none" style={{color:sortKey===k?C.accent:C.muted}} onClick={()=>toggleSort(k)}>
            <span className="flex items-center gap-1">{label}{sortKey===k&&<ArrowUpDown className="w-3 h-3"/>}</span>
        </th>
    );

    const FILTERS:{key:CaseStatus|'all';label:string;icon:string}[]=[
        {key:'all',label:'전체',icon:'📋'},{key:'analyzed',label:'분석완료',icon:'🔍'},{key:'sales_confirmed',label:'영업컨펌',icon:'✅'},
        {key:'lawyer_confirmed',label:'변호사컨펌',icon:'⚖️'},{key:'emailed',label:'이메일발송',icon:'📧'},
        {key:'client_replied',label:'답장수신',icon:'💬'},{key:'client_viewed',label:'리포트열람',icon:'👁️'},
        {key:'contract_sent',label:'계약서발송',icon:'📄'},{key:'contract_signed',label:'서명완료',icon:'✍️'},
    ];

    return (
        <div className="min-h-screen flex flex-col" style={{background:C.bg,color:C.body}}>
            {/* 토스트 */}
            <AnimatePresence>
                {toast&&<motion.div initial={{opacity:0,y:-30}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-30}}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg"
                    style={{background:'#ecfdf5',color:'#065f46',border:'1px solid #a7f3d0'}}>{toast}</motion.div>}
            </AnimatePresence>

            {/* ── 헤더 ── */}
            <div className="px-6 pt-5 pb-3" style={{background:C.surface,borderBottom:`1px solid ${C.border}`,boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
                <div className="max-w-[1920px] mx-auto">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#4f46e5,#6366f1)'}}><Phone className="w-4 h-4 text-white"/></div>
                            <div>
                                <h1 className="text-lg font-black" style={{color:C.heading}}>전화 영업 센터</h1>
                                <p className="text-[11px]" style={{color:C.muted}}>{new Date().toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'})} · {filtered.length}개 기업</p>
                            </div>
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{color:C.faint}}/>
                                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="기업·담당자 검색..."
                                    className="pl-9 pr-4 py-2 rounded-xl text-xs" style={{background:C.bg,border:`1px solid ${C.border}`,color:C.body,outline:'none',width:200}}/>
                            </div>
                            <Link href="/employee"><button className="px-3 py-2 rounded-xl text-xs font-bold" style={{background:C.bg,border:`1px solid ${C.border}`,color:C.sub}}>← CRM</button></Link>
                        </div>
                    </div>
                    {/* KPI */}
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex gap-2 flex-1">
                            {[{l:'대기',v:companies.length-calledCount,c:'#4f46e5',b:'#eef2ff'},{l:'완료',v:calledCount,c:'#059669',b:'#ecfdf5'},{l:'고위험',v:highRiskCount,c:'#dc2626',b:'#fef2f2'},{l:'전환율',v:companies.length>0?`${Math.round(calledCount/companies.length*100)}%`:'0%',c:'#0891b2',b:'#ecfeff'}].map(k=>(
                                <div key={k.l} className="rounded-lg px-3 py-2 flex items-center gap-2" style={{background:k.b}}>
                                    <span className="text-base font-black" style={{color:k.c}}>{k.v}</span>
                                    <span className="text-[10px] font-medium" style={{color:C.sub}}>{k.l}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            {riskAlerts.length>0&&<button onClick={()=>selectCompany(riskAlerts[0].companyId)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold animate-pulse" style={{background:'#fef2f2',color:'#dc2626',border:'1px solid #fca5a5'}}>🚨 고위험 {riskAlerts.length}건</button>}
                            {callQueue.length>0&&<div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold" style={{background:'#eef2ff',color:'#4f46e5',border:'1px solid #c7d2fe'}}>📋 콜백 {callQueue.length}건</div>}
                            <button onClick={()=>setShowNews(!showNews)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold" style={{background:showNews?'#fffbeb':C.bg,color:showNews?'#92400e':C.muted,border:`1px solid ${showNews?'#fde68a':C.borderLight}`}}>📰 뉴스 {newsItems.length}건</button>
                        </div>
                    </div>
                    <AnimatePresence>{showNews&&<motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden mb-2">
                        <div className="grid grid-cols-3 gap-2">{newsItems.map(n=>(
                            <div key={n.id} className="rounded-lg p-2.5" style={{background:C.bg,border:`1px solid ${C.borderLight}`}}>
                                <div className="flex items-center gap-1.5 mb-1"><span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{background:n.urgency==='high'?'#fef2f2':'#fffbeb',color:n.urgency==='high'?'#dc2626':'#92400e'}}>{n.urgency==='high'?'🔴':'🟡'}</span><span className="text-[9px]" style={{color:C.faint}}>{n.source}</span></div>
                                <p className="text-[10px] font-bold leading-tight" style={{color:C.heading}}>{n.title}</p>
                            </div>
                        ))}</div>
                    </motion.div>}</AnimatePresence>
                    {/* 필터 */}
                    <div className="flex items-center gap-1 flex-wrap">
                        {FILTERS.map(f=>{const cnt=statusCounts[f.key]||0;const a=statusFilter===f.key;if(f.key!=='all'&&cnt===0)return null;
                            return <button key={f.key} onClick={()=>setStatusFilter(f.key)} className="px-2 py-1 rounded-md text-[10px] font-bold" style={{background:a?'#eef2ff':'transparent',color:a?'#4f46e5':C.muted,border:`1px solid ${a?'#c7d2fe':'transparent'}`}}>{f.icon} {f.label} {cnt>0&&<span className="ml-0.5 opacity-60">{cnt}</span>}</button>;
                        })}
                    </div>
                </div>
            </div>

            {/* ══ 테이블 + 인라인 확장 ══════════════════ */}
            <div className="flex-1 overflow-auto">
                <table className="w-full" style={{minWidth:1000}}>
                    <thead className="sticky top-0 z-10" style={{background:'#f8fafc'}}>
                        <tr style={{borderBottom:`2px solid ${C.borderLight}`}}>
                            <th className="w-8 py-3 px-3"/>
                            <SortHeader label="기업명" k="name"/>
                            <SortHeader label="상태" k="status"/>
                            <SortHeader label="위험도" k="risk"/>
                            {['담당자','전화번호','변호사','업종','이슈','바로가기'].map(h=><th key={h} className="text-left text-[11px] font-bold py-3 px-3" style={{color:C.muted}}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length===0&&<tr><td colSpan={10} className="text-center py-16 text-sm" style={{color:C.muted}}><Phone className="w-6 h-6 mx-auto mb-2 opacity-30"/>통화 대상이 없습니다</td></tr>}
                        {filtered.map((c,i)=>{
                            const isSel=selectedId===c.id;
                            const isCall=activeCallId===c.id;
                            const rc=riskColor(c.riskScore);
                            return (
                                <React.Fragment key={c.id}>
                                    <tr onClick={()=>selectCompany(c.id)} className="cursor-pointer transition-all"
                                        style={{background:isCall?'#f0fdf4':isSel?'#eef2ff':C.surface,borderBottom:`1px solid ${C.borderLight}`,borderLeft:isCall?'3px solid #059669':isSel?'3px solid #4f46e5':'3px solid transparent'}}
                                        onMouseEnter={e=>{if(!isSel&&!isCall)(e.currentTarget as HTMLElement).style.background=C.rowHover;}}
                                        onMouseLeave={e=>{if(!isSel&&!isCall)(e.currentTarget as HTMLElement).style.background=C.surface;}}>
                                        <td className="py-2.5 px-3 text-[10px] font-mono" style={{color:C.faint}}>{i+1}</td>
                                        <td className="py-2.5 px-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[12px] font-bold" style={{color:C.heading}}>{c.name}</span>
                                                {isSel?<ChevronUp className="w-3 h-3" style={{color:C.accent}}/>:<ChevronDown className="w-3 h-3" style={{color:C.faint}}/>}
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <div className="flex items-center gap-1.5">
                                                <Badge status={c.status}/>
                                                {kakaoStatuses[c.id]?.status==='sent'&&<span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold" style={{background:'#FFFDE7',color:'#2E7D32',border:'1px solid #C8E6C9'}}>💬완료</span>}
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-3">{c.riskScore>0&&<div className="flex items-center gap-1.5"><div className="w-14 h-2 rounded-full overflow-hidden" style={{background:'#e5e7eb'}}><div className="h-full rounded-full" style={{width:`${c.riskScore}%`,background:rc.bar}}/></div><span className="text-[10px] font-bold" style={{color:rc.text}}>{c.riskScore}</span></div>}</td>
                                        <td className="py-2.5 px-3"><span className="text-[11px]" style={{color:c.contactName?C.body:C.amber}}>{c.contactName||'미등록'}</span></td>
                                        <td className="py-2.5 px-3"><span className="text-[11px] font-mono" style={{color:C.sub}}>{c.contactPhone||c.phone}</span></td>
                                        <td className="py-2.5 px-3">{c.assignedLawyer?<span className="text-[10px] px-1.5 py-0.5 rounded" style={{background:'#f3e8ff',color:'#7c3aed'}}>⚖️ {c.assignedLawyer}</span>:<span className="text-[10px]" style={{color:C.faint}}>—</span>}</td>
                                        <td className="py-2.5 px-3"><span className="text-[10px]" style={{color:C.muted}}>{c.bizType||'—'}</span></td>
                                        <td className="py-2.5 px-3">{c.issues&&c.issues.length>0?<span className="text-[10px] font-bold" style={{color:'#dc2626'}}>{c.issues.filter(ii=>ii.level==='HIGH').length}H/{c.issues.length}건</span>:<span className="text-[10px]" style={{color:C.faint}}>—</span>}</td>
                                        <td className="py-2.5 px-3" onClick={e=>e.stopPropagation()}>
                                            <div className="flex items-center gap-1">
                                                <Link href={`/admin/email-preview?company=${encodeURIComponent(c.name)}`} target="_blank" title="이메일 미리보기">
                                                    <button className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors" style={{border:`1px solid ${C.borderLight}`}} title="이메일 미리보기"><Mail className="w-3.5 h-3.5" style={{color:'#2563eb'}}/></button>
                                                </Link>
                                                <Link href={`/lawyer/privacy-review?company=${encodeURIComponent(c.name)}`} target="_blank" title="조문 검토">
                                                    <button className="p-1.5 rounded-lg hover:bg-purple-50 transition-colors" style={{border:`1px solid ${C.borderLight}`}} title="조문 검토"><FileText className="w-3.5 h-3.5" style={{color:'#7c3aed'}}/></button>
                                                </Link>
                                                <a href={`https://${c.name.replace(/[\(\)\uc8fc\s]/g,'').trim().toLowerCase()}.co.kr`} target="_blank" rel="noopener noreferrer" title="홈페이지">
                                                    <button className="p-1.5 rounded-lg hover:bg-cyan-50 transition-colors" style={{border:`1px solid ${C.borderLight}`}} title="홈페이지"><Globe className="w-3.5 h-3.5" style={{color:'#0891b2'}}/></button>
                                                </a>
                                                <button onClick={()=>{setKakaoTarget(c);setKakaoTemplate(0);}} className="p-1.5 rounded-lg hover:bg-yellow-50 transition-colors" style={{border:`1px solid ${C.borderLight}`}} title="카카오톡 발송">
                                                    <MessageCircle className="w-3.5 h-3.5" style={{color:'#FAE100',fill:'#FAE100',stroke:'#3C1E1E'}}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {/* ── 인라인 확장 패널 (행 바로 아래) ── */}
                                    <AnimatePresence>
                                        {isSel&&<InlinePanel co={c} isOnCall={activeCallId===c.id} onStartCall={startCall} onEndCall={endCall} onClose={()=>setSelectedId(null)}
                                            timer={timer} callResult={callResult} onCallResult={handleCallResult} onRefresh={refresh} setToast={setToast}/>}
                                    </AnimatePresence>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* 콜백 모달 */}
            <AnimatePresence>
                {showCallbackModal&&selected&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.3)',backdropFilter:'blur(4px)'}}>
                    <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}} className="rounded-2xl p-6 w-[400px] shadow-xl" style={{background:C.surface,border:`1px solid ${C.border}`}}>
                        <h3 className="text-lg font-black mb-1" style={{color:C.heading}}>📋 콜백 예약</h3>
                        <p className="text-xs mb-4" style={{color:C.sub}}>{selected.name} — {selected.contactName||'담당자'}</p>
                        <input type="datetime-local" value={callbackTime} onChange={e=>setCallbackTime(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm mb-4" style={{background:'#f8fafc',border:`1px solid ${C.border}`,color:C.body,outline:'none'}}/>
                        <div className="flex gap-2">
                            <button onClick={()=>{setShowCallbackModal(false);setCallbackTime('');}} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{background:'#f8f9fc',color:C.sub,border:`1px solid ${C.border}`}}>취소</button>
                            <button onClick={confirmCallback} disabled={!callbackTime} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{background:callbackTime?'#eef2ff':'#f8f9fc',color:callbackTime?'#4f46e5':C.muted,border:`1px solid ${callbackTime?'#c7d2fe':C.border}`}}>예약 확정</button>
                        </div>
                    </motion.div>
                </motion.div>}
            </AnimatePresence>

            {/* 카카오톡 발송 모달 */}
            <AnimatePresence>
                {kakaoTarget&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.3)',backdropFilter:'blur(4px)'}} onClick={()=>setKakaoTarget(null)}>
                    <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}} exit={{scale:0.9,y:20}} className="rounded-2xl p-6 w-[480px] shadow-xl" style={{background:C.surface,border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'#FAE100'}}>
                                <MessageCircle className="w-5 h-5" style={{color:'#3C1E1E'}}/>
                            </div>
                            <div>
                                <h3 className="text-base font-black" style={{color:C.heading}}>카카오 알림톡 발송</h3>
                                <p className="text-[11px]" style={{color:C.sub}}>{kakaoTarget.name} · {kakaoTarget.contactName||'담당자'} · {kakaoTarget.contactPhone||kakaoTarget.phone}</p>
                            </div>
                            <button onClick={()=>setKakaoTarget(null)} className="ml-auto p-1 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" style={{color:C.muted}}/></button>
                        </div>

                        <p className="text-[11px] font-bold mb-2" style={{color:C.muted}}>템플릿 선택</p>
                        <div className="flex flex-col gap-2 mb-4">
                            {[
                                {title:'📊 분석 보고서 안내',desc:'개인정보 진단 보고서 발송 알림',msg:`[IBS 법률사무소]\n\n${kakaoTarget.contactName||'담당자'}님, 안녕하세요.\n${kakaoTarget.name}의 개인정보처리방침 진단 보고서가 준비되었습니다.\n\n▶ 보고서 확인하기\nhttps://ibs-law.co.kr/report/${kakaoTarget.id}\n\n문의: 02-1234-5678`},
                                {title:'📞 통화 팔로업',desc:'통화 후 추가 자료 안내',msg:`[IBS 법률사무소]\n\n${kakaoTarget.contactName||'담당자'}님, 오늘 통화 감사드립니다.\n말씀드린 ${kakaoTarget.name} 관련 상세 검토 의견서를 첨부드립니다.\n\n▶ 검토 의견서 확인\nhttps://ibs-law.co.kr/opinion/${kakaoTarget.id}\n\n추가 문의사항이 있으시면 편하게 연락주세요.`},
                                {title:'🔔 리마인드 안내',desc:'계약/회신 리마인드',msg:`[IBS 법률사무소]\n\n${kakaoTarget.contactName||'담당자'}님, 안녕하세요.\n${kakaoTarget.name} 건 관련 회신 부탁드립니다.\n\n미조치 시 법적 리스크가 발생할 수 있어 사전 대응을 권고드리며,\n편하신 시간에 연락 주시면 상세 안내 도와드리겠습니다.\n\n📞 02-1234-5678`},
                            ].map((t,i)=>(
                                <button key={i} onClick={()=>setKakaoTemplate(i)} className="text-left p-3 rounded-xl transition-all" style={{background:kakaoTemplate===i?'#FFFDE7':'#f8fafc',border:`1.5px solid ${kakaoTemplate===i?'#FAE100':C.borderLight}`}}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold" style={{color:kakaoTemplate===i?'#5D4037':C.heading}}>{t.title}</span>
                                        {kakaoTemplate===i&&<Check className="w-3.5 h-3.5" style={{color:'#F9A825'}}/> }
                                    </div>
                                    <p className="text-[10px] mt-0.5" style={{color:C.sub}}>{t.desc}</p>
                                </button>
                            ))}
                        </div>

                        <div className="p-3 rounded-xl mb-4" style={{background:'#FFFDE7',border:'1px solid #FFF9C4'}}>
                            <p className="text-[10px] font-bold mb-1" style={{color:'#5D4037'}}>미리보기</p>
                            <pre className="text-[10px] whitespace-pre-wrap leading-relaxed" style={{color:'#4E342E',fontFamily:'inherit'}}>
                                {[
                                    `[IBS 법률사무소]\n\n${kakaoTarget.contactName||'담당자'}님, 안녕하세요.\n${kakaoTarget.name}의 개인정보처리방침 진단 보고서가 준비되었습니다.\n\n▶ 보고서 확인하기\nhttps://ibs-law.co.kr/report/${kakaoTarget.id}\n\n문의: 02-1234-5678`,
                                    `[IBS 법률사무소]\n\n${kakaoTarget.contactName||'담당자'}님, 오늘 통화 감사드립니다.\n말씀드린 ${kakaoTarget.name} 관련 상세 검토 의견서를 첨부드립니다.\n\n▶ 검토 의견서 확인\nhttps://ibs-law.co.kr/opinion/${kakaoTarget.id}\n\n추가 문의사항이 있으시면 편하게 연락주세요.`,
                                    `[IBS 법률사무소]\n\n${kakaoTarget.contactName||'담당자'}님, 안녕하세요.\n${kakaoTarget.name} 건 관련 회신 부탁드립니다.\n\n미조치 시 법적 리스크가 발생할 수 있어 사전 대응을 권고드리며,\n편하신 시간에 연락 주시면 상세 안내 도와드리겠습니다.\n\n📞 02-1234-5678`,
                                ][kakaoTemplate]}
                            </pre>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={()=>setKakaoTarget(null)} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{background:'#f8f9fc',color:C.sub,border:`1px solid ${C.border}`}}>취소</button>
                            <button
                                disabled={kakaoSending}
                                onClick={async()=>{
                                    setKakaoSending(true);
                                    await new Promise(r=>setTimeout(r,1200));
                                    setKakaoSending(false);
                                    setKakaoTarget(null);
                                    setToast(`💬 카카오 알림톡 발송 완료 → ${kakaoTarget.name}`);
                                }}
                                className="flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02]"
                                style={{background:kakaoSending?'#FFF9C4':'#FAE100',color:'#3C1E1E',border:'1px solid #F9A825'}}
                            >
                                {kakaoSending?<><RefreshCw className="w-3.5 h-3.5 animate-spin"/>발송 중...</>:<><Send className="w-3.5 h-3.5"/>알림톡 발송</>}
                            </button>
                        </div>

                        <p className="text-center text-[9px] mt-3" style={{color:C.faint}}>알리고 API 연동 · 건당 6.5원 · 카톡 미수신 시 SMS 자동 대체발송</p>
                    </motion.div>
                </motion.div>}
            </AnimatePresence>
        </div>
    );
}
