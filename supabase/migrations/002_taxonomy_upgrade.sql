-- ============================================================
-- Migration 002: Hierarchical Thematic Taxonomy
-- ============================================================
-- Upgrades the flat tag system to a parent-child hierarchy.
-- Adds extract layers (missionary/bureaucratic/reform),
-- commentary fields, and cross-linking between extracts.
-- ============================================================

-- ============================================================
-- 1. MODIFY TAGS TABLE — add hierarchy and tag types
-- ============================================================

-- Add parent reference for hierarchy (NULL = top-level parent theme)
ALTER TABLE tags ADD COLUMN parent_id UUID REFERENCES tags(id) ON DELETE CASCADE;

-- Add description for scholarly context
ALTER TABLE tags ADD COLUMN description TEXT;

-- Add tag_type to distinguish themes from strategies and source types
-- Values: 'theme', 'strategy', 'source_type'
ALTER TABLE tags ADD COLUMN tag_type TEXT DEFAULT 'theme';

-- Drop the old flat category column
ALTER TABLE tags DROP COLUMN IF EXISTS category;

-- Index for efficiently querying children of a parent
CREATE INDEX idx_tags_parent ON tags(parent_id);
CREATE INDEX idx_tags_type ON tags(tag_type);

-- ============================================================
-- 2. MODIFY EXTRACTS TABLE — add layer and commentary
-- ============================================================

-- Layer identifies where in the causal chain: missionary → bureaucratic → reform
ALTER TABLE extracts ADD COLUMN layer TEXT DEFAULT 'missionary';

-- Scholarly commentary for each extract
ALTER TABLE extracts ADD COLUMN commentary TEXT;

-- Make work_id optional (reform/bureaucratic extracts may not come from missionary works)
-- Already nullable, so no change needed

-- Index on layer for filtering
CREATE INDEX idx_extracts_layer ON extracts(layer);

-- ============================================================
-- 3. MODIFY WORKS TABLE — support non-missionary sources
-- ============================================================

-- Add generic author field for non-missionary works (census reports, reform texts)
ALTER TABLE works ADD COLUMN author TEXT;

-- Add layer to indicate what kind of source work this is
ALTER TABLE works ADD COLUMN layer TEXT DEFAULT 'missionary';

-- Make missionary_id optional (already nullable via ON DELETE SET NULL behavior)
-- But let's make the constraint explicit for non-missionary works
-- (it's already nullable from the CASCADE DELETE, so no change needed)

-- ============================================================
-- 4. CREATE EXTRACT_LINKS TABLE — cross-referencing across layers
-- ============================================================

CREATE TABLE extract_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_extract_id UUID NOT NULL REFERENCES extracts(id) ON DELETE CASCADE,
  target_extract_id UUID NOT NULL REFERENCES extracts(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL DEFAULT 'influenced',
    -- Values: 'influenced', 'adopted', 'codified', 'reacted_to'
  commentary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_extract_id, target_extract_id)
);

CREATE INDEX idx_extract_links_source ON extract_links(source_extract_id);
CREATE INDEX idx_extract_links_target ON extract_links(target_extract_id);

-- RLS for extract_links
ALTER TABLE extract_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read extract_links" ON extract_links FOR SELECT USING (true);
CREATE POLICY "Auth insert extract_links" ON extract_links FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update extract_links" ON extract_links FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete extract_links" ON extract_links FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- 5. CLEAR OLD SEED TAGS & SEED NEW TAXONOMY
-- ============================================================

-- Remove old flat tags (and their extract_tags associations)
DELETE FROM extract_tags;
DELETE FROM tags;

-- ============================================================
-- 5a. PARENT THEMES (tag_type = 'theme', parent_id = NULL)
-- ============================================================

