import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import styles from './themes.module.css';

export const metadata = {
    title: 'Themes — Missionary Literature Database',
    description: 'Explore the thematic patterns through which missionaries constructed, critiqued, and sought to dismantle Hindu civilization.',
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export const dynamic = 'force-dynamic';

export default async function ThemesPage() {
    const supabase = await createClient();

    // Load parent themes with their subthemes
    const { data: parentThemes } = await supabase
        .from('tags')
        .select('*')
        .eq('tag_type', 'theme')
        .is('parent_id', null)
        .order('created_at');

    // Load all subthemes
    const { data: subThemes } = await supabase
        .from('tags')
        .select('*')
        .eq('tag_type', 'theme')
        .not('parent_id', 'is', null);

    // Load extract counts per tag via extract_tags
    const { data: tagCounts } = await supabase
        .from('extract_tags')
        .select('tag_id, extracts(layer)');

    // Build count map: { tagId: { missionary: N, bureaucratic: N, reform: N, total: N } }
    const countMap = {};
    (tagCounts || []).forEach(et => {
        const tagId = et.tag_id;
        const layer = et.extracts?.layer || 'missionary';
        if (!countMap[tagId]) countMap[tagId] = { missionary: 0, bureaucratic: 0, reform: 0, total: 0 };
        countMap[tagId][layer] = (countMap[tagId][layer] || 0) + 1;
        countMap[tagId].total += 1;
    });

    // For each parent, sum its subthemes' counts
    const getParentCounts = (parentId) => {
        const children = (subThemes || []).filter(t => t.parent_id === parentId);
        const result = { missionary: 0, bureaucratic: 0, reform: 0, total: 0 };
        children.forEach(child => {
            const c = countMap[child.id];
            if (c) {
                result.missionary += c.missionary;
                result.bureaucratic += c.bureaucratic;
                result.reform += c.reform;
                result.total += c.total;
            }
        });
        return result;
    };

    return (
        <div className="page-content">
            <div className="container">
                <header className={styles.themesHeader}>
                    <h1 className={styles.themesTitle}>The Themes</h1>
                    <p className={styles.themesEpigraph}>
                        Six thematic patterns through which 19th-century missionaries constructed,
                        critiqued, and sought to dismantle Hindu civilization — and their downstream
                        impact through colonial policy and Indian reform movements.
                    </p>
                </header>

                <div className={`${styles.themesGrid} stagger-children`}>
                    {(parentThemes || []).map((theme, i) => {
                        const counts = getParentCounts(theme.id);
                        const children = (subThemes || []).filter(t => t.parent_id === theme.id);

                        return (
                            <Link
                                key={theme.id}
                                href={`/themes/${theme.slug || theme.id}`}
                                className={styles.themeCard}
                            >
                                <div className={styles.themeCardNumeral}>
                                    Theme {ROMAN[i]}
                                </div>
                                <h2 className={styles.themeCardTitle}>{theme.name}</h2>
                                <p className={styles.themeCardDesc}>
                                    {theme.description}
                                </p>
                                <div className={styles.themeCardMeta}>
                                    <span className={styles.themeCardCount}>
                                        <span className={styles.themeCardCountValue}>{counts.total}</span> extracts
                                    </span>
                                    <span className={styles.themeCardSubCount}>
                                        {children.length} sub-themes
                                    </span>
                                    <span className={styles.themeCardArrow}>→</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
