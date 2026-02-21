'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../admin.module.css';

export default function ManageMissionariesPage() {
    const [missionaries, setMissionaries] = useState([]);
    const [denominations, setDenominations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [birthYear, setBirthYear] = useState('');
    const [deathYear, setDeathYear] = useState('');
    const [denominationId, setDenominationId] = useState('');
    const [editingId, setEditingId] = useState(null);

    const supabase = createClient();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [mRes, dRes] = await Promise.all([
                supabase.from('missionaries').select('*, denominations(name)').order('name'),
                supabase.from('denominations').select('*').order('name'),
            ]);
            setMissionaries(mRes.data || []);
            setDenominations(dRes.data || []);
        } catch { setError('Failed to load data.'); }
        setLoading(false);
    };

    const resetForm = () => {
        setName(''); setBio(''); setBirthYear(''); setDeathYear('');
        setDenominationId(''); setEditingId(null); setError(''); setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true); setError(''); setSuccess('');
        const payload = {
            name,
            bio: bio || null,
            birth_year: birthYear ? parseInt(birthYear) : null,
            death_year: deathYear ? parseInt(deathYear) : null,
            denomination_id: denominationId || null,
        };

        try {
            if (editingId) {
                const { error } = await supabase.from('missionaries').update(payload).eq('id', editingId);
                if (error) throw error;
                setSuccess('Missionary updated!');
            } else {
                const { error } = await supabase.from('missionaries').insert(payload);
                if (error) throw error;
                setSuccess('Missionary added!');
            }
            resetForm(); loadData();
        } catch (err) { setError(err.message); }
        setSaving(false);
    };

    const handleEdit = (m) => {
        setName(m.name); setBio(m.bio || '');
        setBirthYear(m.birth_year?.toString() || '');
        setDeathYear(m.death_year?.toString() || '');
        setDenominationId(m.denomination_id || '');
        setEditingId(m.id); setSuccess('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this missionary? Associated works and extracts will also be deleted.')) return;
        await supabase.from('missionaries').delete().eq('id', id);
        loadData();
    };

    return (
        <div className="page-content">
            <div className={`container ${styles['admin-form-page']}`}>
                <div className={styles['admin-form-header']}>
                    <h1>{editingId ? 'Edit Missionary' : 'Add Missionary'}</h1>
                    <Link href="/admin" className={styles['admin-back-link']}>← Back to Dashboard</Link>
                </div>

                <form className={styles['admin-form']} onSubmit={handleSubmit}>
                    {error && <div style={{ color: '#ff6b7a', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>{error}</div>}
                    {success && <div style={{ color: '#7aff8e', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>{success}</div>}

                    <div className="form-group">
                        <label className="form-label">Name *</label>
                        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. William Carey" required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                        <div className="form-group">
                            <label className="form-label">Birth Year</label>
                            <input className="form-input" type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder="e.g. 1761" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Death Year</label>
                            <input className="form-input" type="number" value={deathYear} onChange={(e) => setDeathYear(e.target.value)} placeholder="e.g. 1834" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Denomination</label>
                        <select className="form-select" value={denominationId} onChange={(e) => setDenominationId(e.target.value)}>
                            <option value="">Select denomination...</option>
                            {denominations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Biography</label>
                        <textarea className="form-textarea" value={bio} onChange={(e) => setBio(e.target.value)}
                            placeholder="Brief biographical information..." style={{ minHeight: '120px' }} />
                    </div>

                    <div className={styles['admin-form-actions']}>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : editingId ? 'Update' : 'Add Missionary'}
                        </button>
                        {editingId && <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>}
                    </div>
                </form>

                <h2 style={{ marginTop: 'var(--space-3xl)', marginBottom: 'var(--space-lg)' }}>
                    Missionaries ({missionaries.length})
                </h2>

                {loading ? <div className="empty-state">Loading...</div> :
                    missionaries.length === 0 ? (
                        <div className="empty-state"><div className="empty-state-icon">👤</div><p>No missionaries yet.</p></div>
                    ) : (
                        <div className={styles['admin-list']}>
                            {missionaries.map((m) => (
                                <div key={m.id} className={styles['admin-list-item']}>
                                    <div className={styles['admin-list-item-info']}>
                                        <div className={styles['admin-list-item-title']}>{m.name}</div>
                                        <div className={styles['admin-list-item-meta']}>
                                            {m.denominations?.name || 'No denomination'}
                                            {m.birth_year && ` · ${m.birth_year}–${m.death_year || '?'}`}
                                        </div>
                                    </div>
                                    <div className={styles['admin-list-item-actions']}>
                                        <button className="btn btn-ghost" onClick={() => handleEdit(m)}>Edit</button>
                                        <button className="btn btn-danger" onClick={() => handleDelete(m.id)} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Delete</button>
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