INSERT INTO tags (id, name, description, tag_type, parent_id) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Hinduism',
   'The missionary construction of Hindu religion — its beliefs, practices, and institutions. Missionaries created "Hinduism" as a single religion in the Protestant mold, then found it inferior by those alien standards.',
   'theme', NULL),

  ('10000000-0000-0000-0000-000000000002', 'Caste',
   'The missionary understanding of caste as a religious institution inseparable from Hinduism, with consequences for how caste was legislated. politicized, and understood.',
   'theme', NULL),

  ('10000000-0000-0000-0000-000000000003', 'The Brahmin',
   'The missionary''s primary antagonist. A sustained, multi-dimensional attack on Brahmins and Brahminical authority that went far beyond caste critique.',
   'theme', NULL),

  ('10000000-0000-0000-0000-000000000004', 'Conversion Discourse',
   'The conceptual framework missionaries imposed through their conversion discourse — Protestant ideas about religion alien to Indian civilization.',
   'theme', NULL),

  ('10000000-0000-0000-0000-000000000005', 'The Civilizing Mission',
   'The broader missionary claim to be agents of civilization — the characterological critique of Indians and the proposition that India needs Christian modernity.',
   'theme', NULL),

  ('10000000-0000-0000-0000-000000000006', 'Atrocity Literature',
   'Sensationalized, decontextualized descriptions of Indian practices designed to shock Western audiences. The most potent fundraising and propaganda tool.',
   'theme', NULL);

-- ============================================================
-- 5b. SUB-THEMES under Hinduism
-- ============================================================

INSERT INTO tags (name, description, tag_type, parent_id) VALUES
  ('The Construction of "Hinduism"',
   'Missionaries created a single unified entity called "Hinduism" from diverse traditions, modeled on Protestant Christianity.',
   'theme', '10000000-0000-0000-0000-000000000001'),

  ('Idolatry & Image Worship',
   'The central critique — murti puja as "idol worship." The most voluminous category of missionary writing on India.',
   'theme', '10000000-0000-0000-0000-000000000001'),

  ('Polytheism vs. Monotheism',
   '"Hindus worship 330 million gods" — Hinduism as the antithesis of Christian monotheism.',
   'theme', '10000000-0000-0000-0000-000000000001'),

  ('Superstition & Irrationality',
   'Hindu practices as "blind faith," "delusion," incompatible with reason.',
   'theme', '10000000-0000-0000-0000-000000000001'),

  ('Hindu Scriptures & Canon',
   'Missionaries selectively elevated Hindu texts, creating a "Hindu Bible" modeled on Christian scripture.',
   'theme', '10000000-0000-0000-0000-000000000001'),

  ('Karma & Fatalism',
   'Karma reframed as passive acceptance of suffering — "Hindus accept their lot because they believe they deserve it."',
   'theme', '10000000-0000-0000-0000-000000000001');

-- ============================================================
-- 5c. SUB-THEMES under Caste
-- ============================================================

INSERT INTO tags (name, description, tag_type, parent_id) VALUES
  ('Caste as Intrinsic to Hinduism',
   'The claim that caste is not a social phenomenon but a religious one — inseparable from Hindu theology.',
   'theme', '10000000-0000-0000-0000-000000000002'),

  ('Caste IS Hinduism',
   'The stronger claim: you cannot reform caste while remaining Hindu. To abolish caste, you must leave Hinduism.',
   'theme', '10000000-0000-0000-0000-000000000002'),

  ('Untouchability as Hindu Sin',
   'Descriptions of untouchable suffering, framed as evidence of Hindu moral failure.',
   'theme', '10000000-0000-0000-0000-000000000002'),

  ('Missionary Ethnography of Caste',
   'Detailed descriptions of caste interactions presented as "data" but filtered through Protestant horror.',
   'theme', '10000000-0000-0000-0000-000000000002'),

  ('Varna-Jati Conflation',
   'Reduction of thousands of contextual jatis into a rigid four-tier "caste system."',
   'theme', '10000000-0000-0000-0000-000000000002'),

  ('Caste as Impediment to Conversion',
   'The missionary frustration that caste bonds made conversion nearly impossible. Critiqued caste because it blocked their agenda.',
   'theme', '10000000-0000-0000-0000-000000000002');

-- ============================================================
-- 5d. SUB-THEMES under The Brahmin
-- ============================================================

