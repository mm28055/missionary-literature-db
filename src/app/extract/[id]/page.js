import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './extract.module.css';
import ThemeSidebar from '@/components/ThemeSidebar';
import sidebarStyles from '@/components/ThemeSidebar.module.css';

export const dynamic = 'force-dynamic';

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

export async function generateMetadata({ params }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: extract } = await supabase
        .from('extracts')
        .select('content, works(title, missionaries(name), author)')
        .eq('id', id)
        .single();

    if (!extract) return { title: 'Extract Not Found' };

    const author = extract.works?.missionaries?.name || extract.works?.author || '';
    const title = extract.works?.title || '';

    return {
        title: `${author ? author + ' — ' : ''}${title} — Colonial Discourse & Indian Selfhood`,
        description: extract.content?.substring(0, 160),
    };
}

export default async function ExtractDetailPage({ params }) {
    const { id } = await params;
    const supabase = await createClient();

    // Load the extract with all relationships
    const { data: extract, error: extractError } = await supabase
        .from('extracts')
        .select(`
            *,
            works(title, year_published, publisher, bibliographic_info, author, layer,
                missionaries(name, bio, denominations(name))),
            extract_tags(tags(id, name, tag_type, parent_id))
        `)
        .eq('id', id)
        .single();

    if (extractError) {
        console.error('Extract query error:', extractError.message);
    }

    if (!extract) notFound();

    // Load cross-links (gracefully handle missing table)
    let crossLinks = [];
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
            .or(`source_extract_id.eq.${id},target_extract_id.eq.${id}`);
        if (!error) crossLinks = data || [];
    } catch (e) {
        // extract_links table may not exist yet
    }

    // Organize tags
    const allTags = (extract.extract_tags || []).map(et => et.tags).filter(Boolean);
    const themeTags = allTags.filter(t => t.tag_type === 'theme');
    const strategyTags = allTags.filter(t => t.tag_type === 'strategy');
    const sourceType = extract.works?.source_type;

    const author = extract.works?.missionaries?.name || extract.works?.author || 'Unknown';
    const denomination = extract.works?.missionaries?.denominations?.name;

    // Try to find a parent theme for breadcrumb (first theme tag with a parent_id)
    const subThemeTag = themeTags.find(t => t.parent_id);

    // Load parent theme for breadcrumb if we have a sub-theme
    let parentTheme = null;
    if (subThemeTag) {
        const { data: parent } = await supabase
            .from('tags')
            .select('id, name')
            .eq('id', subThemeTag.parent_id)
            .single();
        parentTheme = parent;
    }

    return (
        <div className="page-content">
            <div className="container">
                <div className={sidebarStyles.sidebarLayout}>
                    <ThemeSidebar />
                    <div className={sidebarStyles.sidebarContent}>
                        <div className={styles.extractPage}>
                            {/* Breadcrumb */}
                            <nav style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.78rem',
                                color: 'var(--text-muted)',
                                marginBottom: 'var(--space-xl)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                flexWrap: 'wrap',
                            }}>
                                <Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
                                <span style={{ color: 'var(--border-medium)' }}>›</span>
                                <Link href="/themes" style={{ color: 'var(--text-muted)' }}>Themes</Link>
                                {parentTheme && (
                                    <>
                                        <span style={{ color: 'var(--border-medium)' }}>›</span>
                                        <Link href={`/themes/${parentTheme.id}`} style={{ color: 'var(--text-muted)' }}>{parentTheme.name}</Link>
                                    </>
                                )}
                                {subThemeTag && parentTheme && (
                                    <>
                                        <span style={{ color: 'var(--border-medium)' }}>›</span>
                                        <Link href={`/themes/${parentTheme.id}/${subThemeTag.id}`} style={{ color: 'var(--text-muted)' }}>{subThemeTag.name}</Link>
                                    </>
                                )}
                                <span style={{ color: 'var(--border-medium)' }}>›</span>
                                <span style={{ color: 'var(--text-secondary)' }}>Extract</span>
                            </nav>

                            {/* Header */}
                            <header className={styles.extractHeader}>
                                <div className={styles.extractMeta}>
                                    <span className={styles.extractAuthor}>{author}</span>
                                </div>
                                <div className={styles.extractWork}>
                                    {extract.works?.title}
                                    {extract.works?.year_published && ` (${extract.works.year_published})`}
                                </div>
                                <div className={styles.metaRow}>
                                    <span className={`${styles.layerBadgeLg} ${styles[LAYER_STYLE_MAP[extract.layer]]}`}>
                                        {LAYER_LABELS[extract.layer] || extract.layer}
                                    </span>
                                    {denomination && (
                                        <span className={styles.denomination}>{denomination}</span>
                                    )}
                                </div>
                                {extract.source_reference && (
                                    <div className={styles.sourceRef}>{extract.source_reference}</div>
                                )}
                            </header>

                            {/* The extract text */}
                            <section className={styles.quoteSection}>
                                <blockquote className={styles.quoteBlock}>
                                    {extract.content}
                                </blockquote>
                            </section>

                            {/* Commentary */}
                            {extract.commentary && (
                                <section className={styles.commentarySection}>
                                    <div className={styles.commentaryLabel}>✦ Commentary</div>
                                    <div className={styles.commentaryText}>{extract.commentary}</div>
                                </section>
                            )}

                            {/* Tags */}
                            {(themeTags.length > 0 || strategyTags.length > 0 || sourceType) && (
                                <section className={styles.tagsSection}>
                                    {themeTags.length > 0 && (
                                        <>
                                            <div className={styles.tagsLabel}>Themes</div>
                                            <div className={styles.tagsList}>
                                                {themeTags.map(t => (
                                                    <span key={t.id} className={styles.themeTag}>{t.name}</span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    {strategyTags.length > 0 && (
                                        <>
                                            <div className={styles.tagsLabel}>Discursive Strategies</div>
                                            <div className={styles.tagsList}>
                                                {strategyTags.map(t => (
                                                    <span key={t.id} className={styles.strategyTag}>{t.name}</span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    {sourceType && (
                                        <>
                                            <div className={styles.tagsLabel}>Source Type</div>
                                            <div className={styles.tagsList}>
                                                <span className={styles.sourceTag}>{sourceType}</span>
                                            </div>
                                        </>
                                    )}
                                </section>
                            )}

                            {/* Cross-links */}
                            {(crossLinks || []).length > 0 && (
                                <section className={styles.crossLinksSection}>
                                    <div className={styles.crossLinksTitle}>
                                        ↯ Tracing the Causal Chain
                                    </div>
                                    {(crossLinks || []).map(link => {
                                        const isSource = link.source_extract_id === id;
                                        const linked = isSource ? link.target : link.source;
                                        const direction = isSource ? '→' : '←';
                                        const linkedAuthor = linked?.works?.missionaries?.name || linked?.works?.author || '';

                                        return (
                                            <Link
                                                key={link.id}
                                                href={`/extract/${linked?.id}`}
                                                className={styles.crossLink}
                                            >
                                                <div className={styles.crossLinkArrow}>{direction}</div>
                                                <div className={styles.crossLinkContent}>
                                                    <div className={styles.crossLinkMeta}>
                                                        <span className={`${styles.layerBadgeLg} ${styles[LAYER_STYLE_MAP[linked?.layer]]}`}>
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
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
