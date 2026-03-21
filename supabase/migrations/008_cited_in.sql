-- 008: Add cited_in field to extracts
-- Records which secondary sources quote or discuss this passage
ALTER TABLE extracts ADD COLUMN IF NOT EXISTS cited_in TEXT;
