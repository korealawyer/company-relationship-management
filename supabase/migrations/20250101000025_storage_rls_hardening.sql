-- Migration: 028_storage_rls_hardening
-- Purpose: Size & Type constraints on the documents storage bucket.
-- Prevents abuse and bucket exhaustion.

UPDATE storage.buckets
SET 
    -- Set max file size to 10MB (10 * 1024 * 1024 bytes)
    file_size_limit = 10485760, 
    
    -- Restrict allowed mime types
    allowed_mime_types = ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
    ]
WHERE id = 'documents';
