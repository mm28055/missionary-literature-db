import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from './LogoutButton';
import styles from './admin.module.css';

export const metadata = {
    title: 'Admin Dashboard — Missionary Literature Database',
};

export default async function AdminPage() {
    let user = null;
    try {
        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        user = data?.user;
    } catch {
        // Supabase not configured
    }

    if (!user) {
        redirect('/login');
    }

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
            description: 'Manage thematic tags for categorizing extracts',
            icon: '🏷️',
            href: '/admin/tags',
        },
        {
            title: 'Denominations',
            description: 'Manage missionary denominations and organizations',
            icon: '⛪',
            href: '/admin/denominations',
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
