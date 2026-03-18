'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './themes.module.css';
import ExtractPanel from '@/components/ExtractPanel';

const LAYERS = [
    { value: 'missionary', label: 'Missionary' },
    { value: 'bureaucratic', label: 'Bureaucratic' },
    { value: 'reform', label: 'Reform / Response' },
];

const LAYER_STYLE = {
    missionary: styles.layerMissionary,
    bureaucratic: styles.layerBureaucratic,
    reform: styles.layerReform,
};

const PAGE_SIZE = 10;

export default function ThemesPage() {
    const supabase = createClient();

    // --- Data ---
    const [allExtracts, setAllExtracts] = useState([]);
    const [parentThemes, setParentThemes] = useState([]);
    const [subThemes, setSubThemes] = useState([]);
    const [missionaries, setMissionaries] = useState([]);
    const [denominations, setDenominations] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Filters ---
    const [selectedTheme, setSelectedTheme] = useState(null); // parent or sub-theme id
    const [selectedThemeType, setSelectedThemeType] = useState(null); // 'parent' or 'sub'
    const [selectedLayers, setSelectedLayers] = useState([]);
    const [selectedDenominations, setSelectedDenominations] = useState([]);
    const [selectedMissionaries, setSelectedMissionaries] = useState([]);
    const [selectedSourceTypes, setSelectedSourceTypes] = useState([]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');

    // --- UI ---
    const [expandedThemes, setExpandedThemes] = useState({});
    const [expandedSections, setExpandedSections] = useState({ themes: true, layer: false, denomination: false, missionary: false, sourceType: false, dateRange: false });
    const [expandedExtract, setExpandedExtract] = useState(null);
    const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
    const [crossLinkCounts, setCrossLinkCounts] = useState({});
    const [crossLinks, setCrossLinks] = useState([]);
    const [loadingLinks, setLoadingLinks] = useState(false);
    const [panelExtractId, setPanelExtractId] = useState(null);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [introCollapsed, setIntroCollapsed] = useState(false);

    // Filter search
    const [missionarySearch, setMissionarySearch] = useState('');
    const [denominationSearch, setDenominationSearch] = useState('');

    const observerRef = useRef(null);
    const loaderRef = useRef(null);

    // --- Load all data on mount ---
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [extractsRes, tagsRes, missionariesRes, denomsRes] = await Promise.all([
            supabase.from('extracts').select(`
                *,
                works(id, title, year_published, author, layer, source_type, missionaries(id, name, denominations(id, name))),
                extract_tags(tag_id, tags(id, name, tag_type, parent_id))
            `).order('created_at', { ascending: false }),
            supabase.from('tags').select('*').eq('tag_type', 'theme').order('created_at'),
            supabase.from('missionaries').select('id, name').order('name'),
            supabase.from('denominations').select('id, name').order('name'),
        ]);

        const extracts = extractsRes.data || [];
        const tags = tagsRes.data || [];

        setAllExtracts(extracts);
        setParentThemes(tags.filter(t => !t.parent_id));
        setSubThemes(tags.filter(t => t.parent_id));
        setMissionaries(missionariesRes.data || []);
        setDenominations(denomsRes.data || []);

        // Load cross-link counts
        const extractIds = extracts.map(e => e.id);
        if (extractIds.length > 0) {
            try {
                const { data: links } = await supabase
                    .from('extract_links')
                    .select('source_extract_id, target_extract_id');

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
                // extract_links might not exist
            }
        }

        setLoading(false);
    };

    // --- Filtering ---
    const getExtractTagIds = (extract) => (extract.extract_tags || []).map(et => et.tag_id);
    const getExtractThemeIds = (extract) =>
        (extract.extract_tags || []).filter(et => et.tags?.tag_type === 'theme').map(et => et.tag_id);

    const filteredExtracts = allExtracts.filter(extract => {
        // Theme/sub-theme filter (single select)
        if (selectedTheme) {
            const themeIds = getExtractThemeIds(extract);
            if (selectedThemeType === 'parent') {
                // Show all extracts in any sub-theme of this parent
                const childIds = subThemes.filter(s => s.parent_id === selectedTheme).map(s => s.id);
                const allIds = [selectedTheme, ...childIds];
                if (!themeIds.some(id => allIds.includes(id))) return false;
            } else {
                if (!themeIds.includes(selectedTheme)) return false;
            }
        }

        // Layer filter
        if (selectedLayers.length > 0) {
            if (!selectedLayers.includes(extract.layer)) return false;
        }

        // Denomination filter
        if (selectedDenominations.length > 0) {
            const denomId = extract.works?.missionaries?.denominations?.id;
            if (!denomId || !selectedDenominations.includes(denomId)) return false;
        }

        // Missionary filter
        if (selectedMissionaries.length > 0) {
            const missId = extract.works?.missionaries?.id;
            if (!missId || !selectedMissionaries.includes(missId)) return false;
        }

        // Source type filter
        if (selectedSourceTypes.length > 0) {
            if (!extract.works?.source_type || !selectedSourceTypes.includes(extract.works.source_type)) return false;
        }

        // Date range filter
        if (dateFrom && extract.works?.year_published && extract.works.year_published < parseInt(dateFrom)) return false;
        if (dateTo && extract.works?.year_published && extract.works.year_published > parseInt(dateTo)) return false;

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const content = (extract.content || '').toLowerCase();
            const author = (extract.works?.missionaries?.name || extract.works?.author || '').toLowerCase();
            const title = (extract.works?.title || '').toLowerCase();
            if (!content.includes(q) && !author.includes(q) && !title.includes(q)) return false;
        }

        return true;
    });

    // --- Sorting ---
    const sortedExtracts = [...filteredExtracts].sort((a, b) => {
        switch (sortOrder) {
            case 'oldest':
                return (a.works?.year_published || 9999) - (b.works?.year_published || 9999);
            case 'newest':
                return (b.works?.year_published || 0) - (a.works?.year_published || 0);
            case 'author':
                const authA = a.works?.missionaries?.name || a.works?.author || '';
                const authB = b.works?.missionaries?.name || b.works?.author || '';
                return authA.localeCompare(authB);
            case 'recent':
            default:
                return new Date(b.created_at) - new Date(a.created_at);
        }
    });

    const visibleExtracts = sortedExtracts.slice(0, displayCount);
    const hasMore = displayCount < sortedExtracts.length;

    // --- Infinite scroll ---
    useEffect(() => {
        if (!hasMore || loading) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setDisplayCount(prev => prev + PAGE_SIZE);
                }
            },
            { rootMargin: '200px' }
        );
        if (loaderRef.current) observer.observe(loaderRef.current);
        observerRef.current = observer;
        return () => observer.disconnect();
    }, [hasMore, loading, displayCount]);

    // Reset display count on filter/sort changes
    useEffect(() => {
        setDisplayCount(PAGE_SIZE);
        setExpandedExtract(null);
    }, [selectedTheme, selectedLayers, selectedDenominations, selectedMissionaries, selectedSourceTypes, dateFrom, dateTo, searchQuery, sortOrder]);

    // --- Expand extract ---
    const handleExpandExtract = async (extractId) => {
        if (expandedExtract === extractId) {
            setExpandedExtract(null);
            setCrossLinks([]);
            return;
        }
        setExpandedExtract(extractId);
        setLoadingLinks(true);

        try {
            const { data: links } = await supabase
                .from('extract_links')
                .select(`
                    *,
                    source:extracts!extract_links_source_extract_id_fkey(id, content, works(title, missionaries(name), author)),
                    target:extracts!extract_links_target_extract_id_fkey(id, content, works(title, missionaries(name), author))
                `)
                .or(`source_extract_id.eq.${extractId},target_extract_id.eq.${extractId}`);
            setCrossLinks(links || []);
        } catch (e) {
            setCrossLinks([]);
        }
        setLoadingLinks(false);
    };

    // --- Helpers ---
    const getAuthor = (extract) => {
        if (extract.works?.missionaries?.name) return extract.works.missionaries.name;
        if (extract.works?.author) return extract.works.author;
        return 'Unknown';
    };

    const getSelectedThemeInfo = () => {
        if (!selectedTheme) return null;
        if (selectedThemeType === 'parent') {
            return parentThemes.find(t => t.id === selectedTheme);
        }
        return subThemes.find(t => t.id === selectedTheme);
    };

    const getSelectedParentForSub = () => {
        if (selectedThemeType !== 'sub') return null;
        const sub = subThemes.find(t => t.id === selectedTheme);
        if (!sub) return null;
        return parentThemes.find(p => p.id === sub.parent_id);
    };

    // Get unique source types from loaded data
    const sourceTypeOptions = [...new Set(allExtracts.map(e => e.works?.source_type).filter(Boolean))].sort();

    // Extract counts per theme
    const themeExtractCounts = {};
    allExtracts.forEach(e => {
        getExtractThemeIds(e).forEach(tid => {
            themeExtractCounts[tid] = (themeExtractCounts[tid] || 0) + 1;
        });
    });
    // Parent counts = sum of children
    parentThemes.forEach(p => {
        const childIds = subThemes.filter(s => s.parent_id === p.id).map(s => s.id);
        themeExtractCounts[p.id] = childIds.reduce((sum, cid) => sum + (themeExtractCounts[cid] || 0), 0);
    });

    const clearAllFilters = () => {
        setSelectedTheme(null);
        setSelectedThemeType(null);
        setSelectedLayers([]);
        setSelectedDenominations([]);
        setSelectedMissionaries([]);
        setSelectedSourceTypes([]);
        setDateFrom('');
        setDateTo('');
        setSearchQuery('');
    };

    const hasActiveFilters = selectedTheme || selectedLayers.length > 0 || selectedDenominations.length > 0 ||
        selectedMissionaries.length > 0 || selectedSourceTypes.length > 0 || dateFrom || dateTo;

    const toggleCheckbox = (arr, setArr, val) => {
        setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    };

    const themeInfo = getSelectedThemeInfo();
    const parentForSub = getSelectedParentForSub();

    // --- Render ---
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

    return (
        <div className="page-content">
            <div className="container">
                {/* Mobile filter toggle */}
                <button
                    className={styles.mobileFilterToggle}
                    onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                >
                    {mobileFiltersOpen ? '✕ Hide Filters' : '☰ Filters & Themes'}
                </button>

                <div className={styles.pageLayout}>
                    {/* === FILTER SIDEBAR === */}
                    <aside className={`${styles.filterSidebar} ${mobileFiltersOpen ? styles.filterSidebarOpen : ''}`}>
                        <div className={styles.filterHeader}>
                            <span className={styles.filterTitle}>Filters</span>
                            {hasActiveFilters && (
                                <button className={styles.clearAllBtn} onClick={clearAllFilters}>Clear all</button>
                            )}
                        </div>

                        {/* Active filter pills */}
                        {hasActiveFilters && (
                            <div className={styles.activeFilters}>
                                {themeInfo && (
                                    <span className={styles.activeFilterPill}>
                                        {parentForSub ? `${parentForSub.name} › ` : ''}{themeInfo.name}
                                        <button className={styles.activeFilterRemove} onClick={() => { setSelectedTheme(null); setSelectedThemeType(null); }}>×</button>
                                    </span>
                                )}
                                {selectedLayers.map(l => (
                                    <span key={l} className={styles.activeFilterPill}>
                                        {LAYERS.find(x => x.value === l)?.label}
                                        <button className={styles.activeFilterRemove} onClick={() => setSelectedLayers(p => p.filter(v => v !== l))}>×</button>
                                    </span>
                                ))}
                                {selectedDenominations.map(id => (
                                    <span key={id} className={styles.activeFilterPill}>
                                        {denominations.find(d => d.id === id)?.name}
                                        <button className={styles.activeFilterRemove} onClick={() => setSelectedDenominations(p => p.filter(v => v !== id))}>×</button>
                                    </span>
                                ))}
                                {selectedMissionaries.map(id => (
                                    <span key={id} className={styles.activeFilterPill}>
                                        {missionaries.find(m => m.id === id)?.name}
                                        <button className={styles.activeFilterRemove} onClick={() => setSelectedMissionaries(p => p.filter(v => v !== id))}>×</button>
                                    </span>
                                ))}
                                {selectedSourceTypes.map(st => (
                                    <span key={st} className={styles.activeFilterPill}>
                                        {st}
                                        <button className={styles.activeFilterRemove} onClick={() => setSelectedSourceTypes(p => p.filter(v => v !== st))}>×</button>
                                    </span>
                                ))}
                                {(dateFrom || dateTo) && (
                                    <span className={styles.activeFilterPill}>
                                        {dateFrom || '...'} — {dateTo || '...'}
                                        <button className={styles.activeFilterRemove} onClick={() => { setDateFrom(''); setDateTo(''); }}>×</button>
                                    </span>
                                )}
                            </div>
                        )}

                        {/* THEMES */}
                        <div className={styles.filterSection}>
                            <button className={styles.filterSectionHeader} onClick={() => setExpandedSections(p => ({ ...p, themes: !p.themes }))}>
                                <span className={styles.filterSectionLabel}>Themes</span>
                                <span className={`${styles.filterSectionArrow} ${expandedSections.themes ? styles.filterSectionArrowOpen : ''}`}>›</span>
                            </button>
                            {expandedSections.themes && (
                                <div className={styles.filterSectionBody}>
                                    {parentThemes.map(parent => {
                                        const children = subThemes.filter(s => s.parent_id === parent.id);
                                        const isExpanded = expandedThemes[parent.id];
                                        const isSelected = selectedTheme === parent.id && selectedThemeType === 'parent';

                                        return (
                                            <div key={parent.id} className={styles.themeParentItem}>
                                                <div className={`${styles.themeParentRow} ${isSelected ? styles.themeParentRowSelected : ''}`}>
                                                    {children.length > 0 && (
                                                        <button
                                                            className={`${styles.themeExpandBtn} ${isExpanded ? styles.themeExpandBtnOpen : ''}`}
                                                            onClick={(e) => { e.stopPropagation(); setExpandedThemes(p => ({ ...p, [parent.id]: !p[parent.id] })); }}
                                                        >›</button>
                                                    )}
                                                    <input
                                                        type="radio"
                                                        className={styles.themeRadio}
                                                        name="themeFilter"
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            if (isSelected) { setSelectedTheme(null); setSelectedThemeType(null); }
                                                            else { setSelectedTheme(parent.id); setSelectedThemeType('parent'); setIntroCollapsed(false); }
                                                        }}
                                                    />
                                                    <span className={styles.themeParentName} onClick={() => {
                                                        if (isSelected) { setSelectedTheme(null); setSelectedThemeType(null); }
                                                        else { setSelectedTheme(parent.id); setSelectedThemeType('parent'); setIntroCollapsed(false); setExpandedThemes(p => ({ ...p, [parent.id]: true })); }
                                                    }}>{parent.name}</span>
                                                    <span className={styles.themeCount}>({themeExtractCounts[parent.id] || 0})</span>
                                                </div>

                                                {isExpanded && children.length > 0 && (
                                                    <div className={styles.themeChildList}>
                                                        {children.map(child => {
                                                            const isChildSelected = selectedTheme === child.id && selectedThemeType === 'sub';
                                                            return (
                                                                <div key={child.id} className={`${styles.themeChildRow} ${isChildSelected ? styles.themeChildRowSelected : ''}`}>
                                                                    <input
                                                                        type="radio"
                                                                        className={styles.themeRadio}
                                                                        name="themeFilter"
                                                                        checked={isChildSelected}
                                                                        onChange={() => {
                                                                            if (isChildSelected) { setSelectedTheme(null); setSelectedThemeType(null); }
                                                                            else { setSelectedTheme(child.id); setSelectedThemeType('sub'); setIntroCollapsed(false); }
                                                                        }}
                                                                    />
                                                                    <span className={styles.themeChildName} onClick={() => {
                                                                        if (isChildSelected) { setSelectedTheme(null); setSelectedThemeType(null); }
                                                                        else { setSelectedTheme(child.id); setSelectedThemeType('sub'); setIntroCollapsed(false); }
                                                                    }}>{child.name}</span>
                                                                    <span className={styles.themeCount}>({themeExtractCounts[child.id] || 0})</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* LAYER */}
                        <div className={styles.filterSection}>
                            <button className={styles.filterSectionHeader} onClick={() => setExpandedSections(p => ({ ...p, layer: !p.layer }))}>
                                <span className={styles.filterSectionLabel}>Layer</span>
                                <span className={`${styles.filterSectionArrow} ${expandedSections.layer ? styles.filterSectionArrowOpen : ''}`}>›</span>
                            </button>
                            {expandedSections.layer && (
                                <div className={styles.filterSectionBody}>
                                    {LAYERS.map(l => (
                                        <label key={l.value} className={styles.checkboxItem}>
                                            <input type="checkbox" className={styles.checkbox} checked={selectedLayers.includes(l.value)} onChange={() => toggleCheckbox(selectedLayers, setSelectedLayers, l.value)} />
                                            <span className={styles.checkboxLabel}>{l.label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* DENOMINATION */}
                        <div className={styles.filterSection}>
                            <button className={styles.filterSectionHeader} onClick={() => setExpandedSections(p => ({ ...p, denomination: !p.denomination }))}>
                                <span className={styles.filterSectionLabel}>Denomination</span>
                                <span className={`${styles.filterSectionArrow} ${expandedSections.denomination ? styles.filterSectionArrowOpen : ''}`}>›</span>
                            </button>
                            {expandedSections.denomination && (
                                <div className={styles.filterSectionBody}>
                                    {denominations.length > 5 && (
                                        <input type="text" className={styles.filterSearch} placeholder="Search denominations..." value={denominationSearch} onChange={e => setDenominationSearch(e.target.value)} />
                                    )}
                                    {denominations.filter(d => !denominationSearch || d.name.toLowerCase().includes(denominationSearch.toLowerCase())).map(d => (
                                        <label key={d.id} className={styles.checkboxItem}>
                                            <input type="checkbox" className={styles.checkbox} checked={selectedDenominations.includes(d.id)} onChange={() => toggleCheckbox(selectedDenominations, setSelectedDenominations, d.id)} />
                                            <span className={styles.checkboxLabel}>{d.name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* MISSIONARY */}
                        <div className={styles.filterSection}>
                            <button className={styles.filterSectionHeader} onClick={() => setExpandedSections(p => ({ ...p, missionary: !p.missionary }))}>
                                <span className={styles.filterSectionLabel}>Missionary</span>
                                <span className={`${styles.filterSectionArrow} ${expandedSections.missionary ? styles.filterSectionArrowOpen : ''}`}>›</span>
                            </button>
                            {expandedSections.missionary && (
                                <div className={styles.filterSectionBody}>
                                    {missionaries.length > 5 && (
                                        <input type="text" className={styles.filterSearch} placeholder="Search missionaries..." value={missionarySearch} onChange={e => setMissionarySearch(e.target.value)} />
                                    )}
                                    {missionaries.filter(m => !missionarySearch || m.name.toLowerCase().includes(missionarySearch.toLowerCase())).map(m => (
                                        <label key={m.id} className={styles.checkboxItem}>
                                            <input type="checkbox" className={styles.checkbox} checked={selectedMissionaries.includes(m.id)} onChange={() => toggleCheckbox(selectedMissionaries, setSelectedMissionaries, m.id)} />
                                            <span className={styles.checkboxLabel}>{m.name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* SOURCE TYPE */}
                        <div className={styles.filterSection}>
                            <button className={styles.filterSectionHeader} onClick={() => setExpandedSections(p => ({ ...p, sourceType: !p.sourceType }))}>
                                <span className={styles.filterSectionLabel}>Source Type</span>
                                <span className={`${styles.filterSectionArrow} ${expandedSections.sourceType ? styles.filterSectionArrowOpen : ''}`}>›</span>
                            </button>
                            {expandedSections.sourceType && (
                                <div className={styles.filterSectionBody}>
                                    {sourceTypeOptions.map(st => (
                                        <label key={st} className={styles.checkboxItem}>
                                            <input type="checkbox" className={styles.checkbox} checked={selectedSourceTypes.includes(st)} onChange={() => toggleCheckbox(selectedSourceTypes, setSelectedSourceTypes, st)} />
                                            <span className={styles.checkboxLabel}>{st}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* DATE RANGE */}
                        <div className={styles.filterSection}>
                            <button className={styles.filterSectionHeader} onClick={() => setExpandedSections(p => ({ ...p, dateRange: !p.dateRange }))}>
                                <span className={styles.filterSectionLabel}>Date Range</span>
                                <span className={`${styles.filterSectionArrow} ${expandedSections.dateRange ? styles.filterSectionArrowOpen : ''}`}>›</span>
                            </button>
                            {expandedSections.dateRange && (
                                <div className={styles.filterSectionBody}>
                                    <div className={styles.dateRangeRow}>
                                        <input type="number" className={styles.dateInput} placeholder="From" value={dateFrom} onChange={e => setDateFrom(e.target.value)} min="1700" max="1950" />
                                        <span className={styles.dateSep}>—</span>
                                        <input type="number" className={styles.dateInput} placeholder="To" value={dateTo} onChange={e => setDateTo(e.target.value)} min="1700" max="1950" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* === MAIN CONTENT === */}
                    <main className={styles.mainContent}>
                        {/* Top Bar */}
                        <div className={styles.topBar}>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search extracts..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            <select className={styles.sortSelect} value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                                <option value="newest">Date (newest)</option>
                                <option value="oldest">Date (oldest)</option>
                                <option value="author">By missionary</option>
                                <option value="recent">Recently added</option>
                            </select>
                            <span className={styles.resultCount}>{sortedExtracts.length} extract{sortedExtracts.length !== 1 ? 's' : ''}</span>
                        </div>


                        {/* Scholarly intro banner */}
                        {themeInfo && (themeInfo.description || themeInfo.introduction) && !introCollapsed && (
                            <div className={styles.introBanner}>
                                <div className={styles.introBannerHeader}>
                                    <span className={styles.introBannerTitle}>
                                        {parentForSub ? `${parentForSub.name} › ` : ''}{themeInfo.name}
                                    </span>
                                    <button className={styles.introBannerToggle} onClick={() => setIntroCollapsed(true)}>▲ Hide</button>
                                </div>
                                {themeInfo.description && (
                                    <p className={styles.introBannerDesc}>{themeInfo.description}</p>
                                )}
                                {themeInfo.introduction && (
                                    <div className={styles.introBannerText}>{themeInfo.introduction}</div>
                                )}
                            </div>
                        )}
                        {themeInfo && introCollapsed && (
                            <button
                                className={styles.introBannerToggle}
                                onClick={() => setIntroCollapsed(false)}
                                style={{ marginBottom: 'var(--space-md)', display: 'block' }}
                            >
                                ▼ Show introduction for {themeInfo.name}
                            </button>
                        )}

                        {/* Extract list */}
                        {sortedExtracts.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyStateIcon}>📜</div>
                                <div className={styles.emptyStateText}>No extracts match your filters</div>
                            </div>
                        ) : (
                            <div className={styles.extractsList}>
                                {visibleExtracts.map(extract => {
                                    const author = getAuthor(extract);
                                    const isExpanded = expandedExtract === extract.id;
                                    const hasCommentary = !!extract.commentary;
                                    const linkCount = crossLinkCounts[extract.id] || 0;
                                    const extractTags = (extract.extract_tags || []).map(et => et.tags).filter(Boolean);
                                    const strategyTags = extractTags.filter(t => t.tag_type === 'strategy');
                                    const themeTags = extractTags.filter(t => t.tag_type === 'theme');

                                    return (
                                        <div
                                            key={extract.id}
                                            className={`${styles.extractCard} ${isExpanded ? styles.extractCardExpanded : ''}`}
                                            onClick={() => handleExpandExtract(extract.id)}
                                        >
                                            {/* Metadata above text */}
                                            <div className={styles.extractMeta}>
                                                <div className={styles.extractMetaRow}>
                                                    <span className={styles.extractAuthor}>{author}</span>
                                                    {extract.works?.missionaries?.denominations?.name && (
                                                        <>
                                                            <span className={styles.extractSep}>·</span>
                                                            <span>{extract.works.missionaries.denominations.name}</span>
                                                        </>
                                                    )}
                                                    {extract.works?.year_published && (
                                                        <>
                                                            <span className={styles.extractSep}>·</span>
                                                            <span className={styles.extractYear}>{extract.works.year_published}</span>
                                                        </>
                                                    )}
                                                    {extract.works?.source_type && (
                                                        <>
                                                            <span className={styles.extractSep}>·</span>
                                                            <span className={styles.extractSourceType}>{extract.works.source_type}</span>
                                                        </>
                                                    )}
                                                    {extract.layer && (
                                                        <span className={`${styles.extractLayerBadge} ${LAYER_STYLE[extract.layer] || ''}`}>
                                                            {extract.layer}
                                                        </span>
                                                    )}
                                                </div>
                                                {extract.works?.title && (
                                                    <div className={styles.extractMetaRow}>
                                                        <span className={styles.extractWork}>{extract.works.title}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Extract text */}
                                            <div className={styles.extractQuote}>{extract.content}</div>

                                            {extract.source_reference && (
                                                <div className={styles.extractRef}>— {extract.source_reference}</div>
                                            )}

                                            {/* Indicators */}
                                            {(hasCommentary || linkCount > 0) && !isExpanded && (
                                                <div className={styles.indicators}>
                                                    {hasCommentary && (
                                                        <span className={`${styles.indicator} ${styles.indicatorCommentary}`}>
                                                            💬 Commentary
                                                        </span>
                                                    )}
                                                    {linkCount > 0 && (
                                                        <span className={`${styles.indicator} ${styles.indicatorLinks}`}>
                                                            📎 {linkCount} connection{linkCount !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Tags */}
                                            {(strategyTags.length > 0 || themeTags.length > 0) && !isExpanded && (
                                                <div className={styles.extractTags}>
                                                    {themeTags.map(t => (
                                                        <span key={t.id} className={styles.themeTag}>{t.name}</span>
                                                    ))}
                                                    {strategyTags.map(t => (
                                                        <span key={t.id} className={styles.strategyTag}>{t.name}</span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Expanded content */}
                                            {isExpanded && (
                                                <div className={styles.expandedContent} onClick={e => e.stopPropagation()}>
                                                    {/* Tags */}
                                                    {(strategyTags.length > 0 || themeTags.length > 0) && (
                                                        <div className={styles.extractTags} style={{ marginBottom: 'var(--space-md)' }}>
                                                            {themeTags.map(t => (
                                                                <span key={t.id} className={styles.themeTag}>{t.name}</span>
                                                            ))}
                                                            {strategyTags.map(t => (
                                                                <span key={t.id} className={styles.strategyTag}>{t.name}</span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Commentary */}
                                                    {hasCommentary && (
                                                        <div className={styles.commentarySection}>
                                                            <div className={styles.commentaryLabel}>✦ Commentary</div>
                                                            <div className={styles.commentaryText}>{extract.commentary}</div>
                                                        </div>
                                                    )}

                                                    {/* Cross-links */}
                                                    {crossLinks.length > 0 && (
                                                        <div className={styles.crossLinksSection}>
                                                            <div className={styles.crossLinksTitle}>📎 Connected Extracts ({crossLinks.length})</div>
                                                            {crossLinks.map(link => {
                                                                const isSource = link.source_extract_id === extract.id;
                                                                const linked = isSource ? link.target : link.source;
                                                                if (!linked) return null;
                                                                const linkedAuthor = linked.works?.missionaries?.name || linked.works?.author || 'Unknown';

                                                                return (
                                                                    <button
                                                                        key={link.id}
                                                                        className={styles.crossLinkItem}
                                                                        onClick={(e) => { e.stopPropagation(); setPanelExtractId(linked.id); }}
                                                                    >
                                                                        <span className={styles.crossLinkArrow}>↗</span>
                                                                        <div className={styles.crossLinkContent}>
                                                                            <div className={styles.crossLinkSource}>{linkedAuthor} — {linked.works?.title || 'Untitled'}</div>
                                                                            <p className={styles.crossLinkPreview}>{linked.content?.substring(0, 150)}...</p>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                    {loadingLinks && crossLinks.length === 0 && (
                                                        <div className={styles.scrollLoader}>Loading connections...</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Infinite scroll loader */}
                        {hasMore && (
                            <div ref={loaderRef} className={styles.scrollLoader}>
                                <div className={styles.loadingDots}>
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                    </main>
                </div>

                {/* Slide-out panel for cross-linked extracts */}
                {panelExtractId && (
                    <ExtractPanel
                        extractId={panelExtractId}
                        onClose={() => setPanelExtractId(null)}
                        onNavigate={(id) => setPanelExtractId(id)}
                        supabase={supabase}
                    />
                )}
            </div>
        </div>
    );
}
