import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from '../themes.module.css';
import ThemeSidebar from '@/components/ThemeSidebar';
import sidebarStyles from '@/components/ThemeSidebar.module.css';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const supabase = await createClient();
    let { data: theme } = await supabase
        .from('tags')
        .select('name, description')
        .eq('slug', slug)
        .eq('tag_type', 'theme')
        .is('parent_id', null)
        .single();

    if (!theme) return { title: 'Theme Not Found' };

    return {
        title: `${theme.name} — Missionary Literature Database`,
        description: theme.description?.substring(0, 160),
    };
}

export default async function ThemeDetailPage({ params }) {
    const { slug } = await params;
    const supabase = await createClient();

    // Load the parent theme by slug
    let { data: theme } = await supabase
        .from('tags')
        .select('*')
        .eq('slug', slug)
        .eq('tag_type', 'theme')
        .is('parent_id', null)
        .single();

    if (!theme) notFound();

    // Determine the theme's Roman numeral
    const { data: allParents } = await supabase
        .from('tags')
        .select('id')
        .eq('tag_type', 'theme')
        .is('parent_id', null)
        .order('created_at');

    const themeIndex = (allParents || []).findIndex(p => p.id === theme.id);

    // Load subthemes
    const { data: subThemes } = await supabase
        .from('tags')
        .select('*')
        .eq('parent_id', theme.id)
        .eq('tag_type', 'theme')
        .order('created_at');

    // Load extract counts per subtheme (grouped by layer)
    const subThemeIds = (subThemes || []).map(s => s.id);
    let countMap = {};

    if (subThemeIds.length > 0) {
        const { data: tagCounts } = await supabase
            .from('extract_tags')
            .select('tag_id, extracts(layer)')
            .in('tag_id', subThemeIds);

        (tagCounts || []).forEach(et => {
            const tagId = et.tag_id;
            const layer = et.extracts?.layer || 'missionary';
            if (!countMap[tagId]) countMap[tagId] = { missionary: 0, bureaucratic: 0, reform: 0, total: 0 };
            countMap[tagId][layer] = (countMap[tagId][layer] || 0) + 1;
            countMap[tagId].total += 1;
        });
    }

    return (
        <div className="page-content">
            <div className="container">
                <div className={sidebarStyles.sidebarLayout}>
                    <ThemeSidebar />
                    <div className={sidebarStyles.sidebarContent}>
                        {/* Breadcrumb */}
                        <nav className={styles.breadcrumb}>
                            <Link href="/">Home</Link>
                            <span className={styles.breadcrumbSep}>›</span>
                            <Link href="/themes">Themes</Link>
                            <span className={styles.breadcrumbSep}>›</span>
                            <span className={styles.breadcrumbCurrent}>{theme.name}</span>
                        </nav>

                        {/* Theme header */}
                        <header className={styles.themeDetailHeader} style={{ textAlign: 'left' }}>
                            <div className={styles.themeDetailNumeral}>Theme {ROMAN[themeIndex] || ''}</div>
                            <h1 className={styles.themeDetailTitle}>{theme.name}</h1>
                            <div className={styles.themeDetailRule} style={{ margin: '0 0 var(--space-lg)' }} />
                            <p className={styles.themeDetailDesc} style={{ margin: 0, maxWidth: 'none' }}>{theme.description}</p>
                        </header>

                        {/* Scholarly introduction */}
                        {theme.introduction && (
                            <div className={styles.introSection} style={{ margin: '0 0 var(--space-3xl)', maxWidth: 'none' }}>
                                <div className={styles.introLabel}>✦ Scholarly Introduction</div>
                                <div className={styles.introText}>{theme.introduction}</div>
                            </div>
                        )}

                        {/* Subtheme cards */}
                        <div className={styles.subthemesLabel} style={{ textAlign: 'left' }}>
                            Sub-Themes · {(subThemes || []).length}
                        </div>

                        <div className={`${styles.subthemesGrid} stagger-children`}>
                            {(subThemes || []).map(sub => {
                                const counts = countMap[sub.id] || { missionary: 0, bureaucratic: 0, reform: 0, total: 0 };

                                return (
                                    <Link
                                        key={sub.id}
                                        href={`/themes/${slug}/${sub.slug || sub.id}`}
                                        className={styles.subthemeCard}
                                    >
                                        <h3 className={styles.subthemeCardTitle}>{sub.name}</h3>
                                        <p className={styles.subthemeCardDesc}>
                                            {sub.description}
                                        </p>
                                        <div className={styles.subthemeCardMeta}>
                                            {counts.missionary > 0 && (
                                                <span className={`${styles.layerPill} ${styles.layerPillMissionary}`}>
                                                    {counts.missionary} missionary
                                                </span>
                                            )}
                                            {counts.bureaucratic > 0 && (
                                                <span className={`${styles.layerPill} ${styles.layerPillBureaucratic}`}>
                                                    {counts.bureaucratic} bureaucratic
                                                </span>
                                            )}
                                            {counts.reform > 0 && (
                                                <span className={`${styles.layerPill} ${styles.layerPillReform}`}>
                                                    {counts.reform} reform
                                                </span>
                                            )}
                                            {counts.total === 0 && (
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                    No extracts yet
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
