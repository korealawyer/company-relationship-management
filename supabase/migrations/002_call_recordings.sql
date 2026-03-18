-- ================================================================
-- IBS 법률사무소 CRM — 통화 녹음 + STT 테이블
-- 영업팀 상담 자동 녹음 → STT 변환 → CRM 자동 입력
-- ================================================================

-- ── call_recordings 테이블 ───────────────────────────────────
CREATE TABLE IF NOT EXISTS call_recordings (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id          uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sales_user_id       uuid REFERENCES users(id),
    recording_url       text,                                    -- Supabase Storage URL
    file_size_bytes     integer DEFAULT 0,
    duration_seconds    integer DEFAULT 0,                       -- 녹음 시간(초)
    transcript          text,                                    -- STT 전체 텍스트
    transcript_summary  text,                                    -- AI 요약본
    call_result         text DEFAULT 'connected',                -- connected | no_answer | callback
    stt_status          text DEFAULT 'pending',                  -- pending | processing | completed | failed
    stt_provider        text DEFAULT 'mock',                     -- mock | google | whisper
    contact_name        text,                                    -- 상대방 이름
    contact_phone       text,                                    -- 상대방 번호
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now()
);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recordings_internal_all" ON call_recordings FOR ALL TO authenticated
    USING (is_internal()) WITH CHECK (is_internal());

-- ── updated_at 자동 갱신 트리거 ──────────────────────────────
CREATE TRIGGER call_recordings_updated_at
    BEFORE UPDATE ON call_recordings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 인덱스 ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_call_recordings_company ON call_recordings(company_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_created ON call_recordings(created_at DESC);
