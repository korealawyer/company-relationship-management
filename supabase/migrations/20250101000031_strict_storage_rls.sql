-- 031_strict_storage_rls.sql

-- XSS 공격 방어 및 사이즈 제한 (5MB) 적용
-- 대상 버킷: 'documents' 및 'signatures' (각 버킷의 용도에 따라 유동적으로 수정 가능)
UPDATE storage.buckets
SET allowed_mime_types = array['application/pdf']::text[],
    file_size_limit = 5242880
WHERE id IN ('documents', 'signatures');
