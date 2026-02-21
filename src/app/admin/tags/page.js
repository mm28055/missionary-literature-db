'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../admin.module.css';

export default function ManageTagsPage() {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [editingId, setEditingId] = useState(null);

    const supabase = createClient();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const { data } = await supabase.from('tags').select('*').order('category').order('name');
            setTags(data || []);
        } catch { setError('Failed to load tags.'); }
        setLoading(false);
    };

    const resetForm = () => {
        setName(''); setCategory(''); setEditingId(null); setError(''); setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true); setError(''); setSuccess('');

        try {
            if (editingId) {
                const { error } = await supabase.from('tags').update({ name, category: category || null }).eq('id', editingId);
                if (error) throw error;
                setSuccess('Tag updated!');
            } else {
                const { error } = await supabase.from('tags').insert({ name, category: category || null });
                if (error) throw error;
                setSuccess('Tag added!');
            }
            resetForm(); loadData();
        } catch (err) { setError(err.message); }
        setSaving(false);
    };

    const handleEdit = (t) => {
        setName(t.name); setCategory(t.category || '');
        setEditingId(t.id); setSuccess('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this tag?')) return;
        await supabase.from('tags').delete().eq('id', id);
        loadData();
    };

    // Group by category
    const categories = [...new Set(tags.map((t) => t.category || 'Uncategorized'))];

    return (
        <div className="page-content">
            <div className={`container ${styles['admin-form-page']}`}>
                <div className={styles['admin-form-header']}>
                    <h1>{editingId ? 'Edit Tag' : 'Add Tag'}</h1>
                    <Link href="/admin" className={styles['admin-back-link']}>← Back to Dashboard</Link>
                </div>

                <form className={styles['admin-form']} onSubmit={handleSubmit}>
                    {error && <div style={{ color: '#ff6b7a', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>{error}</div>}
                    {success && <div style={{ color: '#7aff8e', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>{success}</div>}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                        <div className="form-group">
                            <label className="form-label">Tag Name *</label>
                            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)}
                                placeholder='e.g. "Conversion"' required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <input className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}
                                placeholder='e.g. "Theme", "Region", "Social"' />
                        </div>
                    </div>

                    <div className={styles['admin-form-actions']}>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : editingId ? 'Update' : 'Add Tag'}
                        </button>
                        {editingId && <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>}
                    </div>
                </form>

                <h2 style={{ marginTop: 'var(--space-3xl)', marginBottom: 'var(--space-lg)' }}>
                    Tags ({tags.length})
                </h2>

                {loading ? <div className="empty-state">Loading...</div> :
                    tags.length === 0 ? (
                        <div className="empty-state"><div className="empty-state-icon">🏷️</div><p>No tags yet.</p></div>
                    ) : (
                        categories.map((cat) => (
                            <div key={cat} style={{ marginBottom: 'var(--space-xl)' }}>
                                <h4 style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {cat}
                                </h4>
                                <div className={styles['admin-list']}>
                                    {tags.filter((t) => (t.category || 'Uncategorized') === cat).map((t) => (
                                        <div key={t.id} className={styles['admin-list-item']}>
                                            <div className={styles['admin-list-item-info']}>
                                                <div className={styles['admin-list-item-title']}>{t.name}</div>
                                            </div>
                                            <div className={styles['admin-list-item-actions']}>
                                                <button className="btn btn-ghost" onClick={() => handleEdit(t)}>Edit</button>
                                                <button className="btn btn-danger" onClick={() => handleDelete(t.id)} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )
                }
            </div>
        </div>
    );
}
