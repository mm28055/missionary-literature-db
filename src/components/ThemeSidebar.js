'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './ThemeSidebar.module.css';

const ROMAN = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ'];

export default function ThemeSidebar() {
    const [parentThemes, setParentThemes] = useState([]);
    const [subThemes, setSubThemes] = useState([]);
    const [expanded, setExpanded] = useState({});
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const supabase = createClient();
        const load = async () => {
            const [parents, subs] = await Promise.all([
                supabase.from('tags').select('id, name, slug').eq('tag_type', 'theme').is('parent_id', null).order('created_at'),
                supabase.from('tags').select('id, name, slug, parent_id').eq('tag_type', 'theme').not('parent_id', 'is', null).order('created_at'),
            ]);
            // Custom display order: move "Reforming Hindu Society" after "The Brahmin"
            const pts = parents.data || [];
            const rIdx = pts.findIndex(t => t.name === 'Reforming Hindu Society');
            const bIdx = pts.findIndex(t => t.name === 'The Brahmin');
            if (rIdx !== -1 && bIdx !== -1 && rIdx < bIdx) {
                const [removed] = pts.splice(rIdx, 1);
                const newBIdx = pts.findIndex(t => t.name === 'The Brahmin');
                pts.splice(newBIdx + 1, 0, removed);
            }
            setParentThemes(pts);
            setSubThemes(subs.data || []);
        };
        load();
    }, []);

    // Auto-expand the active theme based on the current URL
    useEffect(() => {
        if (parentThemes.length === 0) return;
        const segments = pathname.split('/').filter(Boolean);
        // /themes/[slug] or /themes/[slug]/[subtheme]
        if (segments[0] === 'themes' && segments[1]) {
            const activeParent = parentThemes.find(p => p.slug === segments[1]);
            if (activeParent) {
                setExpanded(prev => ({ ...prev, [activeParent.id]: true }));
            }
        }
    }, [pathname, parentThemes]);

    const getChildren = (parentId) => subThemes.filter(s => s.parent_id === parentId);

    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const segments = pathname.split('/').filter(Boolean);
    const activeSlug = segments[1]; // parent slug
    const activeSubSlug = segments[2]; // sub-theme slug

    if (parentThemes.length === 0) return null;

    return (
        <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
            <div className={styles.sidebarHeader}>
                <Link href="/themes" className={styles.sidebarTitle}>
                    All Themes
                </Link>
                <button
                    className={styles.collapseBtn}
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? '▶' : '◀'}
                </button>
            </div>

            {!collapsed && (
                <nav className={styles.sidebarNav}>
                    {parentThemes.map((parent, idx) => {
                        const children = getChildren(parent.id);
                        const isActive = activeSlug === parent.slug;
                        const isExpanded = expanded[parent.id];

                        return (
                            <div key={parent.id} className={styles.themeGroup}>
                                <div className={`${styles.parentRow} ${isActive ? styles.parentRowActive : ''}`}>
                                    <Link
                                        href={`/themes/${parent.slug}`}
                                        className={styles.parentLink}
                                    >
                                        <span className={styles.parentNumeral}>{ROMAN[idx]}</span>
                                        <span className={styles.parentName}>{parent.name}</span>
                                    </Link>
                                    {children.length > 0 && (
                                        <button
                                            className={styles.expandBtn}
                                            onClick={(e) => { e.preventDefault(); toggleExpand(parent.id); }}
                                        >
                                            <span className={`${styles.expandIcon} ${isExpanded ? styles.expandIconOpen : ''}`}>
                                                ›
                                            </span>
                                            {!isExpanded && (
                                                <span className={styles.childCount}>{children.length}</span>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {isExpanded && children.length > 0 && (
                                    <div className={styles.childList}>
                                        {children.map(child => {
                                            const isChildActive = activeSubSlug === child.slug;
                                            return (
                                                <Link
                                                    key={child.id}
                                                    href={`/themes/${parent.slug}/${child.slug}`}
                                                    className={`${styles.childLink} ${isChildActive ? styles.childLinkActive : ''}`}
                                                >
                                                    {child.name}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            )}
        </aside>
    );
}
