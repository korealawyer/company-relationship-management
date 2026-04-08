'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Company, CaseStatus } from '@/lib/types';
import { STATUS_LABEL, STATUS_COLOR, STATUS_TEXT } from '@/lib/constants';

/* ── CRM 라이트 색상 ──────────────────────────── */
export const C = {
    bg:'#f8f9fc',surface:'#ffffff',card:'#ffffff',cardHover:'#f1f5f9',
    elevated:'#f8fafc',border:'#d1d5db',borderLight:'#e5e7eb',
    heading:'#0f172a',body:'#1e293b',sub:'#475569',muted:'#64748b',faint:'#94a3b8',
    accent:'#4f46e5',accentSoft:'#6366f1',green:'#059669',greenSoft:'#10b981',
    red:'#dc2626',amber:'#d97706',blue:'#2563eb',purple:'#7c3aed',
    cyan:'#0891b2',rowHover:'#f1f5f9',
};

export const CALLABLE: CaseStatus[] = [
    'pending', 'crawling', 'analyzed', 'lawyer_confirmed', 'emailed',
    'client_replied', 'client_viewed', 'contract_sent', 'contract_signed',
];

export function getScript(c: Company): string {
    const hi = c.contactName ? `${c.contactName} 님` : '담당자님';
    const issues = (c.issues||[]).slice(0,3);
    const it = issues.length>0 ? issues.map((i,x)=>`  ${x+1}. [${i.level}] ${i.title}`).join('\n') : '  (분석 결과 대기 중)';
    if (['analyzed'].includes(c.status))
        return `안녕하세요, ${hi}.\n법률사무소 IBS 영업팀입니다.\n\n${c.name}의 개인정보처리방침을 검토한 결과,\n아래와 같은 법적 리스크가 확인되었습니다:\n\n${it}\n\n사전 대응을 권고드립니다.`;
    if (['lawyer_confirmed','emailed'].includes(c.status))
        return `${hi}, 법률사무소 IBS입니다.\n앞서 발송드린 ${c.name} 개인정보 진단 보고서는 확인하셨을까요?\n\n주요 리스크:\n${it}\n\n전담 변호사의 상세 검토 의견이 준비되어 있습니다.`;
    if (['client_replied','client_viewed'].includes(c.status))
        return `${hi}, 법률사무소 IBS입니다.\n보고서를 검토해 주셔서 감사합니다.\n\n계약 진행을 위한 서류가 준비되어 있습니다.`;
    return `${hi}, 법률사무소 IBS 영업팀입니다.\n${c.name} 건 관련 안내드리고자 연락드렸습니다.`;
}

export function riskColor(s: number) {
    if (s>=70) return {bar:'#dc2626',text:'#dc2626',bg:'#fef2f2'};
    if (s>=40) return {bar:'#d97706',text:'#92400e',bg:'#fffbeb'};
    return {bar:'#059669',text:'#065f46',bg:'#ecfdf5'};
}

export function Badge({status}:{status:CaseStatus}) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap"
        style={{background:STATUS_COLOR[status],color:STATUS_TEXT[status]}}>{STATUS_LABEL[status]}</span>;
}

export function useTimer() {
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
