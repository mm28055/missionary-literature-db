'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './subtheme.module.css';
import themeStyles from '../../themes.module.css';
import ThemeSidebar from '@/components/ThemeSidebar';
import sidebarStyles from '@/components/ThemeSidebar.module.css';

const LAYER_LABELS = {
    missionary: 'Missionary',
    bureaucratic: 'Bureaucratic',
    reform: 'Reform / Response',
};

const LAYER_STYLE_MAP = {
    missionary: 'layerMissionary',
    bureaucratic: 'layerBureaucratic',
    reform: 'layerReform',
};

const PAGE_SIZE = 12;

export default function SubthemePage() {
    const params = useParams();
    const { slug, subtheme } = params;

    const [parentTheme, setParentTheme] = useState(null);
    const [subTheme, setSubTheme] = useState(null);
    const [extracts, setExtracts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters & pagination
    const [selectedLayer, setSelectedLayer] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);

    // Expand state
    const [expandedId, setExpandedId] = useState(null);
    const [crossLinks, setCrossLinks] = useState([]);
    const [crossLinkCounts, setCrossLinkCounts] = useState({});
    const [loadingLinks, setLoadingLinks] = useState(false);

    const expandedRef = useRef(null);
    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, [slug, subtheme]);

    const loadData = async () => {
        setLoading(true);
        setExpandedId(null);
        setCrossLinks([]);

        // Load parent theme by slug
        let { data: parent } = await supabase
            .from('tags')
            .select('*')
            .eq('slug', slug)
            .eq('tag_type', 'theme')
            .is('parent_id', null)
            .single();

        setParentTheme(parent);

        // Load subtheme by slug
        let { data: sub } = await supabase
            .from('tags')
            .select('*')
            .eq('slug', subtheme)
            .eq('tag_type', 'theme')
            .single();

        setSubTheme(sub);

        if (sub) {
            // Load extracts tagged with this subtheme
            const { data: taggedExtracts } = await supabase
                .from('extract_tags')
                .select(`
                    extracts(
                        *,
                        works(title, year_published, author, layer, missionaries(name, denominations(name))),
                        extract_tags(tags(id, name, tag_type, parent_id))
                    )
                `)
                .eq('tag_id', sub.id);

            const extractList = (taggedExtracts || [])
                .map(et => et.extracts)
                .filter(Boolean);

            setExtracts(extractList);

            // Fetch cross-link counts for indicators
            const extractIds = extractList.map(e => e.id);
            if (extractIds.length > 0) {
                try {
                    const { data: links } = await supabase
                        .from('extract_links')
                        .select('source_extract_id, target_extract_id')
                        .or(extractIds.map(id => `source_extract_id.eq.${id}`).join(',') +
                            ',' + extractIds.map(id => `target_extract_id.eq.${id}`).join(','));

                    const counts = {};
                    (links || []).forEach(link => {
                        if (extractIds.includes(link.source_extract_id)) {
                            counts[link.source_extract_id] = (counts[link.source_extract_id] || 0) + 1;
                        }
                        if (extractIds.includes(link.target_extract_id)) {
                            counts[link.target_extract_id] = (counts[link.target_extract_id] || 0) + 1;
                        }
                    });
                    setCrossLinkCounts(counts);
                } catch (e) {
                    // extract_links table may not exist yet
                }
            }
        }

        setLoading(false);
    };

    // Handle expand/collapse
    const handleExtractClick = useCallback(async (extractId) => {
        if (expandedId === extractId) {
            // Collapse
            setExpandedId(null);
            setCrossLinks([]);
            return;
        }

        setExpandedId(extractId);
        setCrossLinks([]);
        setLoadingLinks(true);

        // Fetch cross-links for this extract
        try {
            const { data, error } = await supabase
                .from('extract_links')
                .select(`
                    *,
                    source:extracts!extract_links_source_extract_id_fkey(id, content, layer,
                        works(title, author, missionaries(name))),
                    target:extracts!extract_links_target_extract_id_fkey(id, content, layer,
                        works(title, author, missionaries(name)))
                `)
                .or(`source_extract_id.eq.${extractId},target_extract_id.eq.${extractId}`);
            if (!error) setCrossLinks(data || []);
        } catch (e) {
            // extract_links table may not exist yet
        }

        setLoadingLinks(false);

        // Scroll to expanded card after a small delay
        setTimeout(() => {
            if (expandedRef.current) {
                expandedRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }, [expandedId, supabase]);

    // Available layers (only show tabs for layers with content)
    const layerCounts = extracts.reduce((acc, e) => {
        const layer = e.layer || 'missionary';
        acc[layer] = (acc[layer] || 0) + 1;
        return acc;
    }, {});

    // Filter by layer
    const layerFiltered = selectedLayer === 'all'
        ? extracts
        : extracts.filter(e => e.layer === selectedLayer);

    // Sort
    const sorted = [...layerFiltered].sort((a, b) => {
        const yearA = a.works?.year_published || 0;
        const yearB = b.works?.year_published || 0;
        if (sortOrder === 'oldest') return yearA - yearB;
        if (sortOrder === 'newest') return yearB - yearA;
        // by author
        const authA = getAuthor(a).toLowerCase();
        const authB = getAuthor(b).toLowerCase();
        return authA.localeCompare(authB);
    });

    // Paginate
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const paged = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    function getAuthor(extract) {
        if (extract.works?.missionaries?.name) return extract.works.missionaries.name;
        if (extract.works?.author) return extract.works.author;
        return 'Unknown';
    }

    // Reset page when filters change
    const handleLayerChange = (layer) => {
        setSelectedLayer(layer);
        setCurrentPage(1);
        setExpandedId(null);
    };

    const handleSortChange = (e) => {
        setSortOrder(e.target.value);
        setCurrentPage(1);
        setExpandedId(null);
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="container">
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-3xl)' }}>
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    if (!subTheme) {
        return (
            <div className="page-content">
                <div className="container">
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-3xl)' }}>
                        Sub-theme not found.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="container">
                <div className={sidebarStyles.sidebarLayout}>
                    <ThemeSidebar />
                    <div className={sidebarStyles.sidebarContent}>
                        {/* Breadcrumb */}
                        <nav className={themeStyles.breadcrumb}>
                            <Link href="/">Home</Link>
                            <span className={themeStyles.breadcrumbSep}>›</span>
                            <Link href="/themes">Themes</Link>
                            <span className={themeStyles.breadcrumbSep}>›</span>
                            <Link href={`/themes/${slug}`}>{parentTheme?.name || slug}</Link>
                            <span className={themeStyles.breadcrumbSep}>›</span>
                            <span className={themeStyles.breadcrumbCurrent}>{subTheme.name}</span>
                        </nav>

                        {/* Subtheme header */}
                        <header className={styles.subthemeHeader}>
                            <h1 className={styles.subthemeTitle}>{subTheme.name}</h1>
                            <div className={styles.subthemeRule} />
                            {subTheme.description && (
                                <p className={styles.subthemeDesc}>{subTheme.description}</p>
                            )}
                        </header>

                        {/* Scholarly introduction */}
                        {subTheme.introduction && (
                            <div className={styles.introSection}>
                                <div className={styles.introLabel}>✦ Introduction</div>
                                <div className={styles.introText}>{subTheme.introduction}</div>
                            </div>
                        )}

                        {/* Toolbar: layer tabs + sort + count */}
                        <div className={styles.toolbar}>
                            <div className={styles.layerTabs}>
                                <button
                                    className={`${styles.layerTab} ${selectedLayer === 'all' ? styles.layerTabActive : ''}`}
                                    onClick={() => handleLayerChange('all')}
                                >
                                    All ({extracts.length})
                                </button>
                                {Object.entries(layerCounts).map(([layer, count]) => (
                                    <button
                                        key={layer}
                                        className={`${styles.layerTab} ${selectedLayer === layer ? styles.layerTabActive : ''}`}
                                        onClick={() => handleLayerChange(layer)}
                                    >
                                        {LAYER_LABELS[layer] || layer} ({count})
                                    </button>
                                ))}
                            </div>

                            <select
                                className={styles.sortSelect}
                                value={sortOrder}
                                onChange={handleSortChange}
                            >
                                <option value="newest">Newest first</option>
                                <option value="oldest">Oldest first</option>
                                <option value="author">By author</option>
                            </select>

                            <span className={styles.resultCount}>
                                {layerFiltered.length} passage{layerFiltered.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Extracts list */}
                        {paged.length > 0 ? (
                            <div className={styles.extractsList}>
                                {paged.map(extract => {
                                    const extractTags = (extract.extract_tags || []).map(et => et.tags).filter(Boolean);
                                    const strategyTags = extractTags.filter(t => t.tag_type === 'strategy');
                                    const sourceTags = extractTags.filter(t => t.tag_type === 'source_type');
                                    const themeTags = extractTags.filter(t => t.tag_type === 'theme');
                                    const isExpanded = expandedId === extract.id;
                                    const hasCommentary = !!extract.commentary;
                                    const linkCount = crossLinkCounts[extract.id] || 0;

                                    return (
                                        <div
                                            key={extract.id}
                                            ref={isExpanded ? expandedRef : null}
                                            className={`${styles.extractCard} ${isExpanded ? styles.extractCardExpanded : ''}`}
                                            onClick={() => handleExtractClick(extract.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className={styles.extractAttribution}>
                                                <span className={styles.extractAuthor}>{getAuthor(extract)}</span>
                                                <span className={styles.extractSep}>·</span>
                                                <span className={styles.extractWork}>{extract.works?.title}</span>
                                                {extract.works?.year_published && (
                                                    <>
                                                        <span className={styles.extractSep}>·</span>
                                                        <span className={styles.extractYear}>{extract.works.year_published}</span>
                                                    </>
                                                )}
                                                <span className={`${styles.extractLayerBadge} ${styles[LAYER_STYLE_MAP[extract.layer]]}`}>
                                                    {LAYER_LABELS[extract.layer] || extract.layer}
                                                </span>
                                            </div>

                                            <p className={styles.extractQuote}>
                                                {extract.content}
                                            </p>

                                            {extract.source_reference && (
                                                <div className={styles.extractRef}>— {extract.source_reference}</div>
                                            )}

                                            {/* Tags on card (when not expanded) */}
                                            {!isExpanded && (strategyTags.length > 0 || sourceTags.length > 0) && (
                                                <div className={styles.extractTags}>
                                                    {strategyTags.map(t => (
                                                        <span key={t.id} className={styles.strategyTag}>{t.name}</span>
                                                    ))}
                                                    {sourceTags.map(t => (
                                                        <span key={t.id} className={styles.sourceTag}>{t.name}</span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Indicators */}
                                            {(hasCommentary || linkCount > 0) && !isExpanded && (
                                                <div className={styles.indicators}>
                                                    {hasCommentary && (
                                                        <span className={styles.indicatorCommentary}>
                                                            <span className={styles.indicatorIcon}>✦</span> Commentary
                                                        </span>
                                                    )}
                                                    {linkCount > 0 && (
                                                        <span className={styles.indicatorLinks}>
                                                            <span className={styles.indicatorIcon}>↯</span> {linkCount} connection{linkCount !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Expanded content */}
                                            {isExpanded && (
                                                <div className={styles.expandedWrapper} onClick={e => e.stopPropagation()}>
                                                    {/* Main content: cross-links below */}
                                                    <div className={styles.expandedMainContent}>
                                                        {/* Cross-links */}
                                                        {loadingLinks && (
                                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
                                                                Loading connections…
                                                            </p>
                                                        )}
                                                        {!loadingLinks && crossLinks.length > 0 && (
                                                            <div className={styles.crossLinksInline}>
                                                                <div className={styles.crossLinksTitle}>
                                                                    ↯ Tracing the Causal Chain
                                                                </div>
                                                                {crossLinks.map(link => {
                                                                    const isSource = link.source_extract_id === extract.id;
                                                                    const linked = isSource ? link.target : link.source;
                                                                    const direction = isSource ? '→' : '←';
                                                                    const linkedAuthor = linked?.works?.missionaries?.name || linked?.works?.author || '';

                                                                    return (
                                                                        <Link
                                                                            key={link.id}
                                                                            href={`/extract/${linked?.id}`}
                                                                            className={styles.crossLink}
                                                                            onClick={e => e.stopPropagation()}
                                                                        >
                                                                            <div className={styles.crossLinkArrow}>{direction}</div>
                                                                            <div className={styles.crossLinkContent}>
                                                                                <div className={styles.crossLinkMeta}>
                                                                                    <span className={`${styles.extractLayerBadge} ${styles[LAYER_STYLE_MAP[linked?.layer]]}`}>
                                                                                        {LAYER_LABELS[linked?.layer] || linked?.layer}
                                                                                    </span>
                                                                                    <span className={styles.crossLinkType}>{link.link_type}</span>
                                                                                </div>
                                                                                <div className={styles.crossLinkSource}>
                                                                                    {linkedAuthor && `${linkedAuthor}, `}
                                                                                    <em>{linked?.works?.title}</em>
                                                                                </div>
                                                                                <blockquote className={styles.crossLinkQuote}>
                                                                                    &ldquo;{linked?.content?.substring(0, 200)}...&rdquo;
                                                                                </blockquote>
                                                                                {link.commentary && (
                                                                                    <p className={styles.crossLinkCommentary}>{link.commentary}</p>
                                                                                )}
                                                                            </div>
                                                                        </Link>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Full page link */}
                                                        <Link
                                                            href={`/extract/${extract.id}`}
                                                            className={styles.fullPageLink}
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            Open full page →
                                                        </Link>
                                                    </div>

                                                    {/* Commentary side panel */}
                                                    <div className={styles.commentaryPanel}>
                                                        <div className={styles.commentaryLabel}>✦ Commentary</div>
                                                        {hasCommentary ? (
                                                            <div className={styles.commentaryText}>{extract.commentary}</div>
                                                        ) : (
                                                            <div className={styles.noCommentary}>No commentary yet.</div>
                                                        )}

                                                        {/* Tags in panel */}
                                                        {(themeTags.length > 0 || strategyTags.length > 0 || sourceTags.length > 0) && (
                                                            <div className={styles.panelTags}>
                                                                {themeTags.length > 0 && (
                                                                    <>
                                                                        <div className={styles.panelTagsLabel}>Themes</div>
                                                                        <div className={styles.panelTagsList}>
                                                                            {themeTags.map(t => (
                                                                                <span key={t.id} className={styles.themeTag}>{t.name}</span>
                                                                            ))}
                                                                        </div>
                                                                    </>
                                                                )}
                                                                {strategyTags.length > 0 && (
                                                                    <>
                                                                        <div className={styles.panelTagsLabel} style={{ marginTop: 'var(--space-sm)' }}>Strategies</div>
                                                                        <div className={styles.panelTagsList}>
                                                                            {strategyTags.map(t => (
                                                                                <span key={t.id} className={styles.strategyTag}>{t.name}</span>
                                                                            ))}
                                                                        </div>
                                                                    </>
                                                                )}
                                                                {sourceTags.length > 0 && (
                                                                    <>
                                                                        <div className={styles.panelTagsLabel} style={{ marginTop: 'var(--space-sm)' }}>Source Type</div>
                                                                        <div className={styles.panelTagsList}>
                                                                            {sourceTags.map(t => (
                                                                                <span key={t.id} className={styles.sourceTag}>{t.name}</span>
                                                                            ))}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                No passages found{selectedLayer !== 'all' ? ` in the ${LAYER_LABELS[selectedLayer]} layer` : ''}.
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    className={`${styles.pageBtn} ${safePage <= 1 ? styles.pageBtnDisabled : ''}`}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={safePage <= 1}
                                >
                                    ← Previous
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        className={`${styles.pageBtn} ${p === safePage ? styles.pageBtnActive : ''}`}
                                        onClick={() => setCurrentPage(p)}
                                    >
                                        {p}
                                    </button>
                                ))}

                                <button
                                    className={`${styles.pageBtn} ${safePage >= totalPages ? styles.pageBtnDisabled : ''}`}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={safePage >= totalPages}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
