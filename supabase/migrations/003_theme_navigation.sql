-- ============================================================
-- Migration 003: Theme Navigation Support
-- ============================================================
-- Adds slug and introduction fields to tags table
-- for theme-first URL routing and scholarly introductions.
-- ============================================================

-- Slug for URL routing (e.g., /themes/hinduism)
ALTER TABLE tags ADD COLUMN slug TEXT UNIQUE;

-- Full scholarly introduction (longer essay, separate from short description)
ALTER TABLE tags ADD COLUMN introduction TEXT;

-- Index for slug lookups
CREATE INDEX idx_tags_slug ON tags(slug);

-- ============================================================
-- Seed slugs for existing parent themes
-- ============================================================

UPDATE tags SET slug = 'hinduism' WHERE name = 'Hinduism' AND parent_id IS NULL;
UPDATE tags SET slug = 'caste' WHERE name = 'Caste' AND parent_id IS NULL;
UPDATE tags SET slug = 'the-brahmin' WHERE name = 'The Brahmin' AND parent_id IS NULL;
UPDATE tags SET slug = 'conversion-discourse' WHERE name = 'Conversion Discourse' AND parent_id IS NULL;
UPDATE tags SET slug = 'the-civilizing-mission' WHERE name = 'The Civilizing Mission' AND parent_id IS NULL;
UPDATE tags SET slug = 'atrocity-literature' WHERE name = 'Atrocity Literature' AND parent_id IS NULL;

-- ============================================================
-- Seed slugs for sub-themes under Hinduism
-- ============================================================

UPDATE tags SET slug = 'construction-of-hinduism' WHERE name = 'The Construction of "Hinduism"';
UPDATE tags SET slug = 'idolatry-image-worship' WHERE name = 'Idolatry & Image Worship';
UPDATE tags SET slug = 'polytheism-vs-monotheism' WHERE name = 'Polytheism vs. Monotheism';
UPDATE tags SET slug = 'superstition-irrationality' WHERE name = 'Superstition & Irrationality';
UPDATE tags SET slug = 'hindu-scriptures-canon' WHERE name = 'Hindu Scriptures & Canon';
UPDATE tags SET slug = 'karma-fatalism' WHERE name = 'Karma & Fatalism';

-- ============================================================
-- Seed slugs for sub-themes under Caste
-- ============================================================

UPDATE tags SET slug = 'caste-intrinsic-to-hinduism' WHERE name = 'Caste as Intrinsic to Hinduism';
UPDATE tags SET slug = 'caste-is-hinduism' WHERE name = 'Caste IS Hinduism';
UPDATE tags SET slug = 'untouchability-hindu-sin' WHERE name = 'Untouchability as Hindu Sin';
UPDATE tags SET slug = 'missionary-ethnography-caste' WHERE name = 'Missionary Ethnography of Caste';
UPDATE tags SET slug = 'varna-jati-conflation' WHERE name = 'Varna-Jati Conflation';
UPDATE tags SET slug = 'caste-impediment-conversion' WHERE name = 'Caste as Impediment to Conversion';

-- ============================================================
-- Seed slugs for sub-themes under The Brahmin
-- ============================================================

UPDATE tags SET slug = 'brahmin-religious-fraud' WHERE name = 'Brahmin as Religious Fraud';
UPDATE tags SET slug = 'brahmin-intellectual-antagonist' WHERE name = 'Brahmin as Intellectual Antagonist';
UPDATE tags SET slug = 'brahmin-social-oppressor' WHERE name = 'Brahmin as Social Oppressor';
UPDATE tags SET slug = 'brahmin-knowledge-gatekeeper' WHERE name = 'Brahmin as Knowledge Gatekeeper';
UPDATE tags SET slug = 'brahmin-moral-character' WHERE name = 'Brahmin Moral Character';
UPDATE tags SET slug = 'brahminism-real-enemy' WHERE name = '"Brahminism" as the Real Enemy';
UPDATE tags SET slug = 'brahmin-obstacle-conversion' WHERE name = 'Brahmin as Obstacle to Conversion';

