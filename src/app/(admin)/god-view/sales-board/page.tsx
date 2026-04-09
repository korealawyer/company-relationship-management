"use client";

import { useEffect, useState, useMemo } from "react";
import styles from "./page.module.css";
import { supabaseCompanyStore, supabaseUserStore } from "@/lib/supabaseStore";
import { Company, CallLock } from "@/lib/types";
import { useCallLocks } from "@/hooks/useCallLocks";

// Helper to calculate minutes difference from now
function getMinutesDiff(dateStr: string) {
  if (!dateStr) return 0;
  const t1 = new Date(dateStr).getTime();
  const t2 = new Date().getTime();
  return Math.floor((t2 - t1) / 60000);
}

// Convert string to Date
function getLocalDayStr(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

export default function SalesBoard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [salesUsers, setSalesUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());
  const [visibleCount, setVisibleCount] = useState(50);
  
  // Real-time locks via hook
  const { locks: callLocks } = useCallLocks();

  // Update lastRefresh when callLocks updates
  useEffect(() => {
    setLastRefreshed(new Date().toLocaleTimeString());
  }, [callLocks]);
  
  // Total Goal
  const TOTAL_GOAL = 2000;
  const DAILY_GOAL_PER_PERSON = 30;

  // Initial Data Fetch
  useEffect(() => {
    async function init() {
      try {
        const [cmpData, usrData] = await Promise.all([
          supabaseCompanyStore.getAll(),
          supabaseUserStore.getAll(),
        ]);
        setCompanies(cmpData);
        setSalesUsers(usrData.filter((u: any) => u.role === "sales"));
      } catch (err) {
        console.error("Failed to init data:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // -- Calculations --
  const { todayTotal, todayNumConnected, todayNumNoAnswer, todayNumCallback, totalCompleted } = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    let tTotal = 0;
    let tConnected = 0;
    let tNoAnswer = 0;
    let tCallback = 0;
    let tCompleted = 0; // statuses considered "completed" (e.g., cold_email, guide_download, subscribed, upsell, churn_risk - or anything past reviewing/pending)

    companies.forEach((c) => {
      // Completed logic: not pending/crawling/assigned reviewing. For this context, let's say "salesConfirmed" or status >= 'lawyer_confirmed'
      if (c.salesConfirmed || !['pending','crawling','assigned','reviewing'].includes(c.status)) {
        tCompleted++;
      }

      const callDateStr = c.lastCallAt ? getLocalDayStr(c.lastCallAt) : "";
      if (callDateStr === today && c.lastCallResult) {
        tTotal++;
        if (c.lastCallResult === "connected") tConnected++;
        else if (c.lastCallResult === "no_answer") tNoAnswer++;
        else if (c.lastCallResult === "callback") tCallback++;
      }
    });

    return { todayTotal: tTotal, todayNumConnected: tConnected, todayNumNoAnswer: tNoAnswer, todayNumCallback: tCallback, totalCompleted: tCompleted };
  }, [companies]);

  const progressPercent = Math.min((totalCompleted / TOTAL_GOAL) * 100, 100);

  // Agents logic
  const agentStats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    
    return salesUsers.map(user => {
      // Find locks for this user
      const userLock = callLocks.find(l => l.userId === user.id);
      let companyLockedInfo = null;
      let inCallDuration = 0;
      
      if (userLock) {
        const company = companies.find(c => c.id === userLock.companyId);
        companyLockedInfo = company ? company.name : "알 수 없음";
        inCallDuration = getMinutesDiff(userLock.lockedAt);
      }

      // Today's stats for this user
      let myCalls = 0;
      let myConnected = 0;
      let recentCalls: Company[] = [];

      // Find companies modified/called by this user today
      // Using `lastCallAt` matching today and `assignedSalesId` === user.id as heuristic
      const myCompanies = companies.filter(c => c.assignedSalesId === user.id || c.salesConfirmedBy === user.id);
      
      myCompanies.forEach(c => {
        if (c.lastCallAt && getLocalDayStr(c.lastCallAt) === today) {
          myCalls++;
          if (c.lastCallResult === "connected") myConnected++;
          recentCalls.push(c);
        }
      });

      recentCalls.sort((a,b) => new Date(b.lastCallAt || "").getTime() - new Date(a.lastCallAt || "").getTime());

      // Let's also fallback if no recent calls exist, show any recent assignments
      if (recentCalls.length === 0) {
        recentCalls = myCompanies
          .filter(c => c.assignedAt)
          .sort((a,b) => new Date(b.assignedAt || "").getTime() - new Date(a.assignedAt || "").getTime());
      }

      return {
        id: user.id,
        name: user.name,
        role: "Sales Executive",
        callsToday: myCalls,
        connectRate: myCalls > 0 ? Math.round((myConnected / myCalls) * 100) : 0,
        status: userLock ? "in_call" : "available",
        inCallCompany: companyLockedInfo,
        inCallDuration: inCallDuration,
        recent: recentCalls.slice(0, 3)
      };
    });
  }, [salesUsers, callLocks, companies]);

  // Queue Generation
  const [sortKey, setSortKey] = useState<'riskScore' | 'createdAt'>('createdAt');
  
  const handleSortScore = () => {
    setSortKey('riskScore');
  }

  const handleForceRelease = async () => {
    const obsoleteLocks = callLocks.filter(l => getMinutesDiff(l.lockedAt) > 30);
    if (obsoleteLocks.length === 0) {
      alert("30분 이상 경과된 통화 락이 없습니다.");
      return;
    }
    
    try {
      await Promise.all(obsoleteLocks.map(l => 
        fetch('/api/call-lock/release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId: l.companyId, userId: l.userId })
        })
      ));
      alert(`초기화 완료 (${obsoleteLocks.length}건)`);
    } catch (err) {
      console.error(err);
      alert("락 해제 실패");
    }
  }

  const handleAssign = async (companyId: string, assignedSalesId: string) => {
    if (!assignedSalesId) return;
    const user = salesUsers.find(u => u.id === assignedSalesId);
    
    // Optimistic Update
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, assignedSalesId, assignedSalesName: user?.name } : c));
    
    try {
      await supabaseCompanyStore.update(companyId, { 
        assignedSalesId, 
        assignedSalesName: user?.name 
      });
    } catch (e) {
      console.error(e);
      alert("배정 실패");
      // Revert optimism if needed (skipping for brevity)
    }
  };

  const handleExportCsv = () => {
    const headers = ["회사명", "이메일", "부서", "상태", "리스크점수", "할당된담당자", "마지막통화"];
    const rows = companies.map(c => [
      `"${c.name}"`, 
      `"${c.email || ''}"`, 
      `"${c.bizType || ''}"`, 
      `"${c.status}"`, 
      c.riskScore, 
      `"${c.assignedSalesName || '미배정'}"`, 
      `"${c.lastCallAt ? new Date(c.lastCallAt).toLocaleString() : '없음'}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(",") + "\n" 
      + rows.map(r => r.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const sortedQueue = useMemo(() => {
    let q = [...companies];
    // Filter to exclude completed ones
    q = q.filter(c => !c.salesConfirmed && c.status !== 'contract_signed');

    if (sortKey === 'riskScore') {
      q.sort((a,b) => (b.riskScore || 0) - (a.riskScore || 0));
    } else {
      q.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return q;
  }, [companies, sortKey]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.flexCenter}><div className={styles.loader}></div></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          🚀 Sales Frontline 
          <span className={styles.liveBadge}><div className={styles.liveDot}></div> LIVE {lastRefreshed}</span>
        </h1>
        <div className={styles.controls}>
          <button className={styles.btn} onClick={handleSortScore}>⚡ 전체 재정렬</button>
          <button className={styles.btn} onClick={handleForceRelease}>🔄 락 초기화</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleExportCsv}>📊 오늘 리포트 내보내기</button>
        </div>
      </header>

      {/* SECTION 1: Top Stats */}
      <section className={styles.statsSection}>
        <div className={styles.statsHeader}>
          <div className={styles.progressLabel}>
            <span className={styles.progressLabelTitle}>전체 달성률 (목표 {TOTAL_GOAL}건)</span>
            <span className={styles.progressLabelValue}>{totalCompleted.toLocaleString()} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ {TOTAL_GOAL}건 ({progressPercent.toFixed(1)}%)</span></span>
          </div>
          <div className={styles.estCompletion}>
            <span className={styles.progressLabelTitle}>예상 완료일</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc' }}>
               {todayTotal > 0 ? new Date(new Date().getTime() + (((TOTAL_GOAL - totalCompleted) / todayTotal) * 86400000)).toLocaleDateString('ko-KR') : "진척 대기중"}
            </span>
          </div>
        </div>
        
        <div className={styles.progressContainer}>
          <div className={styles.progressBar} style={{ width: `${progressPercent}%` }}></div>
        </div>

        <div className={styles.kpiCards}>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconBlue}`}>📞</div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiTitle}>오늘 전화 연결</span>
              <span className={styles.kpiValue}>{todayNumConnected}건</span>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconRed}`}>🚫</div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiTitle}>오늘 부재중</span>
              <span className={styles.kpiValue}>{todayNumNoAnswer}건</span>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconOrange}`}>🔄</div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiTitle}>콜백 대기건</span>
              <span className={styles.kpiValue}>{todayNumCallback}건</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Agent Cards */}
      <section className={styles.agentsSection}>
        {agentStats.map(agent => (
          <div key={agent.id} className={styles.agentCard}>
            <div className={styles.agentHeader}>
              <div className={styles.agentNameBox}>
                <div className={styles.agentAvatar}>{agent.name.charAt(0)}</div>
                <div className={styles.agentInfo}>
                  <span className={styles.agentName}>{agent.name}</span>
                  <span className={styles.agentRole}>{agent.role}</span>
                </div>
              </div>
              
              {agent.status === 'in_call' ? (
                <div className={`${styles.agentLockStatus} ${styles.statusInCall}`}>
                  <span className={styles.liveDot} style={{backgroundColor: '#ef4444'}}></span>
                  통화중: {agent.inCallCompany} ({agent.inCallDuration}분째)
                </div>
              ) : agent.status === 'available' ? (
                <div className={`${styles.agentLockStatus} ${styles.statusAvailable}`}>
                  <span className={styles.liveDot}></span>
                  통화 가능
                </div>
              ) : (
                <div className={`${styles.agentLockStatus} ${styles.statusOffline}`}>
                  오프라인
                </div>
              )}
            </div>

            <div className={styles.agentStats}>
              <div className={styles.agentStatItem}>
                <span className={styles.agentStatLabel}>오늘 통화</span>
                <span className={styles.agentStatValue}>{agent.callsToday} / {DAILY_GOAL_PER_PERSON}</span>
                <div className={styles.miniProgressContainer}>
                  <div className={styles.miniProgressBar} style={{ width: `${Math.min((agent.callsToday / DAILY_GOAL_PER_PERSON) * 100, 100)}%` }}></div>
                </div>
              </div>
              <div className={styles.agentStatItem}>
                <span className={styles.agentStatLabel}>연결율</span>
                <span className={styles.agentStatValue} style={{ color: agent.connectRate > 30 ? '#10b981' : '#f8fafc' }}>{agent.connectRate}%</span>
              </div>
            </div>

            <div className={styles.recentList}>
              <div className={styles.recentListTitle}>최근 진행 리스트</div>
              {agent.recent.length > 0 ? agent.recent.map(r => (
                <div key={r.id} className={styles.recentItem}>
                  <span className={styles.recentCompanyName}>{r.name}</span>
                  <span className={styles.recentStatus} style={{ color: r.lastCallResult === 'connected' ? '#10b981' : '#94a3b8' }}>
                    {r.lastCallResult === 'connected' ? '✅ 연결됨' : (r.lastCallResult === 'no_answer' ? '🚫 부재중' : '🔄 대기')}
                  </span>
                </div>
              )) : (
                <div className={styles.recentItem} style={{ justifyContent: 'center', color: '#64748b' }}>
                  기록 없음
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* SECTION 3: Queue Table */}
      <section className={styles.queueSection}>
        <div className={styles.queueHeader}>
          <h2 className={styles.queueTitle}>실시간 영업 큐 ({sortedQueue.length}건)</h2>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>순위</th>
                <th>회사명</th>
                <th>리스크 점수</th>
                <th>현재 상태</th>
                <th>마지막 시도</th>
                <th>담당자 배정</th>
              </tr>
            </thead>
            <tbody>
              {sortedQueue.slice(0, visibleCount).map((c, i) => {
                // Find if locked
                const lock = callLocks.find(l => l.companyId === c.id);
                
                return (
                  <tr key={c.id}>
                    <td>#{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td className={c.riskScore > 75 ? styles.riskHigh : c.riskScore > 40 ? styles.riskMedium : styles.riskLow}>
                      {c.riskScore || 0}점
                    </td>
                    <td>
                      {lock ? (
                        <span className={`${styles.badge} ${styles.badgeInCall}`}>
                          🔴 {lock.userName} 통화중
                        </span>
                      ) : c.lastCallResult === 'callback' ? (
                        <span className={`${styles.badge} ${styles.badgeCallback}`}>
                          🔄 예약/콜백
                        </span>
                      ) : c.salesConfirmed ? (
                        <span className={`${styles.badge} ${styles.badgeCompleted}`}>
                          ✅ 완료
                        </span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeWaiting}`}>
                          🟢 대기중
                        </span>
                      )}
                    </td>
                    <td style={{ color: '#94a3b8' }}>
                      {c.lastCallAt ? new Date(c.lastCallAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : '미시도'}
                    </td>
                    <td>
                      <select 
                        className={styles.select}
                        value={c.assignedSalesId || ''}
                        onChange={(e) => handleAssign(c.id, e.target.value)}
                      >
                        <option value="">-- 자동 배정 대기 --</option>
                        {salesUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {visibleCount < sortedQueue.length && (
          <button className={styles.moreBtn} onClick={() => setVisibleCount(p => p + 50)}>
            상위 50개 더보기
          </button>
        )}
      </section>
    </div>
  );
}
