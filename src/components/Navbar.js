'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar({ user }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (path) => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles['navbar-inner']}>
                <Link href="/" className={styles['navbar-brand']}>
                    <span className={styles['navbar-brand-icon']}>📜</span>
                    <span>Missionary Literature</span>
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
                            href="/browse"
                            className={`${styles['navbar-link']} ${isActive('/browse') ? styles.active : ''}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            Browse
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
