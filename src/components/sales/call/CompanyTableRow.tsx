import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Phone, Mail, Globe, MessageCircle, FileSignature, Eye } from 'lucide-react';
import Link from 'next/link';

import InlinePanel from './InlinePanel';
import { C, Badge, riskColor, useTimer } from '@/lib/callPageUtils';
import { Company } from '@/lib/types';
import {
  AutoSignatureService,
  EmailTrackingService,
  FollowUpService,
  ConversionPredictionService,
  KakaoScheduleItem
} from '@/lib/salesAutomation';
import { CallRecordingStore } from '@/lib/callRecordingService';

interface CompanyTableRowProps {
  c: Company;
  index: number;
  selectedId: string | null;
  activeCallId: string | null;
  kakaoStatuses: Record<string, KakaoScheduleItem>;
  callResult: string;
  timer: ReturnType<typeof useTimer>;
  isRecording: boolean;
  sttStatus: string;
  waveformData: number[];
  onSelect: (id: string) => void;
  onStartCall: () => void;
  onEndCall: () => Promise<void>;
  onCallResult: (r: 'connected' | 'no_answer' | 'callback') => void;
  onRefresh: () => void;
  setToast: (s: string) => void;
  onOpenKakao: (c: Company) => void;
  onOpenContract: (c: Company) => void;
}

