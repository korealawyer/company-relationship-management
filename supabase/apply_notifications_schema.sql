-- 알림 시스템 데이터베이스 스키마 및 보안 정책 (Row Level Security)

-- 1. 알림 테이블 생성
CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
    href text,
    action_label text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. RLS 활성화
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책 생성
-- 사용자는 자신의 알림만 조회할 수 있습니다
CREATE POLICY "Users can view own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

-- 사용자는 자신의 알림 상태(읽음 등)만 수정할 수 있습니다
CREATE POLICY "Users can update own notifications" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = user_id);

-- 사용자는 자신의 알림만 삭제할 수 있습니다
CREATE POLICY "Users can delete own notifications" 
    ON public.notifications FOR DELETE 
    USING (auth.uid() = user_id);

-- 4. 업데이트 트리거 설정 (updated_at)
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_modtime
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
