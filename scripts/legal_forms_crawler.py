"""
대한민국 법원 전자민원센터 법률양식 자동 확보 크롤러 (Phase 1)
요구사항: python -m pip install playwright requests bs4
설치후: playwright install
"""

import asyncio
from playwright.async_api import async_playwright
import os
import json

SAVE_DIR = "./downloaded_forms"
os.makedirs(SAVE_DIR, exist_ok=True)

async def crawl_supreme_court_forms():
    print("Starting Supreme Court Forms Crawler...")
    
    # 향후 대법원 전자민원센터(help.scourt.go.kr) 양식모음 페이지 URL로 대체
    TARGET_URL = "https://help.scourt.go.kr/nm/minwon/doc/DocListAction.work"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        try:
            print(f"Navigating to {TARGET_URL}...")
            # 대법원 접속 (현재는 Mocking 로직, 실제 파서 셀렉터는 DOM 구조 확인 후 조정)
            # await page.goto(TARGET_URL)
            # await page.wait_for_selector(".boardList")
            
            # TODO: Pagination 순회 루프
            # for i in range(1, MAX_PAGES):
            #     rows = await page.query_selector_all(".boardList tbody tr")
            #     for row in rows:
            #         title = await row.query_selector("td.title a").inner_text()
            #         카테고리 = await row.query_selector("td.category").inner_text()
            #         다운로드_링크 = await row.query_selector("td.file a").get_attribute("href")
            #         # 파일 다운로드 로직 수행 (HWP, DOC, PDF) 및 DB 메타데이터 적재 준비
            
            print("[Mock] 크롤링 인프라 구조 데모 완료. (실제 DOM 셀렉터 주입 필요)")
            
            # 임시 메타데이터 생성 (이후 Node.js API를 통해 DB 벌크 인서트)
            mock_forms = [
                {"category": "민사", "sub_category": "소장", "title": "대여금 반환 청구의 소", "files": ["loan_claim.hwp"]},
                {"category": "가사", "sub_category": "소장", "title": "이혼 및 재산분할 청구", "files": ["divorce.hwp"]},
                {"category": "형사", "sub_category": "탄원서", "title": "선처를 바라는 탄원서", "files": ["petition.hwp"]}
            ]
            
            with open(os.path.join(SAVE_DIR, "crawled_meta.json"), "w", encoding="utf-8") as f:
                json.dump(mock_forms, f, ensure_ascii=False, indent=2)
            print("Meta data saved.")
                
        except Exception as e:
            print(f"Crawler Failed: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(crawl_supreme_court_forms())
