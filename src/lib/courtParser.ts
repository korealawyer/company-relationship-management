// src/lib/courtParser.ts — 대법원 사건 진행정보 파서 (Mock)
// 나중에 실제 대법원 API 연동 시 parseCaseInfo() 내부만 교체하면 됩니다.

export interface CourtCaseHistory {
  date: string;
  event: string;
  detail: string;
}

export interface CourtCaseInfo {
  caseNo: string;
  court: string;
  judge: string;
  nextHearing: string;        // ISO 날짜 or ''
  status: '진행' | '종결' | '취하' | '합의';
  parties: { plaintiff: string; defendant: string };
  history: CourtCaseHistory[];
  lastUpdated: string;        // 대법원 시스템 갱신 시각
}

// ── Mock 데이터 생성 (사건번호별로 deterministic) ──────────────────
function generateMockHistory(caseNo: string): CourtCaseHistory[] {
  const seed = caseNo.replace(/[^0-9]/g, '').slice(0, 4);
  const n = parseInt(seed) || 1234;

  const events: CourtCaseHistory[] = [
    { date: '2026-01-15', event: '소장 접수', detail: `사건번호 ${caseNo} 배정` },
    { date: '2026-02-10', event: '답변서 제출', detail: '피고 답변서 접수 완료' },
    { date: '2026-02-28', event: '쟁점 정리', detail: '재판부 쟁점정리 명령' },
  ];

  if (n % 3 === 0) {
    events.push({ date: '2026-03-20', event: '감정신청', detail: '원고 측 손해 감정 신청' });
  }
  if (n % 2 === 0) {
    events.push({ date: '2026-03-25', event: '준비서면 제출', detail: '원고 제2준비서면 접수' });
  }

  return events;
}

const MOCK_JUDGES = ['김영수 부장판사', '이미영 판사', '박정훈 부장판사', '최지은 판사', '한동욱 부장판사'];
const MOCK_COURTS = ['서울중앙지방법원', '서울남부지방법원', '수원지방법원', '인천지방법원', '대전지방법원'];

/**
 * 대법원 나의사건검색 파싱 (현재 Mock)
 * 실제 구현 시 이 함수 내부만 교체하면 됩니다.
 */
export async function parseCaseInfo(caseNo: string): Promise<CourtCaseInfo> {
  // 네트워크 지연 시뮬레이션
  await new Promise(res => setTimeout(res, 800 + Math.random() * 600));

  const seed = caseNo.replace(/[^0-9]/g, '');
  const n = parseInt(seed.slice(0, 4)) || 1234;

  // 다음 기일 계산 (오늘로부터 7~30일 후)
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 7 + (n % 24));
  const nextHearing = nextDate.toISOString().slice(0, 10);

  return {
    caseNo,
    court: MOCK_COURTS[n % MOCK_COURTS.length],
    judge: MOCK_JUDGES[n % MOCK_JUDGES.length],
    nextHearing,
    status: '진행',
    parties: {
      plaintiff: '원고 (의뢰인)',
      defendant: '피고 (상대방)',
    },
    history: generateMockHistory(caseNo),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 여러 사건을 일괄 조회 (대시보드 백그라운드 스캔용)
 */
export async function batchParseCases(caseNos: string[]): Promise<Map<string, CourtCaseInfo>> {
  const results = new Map<string, CourtCaseInfo>();
  for (const caseNo of caseNos) {
    try {
      const info = await parseCaseInfo(caseNo);
      results.set(caseNo, info);
    } catch {
      // 실패한 건은 skip
    }
  }
  return results;
}
