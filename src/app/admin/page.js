import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from './LogoutButton';
import styles from './admin.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Admin Dashboard — Missionary Literature Database',
};

export default async function AdminPage() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

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
