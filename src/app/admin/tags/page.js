'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import DeleteTagModal from '../DeleteTagModal';
import styles from '../admin.module.css';

const TAG_TYPES = [
    { value: 'theme', label: 'Theme' },
    { value: 'strategy', label: 'Discursive Strategy' },
    { value: 'source_type', label: 'Source Type' },
];

export default function AdminTagsPage() {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTag, setEditingTag] = useState(null);
    const [deletingTag, setDeletingTag] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', tag_type: 'theme', parent_id: '', introduction: '' });

    const supabase = createClient();

    useEffect(() => { loadTags(); }, []);

    const loadTags = async () => {
        const { data } = await supabase.from('tags').select('*').order('name');
        setTags(data || []);
        setLoading(false);
    };

    const parentThemes = tags.filter(t => t.tag_type === 'theme' && !t.parent_id);
    const subThemes = tags.filter(t => t.tag_type === 'theme' && t.parent_id);
    const strategies = tags.filter(t => t.tag_type === 'strategy');
    const sourceTypes = tags.filter(t => t.tag_type === 'source_type');

    const getChildren = (parentId) => subThemes.filter(t => t.parent_id === parentId);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            tag_type: form.tag_type,
            parent_id: (form.tag_type === 'theme' && form.parent_id) ? form.parent_id : null,
            introduction: form.introduction.trim() || null,
            slug: form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        };

        if (editingTag) {
            await supabase.from('tags').update(payload).eq('id', editingTag.id);
        } else {
            await supabase.from('tags').insert(payload);
        }
        resetForm();
        loadTags();
    };

    const resetForm = () => {
        setForm({ name: '', description: '', tag_type: 'theme', parent_id: '', introduction: '' });
        setEditingTag(null);
    };

    const startEdit = (tag) => {
        setEditingTag(tag);
        setForm({
            name: tag.name,
            description: tag.description || '',
            tag_type: tag.tag_type || 'theme',
            parent_id: tag.parent_id || '',
            introduction: tag.introduction || '',
        });
    };

    const handleDelete = (tag) => {
        setDeletingTag(tag);
    };

    const renderTagRow = (tag, indent = false) => (
        <div key={tag.id} className={styles['list-item']} style={indent ? { paddingLeft: '2.5rem' } : {}}>
            <div>
                <strong>{tag.name}</strong>
                {tag.description && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {tag.description.substring(0, 100)}{tag.description.length > 100 ? '...' : ''}
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-xs)', alignItems: 'center' }}>
                <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '2px 8px' }} onClick={() => startEdit(tag)}>Edit</button>
                <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '2px 8px', color: '#e74c3c' }} onClick={() => handleDelete(tag)}>Delete</button>
            </div>
        </div>
    );

    return (
        <div>
            <h1 className={styles['admin-title']}>Thematic Taxonomy</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)' }}>
                Manage parent themes, sub-themes, discursive strategies, and source types.
            </p>

            {/* Add/Edit Form */}
            <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ marginBottom: 'var(--space-md)' }}>
                    {editingTag ? `Edit: ${editingTag.name}` : 'Add New Tag'}
                </h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                        <div>
                            <label className={styles.label}>Name</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Type</label>
                            <select
                                className={styles.select}
                                value={form.tag_type}
                                onChange={(e) => setForm({ ...form, tag_type: e.target.value, parent_id: '' })}
                                style={{ width: '100%' }}
                            >
                                {TAG_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {form.tag_type === 'theme' && (
                        <div style={{ marginBottom: 'var(--space-md)' }}>
                            <label className={styles.label}>Parent Theme (leave empty for top-level)</label>
                            <select
                                className={styles.select}
                                value={form.parent_id}
                                onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                                style={{ width: '100%' }}
                            >
                                <option value="">— Top-level parent theme —</option>
                                {parentThemes.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <label className={styles.label}>Description (scholarly context)</label>
                        <textarea
                            className={styles.textarea}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={6}
                            placeholder="Brief scholarly description of this tag..."
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>

                    {form.tag_type === 'theme' && (
                        <div style={{ marginBottom: 'var(--space-md)' }}>
                            <label className={styles.label}>Scholarly Introduction (displayed on theme/sub-theme page)</label>
                            <textarea
                                className={styles.textarea}
                                value={form.introduction}
                                onChange={(e) => setForm({ ...form, introduction: e.target.value })}
                                rows={15}
                                placeholder="Write a full scholarly introduction for this theme or sub-theme. This will be displayed prominently on the theme page..."
                                style={{ width: '100%', resize: 'vertical' }}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <button type="submit" className="btn btn-primary">
                            {editingTag ? 'Update' : 'Add'} Tag
                        </button>
                        {editingTag && (
                            <button type="button" className="btn btn-ghost" onClick={resetForm}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <>
                    {/* Parent Themes */}
                    <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)' }}>
                        Themes ({parentThemes.length} parents, {subThemes.length} sub-themes)
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                        {parentThemes.map((parent, idx) => {
                            const children = getChildren(parent.id);
                            const themeColors = ['#8b5e3c', '#c0392b', '#7d3c98', '#2874a6', '#1e8449', '#b9770e'];
                            const color = themeColors[idx % themeColors.length];

                            return (
                                <div key={parent.id} style={{
                                    border: '1px solid var(--border)',
                                    borderLeft: `4px solid ${color}`,
                                    borderRadius: '10px',
                                    overflow: 'hidden',
                                    background: 'var(--surface)',
                                }}>
                                    {/* Parent header */}
                                    <div style={{
                                        padding: '14px 18px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: 'rgba(0,0,0,0.02)',
                                        borderBottom: '1px solid var(--border)',
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{
                                                    fontSize: '0.95rem',
                                                    fontWeight: 700,
                                                    color,
                                                }}>
                                                    {String.fromCharCode(8544 + idx)}. {parent.name}
                                                </span>
                                                <span style={{
                                                    background: color,
                                                    color: '#fff',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                }}>
                                                    {children.length} sub-themes
                                                </span>
                                                {parent.introduction && (
                                                    <span style={{ fontSize: '0.72rem', color: '#38a18c', fontWeight: 500 }}>✦ Has introduction</span>
                                                )}
                                            </div>
                                            {parent.description && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                                                    {parent.description.substring(0, 150)}{parent.description.length > 150 ? '...' : ''}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '16px' }}>
                                            <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => startEdit(parent)}>Edit</button>
                                            <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '4px 10px', color: '#e74c3c' }} onClick={() => handleDelete(parent)}>Delete</button>
                                        </div>
                                    </div>

                                    {/* Children */}
                                    {children.length > 0 && (
                                        <div style={{ padding: '10px 18px' }}>
                                            {children.map((child, ci) => (
                                                <div key={child.id} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '10px 14px',
                                                    borderRadius: '8px',
                                                    background: ci % 2 === 0 ? 'rgba(0,0,0,0.015)' : 'transparent',
                                                    marginBottom: '2px',
                                                }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                                {child.name}
                                                            </span>
                                                            {child.introduction && (
                                                                <span style={{ fontSize: '0.65rem', color: '#38a18c', fontWeight: 500, padding: '1px 6px', border: '1px solid #38a18c', borderRadius: '6px' }}>✦ intro</span>
                                                            )}
                                                        </div>
                                                        {child.description && (
                                                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                                                                {child.description.substring(0, 120)}{child.description.length > 120 ? '...' : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '12px' }}>
                                                        <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '3px 8px' }} onClick={() => startEdit(child)}>Edit</button>
                                                        <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '3px 8px', color: '#e74c3c' }} onClick={() => handleDelete(child)}>Delete</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Strategies */}
                    <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)' }}>
                        Discursive Strategies ({strategies.length})
                    </h2>
                    <div style={{
                        border: '1px solid var(--border)',
                        borderLeft: '4px solid #38a18c',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        background: 'var(--surface)',
                        padding: '10px 18px',
                        marginBottom: 'var(--space-xl)',
                    }}>
                        {strategies.map((s, si) => (
                            <div key={s.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                background: si % 2 === 0 ? 'rgba(0,0,0,0.015)' : 'transparent',
                                marginBottom: '2px',
                            }}>
                                <div>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{s.name}</span>
                                    {s.description && (
                                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {s.description.substring(0, 120)}{s.description.length > 120 ? '...' : ''}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '12px' }}>
                                    <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '3px 8px' }} onClick={() => startEdit(s)}>Edit</button>
                                    <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '3px 8px', color: '#e74c3c' }} onClick={() => handleDelete(s)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Source Types */}
                    <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)' }}>
                        Source Types ({sourceTypes.length})
                    </h2>
                    <div style={{
                        border: '1px solid var(--border)',
                        borderLeft: '4px solid #64748b',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        background: 'var(--surface)',
                        padding: '10px 18px',
                    }}>
                        {sourceTypes.map((s, si) => (
                            <div key={s.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                background: si % 2 === 0 ? 'rgba(0,0,0,0.015)' : 'transparent',
                                marginBottom: '2px',
                            }}>
                                <div>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{s.name}</span>
                                    {s.description && (
                                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {s.description.substring(0, 120)}{s.description.length > 120 ? '...' : ''}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '12px' }}>
                                    <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '3px 8px' }} onClick={() => startEdit(s)}>Edit</button>
                                    <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '3px 8px', color: '#e74c3c' }} onClick={() => handleDelete(s)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Delete Tag Modal */}
            {deletingTag && (
                <DeleteTagModal
                    tag={deletingTag}
                    tags={tags}
                    supabase={supabase}
                    onClose={() => setDeletingTag(null)}
                    onDeleted={() => {
                        setDeletingTag(null);
                        loadTags();
                    }}
                />
            )}
        </div>
    );
}
