-- Create 'signatures' bucket for Lawyer profile signature uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Grant public read access to 'signatures' bucket
CREATE POLICY "Public read access for signatures"
ON storage.objects FOR SELECT
USING ( bucket_id = 'signatures' );

-- Grant public insert access to 'signatures' bucket
CREATE POLICY "Public insert access for signatures"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'signatures' );

-- Grant public update access to 'signatures' bucket
CREATE POLICY "Public update access for signatures"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'signatures' )
WITH CHECK ( bucket_id = 'signatures' );
