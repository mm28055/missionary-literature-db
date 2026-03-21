'use client';

import { useState, useEffect } from 'react';
import styles from './ExtractPanel.module.css';

const LAYER_STYLE = {
    missionary: styles.layerMissionary,
    bureaucratic: styles.layerBureaucratic,
    reform: styles.layerReform,
};

export default function ExtractPanel({ extractId, onClose, onNavigate, supabase }) {
    const [extract, setExtract] = useState(null);
    const [crossLinks, setCrossLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [citedInOpen, setCitedInOpen] = useState(false);

    useEffect(() => {
        if (extractId) loadExtract(extractId);
    }, [extractId]);

    const loadExtract = async (id) => {
        setLoading(true);
        setCitedInOpen(false);
        const { data } = await supabase
            .from('extracts')
            .select(`
                *,
                works(title, year_published, author, layer, source_type, missionaries(name, denominations(name))),
                extract_tags(tags(id, name, tag_type))
            `)
            .eq('id', id)
            .single();

        setExtract(data);

        // Load cross-links
        try {
            const { data: links } = await supabase
                .from('extract_links')
                .select(`
                    *,
                    source:extracts!extract_links_source_extract_id_fkey(id, content, works(title, missionaries(name), author)),
                    target:extracts!extract_links_target_extract_id_fkey(id, content, works(title, missionaries(name), author))
                `)
                .or(`source_extract_id.eq.${id},target_extract_id.eq.${id}`);
            setCrossLinks(links || []);
        } catch (e) {
            setCrossLinks([]);
        }

        setLoading(false);
    };

    const handleNavigate = (targetId) => {
        setHistory(prev => [...prev, extractId]);
        onNavigate(targetId);
    };

    const handleBack = () => {
        const prev = history[history.length - 1];
        setHistory(h => h.slice(0, -1));
        onNavigate(prev);
    };

    // Close on escape key
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const getAuthor = (ext) => {
        if (ext?.works?.missionaries?.name) return ext.works.missionaries.name;
        if (ext?.works?.author) return ext.works.author;
        return 'Unknown';
    };

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.panel}>
                <div className={styles.panelHeader}>
                    <button
                        className={styles.backBtn}
                        onClick={handleBack}
                        disabled={history.length === 0}
                    >
                        ← Back
                    </button>
                    <span className={styles.panelTitle}>Linked Extract</span>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.panelBody}>
                    {loading ? (
                        <div className={styles.loading}>Loading extract...</div>
                    ) : extract ? (
                        <>
                            {/* Metadata */}
                            <div className={styles.metaRow}>
                                <span className={styles.author}>{getAuthor(extract)}</span>
                                {extract.works?.missionaries?.denominations?.name && (
                                    <>
                                        <span className={styles.sep}>·</span>
                                        <span>{extract.works.missionaries.denominations.name}</span>
                                    </>
                                )}
                                {extract.works?.year_published && (
                                    <>
                                        <span className={styles.sep}>·</span>
                                        <span className={styles.year}>{extract.works.year_published}</span>
                                    </>
                                )}
                                {extract.layer && (
                                    <span className={`${styles.layerBadge} ${LAYER_STYLE[extract.layer] || ''}`}>
                                        {extract.layer}
                                    </span>
                                )}
                            </div>
                            {extract.works?.title && (
                                <div className={styles.metaRow}>
                                    <span className={styles.work}>{extract.works.title}</span>
                                    {extract.works?.source_type && (
                                        <>
                                            <span className={styles.sep}>·</span>
                                            <span className={styles.sourceType}>{extract.works.source_type}</span>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Tags */}
                            {extract.extract_tags?.length > 0 && (
                                <div className={styles.tags}>
                                    {extract.extract_tags.map(et => et.tags).filter(Boolean).map(tag => (
                                        <span key={tag.id} className={tag.tag_type === 'theme' ? styles.themeTag : styles.strategyTag}>
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Content */}
                            <div className={styles.quote}>{extract.content}</div>
                            {extract.source_reference && (
                                <div className={styles.ref}>— {extract.source_reference}</div>
                            )}

                            {/* Commentary */}
                            {extract.commentary && (
                                <div className={styles.commentarySection}>
                                    <div className={styles.commentaryLabel}>✦ Commentary</div>
                                    <div className={styles.commentaryText}>{extract.commentary}</div>
                                </div>
                            )}

                            {/* Cited In */}
                            {extract.cited_in && (() => {
                                const lines = extract.cited_in.split('\n').filter(l => l.trim());
                                return (
                                    <div className={styles.citedInSection}>
                                        <button
                                            className={styles.citedInToggle}
                                            onClick={() => setCitedInOpen(prev => !prev)}
                                            aria-expanded={citedInOpen}
                                        >
                                            <span>📖 Cited in{lines.length > 0 ? ` (${lines.length})` : ''}</span>
                                            <span className={`${styles.citedInChevron} ${citedInOpen ? styles.citedInChevronOpen : ''}`}>›</span>
                                        </button>
                                        {citedInOpen && (
                                            <div className={styles.citedInContent}>
                                                {lines.map((line, i) => (
                                                    <div key={i} className={styles.citedInLine}>{line.trim()}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

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
                                                onClick={() => handleNavigate(linked.id)}
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
                        </>
                    ) : (
                        <div className={styles.loading}>Extract not found</div>
                    )}
                </div>
            </div>
        </>
    );
}
