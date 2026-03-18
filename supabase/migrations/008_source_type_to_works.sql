-- ============================================================
-- Migration 008: Move source_type from extract tags to works table
-- ============================================================
-- Source types (Published Book, Letter, etc.) describe the whole
-- work, not individual passages. This migration:
--   1. Adds a source_type column to works
--   2. Backfills it from existing extract_tags
--   3. Cleans up source_type tags from tags & extract_tags
-- ============================================================

-- 1. Add source_type column to works
ALTER TABLE works ADD COLUMN IF NOT EXISTS source_type TEXT;

-- 2. Backfill: for each work, find the most-used source_type tag
--    across its extracts and write that as the work's source_type.
UPDATE works w
SET source_type = sub.tag_name
FROM (
    SELECT DISTINCT ON (e.work_id)
        e.work_id,
        t.name AS tag_name,
        COUNT(*) AS cnt
    FROM extracts e
    JOIN extract_tags et ON et.extract_id = e.id
    JOIN tags t ON t.id = et.tag_id AND t.tag_type = 'source_type'
    GROUP BY e.work_id, t.name
    ORDER BY e.work_id, cnt DESC
) sub
WHERE w.id = sub.work_id;

-- 3. Remove all source_type extract_tags
DELETE FROM extract_tags
WHERE tag_id IN (SELECT id FROM tags WHERE tag_type = 'source_type');

-- 4. Remove source_type tags from the tags table
DELETE FROM tags WHERE tag_type = 'source_type';
