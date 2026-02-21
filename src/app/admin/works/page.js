'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../admin.module.css';

export default function ManageWorksPage() {
    const [works, setWorks] = useState([]);
    const [missionaries, setMissionaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form
    const [title, setTitle] = useState('');
    const [yearPublished, setYearPublished] = useState('');
    const [publisher, setPublisher] = useState('');
    const [biblioInfo, setBiblioInfo] = useState('');
    const [missionaryId, setMissionaryId] = useState('');
    const [editingId, setEditingId] = useState(null);

    const supabase = createClient();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [wRes, mRes] = await Promise.all([
                supabase.from('works').select('*, missionaries(name)').order('title'),
                supabase.from('missionaries').select('id, name').order('name'),
            ]);
            setWorks(wRes.data || []);
            setMissionaries(mRes.data || []);
        } catch { setError('Failed to load data.'); }
        setLoading(false);
    };

    const resetForm = () => {
        setTitle(''); setYearPublished(''); setPublisher('');
        setBiblioInfo(''); setMissionaryId(''); setEditingId(null);
        setError(''); setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true); setError(''); setSuccess('');
        const payload = {
            title,
            year_published: yearPublished ? parseInt(yearPublished) : null,
            publisher: publisher || null,
            bibliographic_info: biblioInfo || null,
            missionary_id: missionaryId || null,
        };

        try {
            if (editingId) {
                const { error } = await supabase.from('works').update(payload).eq('id', editingId);
                if (error) throw error;
                setSuccess('Work updated!');
            } else {
                const { error } = await supabase.from('works').insert(payload);
                if (error) throw error;
                setSuccess('Work added!');
            }
            resetForm(); loadData();
        } catch (err) { setError(err.message); }
        setSaving(false);
    };

    const handleEdit = (w) => {
        setTitle(w.title); setYearPublished(w.year_published?.toString() || '');
        setPublisher(w.publisher || ''); setBiblioInfo(w.bibliographic_info || '');
        setMissionaryId(w.missionary_id || ''); setEditingId(w.id); setSuccess('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this work? Its extracts will also be deleted.')) return;
        await supabase.from('works').delete().eq('id', id);
        loadData();
    };

    return (
        <div className="page-content">
            <div className={`container ${styles['admin-form-page']}`}>
                <div className={styles['admin-form-header']}>
                    <h1>{editingId ? 'Edit Work' : 'Add Work'}</h1>
                    <Link href="/admin" className={styles['admin-back-link']}>← Back to Dashboard</Link>
                </div>

                <form className={styles['admin-form']} onSubmit={handleSubmit}>
                    {error && <div style={{ color: '#ff6b7a', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>{error}</div>}
                    {success && <div style={{ color: '#7aff8e', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>{success}</div>}

                    <div className="form-group">
                        <label className="form-label">Title *</label>
                        <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)}
                            placeholder='e.g. "A View of the History, Literature, and Mythology of the Hindoos"' required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                        <div className="form-group">
                            <label className="form-label">Year Published</label>
                            <input className="form-input" type="number" value={yearPublished} onChange={(e) => setYearPublished(e.target.value)} placeholder="e.g. 1822" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Publisher</label>
                            <input className="form-input" value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="e.g. Serampore Mission Press" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Author (Missionary)</label>
                        <select className="form-select" value={missionaryId} onChange={(e) => setMissionaryId(e.target.value)}>
                            <option value="">Select missionary...</option>
                            {missionaries.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Bibliographic Information</label>
                        <textarea className="form-textarea" value={biblioInfo} onChange={(e) => setBiblioInfo(e.target.value)}
                            placeholder="Full bibliographic citation, edition details, etc." style={{ minHeight: '100px' }} />
                    </div>

                    <div className={styles['admin-form-actions']}>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : editingId ? 'Update' : 'Add Work'}
                        </button>
                        {editingId && <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>}
                    </div>
                </form>

                <h2 style={{ marginTop: 'var(--space-3xl)', marginBottom: 'var(--space-lg)' }}>
                    Works ({works.length})
                </h2>

                {loading ? <div className="empty-state">Loading...</div> :
                    works.length === 0 ? (
                        <div className="empty-state"><div className="empty-state-icon">📚</div><p>No works yet.</p></div>
                    ) : (
                        <div className={styles['admin-list']}>
                            {works.map((w) => (
                                <div key={w.id} className={styles['admin-list-item']}>
                                    <div className={styles['admin-list-item-info']}>
                                        <div className={styles['admin-list-item-title']}>{w.title}</div>
                                        <div className={styles['admin-list-item-meta']}>
                                            {w.missionaries?.name || 'Unknown author'}
                                            {w.year_published && ` · ${w.year_published}`}
                                        </div>
                                    </div>
                                    <div className={styles['admin-list-item-actions']}>
                                        <button className="btn btn-ghost" onClick={() => handleEdit(w)}>Edit</button>
                                        <button className="btn btn-danger" onClick={() => handleDelete(w.id)} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                }
            </div>
        </div>
    );
}
