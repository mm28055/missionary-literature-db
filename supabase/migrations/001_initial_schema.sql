-- ============================================================
-- Missionary Literature Database — Initial Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DENOMINATIONS
-- ============================================================
CREATE TABLE denominations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- MISSIONARIES
-- ============================================================
CREATE TABLE missionaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  bio TEXT,
  birth_year INT,
  death_year INT,
  denomination_id UUID REFERENCES denominations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_missionaries_denomination ON missionaries(denomination_id);
CREATE INDEX idx_missionaries_name ON missionaries(name);

-- ============================================================
-- WORKS (books, pamphlets, letters, reports, etc.)
-- ============================================================
CREATE TABLE works (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  year_published INT,
  publisher TEXT,
  bibliographic_info TEXT,
  missionary_id UUID REFERENCES missionaries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_works_missionary ON works(missionary_id);
CREATE INDEX idx_works_year ON works(year_published);

-- ============================================================
-- TAGS (thematic categories)
-- ============================================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT, -- e.g. "Theme", "Region", "Topic"
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- EXTRACTS (the core content — passages from missionary works)
-- ============================================================
CREATE TABLE extracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  source_reference TEXT, -- e.g. "Chapter 3, pp. 45-48"
  notes TEXT,
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_extracts_work ON extracts(work_id);

-- Full-text search index on extract content
ALTER TABLE extracts ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, '') || ' ' || coalesce(notes, ''))) STORED;

CREATE INDEX idx_extracts_fts ON extracts USING GIN(fts);

-- ============================================================
-- EXTRACT_TAGS (many-to-many junction)
-- ============================================================
CREATE TABLE extract_tags (
  extract_id UUID REFERENCES extracts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (extract_id, tag_id)
);

CREATE INDEX idx_extract_tags_tag ON extract_tags(tag_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE denominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE missionaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE extract_tags ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read denominations" ON denominations FOR SELECT USING (true);
CREATE POLICY "Public read missionaries" ON missionaries FOR SELECT USING (true);
CREATE POLICY "Public read works" ON works FOR SELECT USING (true);
CREATE POLICY "Public read tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Public read extracts" ON extracts FOR SELECT USING (true);
CREATE POLICY "Public read extract_tags" ON extract_tags FOR SELECT USING (true);

-- Authenticated write access (admin)
CREATE POLICY "Auth insert denominations" ON denominations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update denominations" ON denominations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete denominations" ON denominations FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth insert missionaries" ON missionaries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update missionaries" ON missionaries FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete missionaries" ON missionaries FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth insert works" ON works FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update works" ON works FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete works" ON works FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth insert tags" ON tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update tags" ON tags FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete tags" ON tags FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth insert extracts" ON extracts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update extracts" ON extracts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete extracts" ON extracts FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth insert extract_tags" ON extract_tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth delete extract_tags" ON extract_tags FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA (sample denominations and tags)
-- ============================================================

INSERT INTO denominations (name, description) VALUES
  ('Baptist', 'Baptist Missionary Society and affiliated organizations'),
  ('Methodist', 'Wesleyan Methodist missions'),
  ('Anglican', 'Church Missionary Society (CMS) and Society for the Propagation of the Gospel (SPG)'),
  ('Presbyterian', 'Scottish and Irish Presbyterian missions'),
  ('Congregationalist', 'London Missionary Society (LMS) and affiliated'),
  ('Lutheran', 'German and Scandinavian Lutheran missions');

INSERT INTO tags (name, category) VALUES
  ('Hinduism', 'Religion'),
  ('Caste', 'Social'),
  ('Conversion', 'Theme'),
  ('Temples', 'Religion'),
  ('Education', 'Theme'),
  ('Women', 'Social'),
  ('Idolatry', 'Theme'),
  ('Scripture Translation', 'Theme'),
  ('Customs & Rituals', 'Culture'),
  ('Brahmins', 'Social'),
  ('Villages', 'Geography'),
  ('Cities', 'Geography'),
  ('Bengal', 'Region'),
  ('Madras', 'Region'),
  ('Bombay', 'Region'),
  ('South India', 'Region'),
  ('North India', 'Region');