INSERT INTO tags (name, description, tag_type, parent_id) VALUES
  ('Brahmin as Religious Fraud',
   '"Priestcraft" — the Brahmin exploits the masses through meaningless ritual and superstition for personal profit.',
   'theme', '10000000-0000-0000-0000-000000000003'),

  ('Brahmin as Intellectual Antagonist',
   'The Brahmin who debates the missionary, knows Sanskrit, refuses to be convinced.',
   'theme', '10000000-0000-0000-0000-000000000003'),

  ('Brahmin as Social Oppressor',
   'The Brahmin who enforces caste, prevents inter-dining, maintains social hierarchy through religious sanction.',
   'theme', '10000000-0000-0000-0000-000000000003'),

  ('Brahmin as Knowledge Gatekeeper',
   'Hoarding Sanskrit, denying education to lower castes, maintaining mass ignorance as a tool of control.',
   'theme', '10000000-0000-0000-0000-000000000003'),

  ('Brahmin Moral Character',
   '"Deceitful," "cunning," "proud," "avaricious" — systematic character assassination over decades of writing.',
   'theme', '10000000-0000-0000-0000-000000000003'),

  ('"Brahminism" as the Real Enemy',
   'The invention of "Brahminism" as distinct from Hinduism — the religion is corrupted, not inherently bad; the Brahmins are the problem.',
   'theme', '10000000-0000-0000-0000-000000000003'),

  ('Brahmin as Obstacle to Conversion',
   'Brahmins prevent lower-caste conversion through social pressure, intellectual argument, and community control.',
   'theme', '10000000-0000-0000-0000-000000000003');

-- ============================================================
-- 5e. SUB-THEMES under Conversion Discourse
-- ============================================================

INSERT INTO tags (name, description, tag_type, parent_id) VALUES
  ('Heathen Damnation',
   '"Without Christ, these people are eternally lost." The foundational claim that non-Christian religions are insufficient.',
   'theme', '10000000-0000-0000-0000-000000000004'),

  ('Conversion Narratives',
   'The darkness-to-light template. Formulaic testimonies: "I was lost in idol worship, then I found Christ."',
   'theme', '10000000-0000-0000-0000-000000000004'),

  ('Religion as Individual Choice',
   'The Protestant axiom that religion is a private, individual decision — "freedom of conscience."',
   'theme', '10000000-0000-0000-0000-000000000004'),

  ('Material Inducement',
   'Schools, hospitals, orphanages as conversion infrastructure. The "rice Christian" debate.',
   'theme', '10000000-0000-0000-0000-000000000004'),

  ('Religious Demography as Weapon',
   'Obsession with counting converts leading to census categories and religion as population percentage.',
   'theme', '10000000-0000-0000-0000-000000000004'),

  ('The "Failure" of Conversion',
   'Missionary frustration that India resisted conversion — which fed back into intensified hostility in all other themes.',
   'theme', '10000000-0000-0000-0000-000000000004');

-- ============================================================
-- 5f. SUB-THEMES under The Civilizing Mission
-- ============================================================

INSERT INTO tags (name, description, tag_type, parent_id) VALUES
  ('Moral Character of Indians',
   '"Lying," "deceit," "sensuality," "cowardice" — systematic characterological critique applied to Indians as a people.',
   'theme', '10000000-0000-0000-0000-000000000005'),

  ('Civilizational Hierarchy',
   'India as a fallen, degraded, backward civilization compared to Christian Europe.',
   'theme', '10000000-0000-0000-0000-000000000005'),

  ('Education as Civilizing Tool',
   'Missionary arguments for English/Western education as moral transformation, not just learning.',
   'theme', '10000000-0000-0000-0000-000000000005'),

  ('Science vs. Hindu Knowledge',
   '"Science" deployed as fundamentally incompatible with Hindu worldview — a weapon, not a neutral pursuit.',
   'theme', '10000000-0000-0000-0000-000000000005'),

  ('The Internalization of Inferiority',
   'Descriptions of Indians who agreed with missionary assessments — the mechanism of colonial subjectivity itself.',
   'theme', '10000000-0000-0000-0000-000000000005');

-- ============================================================
-- 5g. SUB-THEMES under Atrocity Literature
-- ============================================================

INSERT INTO tags (name, description, tag_type, parent_id) VALUES
  ('Sati / Widow Burning',
   'The paradigmatic atrocity text — reprinted, illustrated, and circulated endlessly as proof of Hindu barbarism.',
   'theme', '10000000-0000-0000-0000-000000000006'),

  ('The Juggernaut Myth',
   'Devotees allegedly throwing themselves under Jagannath temple car wheels. Largely fabricated.',
   'theme', '10000000-0000-0000-0000-000000000006'),

  ('Hook-Swinging & Self-Mortification',
   'Sensationalized descriptions of physical pain in devotional practice.',
   'theme', '10000000-0000-0000-0000-000000000006'),

  ('Infanticide',
   'Accounts of female infanticide, often exaggerated in scope.',
   'theme', '10000000-0000-0000-0000-000000000006'),

  ('Child Marriage',
   'Marriage of minors framed as sexual predation by missionaries.',
   'theme', '10000000-0000-0000-0000-000000000006'),

  ('Devadasi / "Temple Prostitution"',
   'Temple dancers reframed as sex workers; a deliberate distortion of a complex institution.',
   'theme', '10000000-0000-0000-0000-000000000006'),

  ('Human Sacrifice Allegations',
   'Often alleged among tribal populations, rarely substantiated with evidence.',
   'theme', '10000000-0000-0000-0000-000000000006');

