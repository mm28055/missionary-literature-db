'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from '../admin.module.css';

const LAYERS = [
    { value: 'missionary', label: 'Missionary' },
    { value: 'bureaucratic', label: 'Bureaucratic' },
    { value: 'reform', label: 'Reform / Response' },
];

export default function AdminExtractsPage() {
    const [extracts, setExtracts] = useState([]);
    const [works, setWorks] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingExtract, setEditingExtract] = useState(null);
    const [selectedTagIds, setSelectedTagIds] = useState([]);
    const [form, setForm] = useState({
        content: '', source_reference: '', work_id: '', notes: '', layer: 'missionary', commentary: '',
    });

    const supabase = createClient();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const [extractsRes, worksRes, tagsRes] = await Promise.all([
            supabase.from('extracts').select(`
                *, works(title, missionaries(name)),
                extract_tags(tag_id, tags(name, tag_type))
            `).order('created_at', { ascending: false }),
            supabase.from('works').select('id, title, missionaries(name), author').order('title'),
            supabase.from('tags').select('*').order('name'),
        ]);
        setExtracts(extractsRes.data || []);
        setWorks(worksRes.data || []);
        setTags(tagsRes.data || []);
        setLoading(false);
    };

    // Organize tags
    const parentThemes = tags.filter(t => t.tag_type === 'theme' && !t.parent_id);
    const getChildren = (parentId) => tags.filter(t => t.tag_type === 'theme' && t.parent_id === parentId);
    const strategies = tags.filter(t => t.tag_type === 'strategy');
    const sourceTypes = tags.filter(t => t.tag_type === 'source_type');

    const toggleTag = (tagId) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            content: form.content.trim(),
            source_reference: form.source_reference.trim() || null,
            work_id: form.work_id || null,
            notes: form.notes.trim() || null,
            layer: form.layer,
            commentary: form.commentary.trim() || null,
        };

        let extractId;

        if (editingExtract) {
            await supabase.from('extracts').update(payload).eq('id', editingExtract.id);
            extractId = editingExtract.id;
            // Clear old tags
            await supabase.from('extract_tags').delete().eq('extract_id', extractId);
        } else {
            const { data } = await supabase.from('extracts').insert(payload).select('id').single();
            extractId = data.id;
        }

        // Insert tags
        if (selectedTagIds.length > 0) {
            await supabase.from('extract_tags').insert(
                selectedTagIds.map(tagId => ({ extract_id: extractId, tag_id: tagId }))
            );
        }

        resetForm();
        loadData();
    };

    const resetForm = () => {
        setForm({ content: '', source_reference: '', work_id: '', notes: '', layer: 'missionary', commentary: '' });
        setSelectedTagIds([]);
        setEditingExtract(null);
    };

    const startEdit = (extract) => {
        setEditingExtract(extract);
        setForm({
            content: extract.content || '',
            source_reference: extract.source_reference || '',
            work_id: extract.work_id || '',
            notes: extract.notes || '',
            layer: extract.layer || 'missionary',
            commentary: extract.commentary || '',
        });
        setSelectedTagIds((extract.extract_tags || []).map(et => et.tag_id));
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this extract?')) return;
        await supabase.from('extract_tags').delete().eq('extract_id', id);
        await supabase.from('extracts').delete().eq('id', id);
        loadData();
    };

    return (
        <div>
            <h1 className={styles['admin-title']}>Manage Extracts</h1>

            {/* Form */}
            <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ marginBottom: 'var(--space-md)' }}>
                    {editingExtract ? 'Edit Extract' : 'Add New Extract'}
                </h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <label className={styles.label}>Content *</label>
                        <textarea
                            className={styles.textarea}
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                            rows={15}
                            required
                            placeholder="The missionary extract text..."
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 'var(--space-md)', alignItems: 'end', marginBottom: 'var(--space-md)' }}>
                        <div>
                            <label className={styles.label}>Work / Source</label>
                            <select
                                className={styles.select}
                                value={form.work_id}
                                onChange={(e) => setForm({ ...form, work_id: e.target.value })}
                                style={{ width: '100%' }}
                            >
                                <option value="">— Select work —</option>
                                {works.map(w => (
                                    <option key={w.id} value={w.id}>
                                        {w.title} ({w.missionaries?.name || w.author || ''})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={styles.label}>Source Reference</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={form.source_reference}
                                onChange={(e) => setForm({ ...form, source_reference: e.target.value })}
                                placeholder="e.g. Chapter III, p. 215"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Layer</label>
                            <select
                                className={styles.select}
                                value={form.layer}
                                onChange={(e) => setForm({ ...form, layer: e.target.value })}
                                style={{ width: '100%', minWidth: '140px' }}
                            >
                                {LAYERS.map(l => (
                                    <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <label className={styles.label}>Commentary</label>
                        <textarea
                            className={styles.textarea}
                            value={form.commentary}
                            onChange={(e) => setForm({ ...form, commentary: e.target.value })}
                            rows={8}
                            placeholder="Why this extract matters, what patterns it reveals..."
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>

                    {/* Tag selection — redesigned */}
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                            <label className={styles.label} style={{ margin: 0 }}>Tags</label>
                            {selectedTagIds.length > 0 && (
                                <span style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                                    {selectedTagIds.length} selected
                                </span>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {/* Theme groups */}
                            {parentThemes.map((parent, idx) => {
                                const children = getChildren(parent.id);
                                const selectedCount = children.filter(c => selectedTagIds.includes(c.id)).length;
                                const themeColors = ['#8b5e3c', '#c0392b', '#7d3c98', '#2874a6', '#1e8449', '#b9770e'];
                                const color = themeColors[idx % themeColors.length];

                                return (
                                    <div key={parent.id} style={{
                                        border: '1px solid var(--border)',
                                        borderLeft: `4px solid ${color}`,
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        background: 'var(--surface)',
                                    }}>
                                        <div style={{
                                            padding: '10px 14px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderBottom: '1px solid var(--border)',
                                            background: 'rgba(0,0,0,0.02)',
                                        }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color }}>
                                                {String.fromCharCode(8544 + idx)}. {parent.name}
                                            </span>
                                            {selectedCount > 0 && (
                                                <span style={{
                                                    background: color,
                                                    color: '#fff',
                                                    fontSize: '0.68rem',
                                                    fontWeight: 700,
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                }}>
                                                    {selectedCount}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {children.map(child => {
                                                const isSelected = selectedTagIds.includes(child.id);
                                                return (
                                                    <button
                                                        key={child.id}
                                                        type="button"
                                                        onClick={() => toggleTag(child.id)}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '5px',
                                                            padding: '5px 12px',
                                                            fontSize: '0.8rem',
                                                            border: isSelected ? `2px solid ${color}` : '1px solid var(--border)',
                                                            borderRadius: '20px',
                                                            background: isSelected ? `${color}15` : 'transparent',
                                                            color: isSelected ? color : 'var(--text-secondary)',
                                                            fontWeight: isSelected ? 600 : 400,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s ease',
                                                        }}
                                                    >
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: '16px',
                                                            height: '16px',
                                                            borderRadius: '4px',
                                                            border: isSelected ? `2px solid ${color}` : '2px solid var(--border)',
                                                            background: isSelected ? color : 'transparent',
                                                            fontSize: '10px',
                                                            color: '#fff',
                                                            flexShrink: 0,
                                                        }}>
                                                            {isSelected ? '✓' : ''}
                                                        </span>
                                                        {child.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Discursive Strategies */}
                            <div style={{
                                border: '1px solid var(--border)',
                                borderLeft: '4px solid #38a18c',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                background: 'var(--surface)',
                            }}>
                                <div style={{
                                    padding: '10px 14px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid var(--border)',
                                    background: 'rgba(0,0,0,0.02)',
                                }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38a18c' }}>
                                        ✦ Discursive Strategies
                                    </span>
                                    {strategies.filter(s => selectedTagIds.includes(s.id)).length > 0 && (
                                        <span style={{ background: '#38a18c', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                                            {strategies.filter(s => selectedTagIds.includes(s.id)).length}
                                        </span>
                                    )}
                                </div>
                                <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {strategies.map(s => {
                                        const isSelected = selectedTagIds.includes(s.id);
                                        return (
                                            <button key={s.id} type="button" onClick={() => toggleTag(s.id)} style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                padding: '5px 12px', fontSize: '0.8rem',
                                                border: isSelected ? '2px solid #38a18c' : '1px solid var(--border)',
                                                borderRadius: '20px',
                                                background: isSelected ? 'rgba(56,161,140,0.1)' : 'transparent',
                                                color: isSelected ? '#38a18c' : 'var(--text-secondary)',
                                                fontWeight: isSelected ? 600 : 400, cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                            }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '16px', height: '16px', borderRadius: '4px',
                                                    border: isSelected ? '2px solid #38a18c' : '2px solid var(--border)',
                                                    background: isSelected ? '#38a18c' : 'transparent',
                                                    fontSize: '10px', color: '#fff', flexShrink: 0,
                                                }}>{isSelected ? '✓' : ''}</span>
                                                {s.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Source Types */}
                            <div style={{
                                border: '1px solid var(--border)',
                                borderLeft: '4px solid #64748b',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                background: 'var(--surface)',
                            }}>
                                <div style={{
                                    padding: '10px 14px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid var(--border)',
                                    background: 'rgba(0,0,0,0.02)',
                                }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
                                        ✦ Source Types
                                    </span>
                                    {sourceTypes.filter(s => selectedTagIds.includes(s.id)).length > 0 && (
                                        <span style={{ background: '#64748b', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                                            {sourceTypes.filter(s => selectedTagIds.includes(s.id)).length}
                                        </span>
                                    )}
                                </div>
                                <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {sourceTypes.map(s => {
                                        const isSelected = selectedTagIds.includes(s.id);
                                        return (
                                            <button key={s.id} type="button" onClick={() => toggleTag(s.id)} style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                padding: '5px 12px', fontSize: '0.8rem',
                                                border: isSelected ? '2px solid #64748b' : '1px solid var(--border)',
                                                borderRadius: '20px',
                                                background: isSelected ? 'rgba(100,116,139,0.1)' : 'transparent',
                                                color: isSelected ? '#64748b' : 'var(--text-secondary)',
                                                fontWeight: isSelected ? 600 : 400, cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                            }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '16px', height: '16px', borderRadius: '4px',
                                                    border: isSelected ? '2px solid #64748b' : '2px solid var(--border)',
                                                    background: isSelected ? '#64748b' : 'transparent',
                                                    fontSize: '10px', color: '#fff', flexShrink: 0,
                                                }}>{isSelected ? '✓' : ''}</span>
                                                {s.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <label className={styles.label}>Internal Notes</label>
                        <textarea
                            className={styles.textarea}
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            rows={4}
                            placeholder="Internal notes (not shown publicly)"
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <button type="submit" className="btn btn-primary">
                            {editingExtract ? 'Update' : 'Add'} Extract
                        </button>
                        {editingExtract && (
                            <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>
                        )}
                    </div>
                </form>
            </div>

            {/* List */}
            <h2 style={{ fontSize: '1.3rem', marginBottom: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                Extracts ({extracts.length})
            </h2>
            {loading ? <p>Loading...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {extracts.map(extract => (
                        <div key={extract.id} className="card" style={{ padding: 'var(--space-lg)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                            {extract.works?.missionaries?.name || extract.works?.title || 'No source'}
                                        </span>
                                        <span className={`layer-badge layer-${extract.layer}`}>
                                            {extract.layer}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.6 }}>
                                        {extract.content?.substring(0, 200)}...
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        {(extract.extract_tags || []).map(et => (
                                            <span key={et.tag_id} className={`tag ${et.tags?.tag_type === 'strategy' ? 'tag-strategy' : et.tags?.tag_type === 'source_type' ? 'tag-source' : ''}`} style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                                                {et.tags?.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-xs)', flexShrink: 0, marginLeft: 'var(--space-md)' }}>
                                    <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '4px 12px' }} onClick={() => startEdit(extract)}>Edit</button>
                                    <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '4px 12px', color: '#e74c3c' }} onClick={() => handleDelete(extract.id)}>Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
