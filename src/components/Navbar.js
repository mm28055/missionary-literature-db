'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './Navbar.module.css';

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const pathname = usePathname();

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            setUser(data?.user || null);
        }).catch(() => { });
    }, []);

    const isActive = (path) => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles['navbar-inner']}>
                <Link href="/" className={styles['navbar-brand']}>
                    <span className={styles['navbar-brand-icon']}>📜</span>
                    <span>Colonial Discourse & Indian Selfhood</span>
                </Link>

                <button
                    className={styles['navbar-toggle']}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle navigation"
                >
                    {menuOpen ? '✕' : '☰'}
                </button>

                <ul className={`${styles['navbar-links']} ${menuOpen ? styles.open : ''}`}>
                    <li>
                        <Link
                            href="/"
                            className={`${styles['navbar-link']} ${isActive('/') ? styles.active : ''}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            Home
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/themes"
                            className={`${styles['navbar-link']} ${isActive('/themes') ? styles.active : ''}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            Themes
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/about"
                            className={`${styles['navbar-link']} ${isActive('/about') ? styles.active : ''}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            About
                        </Link>
                    </li>
                    {user && (
                        <li>
                            <Link
                                href="/admin"
                                className={`${styles['navbar-link']} ${styles['navbar-link-admin']} ${isActive('/admin') ? styles.active : ''}`}
                                onClick={() => setMenuOpen(false)}
                            >
                                Admin
                            </Link>
                        </li>
                    )}
                </ul>
            </div>
        </nav>
    );
}