-- ============================================================
-- 5h. DISCURSIVE STRATEGIES (tag_type = 'strategy')
-- ============================================================

INSERT INTO tags (name, description, tag_type, parent_id) VALUES
  ('Moralizing Discourse',
   '"This is sinful / wicked / abominable" — direct moral condemnation using Protestant standards as universal.',
   'strategy', NULL),

  ('Civilizational Comparison',
   '"In England we... but in India they..." — systematic positioning of India as inferior.',
   'strategy', NULL),

  ('Biblical Framing',
   'Using Christian scripture to condemn Hindu practices — imposing Christian categories on non-Christian phenomena.',
   'strategy', NULL),

  ('Humanitarian Appeal',
   '"These poor suffering people" — weaponized sympathy; the "white savior" template.',
   'strategy', NULL),

  ('Ethnographic Observation',
   'Quasi-neutral "I witnessed..." descriptions — the appearance of objectivity masking predetermined conclusions.',
   'strategy', NULL),

  ('Triumphalist Narrative',
   '"Christianity is winning / the old order is crumbling" — progress rhetoric; the inevitability claim.',
   'strategy', NULL),

  ('Heathen Darkness Metaphor',
   'India as darkness, Christianity as light — the governing metaphor. Secular variant: tradition as darkness, modernity as light.',
   'strategy', NULL);

-- ============================================================
-- 5i. SOURCE TYPES (tag_type = 'source_type')
-- ============================================================

INSERT INTO tags (name, description, tag_type, parent_id) VALUES
  ('Letter to Missionary Society',
   'Written to justify funding; incentive to exaggerate "heathen darkness."',
   'source_type', NULL),

  ('Published Book',
   'Shaped European/American opinion about India.',
   'source_type', NULL),

  ('Tract for Indian Distribution',
   'Direct propaganda aimed at potential converts.',
   'source_type', NULL),

  ('Official / Institutional Report',
   'Bureaucratic language; fed directly into colonial policy.',
   'source_type', NULL),

  ('Private Diary / Journal',
   'Potentially more candid; exposes bad faith when compared to public performances.',
   'source_type', NULL),

  ('Periodical / Magazine Article',
   'Mass media propaganda; shaped popular Western imagination.',
   'source_type', NULL);

-- ============================================================
-- 6. SEED SAMPLE MISSIONARIES & WORKS
-- ============================================================

-- Sample missionaries (if not already existing)
INSERT INTO missionaries (id, name, bio, birth_year, death_year, denomination_id) VALUES
  ('20000000-0000-0000-0000-000000000001',
   'William Ward',
   'English Baptist missionary, member of the Serampore Trio. Authored influential works on Hindu society.',
   1769, 1823,
   (SELECT id FROM denominations WHERE name = 'Baptist')),

  ('20000000-0000-0000-0000-000000000002',
   'Alexander Duff',
   'Scottish Presbyterian missionary and educator. Pioneered English-language education as a tool of conversion in Calcutta.',
   1806, 1878,
   (SELECT id FROM denominations WHERE name = 'Presbyterian')),

  ('20000000-0000-0000-0000-000000000003',
   'Charles Grant',
   'British politician and evangelical. His "Observations" became the foundational text for missionary access to India.',
   1746, 1823,
   (SELECT id FROM denominations WHERE name = 'Anglican')),

  ('20000000-0000-0000-0000-000000000004',
   'Claudius Buchanan',
   'Anglican chaplain in India. His sensational descriptions of Jagannath and sati became bestsellers in Britain.',
   1766, 1815,
   (SELECT id FROM denominations WHERE name = 'Anglican')),

  ('20000000-0000-0000-0000-000000000005',
   'William Carey',
   'English Baptist missionary, founder of the Serampore Mission. Called "the father of modern missions."',
   1761, 1834,
   (SELECT id FROM denominations WHERE name = 'Baptist'))
