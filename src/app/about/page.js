import { createClient } from '@/lib/supabase/server';
import styles from './about.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
    const supabase = await createClient();
    const { data: page } = await supabase
        .from('site_pages')
        .select('title, meta_description')
        .eq('slug', 'about')
        .single();

    return {
        title: `${page?.title || 'About'} — Missionary Literature Database`,
        description: page?.meta_description || 'Learn about the Missionary Literature Database project.',
    };
}

// Simple markdown-like renderer for headings, bullets, and paragraphs
function renderContent(content) {
    if (!content) return null;

    const lines = content.split('\n');
    const elements = [];
    let currentList = [];
    let key = 0;

    const flushList = () => {
        if (currentList.length > 0) {
            elements.push(
                <ul key={`list-${key++}`}>
                    {currentList.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            );
            currentList = [];
        }
    };

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('## ')) {
            flushList();
            elements.push(<h2 key={`h-${key++}`}>{trimmed.slice(3)}</h2>);
        } else if (trimmed.startsWith('- ')) {
            currentList.push(trimmed.slice(2));
        } else if (trimmed === '') {
            flushList();
        } else {
            flushList();
            elements.push(<p key={`p-${key++}`}>{trimmed}</p>);
        }
    }
    flushList();
    return elements;
}

export default async function AboutPage() {
    const supabase = await createClient();
    const { data: page } = await supabase
        .from('site_pages')
        .select('*')
        .eq('slug', 'about')
        .single();

    const title = page?.title || 'About This Project';
    const content = page?.content || '';

    return (
        <div className="page-content">
            <div className={`container ${styles['about-content']}`}>
                <div className={`${styles['about-header']} animate-fade-in`}>
                    <h1>{title}</h1>
                </div>

                <div className={styles['about-section']}>
                    {renderContent(content)}
                </div>
            </div>
        </div>
    );
}