-- ============================================================
-- Seed slugs for sub-themes under Conversion Discourse
-- ============================================================

UPDATE tags SET slug = 'heathen-damnation' WHERE name = 'Heathen Damnation';
UPDATE tags SET slug = 'conversion-narratives' WHERE name = 'Conversion Narratives';
UPDATE tags SET slug = 'religion-individual-choice' WHERE name = 'Religion as Individual Choice';
UPDATE tags SET slug = 'material-inducement' WHERE name = 'Material Inducement';
UPDATE tags SET slug = 'religious-demography-weapon' WHERE name = 'Religious Demography as Weapon';
UPDATE tags SET slug = 'failure-of-conversion' WHERE name = 'The "Failure" of Conversion';

-- ============================================================
-- Seed slugs for sub-themes under The Civilizing Mission
-- ============================================================

UPDATE tags SET slug = 'moral-character-indians' WHERE name = 'Moral Character of Indians';
UPDATE tags SET slug = 'civilizational-hierarchy' WHERE name = 'Civilizational Hierarchy';
UPDATE tags SET slug = 'education-civilizing-tool' WHERE name = 'Education as Civilizing Tool';
UPDATE tags SET slug = 'science-vs-hindu-knowledge' WHERE name = 'Science vs. Hindu Knowledge';
UPDATE tags SET slug = 'internalization-inferiority' WHERE name = 'The Internalization of Inferiority';

-- ============================================================
-- Seed slugs for sub-themes under Atrocity Literature
-- ============================================================

UPDATE tags SET slug = 'sati-widow-burning' WHERE name = 'Sati / Widow Burning';
UPDATE tags SET slug = 'juggernaut-myth' WHERE name = 'The Juggernaut Myth';
UPDATE tags SET slug = 'hook-swinging-self-mortification' WHERE name = 'Hook-Swinging & Self-Mortification';
UPDATE tags SET slug = 'infanticide' WHERE name = 'Infanticide';
UPDATE tags SET slug = 'child-marriage' WHERE name = 'Child Marriage';
UPDATE tags SET slug = 'devadasi-temple-prostitution' WHERE name = 'Devadasi / "Temple Prostitution"';
UPDATE tags SET slug = 'human-sacrifice-allegations' WHERE name = 'Human Sacrifice Allegations';

-- ============================================================
-- Seed slugs for strategies (tag_type = 'strategy')
-- ============================================================

UPDATE tags SET slug = 'moralizing-discourse' WHERE name = 'Moralizing Discourse';
UPDATE tags SET slug = 'civilizational-comparison' WHERE name = 'Civilizational Comparison';
UPDATE tags SET slug = 'biblical-framing' WHERE name = 'Biblical Framing';
UPDATE tags SET slug = 'humanitarian-appeal' WHERE name = 'Humanitarian Appeal';
UPDATE tags SET slug = 'ethnographic-observation' WHERE name = 'Ethnographic Observation';
UPDATE tags SET slug = 'triumphalist-narrative' WHERE name = 'Triumphalist Narrative';
UPDATE tags SET slug = 'heathen-darkness-metaphor' WHERE name = 'Heathen Darkness Metaphor';

-- ============================================================
-- Seed slugs for source types (tag_type = 'source_type')
-- ============================================================

UPDATE tags SET slug = 'letter-to-mission-society' WHERE name = 'Letter to Missionary Society';
UPDATE tags SET slug = 'published-book' WHERE name = 'Published Book';
UPDATE tags SET slug = 'tract-indian-distribution' WHERE name = 'Tract for Indian Distribution';
UPDATE tags SET slug = 'official-institutional-report' WHERE name = 'Official / Institutional Report';
UPDATE tags SET slug = 'private-diary-journal' WHERE name = 'Private Diary / Journal';
UPDATE tags SET slug = 'periodical-magazine-article' WHERE name = 'Periodical / Magazine Article';
