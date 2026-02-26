-- ============================================================
-- Migration 005: Re-tag Extracts & Restore Cross-Links
-- ============================================================
-- Tags the 10 sample extracts with the updated taxonomy
-- and restores cross-links between layers.
-- ============================================================

-- Clear any stale extract_tags and extract_links
DELETE FROM extract_tags;
DELETE FROM extract_links;

-- ============================================================
-- Extract 1: Ward on Hindu polytheism / image worship
-- "The Hindus have thirty-three millions of gods..."
-- ============================================================
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000001'::uuid, id FROM tags WHERE slug = 'image-worship'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000001'::uuid, id FROM tags WHERE slug = 'superstition'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000001'::uuid, id FROM tags WHERE slug = 'moralizing-discourse'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000001'::uuid, id FROM tags WHERE slug = 'published-book';

-- ============================================================
-- Extract 2: Duff on caste as barrier to conversion
-- "The caste system is the great barrier..."
-- ============================================================
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000002'::uuid, id FROM tags WHERE slug = 'caste-impediment-conversion'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000002'::uuid, id FROM tags WHERE slug = 'caste-as-hinduism'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000002'::uuid, id FROM tags WHERE slug = 'caste-totalizing-system'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000002'::uuid, id FROM tags WHERE slug = 'moralizing-discourse'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000002'::uuid, id FROM tags WHERE slug = 'published-book';

-- ============================================================
-- Extract 3: Grant on Hindu moral character
-- "The Hindoos err, because they are ignorant..."
-- ============================================================
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000003'::uuid, id FROM tags WHERE slug = 'moral-character-indians'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000003'::uuid, id FROM tags WHERE slug = 'india-degenerate-civilization'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000003'::uuid, id FROM tags WHERE slug = 'christianity-apex'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000003'::uuid, id FROM tags WHERE slug = 'heathen-darkness-metaphor'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000003'::uuid, id FROM tags WHERE slug = 'published-book';

-- ============================================================
-- Extract 4: Buchanan on the Juggernaut
-- "I have returned from witnessing a scene..."
-- ============================================================
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000004'::uuid, id FROM tags WHERE slug = 'superstition'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000004'::uuid, id FROM tags WHERE slug = 'image-worship'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000004'::uuid, id FROM tags WHERE slug = 'moral-corruption'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000004'::uuid, id FROM tags WHERE slug = 'ethnographic-observation'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000004'::uuid, id FROM tags WHERE slug = 'published-book';

-- ============================================================
-- Extract 5: Carey on heathen darkness
-- "Multitudes of them have perished..."
-- ============================================================
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000005'::uuid, id FROM tags WHERE slug = 'heathen-damnation'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000005'::uuid, id FROM tags WHERE slug = 'heathen-darkness-metaphor'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000005'::uuid, id FROM tags WHERE slug = 'published-book';

-- ============================================================
-- Extract 6: Ward on Brahmin priestcraft
-- "The Brahmins have, from the earliest ages..."
-- ============================================================
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000006'::uuid, id FROM tags WHERE slug = 'brahmins-inventors-caste'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000006'::uuid, id FROM tags WHERE slug = 'brahmin-social-oppression'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000006'::uuid, id FROM tags WHERE slug = 'brahmins-hierarchical-order'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000006'::uuid, id FROM tags WHERE slug = 'brahminism-system'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000006'::uuid, id FROM tags WHERE slug = 'moralizing-discourse'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000006'::uuid, id FROM tags WHERE slug = 'published-book';

-- ============================================================
-- Extract 7: Duff on English education as civilizing tool
-- "The English language is the lever..."
-- ============================================================
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000007'::uuid, id FROM tags WHERE slug = 'missionary-schools-conversion'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000007'::uuid, id FROM tags WHERE slug = 'christianity-apex'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000007'::uuid, id FROM tags WHERE slug = 'superstition-and-reason'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000007'::uuid, id FROM tags WHERE slug = 'civilizational-comparison'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000007'::uuid, id FROM tags WHERE slug = 'published-book';

-- ============================================================
-- Extract 8: Grant on sati
-- "Nothing can exceed the horrid cruelty..."
-- ============================================================
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000008'::uuid, id FROM tags WHERE slug = 'social-reforms'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000008'::uuid, id FROM tags WHERE slug = 'moral-corruption'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000008'::uuid, id FROM tags WHERE slug = 'superstition'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000008'::uuid, id FROM tags WHERE slug = 'humanitarian-appeal'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000008'::uuid, id FROM tags WHERE slug = 'published-book';

