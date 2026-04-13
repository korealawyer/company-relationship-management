chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXECUTE_CRAWL") {
    // 비동기 처리를 위해 true 반환
    handleCrawl(message.target, message.apiBase, message.secretKey).then(sendResponse);
    return true;
  }
});

async function handleCrawl(caseItem, apiBase, secretKey) {
  try {
    // 1. 대법원 사이트 요청 (실제로는 복잡한 파라미터 세팅 필요)
    // 현재는 POC 목적으로 타겟 URL의 HTML을 받아오는 과정만 시뮬레이션
    console.log(`[Offscreen] Fetching Court Page for: ${caseItem.case_number}`);
    
    // [개발자 참고] 이 구간에 실제 대법원 fetch() 구문이 들어갑니다.
    // 예: const response = await fetch("https://safind.scourt.go.kr/...", { ... });
    // const buffer = await response.arrayBuffer();
    // const html = new TextDecoder('euc-kr').decode(buffer);
    
    // 2. 가상의 페이지 파싱 및 구조 (캡차 탐지 로직)
    const isCaptchaTriggered = Math.random() < 0.3; // 30% 확률로 자동방지 팝업 트리거 가상 구현

    if (isCaptchaTriggered) {
      console.log("[Offscreen] CAPTCHA detected. Requesting AI Vision Override...");
      
      // 실제 구현 시: HTML 내의 <img id="captchaImage"> 요소를 Canvas에 그려 DataURL로 추출
      const mockBase64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
      
      // OpenAI 프록시 서버(Vercel)로 이미지 전송
      const captchaRes = await fetch(`${apiBase}/solve-captcha`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-crawler-secret": secretKey
        },
        body: JSON.stringify({ base64Image: mockBase64Image })
      });

      const captchaData = await captchaRes.json();
      
      if (!captchaRes.ok || !captchaData.solved) {
         throw new Error("Captcha Match Failed: " + (captchaData.error || "Vision Analysis Failed"));
      }

      console.log(`[Offscreen] AI Solved CAPTCHA as: ${captchaData.solved}`);
      
      // 해독된 captchaData.solved 숫자를 다시 body에 담아 대법원에 최종 데이터 요청 단계 진행
    }

    // 3. 성공적인 데이터 추출 반환 (가상 데이터)
    const mockProgress = ['접수', '서면제출', '변론기일', '판결선고'][Math.floor(Math.random() * 4)];
    const dateObj = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const mockDate = dateObj.toISOString().split('T')[0];

    return {
      status: "success",
      captchaFailed: false,
      data: {
        progress: `${mockProgress} (자동 수집)`,
        nextDate: mockDate,
        nextEvent: "가상 기일 정보"
      }
    };

  } catch (error) {
    console.error(`[Offscreen] Crawl Failed for ${caseItem.case_number}:`, error);
    const isCaptchaFail = error.message.toLowerCase().includes("captcha");
    return {
      status: "error",
      captchaFailed: isCaptchaFail,
      errorMsg: error.message
    };
  }
}