ON CONFLICT (id) DO NOTHING;

-- Sample works
INSERT INTO works (id, title, year_published, publisher, bibliographic_info, missionary_id, layer) VALUES
  ('30000000-0000-0000-0000-000000000001',
   'A View of the History, Literature, and Mythology of the Hindoos',
   1822, 'Serampore Mission Press',
   'First published 1811; expanded 4-volume edition 1822. One of the most influential missionary ethnographies.',
   '20000000-0000-0000-0000-000000000001', 'missionary'),

  ('30000000-0000-0000-0000-000000000002',
   'India and India Missions',
   1839, 'John Johnstone, Edinburgh',
   'Duff''s major work arguing for English education as the key to the conversion of India.',
   '20000000-0000-0000-0000-000000000002', 'missionary'),

  ('30000000-0000-0000-0000-000000000003',
   'Observations on the State of Society among the Asiatic Subjects of Great Britain',
   1792, 'Privately circulated; published 1797',
   'The foundational text arguing that British rule has a duty to bring Christianity to India. Influenced the 1813 Charter Act.',
   '20000000-0000-0000-0000-000000000003', 'missionary'),

  ('30000000-0000-0000-0000-000000000004',
   'Christian Researches in Asia',
   1811, 'T. Cadell and W. Davies, London',
   'A bestseller describing the "horrors" of Indian religion, including the Juggernaut and sati. Went through multiple editions.',
   '20000000-0000-0000-0000-000000000004', 'missionary'),

  ('30000000-0000-0000-0000-000000000005',
   'An Enquiry into the Obligations of Christians to use Means for the Conversion of the Heathens',
   1792, 'Ann Ireland, Leicester',
   'Carey''s foundational text arguing for organized missionary work. The document that launched the modern missionary movement.',
   '20000000-0000-0000-0000-000000000005', 'missionary')
ON CONFLICT (id) DO NOTHING;

-- Non-missionary works for cross-linking
INSERT INTO works (id, title, year_published, author, bibliographic_info, layer) VALUES
  ('30000000-0000-0000-0000-000000000006',
   'Census of India, 1871-72: General Report',
   1872, 'Government of India',
   'The first systematic all-India census. Codified caste and religious categories that missionaries had defined.',
   'bureaucratic'),

  ('30000000-0000-0000-0000-000000000007',
   'Gulamgiri (Slavery)',
   1873, 'Jotirao Phule',
   'Phule''s seminal anti-caste text, dedicated to American abolitionists. Directly adopted missionary anti-Brahmin discourse.',
   'reform')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. SEED SAMPLE EXTRACTS
-- ============================================================

-- Extract 1: Ward on Hindu polytheism (Hinduism > Polytheism)
INSERT INTO extracts (id, content, source_reference, work_id, layer, commentary) VALUES
  ('40000000-0000-0000-0000-000000000001',
   'The Hindus have thirty-three millions of gods, and yet they are not satisfied. They are continually adding to the number. They deify everything — rivers, mountains, trees, animals, and even the implements of husbandry.',
   'Vol. I, Introduction',
   '30000000-0000-0000-0000-000000000001',
   'missionary',
   'Ward imposes the Protestant category of "god" (a supreme being to be worshipped exclusively) onto devatas, tirthas, and sacred sites that function entirely differently in Hindu practice. The number "thirty-three millions" — a mistranslation of the Vedic "thirty-three" (trayastrimshat) — became one of the most repeated missionary tropes, still used today.');

-- Extract 2: Duff on caste as barrier to conversion
INSERT INTO extracts (id, content, source_reference, work_id, layer, commentary) VALUES
  ('40000000-0000-0000-0000-000000000002',
   'The caste system is the great barrier to the progress of Christianity in India. It pervades all Hindu society, and separates man from man with a rigidity which no other institution in the world can parallel. So long as caste stands, Christianity cannot make real progress.',
   'Chapter VII, p. 215',
   '30000000-0000-0000-0000-000000000002',
   'missionary',
   'Duff explicitly identifies caste as an impediment to conversion — not critiquing caste for the suffering it causes, but for the way it blocks his evangelical agenda. The social bonds of jati prevent individual conversion because a convert faces total community expulsion. This instrumental motive is the unspoken truth behind most missionary caste critique.');

