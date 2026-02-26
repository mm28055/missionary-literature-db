'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../admin.module.css';

const PAGE_ICONS = {
    about: '📖',
    contact: '✉️',
    home: '🏠',
};

export default function ManagePagesPage() {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingPage, setEditingPage] = useState(null);
    const [form, setForm] = useState({ title: '', content: '', meta_description: '' });
    const [previewMode, setPreviewMode] = useState(false);

    const supabase = createClient();

    useEffect(() => { loadPages(); }, []);

    const loadPages = async () => {
        try {
            const { data } = await supabase.from('site_pages').select('*').order('slug');
            setPages(data || []);
        } catch {
            setError('Failed to load pages. Make sure the site_pages table exists.');
        }
        setLoading(false);
    };

    const handleEdit = (page) => {
        setEditingPage(page);
        setForm({
            title: page.title || '',
            content: page.content || '',
            meta_description: page.meta_description || '',
        });
        setError('');
        setSuccess('');
        setPreviewMode(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const { error } = await supabase
                .from('site_pages')
                .update({
                    title: form.title,
                    content: form.content,
                    meta_description: form.meta_description,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', editingPage.id);

            if (error) throw error;
            setSuccess('✓ Page saved successfully!');
            loadPages();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message);
        }
        setSaving(false);
    };

    const handleCancel = () => {
        setEditingPage(null);
        setForm({ title: '', content: '', meta_description: '' });
        setError('');
        setSuccess('');
        setPreviewMode(false);
    };

    // Simple preview renderer
    const renderPreview = (content) => {
        if (!content) return <p style={{ color: 'var(--text-muted)' }}>No content yet</p>;
        return content.split('\n').map((line, i) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('## ')) return <h2 key={i} style={{ margin: '1.5rem 0 0.5rem', fontSize: '1.3rem' }}>{trimmed.slice(3)}</h2>;
            if (trimmed.startsWith('- ')) return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.25rem' }}>{trimmed.slice(2)}</li>;
            if (trimmed === '') return <br key={i} />;
            return <p key={i} style={{ marginBottom: '0.5rem' }}>{trimmed}</p>;
        });
    };

    const charCount = form.content?.length || 0;

    return (
        <div className="page-content">
            <div className={`container ${styles['admin-form-page']}`}>
                <div className={styles['admin-form-header']}>
                    <h1>{editingPage ? `✏️ Editing: /${editingPage.slug}` : '📝 Site Pages'}</h1>
                    <Link href="/admin" className={styles['admin-back-link']}>← Back to Dashboard</Link>
                </div>

                {error && (
                    <div style={{
                        color: '#dc3545',
                        background: 'rgba(220, 53, 69, 0.08)',
                        border: '1px solid rgba(220, 53, 69, 0.2)',
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: 'var(--space-md)',
                        fontSize: '0.9rem',
                    }}>{error}</div>
                )}
                {success && (
                    <div style={{
                        color: '#28a745',
                        background: 'rgba(40, 167, 69, 0.08)',
                        border: '1px solid rgba(40, 167, 69, 0.2)',
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: 'var(--space-md)',
                        fontSize: '0.9rem',
                    }}>{success}</div>
                )}

                {editingPage ? (
                    <form className={styles['admin-form']} onSubmit={handleSave}>
                        {/* Title + Meta row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                            <div className="form-group">
                                <label className="form-label">Page Title</label>
                                <input
                                    className="form-input"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="About This Project"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">SEO Description</label>
                                <input
                                    className="form-input"
                                    value={form.meta_description}
                                    onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                                    placeholder="Brief description for search engines"
                                />
                            </div>
                        </div>

                        {/* Editor toolbar */}
                        <div className="form-group">
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 'var(--space-xs)',
                            }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>Content</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {charCount} chars
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewMode(!previewMode)}
                                        style={{
                                            padding: '3px 12px',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            background: previewMode ? 'var(--accent-gold)' : 'var(--bg-glass)',
                                            color: previewMode ? '#fff' : 'var(--text-secondary)',
                                            border: '1px solid var(--border-subtle)',
                                            borderRadius: '100px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {previewMode ? '← Edit' : 'Preview →'}
                                    </button>
                                </div>
                            </div>

                            {/* Format hints */}
                            <div style={{
                                display: 'flex',
                                gap: '16px',
                                marginBottom: 'var(--space-sm)',
                                fontSize: '0.72rem',
                                color: 'var(--text-muted)',
                                fontFamily: 'var(--font-body)',
                            }}>
                                <span><code style={{ background: 'var(--bg-glass)', padding: '1px 5px', borderRadius: '3px' }}>## Heading</code></span>
                                <span><code style={{ background: 'var(--bg-glass)', padding: '1px 5px', borderRadius: '3px' }}>- Bullet point</code></span>
                                <span>Blank line = new paragraph</span>
                            </div>

                            {previewMode ? (
                                <div style={{
                                    minHeight: '400px',
                                    padding: 'var(--space-lg)',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '0.95rem',
                                    lineHeight: 1.8,
                                    color: 'var(--text-primary)',
                                }}>
                                    {renderPreview(form.content)}
                                </div>
                            ) : (
                                <textarea
                                    className="form-textarea"
                                    value={form.content}
                                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    placeholder="Write your page content here..."
                                    rows={22}
                                    style={{
                                        width: '100%',
                                        resize: 'vertical',
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem',
                                        lineHeight: 1.7,
                                        minHeight: '400px',
                                        tabSize: 4,
                                    }}
                                    required
                                />
                            )}
                        </div>

                        <div className={styles['admin-form-actions']} style={{
                            display: 'flex',
                            gap: 'var(--space-sm)',
                            justifyContent: 'space-between',
                            borderTop: '1px solid var(--border-subtle)',
                            paddingTop: 'var(--space-lg)',
                            marginTop: 'var(--space-md)',
                        }}>
                            <button type="button" className="btn btn-ghost" onClick={handleCancel}>← Cancel</button>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <Link
                                    href={`/${editingPage.slug}`}
                                    target="_blank"
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.85rem' }}
                                >
                                    View Live ↗
                                </Link>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : '💾 Save Page'}
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <>
                        {/* Intro text */}
                        <p style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.88rem',
                            marginBottom: 'var(--space-xl)',
                            lineHeight: 1.6,
                        }}>
                            Edit the content of your site pages below. Changes are saved to the database and appear live immediately.
                        </p>

                        {loading ? (
                            <div className="empty-state">Loading pages...</div>
                        ) : pages.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📄</div>
                                <p>No pages found.</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    Run the <code>006_site_pages.sql</code> migration in your Supabase SQL Editor.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                                {pages.map((page) => (
                                    <div
                                        key={page.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-lg)',
                                            padding: 'var(--space-lg) var(--space-xl)',
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-subtle)',
                                            borderRadius: 'var(--radius-md)',
                                            transition: 'all var(--transition-base)',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => handleEdit(page)}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--border-medium)';
                                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.transform = 'none';
                                        }}
                                    >
                                        {/* Icon */}
                                        <div style={{
                                            fontSize: '2rem',
                                            width: '48px',
                                            height: '48px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'var(--bg-glass)',
                                            borderRadius: 'var(--radius-sm)',
                                            flexShrink: 0,
                                        }}>
                                            {PAGE_ICONS[page.slug] || '📄'}
                                        </div>

                                        {/* Page info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'baseline',
                                                gap: 'var(--space-sm)',
                                                marginBottom: '4px',
                                            }}>
                                                <span style={{
                                                    fontFamily: 'var(--font-heading)',
                                                    fontSize: '1.2rem',
                                                    fontWeight: 600,
                                                    color: 'var(--text-heading)',
                                                }}>
                                                    {page.title}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.78rem',
                                                    color: 'var(--text-muted)',
                                                    fontFamily: 'monospace',
                                                    background: 'var(--bg-glass)',
                                                    padding: '1px 8px',
                                                    borderRadius: '100px',
                                                }}>
                                                    /{page.slug}
                                                </span>
                                            </div>
                                            <div style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--text-muted)',
                                                display: 'flex',
                                                gap: 'var(--space-md)',
                                            }}>
                                                <span>Updated {page.updated_at
                                                    ? new Date(page.updated_at).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short', year: 'numeric'
                                                    })
                                                    : 'Never'
                                                }</span>
                                                <span style={{ color: 'var(--border-medium)' }}>·</span>
                                                <span>{page.content?.length || 0} chars</span>
                                            </div>
                                        </div>

                                        {/* Edit arrow */}
                                        <div style={{
                                            color: 'var(--text-muted)',
                                            fontSize: '1.2rem',
                                            flexShrink: 0,
                                        }}>
                                            →
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
