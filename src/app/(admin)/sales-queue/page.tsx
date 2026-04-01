'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabaseCompanyStore } from '@/lib/supabaseStore';
import { claimCompany, releaseCompany, getRemainingMinutes } from '@/lib/callQueueService';
import { useTimer, CALLABLE } from '@/lib/callPageUtils';
import type { Company, Issue } from '@/lib/types';
import type { CallLock } from '@/lib/types';
import { useCallLocks } from '@/hooks/useCallLocks';
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
    
    // Wrap-up state
    const [callState, setCallState] = useState<'calling' | 'wrapup'>('calling');
    const [selectedResult, setSelectedResult] = useState<'연결됨'|'부재중'|'콜백' | null>(null);
    
    // Stats for today
    const [stats, setStats] = useState({ connected: 0, missed: 0, callback: 0 });
    
    const { sec, fmt, start, reset, pause } = useTimer();

    const loadData = useCallback(async () => {
        try {
            const rawComps = await supabaseCompanyStore.getAll();
            const comps = rawComps.filter(c => CALLABLE.includes(c.status));
            
            // Calc stats for today
            const todayStr = new Date().toISOString().split('T')[0];
            let c = 0, m = 0, cb = 0;
            comps.forEach(comp => {
                if (comp.lastCallAt && comp.lastCallAt.startsWith(todayStr) && comp.lastCalledBy === user?.name) {
                    if (comp.lastCallResult === 'connected') c++;
                    else if (comp.lastCallResult === 'no_answer') m++;
                    else if (comp.lastCallResult === 'callback') cb++;
                }
            });
            setStats({ connected: c, missed: m, callback: cb });
            
            // Sort by not called today first, then riskScore DESC
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

        // 2. Verify candidate with server to prevent double-calling freshly completed calls
        try {
            const freshCandidate = await supabaseCompanyStore.getById(candidate.id);
            if (freshCandidate && freshCandidate.lastCallAt && freshCandidate.lastCallAt.startsWith(todayStr)) {
                // Someone else just finished calling this company!
                setCompanies(prev => prev.filter(c => c.id !== freshCandidate.id));
                return handleNextCall(retryCount + 1);
            }
        } catch (e) {
            console.error('Candidate verification failed', e);
        }

        try {
            const res = await claimCompany(candidate.id, user.id, user.name || '영업팀');
            if (res.success) {
                setActiveCall(candidate);
                setCallState('calling');
                setSelectedResult(null);
                setMemoText("");
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
    
    const handleResult = (result: '연결됨'|'부재중'|'콜백') => {
        pause(); // Stop timer
        setSelectedResult(result);
        setCallState('wrapup');
    };

    const finishCall = async () => {
        if (!activeCall || !user || !selectedResult) return;
        
        try {
            // Un-claim
            await releaseCompany(activeCall.id, user.id).catch(() => {});
            
            // Save call result mapping
            let callRes: 'connected'|'no_answer'|'callback' = 'connected';
            if (selectedResult === '부재중') callRes = 'no_answer';
            else if (selectedResult === '콜백') callRes = 'callback';
            
            const payload: Partial<Company> = {
                lastCallResult: callRes,
                lastCallAt: new Date().toISOString(),
                lastCalledBy: user.name,
                callAttempts: (activeCall.callAttempts || 0) + 1,
            };

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
                            <p className={styles.callingSub}>
                                담당자: {activeCall.contactName || '미상'} ({activeCall.contactPhone || activeCall.phone || '번호 없음'})
                            </p>
                        </div>
                        <div className={styles.timer}>{fmt}</div>
                    </div>
                    
                    <div className={styles.issueBox}>
                        <h4 className={styles.issueTitle}>🤖 AI 파악 리스크/이슈 (최대 2개)</h4>
                        {(!activeCall.issues || activeCall.issues.length === 0) && (
                            <p className={styles.issueItem}>이슈 내역 없음</p>
                        )}
                        {activeCall.issues && activeCall.issues.slice(0, 2).map((iss: Issue, idx) => (
                            <div key={idx} className={styles.issueItem}>
                                <span className={styles.issueLevel}>{iss.level}</span>
                                <span>{iss.title}</span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.memoBox}>
                        <textarea
                            className={styles.memoInput}
                            placeholder="간단한 통화 메모나 다음 액션을 기록하세요..."
                            value={memoText}
                            onChange={(e) => setMemoText(e.target.value)}
                        />
                    </div>
                    
                    <div className={styles.resultBtns}>
                        {callState === 'calling' ? (
                            <>
                                <button className={`${styles.resultBtn} ${styles.connected}`} onClick={() => handleResult('연결됨')}>
                                    ✅ 연결됨 / 상담완료
                                </button>
                                <button className={`${styles.resultBtn} ${styles.missed}`} onClick={() => handleResult('부재중')}>
                                    📵 부재중 / 통화불가
                                </button>
                                <button className={`${styles.resultBtn} ${styles.callback}`} onClick={() => handleResult('콜백')}>
                                    🔄 콜백 필요 / 거절
                                </button>
                            </>
                        ) : (
                            <div className={styles.wrapupSection}>
                                <div className={styles.wrapupMsg}>
                                    현재 [<strong>{selectedResult}</strong>] 상태로 정리 중입니다. 
                                    {(selectedResult === '부재중' || selectedResult === '콜백') && ' (24시간 뒤 자동 콜백 예약됨)'}
                                </div>
                                <button className={styles.saveWrapupBtn} onClick={finishCall}>
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
