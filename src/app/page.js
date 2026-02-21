import Link from 'next/link';
import styles from './page.module.css';

// Sample placeholder data — will be replaced with Supabase queries
const SAMPLE_EXTRACTS = [
  {
    id: 1,
    content: '"The Hindus have thirty-three millions of gods, and yet they are not satisfied. They are continually adding to the number. They deify everything — rivers, mountains, trees, animals, and even the implements of husbandry."',
    missionary: 'William Ward',
    work: 'A View of the History, Literature, and Mythology of the Hindoos',
    year: 1822,
    tags: ['Hinduism', 'Idolatry'],
  },
  {
    id: 2,
    content: '"The caste system is the great barrier to the progress of Christianity in India. It pervades all Hindu society, and separates man from man with a rigidity which no other institution in the world can parallel."',
    missionary: 'Alexander Duff',
    work: 'India and India Missions',
    year: 1839,
    tags: ['Caste', 'Conversion'],
  },
  {
    id: 3,
    content: '"I have now been twelve years in India, and have had opportunities of observing the customs and manners of the people... The temples are magnificent structures, adorned with elaborate carvings that speak to centuries of devotion."',
    missionary: 'Reginald Heber',
    work: 'Narrative of a Journey through the Upper Provinces of India',
    year: 1828,
    tags: ['Temples', 'Customs & Rituals'],
  },
];

export default function HomePage() {
  return (
    <div className="page-content">
      <div className="container">
        {/* Hero */}
        <section className={`${styles.hero} animate-fade-in`}>
          <span className={styles['hero-icon']}>📜</span>
          <h1>Missionary Literature Database</h1>
          <p className={styles['hero-subtitle']}>
            A digital humanities archive exploring how 19th-century Christian missionaries
            described India, Hinduism, and Indian society. Browse, search, and discover
            primary source extracts from missionary writings.
          </p>
          <div className={styles['hero-actions']}>
            <Link href="/browse" className="btn btn-primary">
              Browse Extracts →
            </Link>
            <Link href="/about" className="btn btn-secondary">
              About This Project
            </Link>
          </div>
        </section>

        {/* Search */}
        <section className={styles['search-section']}>
          <Link href="/browse" className={styles['search-wrapper']}>
            <span className={styles['search-icon']}>🔍</span>
            <input
              type="text"
              className={styles['search-input']}
              placeholder="Search extracts, missionaries, works..."
              readOnly
              tabIndex={-1}
              style={{ cursor: 'pointer' }}
            />
          </Link>
        </section>

        {/* Stats */}
        <section className={`${styles['stats-grid']} stagger-children`}>
          <div className="card stat-card">
            <div className="stat-number">—</div>
            <div className="stat-label">Extracts</div>
          </div>
          <div className="card stat-card">
            <div className="stat-number">—</div>
            <div className="stat-label">Missionaries</div>
          </div>
          <div className="card stat-card">
            <div className="stat-number">—</div>
            <div className="stat-label">Works</div>
          </div>
        </section>

        {/* Featured Extracts */}
        <section>
          <div className={styles['section-header']}>
            <h2>Featured Extracts</h2>
            <Link href="/browse" className={styles['section-link']}>
              View all →
            </Link>
          </div>

          <div className={`${styles['extracts-grid']} stagger-children`}>
            {SAMPLE_EXTRACTS.map((extract) => (
              <article key={extract.id} className="card">
                <p className={styles['extract-card-content']}>
                  {extract.content}
                </p>
                <div className={styles['extract-card-meta']}>
                  <span className={styles['extract-card-source']}>
                    {extract.missionary}
                  </span>
                  <span>{extract.year}</span>
                </div>
                <div className={styles['extract-card-tags']}>
                  {extract.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
