-- ============================================================
-- Migration 004: Updated Theme Taxonomy
-- ============================================================
-- Replaces the existing theme hierarchy with the revised structure.
-- Preserves discursive strategies and source types.
-- Clears extract_tags since themes are changing.
-- ============================================================

-- Clear existing tag associations (extracts will need re-tagging)
DELETE FROM extract_tags;

-- Delete all existing theme and sub-theme tags
DELETE FROM tags WHERE tag_type = 'theme';

-- ============================================================
-- 1. PARENT THEMES
-- ============================================================

INSERT INTO tags (id, name, description, tag_type, parent_id, slug) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Hinduism',
   'The missionary construction of Hindu religion — image worship, superstition, ritualism, and moral corruption as core accusations.',
   'theme', NULL, 'hinduism'),

  ('10000000-0000-0000-0000-000000000002', 'Caste',
   'The missionary understanding of caste as inseparable from Hinduism, the conflation of varna and jati, and caste as obstacle to conversion.',
   'theme', NULL, 'caste'),

  ('10000000-0000-0000-0000-000000000003', 'The Brahmin',
   'The missionary construction of the Brahmin as the inventor and enforcer of the caste order, and Brahminism as a system of oppression.',
   'theme', NULL, 'the-brahmin'),

  ('10000000-0000-0000-0000-000000000004', 'Conversion Discourse',
   'The conceptual framework missionaries imposed — heathen damnation, schools as conversion tools, Christianity as liberation and fulfillment.',
   'theme', NULL, 'conversion-discourse'),

  ('10000000-0000-0000-0000-000000000005', 'The Civilizing Mission',
   'The broader missionary claim to be agents of civilization — moral character, degenerate civilization, reason vs. superstition, social reforms.',
   'theme', NULL, 'the-civilizing-mission'),

  ('10000000-0000-0000-0000-000000000006', 'Knowledge and Classification of Indians',
   'The missionary and colonial project of categorizing, classifying, and producing knowledge about Indian society — inventing caste categories, racial frameworks, textualizing traditions.',
   'theme', NULL, 'knowledge-classification');

-- ============================================================
-- 2. SUB-THEMES under Hinduism
-- ============================================================

INSERT INTO tags (name, description, tag_type, parent_id, slug) VALUES
  ('Image Worship',
   'The central missionary critique — murti puja as idol worship, the most voluminous category of missionary writing on India.',
   'theme', '10000000-0000-0000-0000-000000000001', 'image-worship'),

  ('Superstition',
   'Hindu practices framed as blind faith, delusion, and irrationality incompatible with reason and progress.',
   'theme', '10000000-0000-0000-0000-000000000001', 'superstition'),

  ('Ritualism',
   'Missionary critique of Hindu ritual practices as empty, meaningless, and spiritually hollow.',
   'theme', '10000000-0000-0000-0000-000000000001', 'ritualism'),

  ('Moral Corruption',
   'The characterization of Hindu religious practices and mythology as morally degraded and corrupting.',
   'theme', '10000000-0000-0000-0000-000000000001', 'moral-corruption');

-- ============================================================
-- 3. SUB-THEMES under Caste
-- ============================================================

INSERT INTO tags (name, description, tag_type, parent_id, slug) VALUES
  ('Caste as Hinduism',
   'The claim that caste is not a social phenomenon but inseparable from Hindu theology — to abolish caste, you must leave Hinduism.',
   'theme', '10000000-0000-0000-0000-000000000002', 'caste-as-hinduism'),

  ('Caste as a Totalizing System',
   'The presentation of caste as an all-encompassing, rigid system that governs every aspect of Indian life.',
   'theme', '10000000-0000-0000-0000-000000000002', 'caste-totalizing-system'),

  ('Varna-Jati Conflation',
   'Reduction of thousands of contextual jatis into a rigid four-tier varna system.',
   'theme', '10000000-0000-0000-0000-000000000002', 'varna-jati-conflation'),

  ('Caste as Impediment to Conversion',
   'Missionary frustration that caste bonds made conversion nearly impossible — critiqued caste because it blocked their agenda.',
   'theme', '10000000-0000-0000-0000-000000000002', 'caste-impediment-conversion'),

  ('Manu Smriti as Authority',
   'The elevation of Manu Smriti as the definitive Hindu legal code, treating one text as representative of the entire tradition.',
   'theme', '10000000-0000-0000-0000-000000000002', 'manu-smriti-authority');

-- ============================================================
-- 4. SUB-THEMES under The Brahmin
-- ============================================================

INSERT INTO tags (name, description, tag_type, parent_id, slug) VALUES
  ('Brahmins as the Top of Hierarchical Order',
   'The missionary portrayal of Brahmins as sitting atop a rigid hierarchical system, exercising dominance over all other castes.',
   'theme', '10000000-0000-0000-0000-000000000003', 'brahmins-hierarchical-order'),

  ('Brahmins as Inventors of Caste Order',
   'The claim that Brahmins deliberately created the caste system as a tool to maintain their supremacy.',
   'theme', '10000000-0000-0000-0000-000000000003', 'brahmins-inventors-caste'),

  ('Brahmin as Social Oppression',
   'The Brahmin who enforces caste, prevents inter-dining, maintains social hierarchy through religious sanction.',
   'theme', '10000000-0000-0000-0000-000000000003', 'brahmin-social-oppression'),

  ('Brahmin as Intellectual Antagonist',
   'The Brahmin who debates the missionary, knows Sanskrit, refuses to be convinced — the primary intellectual adversary.',
   'theme', '10000000-0000-0000-0000-000000000003', 'brahmin-intellectual-antagonist'),

  ('Brahminism as a System',
   'The invention of "Brahminism" as a distinct system of religious and social control, separate from Hinduism at large.',
   'theme', '10000000-0000-0000-0000-000000000003', 'brahminism-system');

