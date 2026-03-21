'use client';

import { useState } from 'react';

export default function CitedInToggle({ citedIn, styles }) {
    const [open, setOpen] = useState(false);

    if (!citedIn) return null;

    // Count citations (split by newlines, filter blanks)
    const lines = citedIn.split('\n').filter(l => l.trim());
    const count = lines.length;

    return (
        <div className={styles.citedInSection}>
            <button
                className={styles.citedInToggle}
                onClick={() => setOpen(prev => !prev)}
                aria-expanded={open}
            >
                <span>📖 Cited in{count > 0 ? ` (${count})` : ''}</span>
                <span className={`${styles.citedInChevron} ${open ? styles.citedInChevronOpen : ''}`}>›</span>
            </button>
            {open && (
                <div className={styles.citedInContent}>
                    {lines.map((line, i) => (
                        <div key={i} className={styles.citedInLine}>{line.trim()}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
