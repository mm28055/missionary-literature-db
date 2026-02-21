import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles['footer-inner']}>
                <div className={styles['footer-text']}>
                    <span className={styles['footer-brand']}>Missionary Literature Database</span>
                    <br />
                    A digital humanities project exploring 19th-century missionary writings on India &amp; Hinduism.
                </div>
                <div className={styles['footer-links']}>
                    <Link href="/about" className={styles['footer-link']}>About</Link>
                    <Link href="/browse" className={styles['footer-link']}>Browse</Link>
                </div>
            </div>
        </footer>
    );
}
