'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../admin.module.css';

export default function ManagePagesPage() {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingPage, setEditingPage] = useState(null);
    const [form, setForm] = useState({ title: '', content: '', meta_description: '' });

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
            setSuccess('Page updated!');
            setEditingPage(null);
            setForm({ title: '', content: '', meta_description: '' });
            loadPages();
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
    };

    return (
        <div className="page-content">
            <div className={`container ${styles['admin-form-page']}`}>
                <div className={styles['admin-form-header']}>
                    <h1>{editingPage ? `Editing: ${editingPage.slug}` : 'Manage Pages'}</h1>
                    <Link href="/admin" className={styles['admin-back-link']}>← Back to Dashboard</Link>
                </div>

                {error && <div style={{ color: '#ff6b7a', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>{error}</div>}
                {success && <div style={{ color: '#7aff8e', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>{success}</div>}

                {editingPage ? (
                    <form className={styles['admin-form']} onSubmit={handleSave}>
                        <div className="form-group">
                            <label className="form-label">Page Title</label>
                            <input
                                className="form-input"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="Page title"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Meta Description (SEO)</label>
                            <input
                                className="form-input"
                                value={form.meta_description}
                                onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                                placeholder="Brief description for search engines"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Content
                                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '8px', fontSize: '0.8rem' }}>
                                    Use ## for headings, - for bullet points, blank lines for paragraphs
                                </span>
                            </label>
                            <textarea
                                className="form-textarea"
                                value={form.content}
                                onChange={(e) => setForm({ ...form, content: e.target.value })}
                                placeholder="Page content..."
                                rows={20}
                                style={{ width: '100%', resize: 'vertical', fontFamily: 'var(--font-body)', fontSize: '0.9rem', lineHeight: 1.7 }}
                                required
                            />
                        </div>

                        <div className={styles['admin-form-actions']}>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Page'}
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={handleCancel}>Cancel</button>
                        </div>
                    </form>
                ) : (
                    <>
                        <h2 style={{ marginTop: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
                            Pages ({pages.length})
                        </h2>

                        {loading ? (
                            <div className="empty-state">Loading...</div>
                        ) : pages.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📄</div>
                                <p>No pages found. Run the site_pages migration first.</p>
                            </div>
                        ) : (
                            <div className={styles['admin-list']}>
                                {pages.map((page) => (
                                    <div key={page.id} className={styles['admin-list-item']}>
                                        <div className={styles['admin-list-item-info']}>
                                            <div className={styles['admin-list-item-title']}>
                                                /{page.slug}
                                                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '12px' }}>
                                                    {page.title}
                                                </span>
                                            </div>
                                            <div className={styles['admin-list-item-meta']}>
                                                Last updated: {page.updated_at ? new Date(page.updated_at).toLocaleDateString() : 'Never'}
                                            </div>
                                        </div>
                                        <div className={styles['admin-list-item-actions']}>
                                            <button className="btn btn-ghost" onClick={() => handleEdit(page)}>
                                                Edit
                                            </button>
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
