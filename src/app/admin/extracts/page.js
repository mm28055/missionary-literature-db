'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../admin.module.css';

export default function ManageExtractsPage() {
    const [extracts, setExtracts] = useState([]);
    const [works, setWorks] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [content, setContent] = useState('');
    const [sourceReference, setSourceReference] = useState('');
    const [notes, setNotes] = useState('');
    const [workId, setWorkId] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [extractsRes, worksRes, tagsRes] = await Promise.all([
                supabase.from('extracts').select(`
          *,
          works(title, missionaries(name)),
          extract_tags(tags(id, name))
        `).order('created_at', { ascending: false }),
                supabase.from('works').select('id, title, missionaries(name)').order('title'),
                supabase.from('tags').select('*').order('name'),
            ]);

            setExtracts(extractsRes.data || []);
            setWorks(worksRes.data || []);
            setTags(tagsRes.data || []);
        } catch (err) {
            setError('Failed to load data. Make sure Supabase is configured.');
        }
        setLoading(false);
    };

    const resetForm = () => {
        setContent('');
        setSourceReference('');
        setNotes('');
        setWorkId('');
        setSelectedTags([]);
        setEditingId(null);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            let extractId = editingId;

            if (editingId) {
                // Update
                const { error: updateError } = await supabase
                    .from('extracts')
                    .update({ content, source_reference: sourceReference, notes, work_id: workId || null })
                    .eq('id', editingId);
                if (updateError) throw updateError;

                // Clear existing tags
                await supabase.from('extract_tags').delete().eq('extract_id', editingId);
            } else {
                // Insert
                const { data, error: insertError } = await supabase
                    .from('extracts')
                    .insert({ content, source_reference: sourceReference, notes, work_id: workId || null })
                    .select()
                    .single();
                if (insertError) throw insertError;
                extractId = data.id;
            }

            // Insert tags
            if (selectedTags.length > 0) {
                const tagRows = selectedTags.map((tagId) => ({
                    extract_id: extractId,
                    tag_id: tagId,
                }));
                await supabase.from('extract_tags').insert(tagRows);
            }

            setSuccess(editingId ? 'Extract updated successfully!' : 'Extract added successfully!');
            resetForm();
            loadData();
        } catch (err) {
            setError(err.message || 'Failed to save extract.');
        }
        setSaving(false);
    };

    const handleEdit = (extract) => {
        setContent(extract.content);
        setSourceReference(extract.source_reference || '');
        setNotes(extract.notes || '');
        setWorkId(extract.work_id || '');
        setSelectedTags(
            (extract.extract_tags || []).map((et) => et.tags?.id).filter(Boolean)
        );
        setEditingId(extract.id);
        setSuccess('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this extract?')) return;
        try {
            await supabase.from('extracts').delete().eq('id', id);
            loadData();
            setSuccess('Extract deleted.');
        } catch (err) {
            setError('Failed to delete extract.');
        }
    };

    const toggleTag = (tagId) => {
        setSelectedTags((prev) =>
            prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
        );
    };

    return (
        <div className="page-content">
            <div className={`container ${styles['admin-form-page']}`}>
                <div className={styles['admin-form-header']}>
                    <h1>{editingId ? 'Edit Extract' : 'Add Extract'}</h1>
                    <Link href="/admin" className={styles['admin-back-link']}>← Back to Dashboard</Link>
                </div>

                {/* Form */}
                <form className={styles['admin-form']} onSubmit={handleSubmit}>
                    {error && <div style={{ color: '#ff6b7a', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>{error}</div>}
                    {success && <div style={{ color: '#7aff8e', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>{success}</div>}

                    <div className="form-group">
                        <label className="form-label">Extract Content *</label>
                        <textarea
                            className="form-textarea"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Paste the extract text here..."
                            required
                            style={{ minHeight: '200px' }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Source Reference</label>
                        <input
                            className="form-input"
                            value={sourceReference}
                            onChange={(e) => setSourceReference(e.target.value)}
                            placeholder='e.g. "Chapter 3, pp. 45-48"'
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Source Work</label>
                        <select
                            className="form-select"
                            value={workId}
                            onChange={(e) => setWorkId(e.target.value)}
                        >
                            <option value="">Select a work...</option>
                            {works.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.title} {w.missionaries ? `(${w.missionaries.name})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tags</label>
                        <div className={styles['tags-input-wrapper']}>
                            {tags.map((tag) => (
                                <span
                                    key={tag.id}
                                    className={`tag ${selectedTags.includes(tag.id) ? '' : 'tag-category'}`}
                                    onClick={() => toggleTag(tag.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {selectedTags.includes(tag.id) ? '✓ ' : ''}{tag.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Notes (private)</label>
                        <textarea
                            className="form-textarea"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Internal notes about this extract..."
                            style={{ minHeight: '80px' }}
                        />
                    </div>

                    <div className={styles['admin-form-actions']}>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : editingId ? 'Update Extract' : 'Add Extract'}
                        </button>
                        {editingId && (
                            <button type="button" className="btn btn-ghost" onClick={resetForm}>
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>

                {/* Existing extracts list */}
                <h2 style={{ marginTop: 'var(--space-3xl)', marginBottom: 'var(--space-lg)' }}>
                    Existing Extracts ({extracts.length})
                </h2>

                {loading ? (
                    <div className="empty-state">Loading...</div>
                ) : extracts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📄</div>
                        <p>No extracts yet. Add your first one above!</p>
                    </div>
                ) : (
                    <div className={styles['admin-list']}>
                        {extracts.map((extract) => (
                            <div key={extract.id} className={styles['admin-list-item']}>
                                <div className={styles['admin-list-item-info']}>
                                    <div className={styles['admin-list-item-title']}>
                                        {extract.content.substring(0, 100)}...
                                    </div>
                                    <div className={styles['admin-list-item-meta']}>
                                        {extract.works?.title || 'No work assigned'}
                                        {extract.works?.missionaries?.name && ` — ${extract.works.missionaries.name}`}
                                    </div>
                                </div>
                                <div className={styles['admin-list-item-actions']}>
                                    <button className="btn btn-ghost" onClick={() => handleEdit(extract)}>Edit</button>
                                    <button className="btn btn-danger" onClick={() => handleDelete(extract.id)} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
