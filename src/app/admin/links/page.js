'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from '../admin.module.css';

const LINK_TYPES = [
    { value: 'influenced', label: 'Influenced', desc: 'General influence on the target' },
    { value: 'adopted', label: 'Adopted', desc: 'Target directly borrowed language/framework' },
    { value: 'codified', label: 'Codified', desc: 'Missionary idea became official policy/data' },
    { value: 'reacted_to', label: 'Reacted To', desc: 'Reform response to missionary/bureaucratic text' },
];

const LAYER_COLORS = {
    missionary: '#8b5e3c',
    bureaucratic: '#38a18c',
    reform: '#9b59b6',
};

export default function AdminLinksPage() {
    const [links, setLinks] = useState([]);
    const [extracts, setExtracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingLink, setEditingLink] = useState(null);
    const [form, setForm] = useState({
        source_extract_id: '',
        target_extract_id: '',
        link_type: 'influenced',
        commentary: '',
    });

    const supabase = createClient();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const [linksRes, extractsRes] = await Promise.all([
            supabase.from('extract_links').select(`
                *,
                source:extracts!source_extract_id(id, content, layer, works(title, author, missionaries(name))),
                target:extracts!target_extract_id(id, content, layer, works(title, author, missionaries(name)))
            `).order('created_at', { ascending: false }),
            supabase.from('extracts').select('id, content, layer, works(title, author, missionaries(name))').order('created_at', { ascending: false }),
        ]);
        setLinks(linksRes.data || []);
        setExtracts(extractsRes.data || []);
        setLoading(false);
    };

    const getExtractLabel = (extract) => {
        if (!extract) return 'Unknown';
        const author = extract.works?.missionaries?.name || extract.works?.author || '';
        const title = extract.works?.title || '';
        const preview = extract.content?.substring(0, 60) || '';
        const layer = extract.layer || 'missionary';
        return `[${layer.toUpperCase()}] ${author}${author && title ? ' — ' : ''}${title ? title.substring(0, 40) : ''}${preview ? ': "' + preview + '..."' : ''}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.source_extract_id === form.target_extract_id) {
            alert('Source and target must be different extracts.');
            return;
        }

        const payload = {
            source_extract_id: form.source_extract_id,
            target_extract_id: form.target_extract_id,
            link_type: form.link_type,
            commentary: form.commentary.trim() || null,
        };

        if (editingLink) {
            await supabase.from('extract_links').update(payload).eq('id', editingLink.id);
        } else {
            const { error } = await supabase.from('extract_links').insert(payload);
            if (error) {
                alert(error.message.includes('unique') ? 'This link already exists.' : error.message);
                return;
            }
        }
        resetForm();
        loadData();
    };

    const resetForm = () => {
        setForm({ source_extract_id: '', target_extract_id: '', link_type: 'influenced', commentary: '' });
        setEditingLink(null);
    };

    const startEdit = (link) => {
        setEditingLink(link);
        setForm({
            source_extract_id: link.source_extract_id,
            target_extract_id: link.target_extract_id,
            link_type: link.link_type,
            commentary: link.commentary || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this link?')) return;
        await supabase.from('extract_links').delete().eq('id', id);
        loadData();
    };

    return (
        <div>
            <h1 className={styles['admin-title']}>Extract Cross-Links</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)' }}>
                Trace the genealogy of ideas across layers: how missionary writings became bureaucratic data and reform ammunition.
            </p>

            {/* Form */}
            <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ marginBottom: 'var(--space-md)' }}>
                    {editingLink ? 'Edit Link' : 'Create New Link'}
                </h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 'var(--space-md)', alignItems: 'end', marginBottom: 'var(--space-md)' }}>
                        <div>
                            <label className={styles.label}>Source Extract (origin of the idea)</label>
                            <select
                                className={styles.select}
                                value={form.source_extract_id}
                                onChange={(e) => setForm({ ...form, source_extract_id: e.target.value })}
                                required
                                style={{ width: '100%' }}
                            >
                                <option value="">— Select source —</option>
                                {extracts.map(e => (
                                    <option key={e.id} value={e.id}>{getExtractLabel(e)}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ textAlign: 'center', padding: '0 var(--space-sm)', fontSize: '1.5rem', color: 'var(--accent-gold)' }}>
                            →
                        </div>

                        <div>
                            <label className={styles.label}>Target Extract (where the idea landed)</label>
                            <select
                                className={styles.select}
                                value={form.target_extract_id}
                                onChange={(e) => setForm({ ...form, target_extract_id: e.target.value })}
                                required
                                style={{ width: '100%' }}
                            >
                                <option value="">— Select target —</option>
                                {extracts.map(e => (
                                    <option key={e.id} value={e.id}>{getExtractLabel(e)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <label className={styles.label}>Link Type</label>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                            {LINK_TYPES.map(lt => (
                                <button
                                    key={lt.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, link_type: lt.value })}
                                    style={{
                                        padding: '8px 16px',
                                        border: form.link_type === lt.value ? '2px solid var(--accent-gold)' : '1px solid var(--border)',
                                        borderRadius: '6px',
                                        background: form.link_type === lt.value ? 'rgba(212, 165, 116, 0.15)' : 'var(--surface)',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: form.link_type === lt.value ? 600 : 400,
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <div>{lt.label}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{lt.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <label className={styles.label}>Commentary (how did this idea travel?)</label>
                        <textarea
                            className={styles.textarea}
                            value={form.commentary}
                            onChange={(e) => setForm({ ...form, commentary: e.target.value })}
                            rows={6}
                            placeholder="Explain how the source extract influenced or was adopted by the target. What changed, what was preserved, and what does this tell us about the genealogy of ideas?"
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <button type="submit" className="btn btn-primary">
                            {editingLink ? 'Update' : 'Create'} Link
                        </button>
                        {editingLink && (
                            <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>
                        )}
                    </div>
                </form>
            </div>

            {/* Existing links */}
            {loading ? <p>Loading...</p> : (
                <>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)' }}>
                        Existing Links ({links.length})
                    </h2>
                    {links.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No cross-links yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {links.map(link => (
                                <div key={link.id} className="card" style={{ padding: 'var(--space-lg)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)', flexWrap: 'wrap' }}>
                                        {/* Source */}
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                borderRadius: '4px',
                                                color: '#fff',
                                                background: LAYER_COLORS[link.source?.layer] || '#666',
                                                marginBottom: '4px',
                                            }}>
                                                {link.source?.layer}
                                            </span>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                                {link.source?.works?.missionaries?.name || link.source?.works?.author || 'Unknown'}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                {link.source?.works?.title}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                "{link.source?.content?.substring(0, 80)}..."
                                            </div>
                                        </div>

                                        {/* Arrow + type */}
                                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                            <div style={{ fontSize: '1.5rem', color: 'var(--accent-gold)' }}>→</div>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                {link.link_type}
                                            </div>
                                        </div>

                                        {/* Target */}
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                borderRadius: '4px',
                                                color: '#fff',
                                                background: LAYER_COLORS[link.target?.layer] || '#666',
                                                marginBottom: '4px',
                                            }}>
                                                {link.target?.layer}
                                            </span>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                                {link.target?.works?.missionaries?.name || link.target?.works?.author || 'Unknown'}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                {link.target?.works?.title}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                "{link.target?.content?.substring(0, 80)}..."
                                            </div>
                                        </div>
                                    </div>

                                    {link.commentary && (
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: 'var(--space-sm) 0', borderTop: '1px solid var(--border)', marginTop: 'var(--space-sm)' }}>
                                            {link.commentary}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: 'var(--space-xs)', justifyContent: 'flex-end', marginTop: 'var(--space-sm)' }}>
                                        <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '2px 8px' }} onClick={() => startEdit(link)}>Edit</button>
                                        <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '2px 8px', color: '#e74c3c' }} onClick={() => handleDelete(link.id)}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