-- ============================================================
-- 5. SUB-THEMES under Conversion Discourse
-- ============================================================

INSERT INTO tags (name, description, tag_type, parent_id, slug) VALUES
  ('Heathen Damnation',
   'Without Christ, these people are eternally lost — the foundational claim that non-Christian religions lead to perdition.',
   'theme', '10000000-0000-0000-0000-000000000004', 'heathen-damnation'),

  ('Missionary Schools as Tools for Conversion',
   'The use of education infrastructure — schools, colleges — as deliberate instruments of religious conversion.',
   'theme', '10000000-0000-0000-0000-000000000004', 'missionary-schools-conversion'),

  ('Christianity as Liberation',
   'The framing of Christianity as liberating Indians from the bondage of caste, superstition, and social oppression.',
   'theme', '10000000-0000-0000-0000-000000000004', 'christianity-liberation'),

  ('Christianity as Fulfillment',
   'The claim that Christianity is the fulfillment of what Hindu traditions were groping toward — the completion of an incomplete quest.',
   'theme', '10000000-0000-0000-0000-000000000004', 'christianity-fulfillment'),

  ('Religious Demography as Weapon',
   'Obsession with counting converts, leading to census categories and religion as population percentage.',
   'theme', '10000000-0000-0000-0000-000000000004', 'religious-demography-weapon');

-- ============================================================
-- 6. SUB-THEMES under The Civilizing Mission
-- ============================================================

INSERT INTO tags (name, description, tag_type, parent_id, slug) VALUES
  ('Moral Character of Indians',
   'Lying, deceit, sensuality, cowardice — systematic characterological critique applied to Indians as a people.',
   'theme', '10000000-0000-0000-0000-000000000005', 'moral-character-indians'),

  ('India as Degenerate Civilization',
   'India as a fallen, degraded, backward civilization compared to Christian Europe — once great, now decayed.',
   'theme', '10000000-0000-0000-0000-000000000005', 'india-degenerate-civilization'),

  ('Superstition and Reason',
   'The deployment of "reason" and "science" as fundamentally incompatible with Hindu worldview.',
   'theme', '10000000-0000-0000-0000-000000000005', 'superstition-and-reason'),

  ('Christianity as the Apex',
   'The positioning of Christianity as the pinnacle of civilizational achievement — the standard against which all others are measured.',
   'theme', '10000000-0000-0000-0000-000000000005', 'christianity-apex'),

  ('Social Reforms',
   'Missionary involvement in social reform — sati, child marriage, widow remarriage — as extensions of the civilizing project.',
   'theme', '10000000-0000-0000-0000-000000000005', 'social-reforms');

-- ============================================================
-- 7. SUB-THEMES under Knowledge and Classification of Indians
-- ============================================================

INSERT INTO tags (name, description, tag_type, parent_id, slug) VALUES
  ('Inventing Caste Categories',
   'The creation and hardening of caste categories through census, ethnographic surveys, and administrative classification.',
   'theme', '10000000-0000-0000-0000-000000000006', 'inventing-caste-categories'),

  ('Inventing Racial Framework',
   'The imposition of racial categories — Aryan, Dravidian — onto Indian society, merging caste with race.',
   'theme', '10000000-0000-0000-0000-000000000006', 'inventing-racial-framework'),

  ('Secularizing Varna Categories',
   'The transformation of varna from a theological concept into a secular sociological category.',
   'theme', '10000000-0000-0000-0000-000000000006', 'secularizing-varna'),

  ('Taxonomizing and Codifying',
   'The obsessive drive to classify, categorize, and codify Indian society into fixed, legible administrative units.',
   'theme', '10000000-0000-0000-0000-000000000006', 'taxonomizing-codifying'),

  ('Textualization and Canon Making',
   'The project of reducing diverse oral and practical traditions into fixed textual canons modeled on Protestant scripture.',
   'theme', '10000000-0000-0000-0000-000000000006', 'textualization-canon-making'),

  ('Infrastructure of Knowledge Production',
   'The institutional apparatus — surveys, societies, universities, printing presses — that produced colonial knowledge about India.',
   'theme', '10000000-0000-0000-0000-000000000006', 'infrastructure-knowledge'),

  ('Difficulty of Data Collection',
   'The acknowledged challenges and failures in collecting reliable data about Indian society, religion, and customs.',
   'theme', '10000000-0000-0000-0000-000000000006', 'difficulty-data-collection'),

  ('Fluidity of Identity',
   'Instances where colonial classifiers encountered the irreducible fluidity of Indian identity — caste, sect, and community boundaries that refused to hold still.',
   'theme', '10000000-0000-0000-0000-000000000006', 'fluidity-identity');
