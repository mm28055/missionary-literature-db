'use client';

import { useState } from 'react';
import styles from './browse.module.css';

// Placeholder data
const SAMPLE_TAGS = [
    { id: 1, name: 'Hinduism', category: 'Religion' },
    { id: 2, name: 'Caste', category: 'Social' },
    { id: 3, name: 'Conversion', category: 'Theme' },
    { id: 4, name: 'Temples', category: 'Religion' },
    { id: 5, name: 'Education', category: 'Theme' },
    { id: 6, name: 'Women', category: 'Social' },
    { id: 7, name: 'Idolatry', category: 'Theme' },
    { id: 8, name: 'Scripture Translation', category: 'Theme' },
    { id: 9, name: 'Customs & Rituals', category: 'Culture' },
    { id: 10, name: 'Bengal', category: 'Region' },
    { id: 11, name: 'Madras', category: 'Region' },
    { id: 12, name: 'South India', category: 'Region' },
];

const SAMPLE_DENOMINATIONS = [
    'Baptist', 'Methodist', 'Anglican', 'Presbyterian', 'Congregationalist', 'Lutheran',
];

const SAMPLE_EXTRACTS = [
    {
        id: 1,
        content: '"The Hindus have thirty-three millions of gods, and yet they are not satisfied. They are continually adding to the number. They deify everything — rivers, mountains, trees, animals, and even the implements of husbandry."',
        missionary: 'William Ward',
        denomination: 'Baptist',
        work: 'A View of the History, Literature, and Mythology of the Hindoos',
        year: 1822,
        tags: ['Hinduism', 'Idolatry'],
    },
    {
        id: 2,
        content: '"The caste system is the great barrier to the progress of Christianity in India. It pervades all Hindu society, and separates man from man with a rigidity which no other institution in the world can parallel."',
        missionary: 'Alexander Duff',
        denomination: 'Presbyterian',
        work: 'India and India Missions',
        year: 1839,
        tags: ['Caste', 'Conversion'],
    },
    {
        id: 3,
        content: '"I have now been twelve years in India, and have had opportunities of observing the customs and manners of the people... The temples are magnificent structures, adorned with elaborate carvings that speak to centuries of devotion."',
        missionary: 'Reginald Heber',
        denomination: 'Anglican',
        work: 'Narrative of a Journey through the Upper Provinces of India',
        year: 1828,
        tags: ['Temples', 'Customs & Rituals'],
    },
    {
        id: 4,
        content: '"The women of India are, for the most part, kept in a state of great ignorance. They are taught nothing beyond the most necessary domestic duties. Education, in any proper sense of the word, is wholly denied them."',
        missionary: 'Hannah Marshman',
        denomination: 'Baptist',
        work: 'Letters from Serampore',
        year: 1815,
        tags: ['Women', 'Education'],
    },
    {
        id: 5,
        content: '"The translation of the Scriptures into Bengali has been a labour of many years. Every word has been carefully weighed, every phrase examined, to ensure that the sacred text conveys its full meaning to the native reader."',
        missionary: 'William Carey',
        denomination: 'Baptist',
        work: 'Memoirs of William Carey',
        year: 1836,
        tags: ['Scripture Translation', 'Bengal'],
    },
];

export default function BrowsePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedDenom, setSelectedDenom] = useState('');

    const toggleTag = (tagName) => {
        setSelectedTags((prev) =>
            prev.includes(tagName)
                ? prev.filter((t) => t !== tagName)
                : [...prev, tagName]
        );
    };

    // Filter extracts
    const filtered = SAMPLE_EXTRACTS.filter((e) => {
        const matchesSearch = searchQuery === '' ||
            e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.missionary.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.work.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTags = selectedTags.length === 0 ||
            selectedTags.some((t) => e.tags.includes(t));
        const matchesDenom = selectedDenom === '' || e.denomination === selectedDenom;
        return matchesSearch && matchesTags && matchesDenom;
    });

    return (
        <div className="page-content">
            <div className="container">
                <div className={styles['browse-header']}>
                    <h1>Browse Extracts</h1>
                    <p>Explore missionary writings on India and Hinduism. Filter by theme, denomination, or search for specific content.</p>
                </div>

                <div className={styles['browse-layout']}>
                    {/* Sidebar Filters */}
                    <aside className={styles.sidebar}>
                        <div className="card" style={{ padding: 'var(--space-lg)' }}>
                            {/* Search */}
                            <div className={styles['browse-search']}>
                                <input
                                    type="text"
                                    className={styles['browse-search-input']}
                                    placeholder="Search content..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Denomination filter */}
                            <div className={styles['filter-section']}>
                                <div className={styles['filter-title']}>Denomination</div>
                                <select
                                    className="form-select"
                                    value={selectedDenom}
                                    onChange={(e) => setSelectedDenom(e.target.value)}
                                >
                                    <option value="">All denominations</option>
                                    {SAMPLE_DENOMINATIONS.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Tags */}
                            <div className={styles['filter-section']}>
                                <div className={styles['filter-title']}>Tags</div>
                                <div className={styles['filter-tags']}>
                                    {SAMPLE_TAGS.map((tag) => (
                                        <span
                                            key={tag.id}
                                            className={`tag ${styles['filter-tag']} ${selectedTags.includes(tag.name) ? styles.selected : ''}`}
                                            onClick={() => toggleTag(tag.name)}
                                        >
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Clear */}
                            {(selectedTags.length > 0 || selectedDenom || searchQuery) && (
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => {
                                        setSelectedTags([]);
                                        setSelectedDenom('');
                                        setSearchQuery('');
                                    }}
                                    style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-sm)' }}
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    </aside>

                    {/* Results */}
                    <div className={styles['results-area']}>
                        <div className={styles['results-header']}>
                            <span className={styles['results-count']}>
                                {filtered.length} extract{filtered.length !== 1 ? 's' : ''} found
                            </span>
                            <select className={styles['sort-select']}>
                                <option>Sort by: Date</option>
                                <option>Sort by: Missionary</option>
                                <option>Sort by: Relevance</option>
                            </select>
                        </div>

                        <div className={styles['results-list']}>
                            {filtered.map((extract) => (
                                <article key={extract.id} className={`card ${styles['result-card']}`}>
                                    <div className={styles['result-card-header']}>
                                        <span className={styles['result-card-missionary']}>
                                            {extract.missionary}
                                        </span>
                                        <span className={styles['result-card-year']}>{extract.year}</span>
                                    </div>
                                    <div className={styles['result-card-work']}>{extract.work}</div>
                                    <p className={styles['result-card-content']}>{extract.content}</p>
                                    <div className={styles['result-card-tags']}>
                                        {extract.tags.map((tag) => (
                                            <span key={tag} className="tag">{tag}</span>
                                        ))}
                                    </div>
                                </article>
                            ))}

                            {filtered.length === 0 && (
                                <div className="empty-state">
                                    <div className="empty-state-icon">🔍</div>
                                    <p>No extracts match your filters. Try adjusting your search or clearing filters.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
