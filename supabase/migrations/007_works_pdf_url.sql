-- Migration: Add pdf_url to works table
-- This allows associating uploaded PDF files with works for the extract workflow

ALTER TABLE works ADD COLUMN IF NOT EXISTS pdf_url TEXT;

COMMENT ON COLUMN works.pdf_url IS 'URL of the uploaded PDF stored in Supabase Storage';
