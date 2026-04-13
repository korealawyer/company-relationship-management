let isRunning = false;

// ⚠️ 로컬 서버: "http://localhost:3000/api/crawler"
// ⚠️ 운영 서버: "https://ibsbase.com/api/crawler"
const API_BASE = "http://localhost:3000/api/crawler";
const CRAWLER_SECRET_KEY = "my_super_secret_crawler_key_2026"; // .env.local과 반드시 일치시켜야 합니다

// Service Worker 수면 방지를 위한 1분 단위 알람 스케줄러
chrome.alarms.create("pollQueue", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "pollQueue") {
    console.log("[Crawler Agent] Wakeup trigger - Polling Queue...");
    pollTasks();
  }
});

async function pollTasks() {
  if (isRunning) return;
  isRunning = true;

  try {
    const res = await fetch(`${API_BASE}/queue`, {
      method: "GET",
      headers: {
        "x-crawler-secret": CRAWLER_SECRET_KEY
      }
    });

    if (!res.ok) {
      throw new Error(`Queue fetch failed with status ${res.status}`);
    }

    const data = await res.json();
    const cases = data.cases || [];
    
    if (cases.length > 0) {
      console.log(`[Crawler Agent] Acquired ${cases.length} tasks from Vercel Server.`);
    }

    for (const c of cases) {
      await processCase(c);
      
      // Jitter (봇 탐지 회피용 3초 ~ 7초 난수 대기)
      const jitterMs = Math.floor(Math.random() * (7000 - 3000 + 1) + 3000);
      console.log(`[Crawler Agent] Waiting ${jitterMs}ms for jitter...`);
      await new Promise(resolve => setTimeout(resolve, jitterMs));
    }

  } catch (error) {
    console.error("[Crawler Agent] Error during polling:", error);
  } finally {
    isRunning = false;
  }
}

// 추출 명령 함수
async function processCase(caseItem) {
  console.log(`[Crawler Agent] Starting processing for Case: ${caseItem.case_number}`);

  await setupOffscreenDocument('offscreen.html');

  try {
    // offscreen.js 에 메시지를 보내 데이터 파싱 요구
    const result = await chrome.runtime.sendMessage({
      type: "EXECUTE_CRAWL",
      target: caseItem,
      apiBase: API_BASE,
      secretKey: CRAWLER_SECRET_KEY
    });

    // 분석 완료 후 성공/실패 여부를 백엔드 큐(cases) 테이블로 전송하여 락 해제
    await fetch(`${API_BASE}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-crawler-secret": CRAWLER_SECRET_KEY
      },
      body: JSON.stringify({
        caseId: caseItem.id,
        status: result.status,
        data: result.data || null,
        captchaFailed: result.captchaFailed || false,
        errorMsg: result.errorMsg || ""
      })
    });

    console.log(`[Crawler Agent] Submitted result for Case: ${caseItem.case_number}`, result);

  } catch (err) {
    console.error(`[Crawler Agent] Execution mapping failed for ${caseItem.case_number}:`, err);
    // 내부 통신 에러 등에 대한 fall-back 리포트
    await fetch(`${API_BASE}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-crawler-secret": CRAWLER_SECRET_KEY
      },
      body: JSON.stringify({
        caseId: caseItem.id,
        status: "error",
        captchaFailed: false,
        errorMsg: err.message
      })
    });
  }
}

// Offscreen DOM 셋업 도우미 (SPA 구조 캐싱 유지 방어)
let creating;
async function setupOffscreenDocument(path) {
  if (await hasDocument()) return;
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'To run secure DOM parsing and background fetches bypassing CORS safely'
    });
    await creating;
    creating = null;
  }
}

async function hasDocument() {
  const matchedClients = await clients.matchAll();
  return matchedClients.some(c => c.url.endsWith('offscreen.html'));
}
