'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../admin.module.css';

const LAYERS = [
    { value: 'missionary', label: 'Missionary' },
    { value: 'bureaucratic', label: 'Bureaucratic' },
    { value: 'reform', label: 'Reform / Response' },
];

const SOURCE_TYPES = [
    { value: 'Published Book', label: 'Published Book' },
    { value: 'Letter to Missionary Society', label: 'Letter to Missionary Society' },
    { value: 'Tract for Indian Distribution', label: 'Tract for Indian Distribution' },
    { value: 'Official / Institutional Report', label: 'Official / Institutional Report' },
    { value: 'Private Diary / Journal', label: 'Private Diary / Journal' },
    { value: 'Periodical / Magazine Article', label: 'Periodical / Magazine Article' },
    { value: 'Conference Paper', label: 'Conference Paper' },
];

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
    const [author, setAuthor] = useState('');
    const [layer, setLayer] = useState('missionary');
    const [missionaryId, setMissionaryId] = useState('');
    const [pdfUrl, setPdfUrl] = useState('');
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [sourceType, setSourceType] = useState('');
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
        setBiblioInfo(''); setAuthor(''); setLayer('missionary');
        setMissionaryId(''); setPdfUrl(''); setSourceType(''); setEditingId(null);
        setError(''); setSuccess('');
    };

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file.');
            return;
        }
        setUploadingPdf(true);
        setError('');
        try {
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const { error: uploadError } = await supabase.storage
                .from('pdfs')
                .upload(fileName, file, { contentType: 'application/pdf' });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage
                .from('pdfs')
                .getPublicUrl(fileName);
            setPdfUrl(urlData.publicUrl);
        } catch (err) {
            setError('PDF upload failed: ' + (err.message || 'Unknown error'));
        }
        setUploadingPdf(false);
    };

    const removePdf = () => {
        setPdfUrl('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true); setError(''); setSuccess('');
        const payload = {
            title,
            year_published: yearPublished ? parseInt(yearPublished) : null,
            publisher: publisher || null,
            bibliographic_info: biblioInfo || null,
            author: author || null,
            layer,
            missionary_id: missionaryId || null,
            pdf_url: pdfUrl || null,
            source_type: sourceType || null,
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
        setAuthor(w.author || ''); setLayer(w.layer || 'missionary');
        setMissionaryId(w.missionary_id || ''); setPdfUrl(w.pdf_url || '');
        setSourceType(w.source_type || '');
        setEditingId(w.id); setSuccess('');
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-lg)' }}>
                        <div className="form-group">
                            <label className="form-label">Year Published</label>
                            <input className="form-input" type="number" value={yearPublished} onChange={(e) => setYearPublished(e.target.value)} placeholder="e.g. 1822" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Publisher</label>
                            <input className="form-input" value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="e.g. Serampore Mission Press" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Layer</label>
                            <select className="form-select" value={layer} onChange={(e) => setLayer(e.target.value)}>
                                {LAYERS.map(l => (
                                    <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Source Type</label>
                        <select className="form-select" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                            <option value="">Select source type...</option>
                            {SOURCE_TYPES.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                        <div className="form-group">
                            <label className="form-label">Missionary Author</label>
                            <select className="form-select" value={missionaryId} onChange={(e) => setMissionaryId(e.target.value)}>
                                <option value="">Select missionary...</option>
                                {missionaries.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Non-Missionary Author</label>
                            <input className="form-input" value={author} onChange={(e) => setAuthor(e.target.value)}
                                placeholder="For bureaucratic/reform sources" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Bibliographic Information</label>
                        <textarea className="form-textarea" value={biblioInfo} onChange={(e) => setBiblioInfo(e.target.value)}
                            placeholder="Full bibliographic citation, edition details, etc." style={{ minHeight: '100px' }} />
                    </div>

                    {/* PDF Upload */}
                    <div className="form-group">
                        <label className="form-label">PDF Document</label>
                        {pdfUrl ? (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-md)',
                                padding: 'var(--space-sm) var(--space-md)',
                                background: 'rgba(56, 161, 140, 0.06)',
                                border: '1px solid rgba(56, 161, 140, 0.2)',
                                borderRadius: 'var(--radius-sm)',
                            }}>
                                <span style={{ fontSize: '1.2rem' }}>📄</span>
                                <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>PDF uploaded</span>
                                <button type="button" className="btn btn-ghost" onClick={removePdf}
                                    style={{ fontSize: '0.8rem', padding: '2px 8px', color: '#e74c3c' }}>Remove</button>
                            </div>
                        ) : (
                            <div>
                                <input
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={handlePdfUpload}
                                    disabled={uploadingPdf}
                                    style={{ fontSize: '0.85rem' }}
                                />
                                {uploadingPdf && <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: 'var(--space-sm)' }}>Uploading...</span>}
                            </div>
                        )}
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
                                        <div className={styles['admin-list-item-title']}>
                                            {w.title}
                                            {w.pdf_url && <span style={{ marginLeft: '8px', fontSize: '0.72rem', color: '#38a18c', fontWeight: 500 }}>📄 PDF</span>}
                                        </div>
                                        <div className={styles['admin-list-item-meta']}>
                                            {w.missionaries?.name || w.author || 'Unknown author'}
                                            {w.year_published && ` · ${w.year_published}`}
                                            {w.layer && w.layer !== 'missionary' && ` · ${w.layer}`}
                                            {w.source_type && ` · ${w.source_type}`}
                                        </div>
                                    </div>
                                    <div className={styles['admin-list-item-actions']}>
                                        {w.pdf_url && (
                                            <Link href={`/admin/works/${w.id}/extract`} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                                                Extract Passages
                                            </Link>
                                        )}
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