-- Extract 3: Grant on Hindu moral character
INSERT INTO extracts (id, content, source_reference, work_id, layer, commentary) VALUES
  ('40000000-0000-0000-0000-000000000003',
   'The Hindoos err, because they are ignorant; and their errors have never fairly been laid before them. The communication of our light and knowledge to them would prove the best remedy for their disorders; and this remedy is proposed from a full conviction that if judiciously and patiently applied, it would have great and happy effects upon them — effects honourable and advantageous for us.',
   'Part I, Section III',
   '30000000-0000-0000-0000-000000000003',
   'missionary',
   'Grant''s "Observations" (1792) is the foundational text of the civilizing mission. Notice the structure: Indians "err" because of ignorance (not malice), and "our light and knowledge" is the cure. This is the template that Nehruvian modernism would later secularize — India is backward because of ignorance, and Western-style education/science is the remedy.');

-- Extract 4: Buchanan on the Juggernaut
INSERT INTO extracts (id, content, source_reference, work_id, layer, commentary) VALUES
  ('40000000-0000-0000-0000-000000000004',
   'I have returned from witnessing a scene which I shall never forget... The idol called Juggernaut was placed on his throne, a tower about sixty feet in height, moving on wheels. The throne was drawn along by the multitude, and several unhappy wretches threw themselves before the wheels and were crushed to death.',
   'Chapter III',
   '30000000-0000-0000-0000-000000000004',
   'missionary',
   'Buchanan''s "Christian Researches" (1811) was a bestseller that defined the word "juggernaut" in the English language. Modern scholarship has demonstrated that deliberate self-immolation at Jagannath Puri was extremely rare — accidental deaths in the crowd were reframed as intentional human sacrifice. This is atrocity literature at its most effective: a fabrication that became permanent vocabulary.');

-- Extract 5: Carey on heathen darkness
INSERT INTO extracts (id, content, source_reference, work_id, layer, commentary) VALUES
  ('40000000-0000-0000-0000-000000000005',
   'Multitudes of them have perished, and are still perishing in their sins, and that notwithstanding the light of nature, and the remains of Noachic tradition, the heathens are universally given to idolatry, and are as much in a state of perdition as any criminals who deserve the punishment of the divine law.',
   'Section I',
   '30000000-0000-0000-0000-000000000005',
   'missionary',
   'Carey''s founding text establishes the theological premise: all non-Christians are in a "state of perdition" — literal damnation. This is not cultural critique; it is soteriological absolutism. Every missionary who followed was working within this framework: Indian religions are not merely different or inadequate, they lead to eternal punishment.');

-- Extract 6: Ward on Brahmin priestcraft
INSERT INTO extracts (id, content, source_reference, work_id, layer, commentary) VALUES
  ('40000000-0000-0000-0000-000000000006',
   'The Brahmins have, from the earliest ages, claimed the highest rank among men. They have taught that they proceeded from the mouth of God, while the inferior castes sprang from His lower members. By this fraud they have maintained their ascendancy over millions of their fellow creatures.',
   'Vol. II, Chapter I',
   '30000000-0000-0000-0000-000000000001',
   'missionary',
   'Ward frames the Purusha Sukta purely as a Brahminical conspiracy — a "fraud" designed to maintain power. The theological concept of cosmic hierarchy is reduced to a political lie. This reading was adopted almost verbatim by Phule in "Gulamgiri" and became foundational to anti-Brahmin movements. Notice how Ward separates "Brahmins" from "their fellow creatures" — the Brahmin is already being constructed as the oppressor-alien.');

-- Extract 7: Duff on English education as civilizing tool
INSERT INTO extracts (id, content, source_reference, work_id, layer, commentary) VALUES
  ('40000000-0000-0000-0000-000000000007',
   'The English language is the lever by which the edifice of Hinduism must be overturned. Through it, we introduce the youth of India to the sciences of the West, to the history of nations, and above all, to the truths of our holy religion. Once the mind is opened by Western knowledge, the shackles of superstition fall away.',
   'Chapter XII, p. 387',
   '30000000-0000-0000-0000-000000000002',
   'missionary',
   'Duff explicitly states that English education is a conversion tool — the "lever" to overturn Hinduism. This is not education for its own sake but education as subversion. The metaphor of "shackles" and "superstition" falling away through Western knowledge became the foundation of Macaulay''s education policy and persists in the modern Indian assumption that English-medium education equals progress.');