-- ============================================================
-- Extract 9: Census 1871 (bureaucratic layer)
-- "The Brahmins form a priestly class..."
-- ============================================================
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000009'::uuid, id FROM tags WHERE slug = 'inventing-caste-categories'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000009'::uuid, id FROM tags WHERE slug = 'taxonomizing-codifying'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000009'::uuid, id FROM tags WHERE slug = 'brahmins-hierarchical-order'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000009'::uuid, id FROM tags WHERE slug = 'official-institutional-report';

-- ============================================================
-- Extract 10: Phule on Brahminism (reform layer)
-- "The Brahmin has been the curse of India..."
-- ============================================================
INSERT INTO extract_tags (extract_id, tag_id)
SELECT '40000000-0000-0000-0000-000000000010'::uuid, id FROM tags WHERE slug = 'brahminism-system'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000010'::uuid, id FROM tags WHERE slug = 'brahmins-inventors-caste'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000010'::uuid, id FROM tags WHERE slug = 'brahmin-social-oppression'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000010'::uuid, id FROM tags WHERE slug = 'caste-as-hinduism'
UNION ALL
SELECT '40000000-0000-0000-0000-000000000010'::uuid, id FROM tags WHERE slug = 'published-book';

-- ============================================================
-- CROSS-LINKS between extracts (genealogy of ideas)
-- ============================================================

-- Ward on Brahmins (missionary) → Census 1871 (bureaucratic)
-- Missionary moral judgment codified into bureaucratic data
INSERT INTO extract_links (source_extract_id, target_extract_id, link_type, commentary) VALUES
  ('40000000-0000-0000-0000-000000000006',
   '40000000-0000-0000-0000-000000000009',
   'codified',
   'The census transforms Ward''s moral judgment ("fraud," "ascendancy over millions") into apparently neutral sociological observation ("exercises considerable influence"). The content is identical — Brahmins control religion — but the bureaucratic language strips the missionary hostility, giving it the authority of state data.');

-- Ward on Brahmins (missionary) → Phule (reform)
-- Anti-Brahmin framework adopted by reform movement
INSERT INTO extract_links (source_extract_id, target_extract_id, link_type, commentary) VALUES
  ('40000000-0000-0000-0000-000000000006',
   '40000000-0000-0000-0000-000000000010',
   'adopted',
   'Phule adopts Ward''s framework nearly verbatim: Brahmins are "cunning," religion is their "tool," caste is their "invention." The missionary diagnosis survives unchanged; only the prescription changes — Phule argues for social revolution rather than Christian conversion.');

-- Census 1871 (bureaucratic) → Phule (reform)
-- Bureaucratic data becomes political ammunition
INSERT INTO extract_links (source_extract_id, target_extract_id, link_type, commentary) VALUES
  ('40000000-0000-0000-0000-000000000009',
   '40000000-0000-0000-0000-000000000010',
   'influenced',
   'Once the census codified the missionary construction of Brahmin dominance as official data, Phule could cite it as objective evidence rather than missionary opinion. The laundering is complete: missionary propaganda → census category → political fact.');

-- Grant on moral character (missionary) → Duff on education (missionary)
-- Civilizational critique leads to education as intervention
INSERT INTO extract_links (source_extract_id, target_extract_id, link_type, commentary) VALUES
  ('40000000-0000-0000-0000-000000000003',
   '40000000-0000-0000-0000-000000000007',
   'influenced',
   'Grant''s diagnosis — Indians err because of ignorance, "our light and knowledge" is the cure — directly provides the rationale for Duff''s program 47 years later. Duff makes explicit what Grant implied: English education is the "lever" to overturn Hinduism. The civilizing mission generates the conversion infrastructure.');

-- Carey on heathen damnation (missionary) → Grant on moral character (missionary)
-- Theological premise generates civilizational critique
INSERT INTO extract_links (source_extract_id, target_extract_id, link_type, commentary) VALUES
  ('40000000-0000-0000-0000-000000000005',
   '40000000-0000-0000-0000-000000000003',
   'influenced',
   'Carey''s soteriological absolutism — all non-Christians are in "perdition" — provides the theological foundation for Grant''s secular-sounding civilizational critique. Once eternal damnation is established, the diagnosis of ignorance and moral failure follows logically. The civilizing mission is conversion by other means.');

-- Duff on caste as barrier (missionary) → Census 1871 (bureaucratic)
-- Missionary caste framework codified into census categories
INSERT INTO extract_links (source_extract_id, target_extract_id, link_type, commentary) VALUES
  ('40000000-0000-0000-0000-000000000002',
   '40000000-0000-0000-0000-000000000009',
   'codified',
   'Duff''s frustration that caste blocks conversion leads to intensive missionary study of caste. This missionary ethnography directly shapes the census categories decades later — the bureaucratic "caste tables" are built on frameworks missionaries developed to understand why conversion failed.');
