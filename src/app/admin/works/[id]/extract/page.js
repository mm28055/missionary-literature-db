'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import styles from '../../../admin.module.css';

// Dynamically import PdfViewer with SSR disabled — react-pdf needs browser canvas
const PdfViewer = dynamic(() => import('./PdfViewer'), { ssr: false });

const LAYERS = [
    { value: 'missionary', label: 'Missionary' },
    { value: 'bureaucratic', label: 'Bureaucratic' },
    { value: 'reform', label: 'Reform / Response' },
];

export default function ExtractFromWorkPage() {
    const params = useParams();
    const workId = params.id;
    const supabase = createClient();

    // Work data
    const [work, setWork] = useState(null);
    const [loading, setLoading] = useState(true);

    // Extract form
    const [form, setForm] = useState({
        content: '', source_reference: '', layer: 'missionary', commentary: '', notes: '',
    });
    const [selectedTagIds, setSelectedTagIds] = useState([]);
    const [tags, setTags] = useState([]);
    const [saving, setSaving] = useState(false);
    const [savedMessage, setSavedMessage] = useState('');

    // Existing extracts from this work
    const [existingExtracts, setExistingExtracts] = useState([]);
    const [editingExtractId, setEditingExtractId] = useState(null);

    useEffect(() => {
        loadAll();
    }, [workId]);

    const loadAll = async () => {
        const [workRes, tagsRes, extractsRes] = await Promise.all([
            supabase.from('works').select('*, missionaries(name)').eq('id', workId).single(),
            supabase.from('tags').select('*').order('name'),
            supabase.from('extracts').select(`
                *, extract_tags(tag_id, tags(name, tag_type))
            `).eq('work_id', workId).order('created_at', { ascending: false }),
        ]);
        setWork(workRes.data);
        setTags(tagsRes.data || []);
        setExistingExtracts(extractsRes.data || []);
        if (workRes.data) {
            setForm(f => ({ ...f, layer: workRes.data.layer || 'missionary' }));
        }
        setLoading(false);
    };

    // Tag organization
    const parentThemes = tags.filter(t => t.tag_type === 'theme' && !t.parent_id);
    const getChildren = (parentId) => tags.filter(t => t.tag_type === 'theme' && t.parent_id === parentId);
    const strategies = tags.filter(t => t.tag_type === 'strategy');
    const sourceTypes = tags.filter(t => t.tag_type === 'source_type');

    const toggleTag = (tagId) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    // Handle text selection from PDF viewer — append mode
    const handleTextSelected = useCallback((text, pageNum) => {
        setForm(f => {
            if (!f.content.trim()) {
                // First selection: set content and page ref
                return { ...f, content: text, source_reference: `p. ${pageNum}` };
            }
            // Subsequent selection: append with space
            const newContent = f.content + ' ' + text;

            // Smart source_reference: merge page numbers
            const existingRef = f.source_reference || '';
            let newRef = existingRef;
            const singleMatch = existingRef.match(/^p\.\s*(\d+)$/);
            const rangeMatch = existingRef.match(/^pp\.\s*(\d+)[–-](\d+)$/);
            if (singleMatch) {
                const startPage = parseInt(singleMatch[1], 10);
                if (pageNum !== startPage) {
                    newRef = `pp. ${Math.min(startPage, pageNum)}–${Math.max(startPage, pageNum)}`;
                }
            } else if (rangeMatch) {
                const startPage = parseInt(rangeMatch[1], 10);
                const endPage = parseInt(rangeMatch[2], 10);
                const newStart = Math.min(startPage, pageNum);
                const newEnd = Math.max(endPage, pageNum);
                newRef = newStart === newEnd ? `p. ${newStart}` : `pp. ${newStart}–${newEnd}`;
            } else {
                newRef = `p. ${pageNum}`;
            }

            return { ...f, content: newContent, source_reference: newRef };
        });
        setSavedMessage('');
        setEditingExtractId(null);

        // Flash the textarea to signal text was appended
        const textarea = document.querySelector('[data-extract-content]');
        if (textarea) {
            textarea.style.transition = 'box-shadow 0.15s ease';
            textarea.style.boxShadow = '0 0 0 3px rgba(184, 132, 58, 0.4)';
            setTimeout(() => { textarea.style.boxShadow = 'none'; }, 600);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.content.trim()) return;
        setSaving(true);
        setSavedMessage('');

        const payload = {
            content: form.content.trim(),
            source_reference: form.source_reference.trim() || null,
            work_id: workId,
            notes: form.notes.trim() || null,
            layer: form.layer,
            commentary: form.commentary.trim() || null,
        };

        let extractId;

        if (editingExtractId) {
            await supabase.from('extracts').update(payload).eq('id', editingExtractId);
            extractId = editingExtractId;
            await supabase.from('extract_tags').delete().eq('extract_id', extractId);
        } else {
            const { data } = await supabase.from('extracts').insert(payload).select('id').single();
            extractId = data.id;
        }

        if (selectedTagIds.length > 0) {
            await supabase.from('extract_tags').insert(
                selectedTagIds.map(tagId => ({ extract_id: extractId, tag_id: tagId }))
            );
        }

        setSaving(false);
        setSavedMessage(editingExtractId ? 'Extract updated ✓' : 'Extract saved ✓');
        setForm({ content: '', source_reference: '', layer: form.layer, commentary: '', notes: '' });
        setSelectedTagIds([]);
        setEditingExtractId(null);
        loadAll();
    };

    const startEditExtract = (extract) => {
        setEditingExtractId(extract.id);
        setForm({
            content: extract.content || '',
            source_reference: extract.source_reference || '',
            layer: extract.layer || 'missionary',
            commentary: extract.commentary || '',
            notes: extract.notes || '',
        });
        setSelectedTagIds((extract.extract_tags || []).map(et => et.tag_id));
        setSavedMessage('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteExtract = async (id) => {
        if (!confirm('Delete this extract?')) return;
        await supabase.from('extract_tags').delete().eq('extract_id', id);
        await supabase.from('extracts').delete().eq('id', id);
        loadAll();
    };

    const resetForm = () => {
        setForm({ content: '', source_reference: '', layer: work?.layer || 'missionary', commentary: '', notes: '' });
        setSelectedTagIds([]);
        setEditingExtractId(null);
        setSavedMessage('');
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="container">
                    <div className="empty-state">Loading...</div>
                </div>
            </div>
        );
    }

    if (!work) {
        return (
            <div className="page-content">
                <div className="container">
                    <div className="empty-state">
                        <p>Work not found.</p>
                        <Link href="/admin/works" className="btn btn-secondary" style={{ marginTop: 'var(--space-md)' }}>← Back to Works</Link>
                    </div>
                </div>
            </div>
        );
    }

    const themeColors = ['#8b5e3c', '#c0392b', '#7d3c98', '#2874a6', '#1e8449', '#b9770e'];

    return (
        <div className="page-content" style={{ paddingTop: 'var(--space-lg)' }}>
            <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 var(--space-lg)' }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-lg)',
                    paddingBottom: 'var(--space-md)',
                    borderBottom: '1px solid var(--border-subtle)',
                }}>
                    <div>
                        <Link href="/admin/works" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>← Back to Works</Link>
                        <h1 style={{ fontSize: '1.5rem', marginTop: '4px' }}>
                            Extract Passages
                        </h1>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
                            {work.title} — {work.missionaries?.name || work.author || 'Unknown'}
                            {work.year_published && ` (${work.year_published})`}
                        </p>
                    </div>
                    <span className={`layer-badge layer-${work.layer || 'missionary'}`}>
                        {work.layer || 'missionary'}
                    </span>
                </div>

                {/* Split-screen layout */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: work.pdf_url ? '60fr 40fr' : '1fr',
                    gap: 'var(--space-xl)',
                    alignItems: 'start',
                }}>
                    {/* Left: PDF Viewer */}
                    {work.pdf_url && (
                        <PdfViewer
                            pdfUrl={work.pdf_url}
                            onTextSelected={handleTextSelected}
                        />
                    )}

                    {/* Right: Extract Form + Tags + Saved Extracts */}
                    <div>
                        {/* Extract Form */}
                        <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-md)' }}>
                                {editingExtractId ? '✏️ Edit Extract' : '📝 New Extract'}
                            </h3>

                            {savedMessage && (
                                <div style={{
                                    background: 'rgba(56, 161, 140, 0.08)',
                                    border: '1px solid rgba(56, 161, 140, 0.2)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: 'var(--space-sm) var(--space-md)',
                                    marginBottom: 'var(--space-md)',
                                    fontSize: '0.85rem',
                                    color: '#38a18c',
                                }}>
                                    {savedMessage}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {/* Content */}
                                <div style={{ marginBottom: 'var(--space-md)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <label className={styles.label} style={{ margin: 0 }}>Selected Passage *</label>
                                        {form.content && (
                                            <button
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, content: '', source_reference: '' }))}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    fontSize: '0.75rem', color: 'var(--text-muted)',
                                                    display: 'flex', alignItems: 'center', gap: '3px',
                                                    padding: '2px 6px', borderRadius: '4px',
                                                    transition: 'all 0.15s ease',
                                                }}
                                                onMouseEnter={e => e.target.style.color = '#e74c3c'}
                                                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                                            >
                                                ✕ Clear
                                            </button>
                                        )}
                                    </div>
                                    <textarea
                                        data-extract-content
                                        className={styles.textarea || 'form-textarea'}
                                        value={form.content}
                                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                                        rows={8}
                                        required
                                        placeholder={work.pdf_url
                                            ? "Select text in the PDF — selections will be appended here"
                                            : "Paste the extract passage here..."
                                        }
                                        style={{ width: '100%', resize: 'vertical' }}
                                    />
                                    {work.pdf_url && form.content && (
                                        <div style={{
                                            fontSize: '0.72rem', color: 'var(--text-muted)',
                                            marginTop: '4px', fontStyle: 'italic',
                                        }}>
                                            Selecting more text in the PDF will append to this field.
                                        </div>
                                    )}
                                </div>

                                {/* Source ref + Layer */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                    <div>
                                        <label className={styles.label}>Source Reference</label>
                                        <input
                                            type="text"
                                            className={styles.input || 'form-input'}
                                            value={form.source_reference}
                                            onChange={(e) => setForm({ ...form, source_reference: e.target.value })}
                                            placeholder="e.g. p. 47"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div>
                                        <label className={styles.label}>Layer</label>
                                        <select
                                            className={styles.select || 'form-select'}
                                            value={form.layer}
                                            onChange={(e) => setForm({ ...form, layer: e.target.value })}
                                            style={{ width: '100%' }}
                                        >
                                            {LAYERS.map(l => (
                                                <option key={l.value} value={l.value}>{l.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Commentary */}
                                <div style={{ marginBottom: 'var(--space-md)' }}>
                                    <label className={styles.label}>Commentary</label>
                                    <textarea
                                        className={styles.textarea || 'form-textarea'}
                                        value={form.commentary}
                                        onChange={(e) => setForm({ ...form, commentary: e.target.value })}
                                        rows={4}
                                        placeholder="Why this passage matters..."
                                        style={{ width: '100%', resize: 'vertical' }}
                                    />
                                </div>

                                {/* Tags */}
                                <div style={{ marginBottom: 'var(--space-md)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                        <label className={styles.label} style={{ margin: 0 }}>Tags</label>
                                        {selectedTagIds.length > 0 && (
                                            <span style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                                                {selectedTagIds.length} selected
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {/* Theme groups */}
                                        {parentThemes.map((parent, idx) => {
                                            const children = getChildren(parent.id);
                                            const selectedCount = children.filter(c => selectedTagIds.includes(c.id)).length;
                                            const color = themeColors[idx % themeColors.length];

                                            return (
                                                <div key={parent.id} style={{
                                                    border: '1px solid var(--border)',
                                                    borderLeft: `3px solid ${color}`,
                                                    borderRadius: '6px',
                                                    overflow: 'hidden',
                                                    background: 'var(--surface)',
                                                }}>
                                                    <div style={{
                                                        padding: '6px 12px',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        background: 'rgba(0,0,0,0.02)',
                                                        borderBottom: '1px solid var(--border)',
                                                    }}>
                                                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color }}>
                                                            {parent.name}
                                                        </span>
                                                        {selectedCount > 0 && (
                                                            <span style={{
                                                                background: color, color: '#fff',
                                                                fontSize: '0.62rem', fontWeight: 700,
                                                                padding: '1px 6px', borderRadius: '10px',
                                                            }}>{selectedCount}</span>
                                                        )}
                                                    </div>
                                                    <div style={{ padding: '6px 12px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                        {children.map(child => {
                                                            const isSelected = selectedTagIds.includes(child.id);
                                                            return (
                                                                <button
                                                                    key={child.id}
                                                                    type="button"
                                                                    onClick={() => toggleTag(child.id)}
                                                                    style={{
                                                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                        padding: '3px 10px', fontSize: '0.75rem',
                                                                        border: isSelected ? `2px solid ${color}` : '1px solid var(--border)',
                                                                        borderRadius: '16px',
                                                                        background: isSelected ? `${color}15` : 'transparent',
                                                                        color: isSelected ? color : 'var(--text-secondary)',
                                                                        fontWeight: isSelected ? 600 : 400,
                                                                        cursor: 'pointer', transition: 'all 0.15s ease',
                                                                    }}
                                                                >
                                                                    {isSelected ? '✓ ' : ''}{child.name}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Strategies */}
                                        <div style={{
                                            border: '1px solid var(--border)',
                                            borderLeft: '3px solid #38a18c',
                                            borderRadius: '6px', overflow: 'hidden', background: 'var(--surface)',
                                        }}>
                                            <div style={{
                                                padding: '6px 12px',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)',
                                            }}>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#38a18c' }}>✦ Strategies</span>
                                            </div>
                                            <div style={{ padding: '6px 12px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {strategies.map(s => {
                                                    const isSelected = selectedTagIds.includes(s.id);
                                                    return (
                                                        <button key={s.id} type="button" onClick={() => toggleTag(s.id)} style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                            padding: '3px 10px', fontSize: '0.75rem',
                                                            border: isSelected ? '2px solid #38a18c' : '1px solid var(--border)',
                                                            borderRadius: '16px',
                                                            background: isSelected ? 'rgba(56,161,140,0.1)' : 'transparent',
                                                            color: isSelected ? '#38a18c' : 'var(--text-secondary)',
                                                            fontWeight: isSelected ? 600 : 400,
                                                            cursor: 'pointer', transition: 'all 0.15s ease',
                                                        }}>
                                                            {isSelected ? '✓ ' : ''}{s.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Source Types */}
                                        <div style={{
                                            border: '1px solid var(--border)',
                                            borderLeft: '3px solid #64748b',
                                            borderRadius: '6px', overflow: 'hidden', background: 'var(--surface)',
                                        }}>
                                            <div style={{
                                                padding: '6px 12px',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)',
                                            }}>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>✦ Source Types</span>
                                            </div>
                                            <div style={{ padding: '6px 12px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {sourceTypes.map(s => {
                                                    const isSelected = selectedTagIds.includes(s.id);
                                                    return (
                                                        <button key={s.id} type="button" onClick={() => toggleTag(s.id)} style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                            padding: '3px 10px', fontSize: '0.75rem',
                                                            border: isSelected ? '2px solid #64748b' : '1px solid var(--border)',
                                                            borderRadius: '16px',
                                                            background: isSelected ? 'rgba(100,116,139,0.1)' : 'transparent',
                                                            color: isSelected ? '#64748b' : 'var(--text-secondary)',
                                                            fontWeight: isSelected ? 600 : 400,
                                                            cursor: 'pointer', transition: 'all 0.15s ease',
                                                        }}>
                                                            {isSelected ? '✓ ' : ''}{s.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Internal Notes */}
                                <div style={{ marginBottom: 'var(--space-md)' }}>
                                    <label className={styles.label}>Internal Notes</label>
                                    <textarea
                                        className={styles.textarea || 'form-textarea'}
                                        value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        rows={2}
                                        placeholder="Internal notes (not shown publicly)"
                                        style={{ width: '100%', resize: 'vertical' }}
                                    />
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? 'Saving...' : editingExtractId ? 'Update Extract' : 'Save Extract'}
                                    </button>
                                    {(form.content || editingExtractId) && (
                                        <button type="button" className="btn btn-ghost" onClick={resetForm}>
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Existing extracts from this work */}
                        {existingExtracts.length > 0 && (
                            <div>
                                <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>
                                    Saved Extracts from this Work ({existingExtracts.length})
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                    {existingExtracts.map(extract => (
                                        <div key={extract.id} style={{
                                            padding: 'var(--space-md)',
                                            background: editingExtractId === extract.id ? 'rgba(184, 132, 58, 0.08)' : 'var(--bg-card)',
                                            border: editingExtractId === extract.id
                                                ? '2px solid var(--accent-gold)'
                                                : '1px solid var(--border-subtle)',
                                            borderRadius: 'var(--radius-md)',
                                            transition: 'all 0.15s ease',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{
                                                        fontSize: '0.82rem', color: 'var(--text-secondary)',
                                                        margin: '0 0 6px 0', lineHeight: 1.5,
                                                        fontStyle: 'italic',
                                                    }}>
                                                        &ldquo;{extract.content?.substring(0, 150)}{extract.content?.length > 150 ? '...' : ''}&rdquo;
                                                    </p>
                                                    {extract.source_reference && (
                                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                            {extract.source_reference}
                                                        </span>
                                                    )}
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '6px' }}>
                                                        {(extract.extract_tags || []).map(et => (
                                                            <span key={et.tag_id} className={`tag ${et.tags?.tag_type === 'strategy' ? 'tag-strategy' : et.tags?.tag_type === 'source_type' ? 'tag-source' : ''}`}
                                                                style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                                                                {et.tags?.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: 'var(--space-sm)' }}>
                                                    <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                                                        onClick={() => startEditExtract(extract)}>Edit</button>
                                                    <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '2px 8px', color: '#e74c3c' }}
                                                        onClick={() => handleDeleteExtract(extract.id)}>Delete</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