-- Extract 8: Grant on sati
INSERT INTO extracts (id, content, source_reference, work_id, layer, commentary) VALUES
  ('40000000-0000-0000-0000-000000000008',
   'Nothing can exceed the horrid cruelty of this practice. The widow, often but a girl, is led to the funeral pile of her husband, and there, amidst the shouts of the multitude, is consumed in the flames. The Brahmins stand around, chanting their incantations, preventing her escape should she attempt to flee.',
   'Part II, Section V',
   '30000000-0000-0000-0000-000000000003',
   'missionary',
   'The sati passage follows a precise formula: helpless young victim, bloodthirsty crowd, complicit Brahmins. This template was reproduced across hundreds of missionary texts. While sati was real and horrifying, the missionary genre systematically exaggerated its frequency, always placed Brahmins as active enforcers, and presented it as representative of Hindu civilization rather than as a contested practice that many Hindus themselves opposed.');

-- Extract 9: Census 1871 (bureaucratic layer) — linked to Ward on Brahmins
INSERT INTO extracts (id, content, source_reference, work_id, layer, commentary) VALUES
  ('40000000-0000-0000-0000-000000000009',
   'The Brahmins form a priestly class which exercises considerable influence over the religious and social life of the Hindu population. They are the custodians of sacred learning and perform all the principal religious ceremonies.',
   'General Tables, Section III: Caste',
   '30000000-0000-0000-0000-000000000006',
   'bureaucratic',
   'Notice how the census transforms Ward''s moral judgment ("fraud," "ascendancy") into apparently neutral sociological description ("exercises considerable influence," "custodians of sacred learning"). The content is identical — Brahmins control religion — but the census language launders missionary hostility into bureaucratic objectivity. This is the mechanism by which propaganda becomes "data."');

-- Extract 10: Phule on Brahminism (reform layer) — linked to Ward and Census
INSERT INTO extracts (id, content, source_reference, work_id, layer, commentary) VALUES
  ('40000000-0000-0000-0000-000000000010',
   'The Brahmin has been the curse of India. For thousands of years, these cunning men have used religion as a tool to maintain their supremacy over the Shudras and Ati-Shudras. They invented the caste system to keep the masses in subjection.',
   'Chapter III',
   '30000000-0000-0000-0000-000000000007',
   'reform',
   'Phule adopts the missionary anti-Brahmin framework wholesale: Brahmins are "cunning," caste is their "invention," religion is their "tool." Compare with Ward''s nearly identical language. But Phule redirects the argument — not toward Christian conversion, but toward social revolution. The missionary diagnosis survives; only the prescription changes. This is the mechanism of internalization.');

-- ============================================================
-- 8. TAG THE SAMPLE EXTRACTS
-- ============================================================

-- Helper: we need tag IDs. Since sub-themes were auto-generated UUIDs, look them up by name.

-- Extract 1 (Ward polytheism): Hinduism > Polytheism + Moralizing Discourse + Published Book
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000001'::uuid, id FROM tags WHERE name = 'Polytheism vs. Monotheism'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000001'::uuid, id FROM tags WHERE name = 'Idolatry & Image Worship'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000001'::uuid, id FROM tags WHERE name = 'Moralizing Discourse'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000001'::uuid, id FROM tags WHERE name = 'Published Book';

-- Extract 2 (Duff caste): Caste > Impediment to Conversion + Caste as Intrinsic
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000002'::uuid, id FROM tags WHERE name = 'Caste as Impediment to Conversion'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000002'::uuid, id FROM tags WHERE name = 'Caste as Intrinsic to Hinduism'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000002'::uuid, id FROM tags WHERE name = 'Moralizing Discourse'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000002'::uuid, id FROM tags WHERE name = 'Published Book';

-- Extract 3 (Grant moral character): Civilizing Mission > Moral Character + Heathen Darkness
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000003'::uuid, id FROM tags WHERE name = 'Moral Character of Indians'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000003'::uuid, id FROM tags WHERE name = 'Civilizational Hierarchy'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000003'::uuid, id FROM tags WHERE name = 'Heathen Darkness Metaphor'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000003'::uuid, id FROM tags WHERE name = 'Published Book';

