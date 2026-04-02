'use client';
import React from 'react';
import { Mic } from 'lucide-react';
import { C } from '@/lib/callPageUtils';
import { formatDuration, type CallRecording } from '@/lib/callRecordingService';

interface RecordingsTabProps {
  companyRecordings: CallRecording[];
}

export default function RecordingsTab({ companyRecordings }: RecordingsTabProps) {
  return (
    <div className="space-y-3">
      {companyRecordings.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: C.surface, border: `1px solid ${C.borderLight}` }}>
          <Mic className="w-8 h-8 mx-auto mb-2" style={{ color: C.faint }} />
          <p className="text-xs font-bold" style={{ color: C.muted }}>녹음 내역 없음</p>
          <p className="text-[10px] mt-1" style={{ color: C.faint }}>통화 시작 시 자동으로 녹음됩니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-[240px] overflow-y-auto">
          {companyRecordings.map(rec => (
            <div key={rec.id} className="rounded-xl p-3" style={{ background: C.surface, border: `1px solid ${C.borderLight}` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: rec.sttStatus === 'completed' ? '#ecfdf5' : '#fffbeb' }}>
                    <Mic className="w-3.5 h-3.5" style={{ color: rec.sttStatus === 'completed' ? '#059669' : '#d97706' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold" style={{ color: C.heading }}>
                        {new Date(rec.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{
                        background: rec.callResult === 'connected' ? '#ecfdf5' : rec.callResult === 'callback' ? '#eef2ff' : '#fffbeb',
                        color: rec.callResult === 'connected' ? '#059669' : rec.callResult === 'callback' ? '#4f46e5' : '#92400e',
                      }}>
                        {rec.callResult === 'connected' ? '✅연결' : rec.callResult === 'callback' ? '📋콜백' : '📵부재'}
                      </span>
                    </div>
                    <span className="text-[9px]" style={{ color: C.faint }}>
                      {formatDuration(rec.durationSeconds)} · {rec.contactName || '담당자'}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{
                  background: rec.sttStatus === 'completed' ? '#ecfdf5' : '#fffbeb',
                  color: rec.sttStatus === 'completed' ? '#059669' : '#d97706',
                }}>
                  {rec.sttStatus === 'completed' ? '✅ 변환완료' : rec.sttStatus === 'processing' ? '⏳ 변환중' : '⬜ 대기'}
                </span>
              </div>
              {rec.transcriptSummary && (
                <div className="rounded-lg p-2 mb-2" style={{ background: '#f0fdf4', border: '1px solid #a7f3d0' }}>
                  <p className="text-[10px] font-bold" style={{ color: '#059669' }}>📌 내용 요약</p>
                  <p className="text-[10px] mt-0.5" style={{ color: C.body }}>{rec.transcriptSummary}</p>
                </div>
              )}
              {rec.transcript && (
                <details className="group">
                  <summary className="text-[10px] font-bold cursor-pointer" style={{ color: C.accent }}>📝 전체 녹취록 보기</summary>
                  <pre className="text-[10px] leading-relaxed mt-1 p-2 rounded-lg whitespace-pre-wrap" style={{ background: '#f8fafc', color: C.body, fontFamily: 'inherit', border: `1px solid ${C.borderLight}` }}>{rec.transcript}</pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
