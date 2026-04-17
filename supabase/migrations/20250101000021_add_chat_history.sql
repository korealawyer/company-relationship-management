-- Add chat_history to consultations table
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS chat_history jsonb;
