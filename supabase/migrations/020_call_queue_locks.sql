-- Create call_locks table
CREATE TABLE call_locks (
    company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    locked_at TIMESTAMPTZ DEFAULT NOW(),
    locked_until TIMESTAMPTZ NOT NULL
);

-- Enable RLS
ALTER TABLE call_locks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read call_locks"
    ON call_locks FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert call_locks"
    ON call_locks FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete call_locks"
    ON call_locks FOR DELETE
    TO authenticated
    USING (true);

-- Function to claim a company call
CREATE OR REPLACE FUNCTION claim_company_call(
    p_company_id UUID,
    p_user_id UUID,
    p_user_name TEXT,
    p_lock_minutes INT DEFAULT 30
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_locked_by TEXT;
    v_locked_until TIMESTAMPTZ;
    v_new_locked_until TIMESTAMPTZ;
BEGIN
    -- 1. Delete expired lock if exists for this company
    DELETE FROM call_locks 
    WHERE company_id = p_company_id AND locked_until < NOW();

    -- 2. Calculate new lock expiration time
    v_new_locked_until := NOW() + (p_lock_minutes || ' minutes')::interval;

    -- 3. Try to insert lock
    BEGIN
        INSERT INTO call_locks (company_id, user_id, user_name, locked_until)
        VALUES (p_company_id, p_user_id, p_user_name, v_new_locked_until);
        
        RETURN jsonb_build_object(
            'success', true,
            'locked_until', v_new_locked_until
        );
    EXCEPTION WHEN unique_violation THEN
        -- Lock exists and is not expired
        SELECT user_name, locked_until INTO v_locked_by, v_locked_until 
        FROM call_locks 
        WHERE company_id = p_company_id;
        
        RETURN jsonb_build_object(
            'success', false,
            'locked_by', v_locked_by,
            'locked_until', v_locked_until
        );
    END;
END;
$$;

-- Function to release a company call lock
CREATE OR REPLACE FUNCTION release_company_call(
    p_company_id UUID,
    p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM call_locks 
    WHERE company_id = p_company_id AND user_id = p_user_id;
    
    RETURN '{"success": true}'::jsonb;
END;
$$;

-- Function to get all active locks status
CREATE OR REPLACE FUNCTION get_call_locks_status()
RETURNS SETOF call_locks
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete all expired locks
    DELETE FROM call_locks WHERE locked_until < NOW();
    
    -- Return remaining active locks
    RETURN QUERY SELECT * FROM call_locks;
END;
$$;
