'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabaseCompanyStore } from '@/lib/supabaseStore';
import { claimCompany, releaseCompany, getRemainingMinutes } from '@/lib/callQueueService';
import { useTimer, CALLABLE } from '@/lib/callPageUtils';
import type { Company, Issue } from '@/lib/types';
import type { CallLock } from '@/lib/types';
import { useCallLocks } from '@/hooks/useCallLocks';
import ScriptTab from '@/components/sales/call/ScriptTab';
import styles from './sales-queue.module.css';

const GOAL_CALLS = 30;

export default function SalesQueuePage() {
    const { user } = useAuth();
    const { locks } = useCallLocks(); // Get real-time locks
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCall, setActiveCall] = useState<Company | null>(null);
    const [queueOpen, setQueueOpen] = useState(true);
    const [memoText, setMemoText] = useState("");
    const [toastMsg, setToastMsg] = useState(""); // Toast Message
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [editContactName, setEditContactName] = useState("");
    
    // Wrap-up state
    const [callState, setCallState] = useState<'calling' | 'wrapup'>('calling');
    const [selectedResult, setSelectedResult] = useState<'연결-메일'|'연결-콜백'|'연결-거절'|'부재중(24h)'|'사이트이상(패스)' | null>(null);
    
    // Stats for today
    const [stats, setStats] = useState({ connected: 0, missed: 0, callback: 0, rejected: 0, invalid: 0 });
    
    const { sec, fmt, start, reset, pause } = useTimer();

    const loadData = useCallback(async () => {
        try {
            const comps = await supabaseCompanyStore.getQueue();
            
            // Calc stats for today from DB O(1) via logs
            if (user?.name) {
                const dbStats = await supabaseCompanyStore.getTodaySalesStats(user.name);
                setStats({ 
                    connected: dbStats.connected || 0, 
                    missed: dbStats.no_answer || 0, 
                    callback: dbStats.callback || 0, 
                    rejected: dbStats.rejected || 0, 
                    invalid: (dbStats.invalid_site || 0) + (dbStats.no_homepage || 0) + (dbStats.promo_only || 0) + (dbStats.no_policy || 0)
                });
            }
            
            // Sort by not called today first, then riskScore DESC
            const todayStr = new Date().toISOString().split('T')[0];
            const uncalled = comps.filter(comp => {
                const calledToday = comp.lastCallAt && comp.lastCallAt.startsWith(todayStr);
                return !calledToday;
            });
            
            const sorted = uncalled.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
            setCompanies(sorted);
        } catch (e) {
            console.error('Failed to load queue data', e);
        } finally {
            setLoading(false);
        }
    }, [user?.name]);

    useEffect(() => {
        loadData();
        const int = setInterval(loadData, 30000); // 30s auto refresh back to normal
        return () => clearInterval(int);
    }, [loadData]);

    // 새로고침/재진입 시 본인이 잡고 있는 Lock이 있다면 화면 복구(Auto-resume)
    useEffect(() => {
        if (!user || activeCall || companies.length === 0 || locks.length === 0) return;
        
        const myLock = locks.find(l => l.userId === user.id);
        if (myLock) {
            const c = companies.find(comp => comp.id === myLock.companyId);
            if (c) {
                supabaseCompanyStore.getById(c.id).then(fullC => {
                    setActiveCall(fullC || c);
                    setCallState('calling');
                    setSelectedResult(null);
                    setToastMsg('기존에 진행 중이던 통화 화면을 복구했습니다.');
                    setTimeout(() => setToastMsg(''), 3000);
                    setEditContactName(c.contactName || '');
                    setIsEditingContact(false);
                    reset();
                    start();
                });
            }
        }
    }, [user, activeCall, companies, locks, reset, start]);

    const handleNextCall = async (retryCount = 0) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }
        if (retryCount >= 5) {
            alert('현재 연결 가능한 대기열이 없습니다. 나중에 다시 시도해주세요.');
            return;
        }
        
        const lockedIds = new Set(locks.map(l => l.companyId));
        const todayStr = new Date().toISOString().split('T')[0];
        
        // 1. Find best candidate locally
        const candidate = companies.find(c => {
            const calledToday = c.lastCallAt && c.lastCallAt.startsWith(todayStr);
            return !calledToday && !lockedIds.has(c.id);
        });
        
        if (!candidate) {
            alert('전화할 대기열 회사가 없습니다.');
            return;
        }

        let finalCandidate = candidate;
        // 2. Verify candidate with server to prevent double-calling freshly completed calls
        try {
            const freshCandidate = await supabaseCompanyStore.getById(candidate.id);
            if (freshCandidate) {
                if (freshCandidate.lastCallAt && freshCandidate.lastCallAt.startsWith(todayStr)) {
                    // Someone else just finished calling this company!
                    setCompanies(prev => prev.filter(c => c.id !== freshCandidate.id));
                    return handleNextCall(retryCount + 1);
                }
                finalCandidate = freshCandidate;
            }
        } catch (e) {
            console.error('Candidate verification failed', e);
        }

        try {
            const res = await claimCompany(candidate.id, user.id, user.name || '영업팀');
            if (res.success) {
                setActiveCall(finalCandidate);
                setCallState('calling');
                setSelectedResult(null);
                setMemoText("");
                setEditContactName(candidate.contactName || '');
                setIsEditingContact(false);
                reset(); // Reset timer
                start(); // Start timer
            } else {
                // Already locked, try next
                handleNextCall(retryCount + 1);
            }
        } catch (e) {
            console.error('Claim error', e);
            handleNextCall(retryCount + 1);
        }
    };
    
    const handleSaveContact = async () => {
        if (!activeCall) return;
        try {
            await supabaseCompanyStore.update(activeCall.id, { contactName: editContactName });
            setActiveCall({ ...activeCall, contactName: editContactName });
            setIsEditingContact(false);
            
            // Also update the queue state to reflect new contact
            setCompanies(prev => prev.map(c => c.id === activeCall.id ? { ...c, contactName: editContactName } : c));
            
            setToastMsg('담당자 명이 수정되었습니다.');
            setTimeout(() => setToastMsg(''), 3000);
        } catch (e) {
            console.error(e);
            alert('담당자명 수정 중 오류가 발생했습니다.');
        }
    };

    const cancelCall = async () => {
        if (!activeCall || !user) return;
        
        try {
            // 통화 결과 저장 없이 단순히 Lock만 해제 (취소)
            await releaseCompany(activeCall.id, user.id).catch(() => {});
            setActiveCall(null);
            setCallState('calling');
            setSelectedResult(null);
            setMemoText("");
            reset();
            
            setToastMsg('통화가 취소되고 대기열로 복귀했습니다.');
            setTimeout(() => setToastMsg(''), 3000);
            await loadData();
        } catch (e) {
            console.error(e);
            alert('취소 처리 중 오류가 발생했습니다.');
        }
    };

    const handleResult = (result: '연결-메일'|'연결-콜백'|'연결-거절'|'부재중(24h)'|'홈페이지없음(패스)'|'홍보전용(패스)'|'동의서없음(패스)', nextAction?: 'review'|'memo') => {
        pause(); // Stop timer
        setSelectedResult(result as any);
        setCallState('wrapup');

        if (nextAction === 'memo') {
            document.getElementById('queue-memo-input')?.focus();
        } else if (result === '연결-메일') {
            setToastMsg('✅ 검토 요청이 등록되었습니다.');
            setMemoText(prev => prev ? prev + '\n[변호사 검토 요청]' : '[변호사 검토 요청]');
        }
        
        if (result === '홈페이지없음(패스)' || result === '홍보전용(패스)' || result === '동의서없음(패스)') {
            // instant complete can be done by user clicking save, but focus button so user just hits enter!
            document.querySelector<HTMLButtonElement>('.' + styles.saveWrapupBtn)?.focus();
        }
    };

    const finishCall = async () => {
        if (!activeCall || !user || !selectedResult) return;
        
        try {
            // Un-claim
            await releaseCompany(activeCall.id, user.id).catch(() => {});
            
            let callRes: 'connected'|'no_answer'|'callback'|'rejected'|'invalid_site'|'no_homepage'|'promo_only'|'no_policy' = 'connected';
            if (selectedResult === '부재중(24h)' as any) callRes = 'no_answer';
            else if (selectedResult === '연결-콜백' as any) callRes = 'callback';
            else if (selectedResult === '연결-거절' as any) callRes = 'rejected';
            else if (selectedResult === '홈페이지없음(패스)' as any) callRes = 'no_homepage';
            else if (selectedResult === '홍보전용(패스)' as any) callRes = 'promo_only';
            else if (selectedResult === '동의서없음(패스)' as any) callRes = 'no_policy';
            
            const payload: Partial<Company> = {
                lastCallResult: callRes,
                lastCallAt: new Date().toISOString(),
                lastCalledBy: user.name,
                callAttempts: (activeCall.callAttempts || 0) + 1,
            };

            if (selectedResult === '연결-메일' && activeCall.status === 'analyzed') {
                payload.status = 'reviewing';
            } else if (callRes === 'rejected' || callRes === 'no_homepage' || callRes === 'promo_only' || callRes === 'no_policy') {
                payload.status = callRes === 'rejected' ? 'rejected' : 'invalid_site';
            }

            // 자동 콜백 24시간 처리
            if (callRes === 'no_answer' || callRes === 'callback') {
                const tomorrow = new Date();
                tomorrow.setHours(tomorrow.getHours() + 24);
                payload.callbackScheduledAt = tomorrow.toISOString();
            }

            // Also append a memo if needed, optional
            if (memoText.trim()) {
                const newMemo = {
                    id: Math.random().toString(36).substring(7),
                    createdAt: new Date().toISOString(),
                    author: user.name,
                    content: memoText.trim()
                };
                payload.memos = [newMemo, ...(activeCall.memos || [])];
                
                // Add to timeline
                const newTimeEvent = {
                    id: Math.random().toString(36).substring(7),
                    createdAt: new Date().toISOString(),
                    author: user.name,
                    type: 'call' as const,
                    content: `[결과: ${selectedResult}] ${memoText.trim()}`
                };
                payload.timeline = [newTimeEvent, ...(activeCall.timeline || [])];
            } else {
                // 메모가 없어도 타임라인 로그는 남김
                const newTimeEvent = {
                    id: Math.random().toString(36).substring(7),
                    createdAt: new Date().toISOString(),
                    author: user.name,
                    type: 'call' as const,
                    content: `[결과: ${selectedResult}] 통화 완료`
                };
                payload.timeline = [newTimeEvent, ...(activeCall.timeline || [])];
            }
            
            await supabaseCompanyStore.update(activeCall.id, payload);

            // --- 세일즈 큐 (다음 전화하기) 자동 통화 녹음 연동 ---
            import('@/lib/callRecordingService').then(({ CallRecordingStore }) => {
                CallRecordingStore.save({
                    companyId: activeCall.id,
                    companyName: activeCall.name,
                    salesUserName: user.name || '영업담당자',
                    fileSizeBytes: Math.floor(Math.random() * 500000) + 200000, // 가상 파일 크기
                    durationSeconds: sec > 0 ? sec : 10,
                    transcript: `(자동녹음) 시스템 안내: 통화가 녹음되었습니다.\n결과: ${selectedResult}\n내용: ${memoText.trim() ? memoText.trim() : '수기 입력 메모 없음'}`,
                    transcriptSummary: memoText.trim() ? memoText.trim() : `${selectedResult} 처리 완료`,
                    callResult: callRes,
                    sttStatus: 'completed',
                    sttProvider: 'mock',
                    contactName: activeCall.contactName || '',
                    contactPhone: activeCall.contactPhone || activeCall.phone,
                });
            });
            
            setActiveCall(null);
            setCallState('calling');
            setSelectedResult(null);
            setMemoText("");
            reset();
            
            setToastMsg('결과가 저장되었습니다.');
            setTimeout(() => setToastMsg(''), 3000);
            
            // Auto reload to update queue
            await loadData();
        } catch (e) {
            console.error(e);
            alert('결과 저장 중 오류가 발생했습니다.');
        }
    };

    const getStatusInfo = (c: Company) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const calledToday = c.lastCallAt && c.lastCallAt.startsWith(todayStr);
        if (calledToday && c.lastCallResult) {
            return { label: `✅ 완료 (${c.lastCallResult})`, cls: styles.done };
        }
        
        const lock = locks.find(l => l.companyId === c.id);
        if (lock) {
            const min = getRemainingMinutes(lock.lockedUntil);
            return { label: `🔴 ${lock.userName} 통화중 (${min}분 남음)`, cls: styles.locked };
        }
        
        return { label: '🟢 가능', cls: styles.avail };
    };

    if (loading && companies.length === 0) {
        return <div className={styles.container}>로딩 중...</div>;
    }

    const totalCalls = stats.connected + stats.missed + stats.callback;
    const progressPercent = Math.min(100, (totalCalls / GOAL_CALLS) * 100);

    return (
        <div className={styles.container}>
            {toastMsg && <div className={styles.toastMsg}>{toastMsg}</div>}
            {/* Top Dashboard */}
            <div className={styles.headerCard}>
                <h2 className={styles.greeting}>안녕하세요, {user?.name || '영업담당자'}님 👋</h2>
                
                <div className={styles.progressContainer}>
                    <div className={styles.progressLabels}>
                        <span>오늘의 목표 달성률</span>
                        <span>{totalCalls} / {GOAL_CALLS}건</span>
                    </div>
                    <div className={styles.progressTrack}>
                        <div className={styles.progressBar} style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
                
                <div className={styles.statsRow}>
                    <div className={`${styles.statBadge} ${styles.connected}`}>
                        <span>연결됨</span>
                        <span className={styles.statValue}>{stats.connected}</span>
                    </div>
                    <div className={`${styles.statBadge} ${styles.missed}`}>
                        <span>부재중</span>
                        <span className={styles.statValue}>{stats.missed}</span>
                    </div>
                    <div className={`${styles.statBadge} ${styles.callback}`}>
                        <span>콜백 대기</span>
                        <span className={styles.statValue}>{stats.callback}</span>
                    </div>
                    <div className={`${styles.statBadge} bg-slate-100 text-slate-600 border border-slate-200`}>
                        <span>거절</span>
                        <span className={styles.statValue}>{stats.rejected}</span>
                    </div>
                </div>
            </div>

            {/* Main Button */}
            {!activeCall && (
                <div className={styles.mainBtnContainer}>
                    <button className={styles.mainButton} onClick={() => handleNextCall(0)}>
                        ▶ 다음 전화하기
                    </button>
                </div>
            )}

            {/* In-Call Card */}
            {activeCall && (
                <div className={styles.callingCard}>
                    <div className={styles.callingHeader}>
                        <div>
                            <h3 className={styles.callingTitle}>{activeCall.name}</h3>
                            <div className={styles.callingSub}>
                                담당자:{' '}
                                {isEditingContact ? (
                                    <span className="inline-flex items-center gap-1 ml-1">
                                        <input 
                                            autoFocus
                                            type="text" 
                                            value={editContactName} 
                                            onChange={e => setEditContactName(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleSaveContact();
                                                if (e.key === 'Escape') {
                                                    setIsEditingContact(false);
                                                    setEditContactName(activeCall.contactName || '');
                                                }
                                            }}
                                            className="px-1.5 py-0.5 text-[11px] border border-slate-300 rounded focus:outline-none focus:border-blue-500 text-slate-800"
                                            placeholder="담당자명"
                                        />
                                        <button onClick={handleSaveContact} className="px-2 py-0.5 text-[10px] bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">저장</button>
                                        <button onClick={() => { setIsEditingContact(false); setEditContactName(activeCall.contactName || ''); }} className="px-2 py-0.5 text-[10px] bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors">취소</button>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 ml-1 group">
                                        <span className="text-slate-700 font-medium">{activeCall.contactName || '미상'}</span>
                                        <button onClick={() => { setEditContactName(activeCall.contactName || ''); setIsEditingContact(true); }} className="text-slate-400 hover:text-blue-500 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity" title="담당자 수정">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                        </button>
                                    </span>
                                )} 
                                <span className="ml-1">({activeCall.contactPhone || activeCall.phone || '번호 없음'})</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-3">
                                <button onClick={cancelCall} className="text-[11px] text-slate-400 underline hover:text-slate-600 transition-colors cursor-pointer">
                                    통화 취소(Lock 해제)
                                </button>
                                <div className={styles.timer}>{fmt}</div>
                            </div>
                            {callState === 'calling' && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-[12px] font-bold animate-pulse shadow-sm">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute opacity-75"></span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 relative z-10"></span>
                                    자동 녹음 중...
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 mb-6">
                        {/* 왼쪽 컬럼: 통화 스크립트 */}
                        <div className="flex flex-col gap-4 lg:max-h-[600px]">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full lg:overflow-hidden">
                                <h4 className="text-[14px] font-bold text-slate-800 mb-3 flex items-center gap-2 shrink-0">
                                    <span>📞 통화 스크립트</span>
                                </h4>
                                <div className="flex-1 overflow-y-auto pr-2 min-h-[300px]">
                                    <ScriptTab co={activeCall} setToast={setToastMsg} />
                                </div>
                            </div>
                        </div>

                        {/* 오른쪽 컬럼: 위험도, 발생 이슈, 기업 정보, 통화 메모 */}
                        <div className="flex flex-col gap-4 lg:max-h-[600px] overflow-y-auto pr-1">
                            {/* 기업 요약 및 위험도 */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 flex flex-col shrink-0">
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-50">
                                    <h4 className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
                                        <span>🏢 기업 상세 정보</span>
                                    </h4>
                                    <div className="flex items-center gap-2 max-w-[150px] w-full justify-end">
                                        <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">위험도</span>
                                        <div className="flex-1 h-2 rounded-full overflow-hidden bg-slate-100 w-full min-w-[50px]">
                                            <div 
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${activeCall.riskScore}%`,
                                                    background: activeCall.riskScore >= 70 ? '#dc2626' : activeCall.riskScore >= 40 ? '#d97706' : '#059669'
                                                }}
                                            />
                                        </div>
                                        <span className="text-[11px] font-black" style={{ color: activeCall.riskScore >= 70 ? '#dc2626' : activeCall.riskScore >= 40 ? '#92400e' : '#065f46' }}>{activeCall.riskScore}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-500 font-medium text-[10px] bg-slate-50 self-start px-2 py-0.5 rounded">업종 / 구분</span>
                                        <span className="font-bold text-slate-800 ml-1 truncate">{activeCall.bizType || '-'} / {activeCall.franchiseType || '-'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-500 font-medium text-[10px] bg-slate-50 self-start px-2 py-0.5 rounded">사업자번호</span>
                                        <span className="font-bold text-slate-800 ml-1 truncate">{activeCall.biz || '-'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 col-span-2">
                                        <span className="text-slate-500 font-medium text-[10px] bg-slate-50 self-start px-2 py-0.5 rounded">웹사이트</span>
                                        <span className="font-bold text-slate-800 ml-1 truncate">
                                            {activeCall.url || activeCall.domain ? (
                                                <a href={activeCall.url || activeCall.domain} target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800">
                                                    {activeCall.url || activeCall.domain}
                                                </a>
                                            ) : '-'}
                                        </span>
                                    </div>
                                    {activeCall.callNote && (
                                        <div className="flex flex-col gap-1.5 col-span-2 mt-1">
                                            <span className="text-slate-500 font-medium text-[10px] bg-slate-50 self-start px-1.5 py-0.5 rounded">기존 메모 (Call Note)</span>
                                            <div className="ml-1 text-[11px] text-slate-700 whitespace-pre-wrap bg-rose-50 p-2.5 rounded-md border border-rose-100 max-h-[80px] overflow-y-auto">{activeCall.callNote}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* 발생 이슈 */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 shrink-0">
                                <h4 className="text-[13px] font-bold text-red-600 mb-3 flex items-center gap-1.5">
                                    <span>🚨 발생 이슈</span>
                                </h4>
                                {(!activeCall.issues || activeCall.issues.length === 0) ? (
                                    <div className="text-xs text-gray-400 py-2 text-center bg-slate-50 rounded border border-dashed border-slate-200">발견된 이슈가 없습니다.</div>
                                ) : (
                                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2.5 items-start">
                                        {activeCall.issues.map((iss: Issue, idx) => (
                                            <React.Fragment key={idx}>
                                                <div className="pt-0.5">
                                                    <span className={`inline-block text-[9px] px-2 py-0.5 rounded-md font-black whitespace-nowrap ${iss.level === 'HIGH' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                        {iss.level}
                                                    </span>
                                                </div>
                                                <span className="text-[12px] text-slate-700 leading-snug">{iss.title}</span>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 메모 입력 */}
                            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden flex-none flex flex-col min-h-[140px] focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                                <textarea
                                    id="queue-memo-input"
                                    className="w-full h-full p-4 text-[13px] text-slate-800 resize-none outline-none placeholder:text-slate-400 bg-indigo-50/30"
                                    placeholder="간단한 통화 메모나 다음 액션을 기록하세요..."
                                    value={memoText}
                                    onChange={(e) => setMemoText(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="w-full mt-4">
                        {callState === 'calling' ? (
                            <div className="flex flex-col gap-2 w-full">
                                <div className="flex gap-2">
                                    <button className={`${styles.resultBtn} ${styles.connected} flex-1 text-[13px] py-3`} onClick={() => handleResult('연결-메일')}>
                                        ✅ 메일 요청
                                    </button>
                                    <button className={`${styles.resultBtn} ${styles.connected} flex-1 text-[13px] py-3`} onClick={() => handleResult('연결-콜백')}>
                                        🔄 콜백
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button className={`${styles.resultBtn} bg-slate-200 text-slate-700 hover:bg-slate-300 flex-1 text-[13px] py-3`} onClick={() => handleResult('연결-거절')}>
                                        ❌ 거절
                                    </button>
                                    <button className={`${styles.resultBtn} ${styles.missed} flex-1 text-[13px] py-3`} onClick={() => handleResult('부재중(24h)')}>
                                        📵 부재
                                    </button>
                                </div>

                                <div className="h-[1px] bg-slate-200 my-1"></div>

                                <div className="flex gap-2">
                                    <button className={`${styles.resultBtn} bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 flex-1 text-[11px] py-2.5 font-bold`} onClick={() => handleResult('홈페이지없음(패스)')}>
                                        ⚠️ 홈페이지 없음
                                    </button>
                                    <button className={`${styles.resultBtn} bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 flex-1 text-[11px] py-2.5 font-bold`} onClick={() => handleResult('홍보전용(패스)')}>
                                        ⚠️ 홍보페이지만 있음
                                    </button>
                                    <button className={`${styles.resultBtn} bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 flex-1 text-[11px] py-2.5 font-bold leading-tight`} onClick={() => handleResult('동의서없음(패스)')}>
                                        ⚠️ 홈페이지 있음<br/>(방침 없음)
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.wrapupSection}>
                                <div className={styles.wrapupMsg}>
                                    현재 [<strong>{selectedResult}</strong>] 상태로 정리 중입니다. 
                                    {(selectedResult as any === '부재중(24h)' || selectedResult as any === '연결-콜백') && ' (24시간 뒤 자동 콜백 예약됨)'}
                                </div>
                                <button className={styles.saveWrapupBtn} onClick={() => {
                                    finishCall().then(() => {
                                        if (selectedResult as any === '홈페이지없음(패스)' || selectedResult as any === '홍보전용(패스)' || selectedResult as any === '동의서없음(패스)') {
                                            setTimeout(() => handleNextCall(0), 500); // 자동 다음 호출
                                        }
                                    });
                                }}>
                                    💾 저장 및 다음 대기열
                                </button>
                                <button className={styles.cancelWrapupBtn} onClick={() => { setCallState('calling'); setSelectedResult(null); start(); }}>
                                    ← 취소 (타이머 재시작)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Queue List */}
            <div className={styles.queueSection}>
                <div className={styles.queueHeader} onClick={() => setQueueOpen(!queueOpen)}>
                    <span>대기열 큐 (상위 20개 - 우선순위)</span>
                    <span>{queueOpen ? '▲' : '▼'}</span>
                </div>
                {queueOpen && (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>회사명</th>
                                <th className={styles.th}>우선순위(Risk)</th>
                                <th className={styles.th}>상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.slice(0, 20).map(c => {
                                const st = getStatusInfo(c);
                                return (
                                    <tr key={c.id} className={styles.tr}>
                                        <td className={styles.td}>
                                            <strong>{c.name}</strong>
                                        </td>
                                        <td className={styles.td}>{c.riskScore ?? 0}점</td>
                                        <td className={styles.td}>
                                            <span className={`${styles.statusBadge} ${st.cls}`}>
                                                {st.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
