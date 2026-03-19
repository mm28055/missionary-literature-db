import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();

  // Load featured extracts + stats
  const extractsRes = await supabase.from('extracts').select(`
            id, content, layer, commentary,
            works(title, year_published, author, missionaries(name)),
            extract_tags(tags(id, name, tag_type, parent_id))
        `).order('created_at', { ascending: false }).limit(4);

  const extracts = extractsRes.data || [];

  // Load parent tag names for display
  const allTags = {};
  extracts.forEach((e) =>
    (e.extract_tags || []).forEach((et) => {
      if (et.tags) allTags[et.tags.id] = et.tags;
    })
  );

  const getAuthor = (extract) => {
    if (extract.works?.missionaries?.name) return extract.works.missionaries.name;
    if (extract.works?.author) return extract.works.author;
    return '';
  };

  const LAYER_LABELS = {
    missionary: 'Missionary',
    bureaucratic: 'Bureaucratic',
    reform: 'Reform / Response',
  };

  return (
    <div className="page-content" style={{ paddingTop: 0 }}>
      {/* Hero — full-bleed, outside container */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Colonial Discourse<br />& Indian Selfhood
        </h1>
        <p className={styles.heroSubtitle}>
          Interrogating the texts that shaped how India came to know itself.
        </p>
        <div className={styles.heroActions}>
          <Link href="/themes" className="btn btn-primary">
            Explore Themes
          </Link>
          <Link href="/about" className="btn btn-ghost">
            About the Project
          </Link>
        </div>
      </section>

      <div className="container">

        {/* About the Archive */}
        <section className={styles.aboutSection}>
          <h2 className={styles.aboutTitle}>About the Archive</h2>
          <p className={styles.aboutText}>
            This archive brings together three bodies of colonial-era writing that, read side by side,
            reveal how India was described, classified, and ultimately reimagined. <strong>Missionary texts</strong> —
            from Ward to Duff — constructed Hinduism as superstition in need of Christian salvation.
            <strong> Bureaucratic records</strong> — census reports, official surveys — codified these
            judgments into the neutral language of governance. And <strong>reform voices</strong> — Phule,
            among others — turned these very categories back against their authors, forging a new
            language of self-understanding and resistance.
          </p>
          <p className={styles.aboutText}>
            Explore the extracts thematically to trace how ideas about caste, religion, and civilization
            moved between these three worlds — and how they continue to shape Indian self-perception today.
          </p>
        </section>

        {/* Featured Extracts */}
        <section className={styles.featured}>
          <h2 className={styles.sectionTitle}>Featured Extracts</h2>
          <div className={styles.extractGrid}>
            {extracts.map((e) => {
              const themeTags = (e.extract_tags || [])
                .map((et) => et.tags)
                .filter((t) => t && t.tag_type === 'theme');

              return (
                <Link
                  key={e.id}
                  href={`/extract/${e.id}`}
                  className={`card ${styles.extractCard}`}
                >
                  <div className={styles.extractCardHeader}>
                    <span className={styles.extractCardAuthor}>
                      {getAuthor(e)}
                    </span>
                    <span className={`layer-badge layer-${e.layer}`}>
                      {LAYER_LABELS[e.layer]}
                    </span>
                  </div>
                  <div className={styles.extractCardWork}>
                    {e.works?.title} ({e.works?.year_published})
                  </div>
                  <p className={styles.extractCardContent}>
                    {e.content?.substring(0, 200)}...
                  </p>
                  <div className={styles.extractCardTags}>
                    {themeTags.slice(0, 3).map((tag) => (
                      <span key={tag.id} className="tag">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
            <Link href="/themes" className="btn btn-ghost">
              Explore all themes →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
