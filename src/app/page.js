import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import styles from './page.module.css';

export default async function HomePage() {
  const supabase = await createClient();

  // Load featured extracts + stats
  const [extractsRes, statsRes] = await Promise.all([
    supabase.from('extracts').select(`
            id, content, layer, commentary,
            works(title, year_published, author, missionaries(name)),
            extract_tags(tags(id, name, tag_type, parent_id))
        `).order('created_at', { ascending: false }).limit(4),

    Promise.all([
      supabase.from('extracts').select('id', { count: 'exact', head: true }),
      supabase.from('tags').select('id', { count: 'exact', head: true }).eq('tag_type', 'theme').is('parent_id', null),
      supabase.from('missionaries').select('id', { count: 'exact', head: true }),
      supabase.from('works').select('id', { count: 'exact', head: true }),
    ]),
  ]);

  const extracts = extractsRes.data || [];
  const [extractCount, themeCount, missionaryCount, workCount] = statsRes;
  const stats = {
    extracts: extractCount.count || 0,
    themes: themeCount.count || 0,
    missionaries: missionaryCount.count || 0,
    works: workCount.count || 0,
  };

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
    <div className="page-content">
      <div className="container">
        {/* Hero */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Missionary Literature on India
          </h1>
          <p className={styles.heroSubtitle}>
            A scholarly database of 19th-century missionary writings that shaped Western perceptions of
            Hinduism, caste, and Indian civilization — and their downstream impact through colonial
            policy and Indian reform movements.
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

        {/* Stats */}
        <section className={styles.statsRow}>
          {[
            { label: 'Extracts', value: stats.extracts, icon: '📜' },
            { label: 'Themes', value: stats.themes, icon: '🏷️' },
            { label: 'Missionaries', value: stats.missionaries, icon: '✝️' },
            { label: 'Works', value: stats.works, icon: '📚' },
          ].map((s) => (
            <div key={s.label} className={`card ${styles.statCard}`}>
              <div className={styles.statIcon}>{s.icon}</div>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
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
