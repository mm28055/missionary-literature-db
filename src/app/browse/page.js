'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './browse.module.css';

const LAYER_LABELS = {
    missionary: 'Missionary',
    bureaucratic: 'Bureaucratic',
    reform: 'Reform / Response',
};

export default function BrowsePage() {
    const [extracts, setExtracts] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCard, setExpandedCard] = useState(null);
    const [crossLinks, setCrossLinks] = useState({});
    const [collapsedThemes, setCollapsedThemes] = useState({});

    // Lightweight filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLayer, setSelectedLayer] = useState('');

    const supabase = createClient();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [extractsRes, tagsRes] = await Promise.all([
                supabase.from('extracts').select(`
                    *,
                    works(title, year_published, author, layer, source_type, missionaries(name, denominations(name))),
                    extract_tags(tags(id, name, tag_type, parent_id))
                `).order('created_at', { ascending: false }),

                supabase.from('tags').select('*').order('name'),
            ]);

            setExtracts(extractsRes.data || []);
            setTags(tagsRes.data || []);
        } catch {
            console.error('Failed to load data');
        }
        setLoading(false);
    };

    // Organize tags
    const parentThemes = tags.filter(t => t.tag_type === 'theme' && !t.parent_id);
    const subThemes = tags.filter(t => t.tag_type === 'theme' && t.parent_id);
    const getSubThemes = (parentId) => subThemes.filter(t => t.parent_id === parentId);

    // Filter extracts
    const filtered = extracts.filter(e => {
        const matchesSearch = searchQuery === '' ||
            e.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.works?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.works?.missionaries?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.works?.author?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLayer = selectedLayer === '' || e.layer === selectedLayer;
        return matchesSearch && matchesLayer;
    });

    // Group extracts by sub-theme
    const getExtractsForSubTheme = (subThemeId) => {
        return filtered.filter(e =>
            (e.extract_tags || []).some(et => et.tags?.id === subThemeId)
        );
    };

    // Track themed extract IDs for "Other" section
    const themedExtractIds = new Set();
    parentThemes.forEach(parent => {
        getSubThemes(parent.id).forEach(sub => {
            getExtractsForSubTheme(sub.id).forEach(e => themedExtractIds.add(e.id));
        });
    });
    const unthemedExtracts = filtered.filter(e => !themedExtractIds.has(e.id));

    // Cross-links
    const loadCrossLinks = async (extractId) => {
        if (crossLinks[extractId]) return;
        const { data } = await supabase.from('extract_links').select(`
            *,
            source:extracts!extract_links_source_extract_id_fkey(id, content, layer,
                works(title, author, missionaries(name))),
            target:extracts!extract_links_target_extract_id_fkey(id, content, layer,
                works(title, author, missionaries(name)))
        `).or(`source_extract_id.eq.${extractId},target_extract_id.eq.${extractId}`);
        setCrossLinks(prev => ({ ...prev, [extractId]: data || [] }));
    };

    const toggleExpand = (extractId) => {
        if (expandedCard === extractId) {
            setExpandedCard(null);
        } else {
            setExpandedCard(extractId);
            loadCrossLinks(extractId);
        }
    };

    const toggleTheme = (themeId) => {
        setCollapsedThemes(prev => ({ ...prev, [themeId]: !prev[themeId] }));
    };

    const getAuthor = (extract) => {
        if (extract.works?.missionaries?.name) return extract.works.missionaries.name;
        if (extract.works?.author) return extract.works.author;
        return 'Unknown';
    };

    // Roman numeral for theme index
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

    // Render extract as a document-style passage
    const renderExtract = (extract) => {
        const isExpanded = expandedCard === extract.id;
        const extractTags = (extract.extract_tags || []).map(et => et.tags).filter(Boolean);
        const strategyTags = extractTags.filter(t => t.tag_type === 'strategy');
        const sourceType = extract.works?.source_type;
        const links = crossLinks[extract.id] || [];

        return (
            <div
                key={extract.id}
                className={`${styles.passage} ${isExpanded ? styles.passageExpanded : ''}`}
                onClick={() => toggleExpand(extract.id)}
            >
                {/* Attribution line */}
                <div className={styles.attribution}>
                    <span className={styles.author}>{getAuthor(extract)}</span>
                    <span className={styles.separator}>·</span>
                    <span className={styles.workTitle}>{extract.works?.title}</span>
                    {extract.works?.year_published && (
                        <>
                            <span className={styles.separator}>·</span>
                            <span className={styles.year}>{extract.works.year_published}</span>
                        </>
                    )}
                    <span className={`${styles.layerBadge} ${styles[`layer${extract.layer?.charAt(0).toUpperCase()}${extract.layer?.slice(1)}`]}`}>
                        {LAYER_LABELS[extract.layer] || extract.layer}
                    </span>
                </div>

                {/* The extract text — the star of the show */}
                <blockquote className={styles.quoteBlock}>
                    <p className={isExpanded ? '' : styles.quoteClamped}>
                        {extract.content}
                    </p>
                </blockquote>

                {extract.source_reference && (
                    <div className={styles.sourceRef}>— {extract.source_reference}</div>
                )}

                {/* Strategy tags + source type */}
                {(strategyTags.length > 0 || sourceType) && (
                    <div className={styles.passageTags}>
                        {strategyTags.map(t => (
                            <span key={t.id} className={styles.strategyTag}>{t.name}</span>
                        ))}
                        {sourceType && (
                            <span className={styles.sourceTag}>{sourceType}</span>
                        )}
                    </div>
                )}

                {/* Expanded: scholarly commentary + cross-links */}
                {isExpanded && (
                    <div className={styles.marginalia} onClick={e => e.stopPropagation()}>
                        {extract.commentary && (
                            <div className={styles.commentaryBlock}>
                                <div className={styles.commentaryMarker}>✦ Commentary</div>
                                <p>{extract.commentary}</p>
                            </div>
                        )}

                        {links.length > 0 && (
                            <div className={styles.chainSection}>
                                <div className={styles.chainTitle}>
                                    ↯ Tracing the Causal Chain
                                </div>
                                {links.map(link => {
                                    const isSource = link.source_extract_id === extract.id;
                                    const linked = isSource ? link.target : link.source;
                                    const direction = isSource ? '→' : '←';
                                    const linkedAuthor = linked?.works?.missionaries?.name || linked?.works?.author || '';
                                    return (
                                        <div key={link.id} className={styles.chainLink}>
                                            <div className={styles.chainArrow}>{direction}</div>
                                            <div className={styles.chainContent}>
                                                <div className={styles.chainMeta}>
                                                    <span className={`${styles.layerBadge} ${styles[`layer${linked?.layer?.charAt(0).toUpperCase()}${linked?.layer?.slice(1)}`]}`}>
                                                        {LAYER_LABELS[linked?.layer] || linked?.layer}
                                                    </span>
                                                    <span className={styles.chainType}>{link.link_type}</span>
                                                </div>
                                                <div className={styles.chainSource}>
                                                    {linkedAuthor && `${linkedAuthor}, `}
                                                    <em>{linked?.works?.title}</em>
                                                </div>
                                                <blockquote className={styles.chainQuote}>
                                                    &ldquo;{linked?.content?.substring(0, 180)}...&rdquo;
                                                </blockquote>
                                                {link.commentary && (
                                                    <p className={styles.chainCommentary}>{link.commentary}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="page-content">
            <div className="container">
                {/* Page title — scholarly, not app-like */}
                <header className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>The Archive</h1>
                    <p className={styles.pageEpigraph}>
                        Selected extracts from 19th-century missionary writings on India — organized
                        by the thematic patterns through which missionaries constructed, critiqued, and
                        sought to dismantle Hindu civilization.
                    </p>
                </header>

                {/* Search + filter — unobtrusive */}
                <div className={styles.filterBar}>
                    <div className={styles.searchWrap}>
                        <span className={styles.searchIcon}>⌕</span>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search the archive..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className={styles.layerSelect}
                        value={selectedLayer}
                        onChange={e => setSelectedLayer(e.target.value)}
                    >
                        <option value="">All layers</option>
                        {Object.entries(LAYER_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                    {(searchQuery || selectedLayer) && (
                        <button
                            className={styles.clearBtn}
                            onClick={() => { setSearchQuery(''); setSelectedLayer(''); }}
                        >
                            Clear
                        </button>
                    )}
                    <span className={styles.resultCount}>
                        {loading ? '' : `${filtered.length} passage${filtered.length !== 1 ? 's' : ''}`}
                    </span>
                </div>

                {/* Layout: TOC + Content */}
                <div className={styles.archiveLayout}>
                    {/* Sticky TOC — shows parent themes + sub-theme counts */}
                    <nav className={styles.toc}>
                        <div className={styles.tocLabel}>Contents</div>
                        {parentThemes.map((parent, i) => {
                            const subs = getSubThemes(parent.id);
                            const count = subs.reduce((n, sub) => n + getExtractsForSubTheme(sub.id).length, 0);
                            return (
                                <a
                                    key={parent.id}
                                    href={`#theme-${parent.id}`}
                                    className={styles.tocItem}
                                >
                                    <span className={styles.tocNumeral}>{romanNumerals[i]}</span>
                                    <span className={styles.tocName}>{parent.name}</span>
                                    {count > 0 && <span className={styles.tocCount}>{count}</span>}
                                </a>
                            );
                        })}
                    </nav>

                    {/* Main content — editorial layout */}
                    <div className={styles.content}>
                        {!loading && parentThemes.map((parent, i) => {
                            const subs = getSubThemes(parent.id);
                            const isCollapsed = collapsedThemes[parent.id];
                            const hasExtracts = subs.some(sub => getExtractsForSubTheme(sub.id).length > 0);
                            if (!hasExtracts && (searchQuery || selectedLayer)) return null;

                            return (
                                <section key={parent.id} id={`theme-${parent.id}`} className={styles.themeSection}>
                                    {/* Theme heading — like a chapter */}
                                    <div className={styles.chapterHead} onClick={() => toggleTheme(parent.id)}>
                                        <div className={styles.chapterNumeral}>{romanNumerals[i]}</div>
                                        <h2 className={styles.chapterTitle}>{parent.name}</h2>
                                        <div className={styles.chapterRule} />
                                        <p className={styles.chapterDesc}>{parent.description}</p>
                                    </div>

                                    {/* Sub-theme chips — visible at a glance */}
                                    {!isCollapsed && subs.length > 0 && (
                                        <div className={styles.subThemeIndex}>
                                            {subs.map(sub => {
                                                const count = getExtractsForSubTheme(sub.id).length;
                                                return (
                                                    <a
                                                        key={sub.id}
                                                        href={`#sub-${sub.id}`}
                                                        className={`${styles.subThemeChip} ${count === 0 ? styles.subThemeEmpty : ''}`}
                                                    >
                                                        {sub.name}
                                                        {count > 0 && <span className={styles.chipCount}>{count}</span>}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Sub-theme sections with extracts */}
                                    {!isCollapsed && subs.map(sub => {
                                        const subExtracts = getExtractsForSubTheme(sub.id);
                                        if (subExtracts.length === 0) return null;

                                        return (
                                            <div key={sub.id} id={`sub-${sub.id}`} className={styles.subSection}>
                                                <h3 className={styles.subTitle}>{sub.name}</h3>
                                                {sub.description && (
                                                    <p className={styles.subDesc}>{sub.description}</p>
                                                )}
                                                <div className={styles.passages}>
                                                    {subExtracts.map(e => renderExtract(e))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </section>
                            );
                        })}

                        {/* Unthemed */}
                        {!loading && unthemedExtracts.length > 0 && (
                            <section className={styles.themeSection}>
                                <div className={styles.chapterHead}>
                                    <h2 className={styles.chapterTitle}>Uncategorized</h2>
                                    <div className={styles.chapterRule} />
                                </div>
                                <div className={styles.passages}>
                                    {unthemedExtracts.map(e => renderExtract(e))}
                                </div>
                            </section>
                        )}

                        {!loading && filtered.length === 0 && (
                            <div className={styles.emptyState}>
                                <p>No passages match your search.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
