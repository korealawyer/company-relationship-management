-- ================================================================
-- Migration: Add crawling status columns to cases
-- 봇의 동시성 제어 및 예기치 못한 종료(Zombie)를 추적하기 위한 확장
-- ================================================================

ALTER TABLE cases
ADD COLUMN IF NOT EXISTS crawling_status TEXT NOT NULL DEFAULT 'idle'
    CHECK (crawling_status IN ('idle', 'processing', 'error')),
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_crawled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS captcha_fail_count INT NOT NULL DEFAULT 0;

-- 인덱스: 스케줄러가 효율적으로 락이 풀린(혹은 시간이 지난) 작업을 탐색할 수 있도록 추가
CREATE INDEX IF NOT EXISTS idx_cases_crawler_queue 
    ON cases (status, crawling_status, locked_until)
    WHERE status = 'active';