-- Extract 4 (Buchanan Juggernaut): Atrocity Lit > Juggernaut Myth
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000004'::uuid, id FROM tags WHERE name = 'The Juggernaut Myth'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000004'::uuid, id FROM tags WHERE name = 'Ethnographic Observation'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000004'::uuid, id FROM tags WHERE name = 'Published Book';

-- Extract 5 (Carey heathen damnation): Conversion > Heathen Damnation
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000005'::uuid, id FROM tags WHERE name = 'Heathen Damnation'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000005'::uuid, id FROM tags WHERE name = 'Heathen Darkness Metaphor'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000005'::uuid, id FROM tags WHERE name = 'Published Book';

-- Extract 6 (Ward on Brahmins): The Brahmin > Religious Fraud + Social Oppressor
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000006'::uuid, id FROM tags WHERE name = 'Brahmin as Religious Fraud'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000006'::uuid, id FROM tags WHERE name = 'Brahmin as Social Oppressor'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000006'::uuid, id FROM tags WHERE name = '"Brahminism" as the Real Enemy'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000006'::uuid, id FROM tags WHERE name = 'Moralizing Discourse'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000006'::uuid, id FROM tags WHERE name = 'Published Book';

-- Extract 7 (Duff education): Civilizing Mission > Education
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000007'::uuid, id FROM tags WHERE name = 'Education as Civilizing Tool'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000007'::uuid, id FROM tags WHERE name = 'Civilizational Comparison'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000007'::uuid, id FROM tags WHERE name = 'Published Book';

-- Extract 8 (Grant sati): Atrocity Literature > Sati
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000008'::uuid, id FROM tags WHERE name = 'Sati / Widow Burning'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000008'::uuid, id FROM tags WHERE name = 'Brahmin as Religious Fraud'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000008'::uuid, id FROM tags WHERE name = 'Humanitarian Appeal'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000008'::uuid, id FROM tags WHERE name = 'Published Book';

-- Extract 9 (Census - bureaucratic): The Brahmin tags
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000009'::uuid, id FROM tags WHERE name = 'Brahmin as Religious Fraud'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000009'::uuid, id FROM tags WHERE name = 'Missionary Ethnography of Caste'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000009'::uuid, id FROM tags WHERE name = 'Official / Institutional Report';

-- Extract 10 (Phule - reform): The Brahmin + Caste
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000010'::uuid, id FROM tags WHERE name = '"Brahminism" as the Real Enemy'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000010'::uuid, id FROM tags WHERE name = 'Brahmin as Social Oppressor'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000010'::uuid, id FROM tags WHERE name = 'Caste IS Hinduism'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000010'::uuid, id FROM tags WHERE name = 'Published Book';

-- ============================================================
-- 9. CREATE CROSS-LINKS between extracts
-- ============================================================

-- Ward (missionary) → Census 1871 (bureaucratic): Brahmin "priestcraft" codified
INSERT INTO extract_links (source_extract_id, target_extract_id, link_type, commentary) VALUES
  ('40000000-0000-0000-0000-000000000006',
   '40000000-0000-0000-0000-000000000009',
   'codified',
   'The census transforms Ward''s moral judgment ("fraud," "ascendancy over millions") into apparently neutral sociological observation ("exercises considerable influence"). The content is identical — Brahmins control religion — but the bureaucratic language strips the missionary hostility, giving it the authority of state data.');

-- Ward (missionary) → Phule (reform): Anti-Brahmin discourse adopted
INSERT INTO extract_links (source_extract_id, target_extract_id, link_type, commentary) VALUES
  ('40000000-0000-0000-0000-000000000006',
   '40000000-0000-0000-0000-000000000010',
   'adopted',
   'Phule adopts Ward''s framework nearly verbatim: Brahmins are "cunning," religion is their "tool," caste is their "invention." The missionary diagnosis survives unchanged; only the prescription changes — Phule argues for social revolution rather than Christian conversion.');

-- Census (bureaucratic) → Phule (reform): Bureaucratic data becomes political argument
INSERT INTO extract_links (source_extract_id, target_extract_id, link_type, commentary) VALUES
  ('40000000-0000-0000-0000-000000000009',
   '40000000-0000-0000-0000-000000000010',
   'influenced',
   'Once the census codified the missionary construction of Brahmin dominance as official data, Phule could cite it as objective evidence rather than missionary opinion. The laundering is complete: missionary propaganda → census category → political fact.');
