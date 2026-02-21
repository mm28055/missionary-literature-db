import styles from './about.module.css';

export const metadata = {
    title: 'About — Missionary Literature Database',
    description: 'Learn about the Missionary Literature Database project, its goals, methodology, and scope.',
};

export default function AboutPage() {
    return (
        <div className="page-content">
            <div className={`container ${styles['about-content']}`}>
                <div className={`${styles['about-header']} animate-fade-in`}>
                    <h1>About This Project</h1>
                    <p>
                        The Missionary Literature Database is a digital humanities project that
                        creates a searchable archive of 19th-century Christian missionary writings
                        about India and Hinduism.
                    </p>
                </div>

                <section className={styles['about-section']}>
                    <h2>Purpose</h2>
                    <p>
                        During the 19th century, Christian missionaries from various denominations
                        produced an enormous body of literature about India — its religions, customs,
                        social structures, and peoples. These writings, while shaped by the biases
                        and assumptions of their time, constitute a significant primary source for
                        understanding colonial-era encounters between Christianity and Hinduism.
                    </p>
                    <p>
                        This database aims to make selected extracts from these writings accessible
                        to researchers, students, and anyone interested in the history of religious
                        encounters in colonial India.
                    </p>
                </section>

                <section className={styles['about-section']}>
                    <h2>What You&apos;ll Find</h2>
                    <ul>
                        <li>Curated extracts from missionary letters, reports, books, and pamphlets</li>
                        <li>Biographical information about the missionaries</li>
                        <li>Bibliographic data for the original works</li>
                        <li>Thematic tags for easy discovery and cross-referencing</li>
                        <li>Full-text search across all extracts</li>
                        <li>Filtering by denomination, period, region, and topic</li>
                    </ul>
                </section>

                <section className={styles['about-section']}>
                    <h2>Scope</h2>
                    <p>
                        The database focuses primarily on 19th-century writings (c. 1793–1900),
                        spanning the period from William Carey&apos;s arrival in India to the end of
                        the Victorian era. It covers missionaries from major Protestant denominations
                        including Baptist, Methodist, Anglican, Presbyterian, Congregationalist, and
                        Lutheran traditions.
                    </p>
                </section>

                <section className={styles['about-section']}>
                    <h2>Methodology</h2>
                    <p>
                        Extracts are selected for their historical significance and illustrative
                        value. Each extract is tagged with relevant themes and linked to its source
                        work and author. The database is not exhaustive but aims to be representative
                        of the range of missionary perspectives on India and Hinduism.
                    </p>
                </section>
            </div>
        </div>
    );
}
