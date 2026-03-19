import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from './LogoutButton';
import styles from './admin.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Admin Dashboard — Colonial Discourse & Indian Selfhood',
};

export default async function AdminPage() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    // Check for untagged extracts (extracts with no entries in extract_tags)
    const { data: allExtracts } = await supabase
        .from('extracts')
        .select('id');
    const { data: taggedExtractIds } = await supabase
        .from('extract_tags')
        .select('extract_id');

    const taggedSet = new Set((taggedExtractIds || []).map(r => r.extract_id));
    const untaggedCount = (allExtracts || []).filter(e => !taggedSet.has(e.id)).length;

    const sections = [
        {
            title: 'Extracts',
            description: 'Add, edit, and manage text extracts from missionary writings',
            icon: '📄',
            href: '/admin/extracts',
        },
        {
            title: 'Missionaries',
            description: 'Manage missionary biographical information',
            icon: '👤',
            href: '/admin/missionaries',
        },
        {
            title: 'Works',
            description: 'Manage books, pamphlets, letters, and other source works',
            icon: '📚',
            href: '/admin/works',
        },
        {
            title: 'Tags',
            description: 'Manage thematic taxonomy — parent themes, sub-themes, strategies',
            icon: '🏷️',
            href: '/admin/tags',
        },
        {
            title: 'Denominations',
            description: 'Manage missionary denominations and organizations',
            icon: '⛪',
            href: '/admin/denominations',
        },
        {
            title: 'Cross-Links',
            description: 'Trace the genealogy of ideas across missionary → bureaucratic → reform layers',
            icon: '🔗',
            href: '/admin/links',
        },
        {
            title: 'Pages',
            description: 'Edit site pages (About, etc.)',
            icon: '📝',
            href: '/admin/pages',
        },
    ];

    return (
        <div className="page-content">
            <div className="container">
                <div className={styles['admin-header']}>
                    <h1>Admin Dashboard</h1>
                    <div className={styles['admin-user-info']}>
                        <span className={styles['admin-user-email']}>{user.email}</span>
                        <LogoutButton />
                    </div>
                </div>

                {/* Untagged extracts warning */}
                {untaggedCount > 0 && (
                    <div style={{
                        background: 'rgba(220, 53, 69, 0.06)',
                        border: '1px solid rgba(220, 53, 69, 0.2)',
                        borderLeft: '4px solid #e74c3c',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-md) var(--space-lg)',
                        marginBottom: 'var(--space-xl)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <span style={{ fontSize: '0.9rem' }}>
                            ⚠️ <strong>{untaggedCount} untagged extract{untaggedCount !== 1 ? 's' : ''}</strong> — {untaggedCount !== 1 ? 'these' : 'this'} won&apos;t appear under any theme on the website.
                        </span>
                        <Link href="/admin/extracts" style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: 'var(--accent-gold)',
                            whiteSpace: 'nowrap',
                        }}>
                            View &amp; fix →
                        </Link>
                    </div>
                )}

                <div className={`${styles['admin-grid']} stagger-children`}>
                    {sections.map((section) => (
                        <Link
                            key={section.title}
                            href={section.href}
                            className={`card ${styles['admin-card']}`}
                        >
                            <span className={styles['admin-card-icon']}>{section.icon}</span>
                            <h3>{section.title}</h3>
                            <p>{section.description}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

