-- Migration: 031_storage_mime_types
-- Purpose: add missing text and hwp mime types

UPDATE storage.buckets
SET 
    allowed_mime_types = ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'text/plain',
        'application/haansofthwp',
        'application/x-hwp',
        'application/hwpx'
    ]
WHERE id = 'documents';
