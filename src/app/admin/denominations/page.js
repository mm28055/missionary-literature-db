'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../admin.module.css';

export default function ManageDenominationsPage() {
    const [denominations, setDenominations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [editingId, setEditingId] = useState(null);

    const supabase = createClient();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const { data } = await supabase.from('denominations').select('*').order('name');
            setDenominations(data || []);
        } catch { setError('Failed to load denominations.'); }
        setLoading(false);
    };

    const resetForm = () => {
        setName(''); setDescription(''); setEditingId(null); setError(''); setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true); setError(''); setSuccess('');

        try {
            if (editingId) {
                const { error } = await supabase.from('denominations').update({ name, description: description || null }).eq('id', editingId);
                if (error) throw error;
                setSuccess('Denomination updated!');
            } else {
                const { error } = await supabase.from('denominations').insert({ name, description: description || null });
                if (error) throw error;
                setSuccess('Denomination added!');
            }
            resetForm(); loadData();
        } catch (err) { setError(err.message); }
        setSaving(false);
    };

    const handleEdit = (d) => {
        setName(d.name); setDescription(d.description || '');
        setEditingId(d.id); setSuccess('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this denomination?')) return;
        await supabase.from('denominations').delete().eq('id', id);
        loadData();
    };

    return (
        <div className="page-content">
            <div className={`container ${styles['admin-form-page']}`}>
                <div className={styles['admin-form-header']}>
                    <h1>{editingId ? 'Edit Denomination' : 'Add Denomination'}</h1>
                    <Link href="/admin" className={styles['admin-back-link']}>← Back to Dashboard</Link>
                </div>

                <form className={styles['admin-form']} onSubmit={handleSubmit}>
                    {error && <div style={{ color: '#ff6b7a', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>{error}</div>}
                    {success && <div style={{ color: '#7aff8e', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>{success}</div>}

                    <div className="form-group">
                        <label className="form-label">Name *</label>
                        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)}
                            placeholder='e.g. "Baptist"' required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)}
                            placeholder='e.g. "Baptist Missionary Society and affiliated organizations"'
                            style={{ minHeight: '100px' }} />
                    </div>

                    <div className={styles['admin-form-actions']}>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : editingId ? 'Update' : 'Add Denomination'}
                        </button>
                        {editingId && <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>}
                    </div>
                </form>

                <h2 style={{ marginTop: 'var(--space-3xl)', marginBottom: 'var(--space-lg)' }}>
                    Denominations ({denominations.length})
                </h2>

                {loading ? <div className="empty-state">Loading...</div> :
                    denominations.length === 0 ? (
                        <div className="empty-state"><div className="empty-state-icon">⛪</div><p>No denominations yet.</p></div>
                    ) : (
                        <div className={styles['admin-list']}>
                            {denominations.map((d) => (
                                <div key={d.id} className={styles['admin-list-item']}>
                                    <div className={styles['admin-list-item-info']}>
                                        <div className={styles['admin-list-item-title']}>{d.name}</div>
                                        {d.description && <div className={styles['admin-list-item-meta']}>{d.description}</div>}
                                    </div>
                                    <div className={styles['admin-list-item-actions']}>
                                        <button className="btn btn-ghost" onClick={() => handleEdit(d)}>Edit</button>
                                        <button className="btn btn-danger" onClick={() => handleDelete(d.id)} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Delete</button>
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
