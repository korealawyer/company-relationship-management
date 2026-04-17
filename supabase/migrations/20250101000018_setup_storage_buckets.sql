-- Create 'documents' bucket for Service Request file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create 'legal-templates' bucket (referenced in the template API route)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('legal-templates', 'legal-templates', true)
ON CONFLICT (id) DO NOTHING;

-- Grant public read access to 'documents' bucket
CREATE POLICY "Public read access for documents"
ON storage.objects FOR SELECT
USING ( bucket_id = 'documents' );

-- Grant public insert access to 'documents' bucket (authenticated users if needed, but going with public for simplicity since the bucket is public)
CREATE POLICY "Public insert access for documents"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'documents' );

-- Grant public read access to 'legal-templates' bucket
CREATE POLICY "Public read access for legal-templates"
ON storage.objects FOR SELECT
USING ( bucket_id = 'legal-templates' );
