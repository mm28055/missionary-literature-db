-- site_pages: stores editable page content (About, etc.)
CREATE TABLE IF NOT EXISTS site_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,           -- e.g. 'about'
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',     -- main body text (supports simple markdown/paragraphs)
    meta_description TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with current About page content
INSERT INTO site_pages (slug, title, content, meta_description) VALUES (
    'about',
    'About This Project',
    'The Missionary Literature Database is a digital humanities project that creates a searchable archive of 19th-century Christian missionary writings about India and Hinduism.

## Purpose

During the 19th century, Christian missionaries from various denominations produced an enormous body of literature about India — its religions, customs, social structures, and peoples. These writings, while shaped by the biases and assumptions of their time, constitute a significant primary source for understanding colonial-era encounters between Christianity and Hinduism.

This database aims to make selected extracts from these writings accessible to researchers, students, and anyone interested in the history of religious encounters in colonial India.

## What You''ll Find

- Curated extracts from missionary letters, reports, books, and pamphlets
- Biographical information about the missionaries
- Bibliographic data for the original works
- Thematic tags for easy discovery and cross-referencing
- Full-text search across all extracts
- Filtering by denomination, period, region, and topic

## Scope

The database focuses primarily on 19th-century writings (c. 1793–1900), spanning the period from William Carey''s arrival in India to the end of the Victorian era. It covers missionaries from major Protestant denominations including Baptist, Methodist, Anglican, Presbyterian, Congregationalist, and Lutheran traditions.

## Methodology

Extracts are selected for their historical significance and illustrative value. Each extract is tagged with relevant themes and linked to its source work and author. The database is not exhaustive but aims to be representative of the range of missionary perspectives on India and Hinduism.',
    'Learn about the Missionary Literature Database project, its goals, methodology, and scope.'
);

-- Enable RLS
ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public can read pages" ON site_pages FOR SELECT USING (true);

-- Authenticated users can update
CREATE POLICY "Authenticated can manage pages" ON site_pages FOR ALL USING (auth.role() = 'authenticated');
