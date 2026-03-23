-- ========================================================
-- Table `attendance`
-- Purpose: Records daily attendance and call performance 
--          metrics for the Zero-Trust Briefing System.
-- ========================================================

CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    target_calls INTEGER NOT NULL DEFAULT 80,
    actual_calls INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure only one attendance record per user per day
CREATE UNIQUE INDEX IF NOT EXISTS attendance_user_date_idx ON public.attendance (user_id, date);

-- Optional: Row Level Security (RLS) policies 
-- Assuming standard usage where simple read/write access is tied to the user
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attendance"
    ON public.attendance FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendance"
    ON public.attendance FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance"
    ON public.attendance FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Optional: trigger to automatically set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
