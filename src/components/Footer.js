import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles['footer-inner']}>
                <div className={styles['footer-text']}>
                    <span className={styles['footer-brand']}>Colonial Discourse & Indian Selfhood</span>
                    <br />
                    Interrogating the texts that shaped how India came to know itself.
                </div>
                <div className={styles['footer-links']}>
                    <Link href="/about" className={styles['footer-link']}>About</Link>
                    <Link href="/browse" className={styles['footer-link']}>Browse</Link>
                </div>
            </div>
        </footer>
    );
}