export default function CompanyTableRow({
  c, index, selectedId, activeCallId, kakaoStatuses, callResult, timer, 
  isRecording, sttStatus, waveformData, onSelect, onStartCall, onEndCall, 
  onCallResult, onRefresh, setToast, onOpenKakao, onOpenContract
}: CompanyTableRowProps) {
  const isSel = selectedId === c.id;
  const isCall = activeCallId === c.id;
  const rc = riskColor(c.riskScore);

  return (
    <React.Fragment>
      <tr onClick={() => onSelect(c.id)} className="cursor-pointer transition-all"
          style={{
            background: isCall ? '#f0fdf4' : isSel ? '#eef2ff' : C.surface,
            borderBottom: `1px solid ${C.borderLight}`,
            borderLeft: isCall ? '3px solid #059669' : isSel ? '3px solid #4f46e5' : '3px solid transparent'
          }}
          onMouseEnter={e => { if (!isSel && !isCall) (e.currentTarget as HTMLElement).style.background = C.rowHover; }}
          onMouseLeave={e => { if (!isSel && !isCall) (e.currentTarget as HTMLElement).style.background = C.surface; }}>
          <td className="py-2.5 px-3 text-[10px] font-mono" style={{color:C.faint}}>{index + 1}</td>
          <td className="py-2.5 px-3">
              <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold" style={{color:C.heading}}>{c.name}</span>
                  {isSel ? <ChevronUp className="w-3 h-3" style={{color:C.accent}}/> : <ChevronDown className="w-3 h-3" style={{color:C.faint}}/>}
              </div>
          </td>
          <td className="py-2.5 px-3">
              <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 flex-wrap">
                      <Badge status={c.status}/>
                      {kakaoStatuses[c.id]?.status === 'sent' && <span className="inline-flex items-center px-1 py-0.5 rounded text-[8px] font-bold cursor-default" style={{background:'#FFFDE7',color:'#2E7D32',border:'1px solid #C8E6C9'}} title="카카오 알림톡 발송 완료">💬</span>}
                      {(() => {
                          const sig = AutoSignatureService.getStatus(c.id);
                          if (!sig) return null;
                          return sig.status === 'watching' ? <span className="inline-flex items-center px-1 py-0.5 rounded text-[8px] font-bold animate-pulse cursor-default" style={{background:'#fef3c7',color:'#92400e',border:'1px solid #fde68a'}} title="계약서 발송됨 → 고객 전자서명 대기 중 (자동 감지)">✍️대기</span> : <span className="inline-flex items-center px-1 py-0.5 rounded text-[8px] font-bold cursor-default" style={{background:'#d1fae5',color:'#065f46',border:'1px solid #a7f3d0'}} title="고객이 전자서명 완료! → 구독 자동 전환 진행">✅서명</span>;
                      })()}
                      {(() => {
                          const et = EmailTrackingService.getAll().find(e=>e.companyId===c.id);
                          if (!et) return null;
                          return et.openedAt ? <span className="inline-flex items-center px-1 py-0.5 rounded text-[8px] font-bold cursor-default" style={{background:'#ede9fe',color:'#5b21b6',border:'1px solid #c4b5fd'}} title="고객이 이메일을 열어봤습니다! 지금 전화하면 효과적">👁️열람</span> : <span className="inline-flex items-center px-1 py-0.5 rounded text-[8px] font-bold cursor-default" style={{background:'#dbeafe',color:'#1d4ed8',border:'1px solid #bfdbfe'}} title="이메일 열람 여부 자동 추적 중 (SendGrid 연동)">📧추적중</span>;
                      })()}
                  </div>
                  {c.emailSentAt && (() => {
                      const step = FollowUpService.getCurrentStep(c);
                      const next = FollowUpService.getNextStep(c);
                      if (step === 0 && !next) return null;
                      return <div className="flex items-center gap-1 cursor-default" title={`자동 팔로업 이메일: ${step}/3단계 완료${next ? ` · 다음 D+${next.dayOffset} 자동 발송 예정` : ' · 전체 완료'}`}>{[1, 2, 3].map(s=><div key={s} className="w-3 h-1.5 rounded-full" style={{background:s<=step?'#4f46e5':'#e2e8f0'}}/>)}<span className="text-[8px] font-bold" style={{color:step>=3?'#059669':'#4f46e5'}}>{step>=3?'완료':`D+${next?.dayOffset||'?'}`}</span></div>;
                  })()}
              </div>
          </td>
          <td className="py-2.5 px-3">{c.riskScore > 0 && <div className="flex items-center gap-1.5"><div className="w-14 h-2 rounded-full overflow-hidden" style={{background:'#e5e7eb'}}><div className="h-full rounded-full" style={{width:`${c.riskScore}%`,background:rc.bar}}/></div><span className="text-[10px] font-bold" style={{color:rc.text}}>{c.riskScore}</span></div>}</td>
          <td className="py-2.5 px-3"><span className="text-[11px]" style={{color:c.contactName?C.body:C.amber}}>{c.contactName||'미등록'}</span></td>
          <td className="py-2.5 px-3" onClick={e=>e.stopPropagation()}><a href={`tel:${(c.contactPhone||c.phone).replace(/[^0-9+]/g,'')}`} className="text-[11px] font-mono inline-flex items-center gap-1 hover:text-indigo-600" style={{color:C.sub}} title="클릭하여 전화걸기"><Phone className="w-3 h-3" style={{color:C.accent}}/>{c.contactPhone||c.phone}</a></td>
          <td className="py-2.5 px-3">{(() => {
              const p = ConversionPredictionService.predict(c);
              const colors = { HOT: { bg: '#fef2f2', c: '#dc2626', icon: '🔥' }, WARM: { bg: '#fffbeb', c: '#d97706', icon: '🌡️' }, COLD: { bg: '#f0f9ff', c: '#0284c7', icon: '❄️' } };
              const cl = colors[p.level];
              return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{background:cl.bg,color:cl.c}} title={p.factors.join(' · ')}>{cl.icon}{p.score}%</span>;
          })()}</td>
          <td className="py-2.5 px-3">{c.issues && c.issues.length > 0 ? <span className="text-[10px] font-bold" style={{color:'#dc2626'}}>{c.issues.filter(ii=>ii.level==='HIGH').length}H/{c.issues.length}건</span> : <span className="text-[10px]" style={{color:C.faint}}>—</span>}</td>
          <td className="py-2.5 px-3" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center gap-1">
                  <Link href={`/admin/email-preview?company=${encodeURIComponent(c.name)}`} target="_blank" title="이메일 미리보기">
                      <button className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors" style={{border:`1px solid ${C.borderLight}`}} title="이메일 미리보기"><Mail className="w-3.5 h-3.5" style={{color:'#2563eb'}}/></button>
                  </Link>
                  <Link href={`/lawyer/privacy-review?company=${encodeURIComponent(c.name)}&preview=1`} target="_blank" title="1차 조문검토 미리보기">
                      <button className="p-1.5 rounded-lg hover:bg-purple-50 transition-colors" style={{border:`1px solid ${C.borderLight}`}} title="1차 조문검토 미리보기"><Eye className="w-3.5 h-3.5" style={{color:'#7c3aed'}}/></button>
                  </Link>
                  <a href={`https://${c.name.replace(/[\(\)\uc8fc\s]/g,'').trim().toLowerCase()}.co.kr`} target="_blank" rel="noopener noreferrer" title="홈페이지">
                      <button className="p-1.5 rounded-lg hover:bg-cyan-50 transition-colors" style={{border:`1px solid ${C.borderLight}`}} title="홈페이지"><Globe className="w-3.5 h-3.5" style={{color:'#0891b2'}}/></button>
                  </a>
                  <button onClick={() => onOpenKakao(c)} className="p-1.5 rounded-lg hover:bg-yellow-50 transition-colors" style={{border:`1px solid ${C.borderLight}`}} title="카카오톡 발송">
                      <MessageCircle className="w-3.5 h-3.5" style={{color:'#FAE100',fill:'#FAE100',stroke:'#3C1E1E'}}/>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onOpenContract(c); }} className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors" style={{border:`1px solid ${C.borderLight}`}} title="계약서 발송 미리보기">
                      <FileSignature className="w-3.5 h-3.5" style={{color:'#d97706'}}/>
                  </button>
              </div>
          </td>
      </tr>
      <AnimatePresence>
          {isSel && <InlinePanel
              co={c} isOnCall={isCall} onStartCall={onStartCall}
              onEndCall={onEndCall} onClose={() => onSelect('')}
              timer={timer} callResult={callResult as any}
              onCallResult={onCallResult} onRefresh={onRefresh} setToast={setToast}
              isRecording={isRecording} sttStatus={sttStatus} waveformData={waveformData}
              companyRecordings={CallRecordingStore.getByCompany(c.id)} />}
      </AnimatePresence>
    </React.Fragment>
  );
}
