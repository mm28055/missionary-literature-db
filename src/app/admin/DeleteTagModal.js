'use client';

import { useState, useEffect } from 'react';
import styles from './admin.module.css';

export default function DeleteTagModal({ tag, tags, supabase, onClose, onDeleted }) {
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [affectedExtracts, setAffectedExtracts] = useState([]);
    const [orphanExtracts, setOrphanExtracts] = useState([]);
    const [safeExtracts, setSafeExtracts] = useState([]);
    const [replacementTagId, setReplacementTagId] = useState('');
    const [error, setError] = useState('');

    // Get eligible replacement tags (same type, excluding current tag and its children)
    const childTagIds = tags.filter(t => t.parent_id === tag.id).map(t => t.id);
    const replacementTags = tags.filter(t =>
        t.id !== tag.id &&
        !childTagIds.includes(t.id) &&
        (t.tag_type === tag.tag_type || t.tag_type === 'theme')
    );

    useEffect(() => {
        analyzeImpact();
    }, []);

    const analyzeImpact = async () => {
        try {
            // Get all extract_ids using this tag
            const { data: tagLinks } = await supabase
                .from('extract_tags')
                .select('extract_id')
                .eq('tag_id', tag.id);

            if (!tagLinks || tagLinks.length === 0) {
                setAffectedExtracts([]);
                setOrphanExtracts([]);
                setSafeExtracts([]);
                setLoading(false);
                return;
            }

            const extractIds = tagLinks.map(tl => tl.extract_id);

            // For each affected extract, get all its tags to determine if it's an orphan
            const { data: allTagLinks } = await supabase
                .from('extract_tags')
                .select('extract_id, tag_id')
                .in('extract_id', extractIds);

            // Count tags per extract
            const tagCountMap = {};
            (allTagLinks || []).forEach(link => {
                tagCountMap[link.extract_id] = (tagCountMap[link.extract_id] || 0) + 1;
            });

            // Fetch extract content for display
            const { data: extractsData } = await supabase
                .from('extracts')
                .select('id, content, source_reference, works(title)')
                .in('id', extractIds);

            const enrichedExtracts = (extractsData || []).map(ext => ({
                ...ext,
                tagCount: tagCountMap[ext.id] || 0,
                isOrphan: (tagCountMap[ext.id] || 0) <= 1,
            }));

            const orphans = enrichedExtracts.filter(e => e.isOrphan);
            const safe = enrichedExtracts.filter(e => !e.isOrphan);

            setAffectedExtracts(enrichedExtracts);
            setOrphanExtracts(orphans);
            setSafeExtracts(safe);
        } catch (err) {
            setError('Failed to analyze impact.');
        }
        setLoading(false);
    };

    const handleReplaceAndDelete = async () => {
        if (!replacementTagId) return;
        setProcessing(true);
        setError('');

        try {
            // Get all extract_tags for the old tag
            const { data: oldLinks } = await supabase
                .from('extract_tags')
                .select('extract_id')
                .eq('tag_id', tag.id);

            if (oldLinks && oldLinks.length > 0) {
                for (const link of oldLinks) {
                    // Check if the replacement tag already exists on this extract
                    const { data: existing } = await supabase
                        .from('extract_tags')
                        .select('extract_id')
                        .eq('extract_id', link.extract_id)
                        .eq('tag_id', replacementTagId)
                        .maybeSingle();

                    if (existing) {
                        // Already has the replacement tag, just delete the old one
                        await supabase
                            .from('extract_tags')
                            .delete()
                            .eq('extract_id', link.extract_id)
                            .eq('tag_id', tag.id);
                    } else {
                        // Replace old tag with new one
                        await supabase
                            .from('extract_tags')
                            .update({ tag_id: replacementTagId })
                            .eq('extract_id', link.extract_id)
                            .eq('tag_id', tag.id);
                    }
                }
            }

            // Now delete the tag itself (and any child tags via CASCADE)
            await supabase.from('tags').delete().eq('id', tag.id);
            onDeleted();
        } catch (err) {
            setError('Failed to replace and delete. ' + (err.message || ''));
            setProcessing(false);
        }
    };

    const handleDeleteAnyway = async () => {
        setProcessing(true);
        setError('');

        try {
            await supabase.from('tags').delete().eq('id', tag.id);
            onDeleted();
        } catch (err) {
            setError('Failed to delete. ' + (err.message || ''));
            setProcessing(false);
        }
    };

    const isParent = tags.some(t => t.parent_id === tag.id);
    const childCount = childTagIds.length;

    return (
        <div className={styles['modal-overlay']} onClick={onClose}>
            <div className={styles['modal-content']} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles['modal-header']}>
                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
                        Delete &ldquo;{tag.name}&rdquo;?
                    </h3>
                    <button
                        className="btn btn-ghost"
                        onClick={onClose}
                        style={{ fontSize: '1.2rem', padding: '2px 8px', lineHeight: 1 }}
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className={styles['modal-body']}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                            Analyzing impact...
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div style={{ color: '#ff6b7a', marginBottom: 'var(--space-md)', fontSize: '0.88rem' }}>
                                    {error}
                                </div>
                            )}

                            {/* Parent tag warning */}
                            {isParent && (
                                <div className={styles['modal-warning']} style={{ marginBottom: 'var(--space-md)' }}>
                                    <strong>⚠️ This is a parent theme</strong>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                                        Deleting it will also delete {childCount} sub-theme{childCount !== 1 ? 's' : ''} under it.
                                    </p>
                                </div>
                            )}

                            {affectedExtracts.length === 0 ? (
                                <div className={styles['modal-info']}>
                                    <p style={{ margin: 0 }}>
                                        ✓ This tag is not used by any extracts. Safe to delete.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <p style={{ fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>
                                        This tag is used by <strong>{affectedExtracts.length} extract{affectedExtracts.length !== 1 ? 's' : ''}</strong>.
                                    </p>

                                    {/* Orphan warning */}
                                    {orphanExtracts.length > 0 && (
                                        <div className={styles['modal-warning']} style={{ marginBottom: 'var(--space-md)' }}>
                                            <strong>🔴 {orphanExtracts.length} extract{orphanExtracts.length !== 1 ? 's have' : ' has'} ONLY this tag:</strong>
                                            <div style={{ marginTop: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                                                {orphanExtracts.map(ext => (
                                                    <div key={ext.id} style={{
                                                        fontSize: '0.82rem',
                                                        padding: '4px 0',
                                                        borderBottom: '1px solid rgba(220,53,69,0.1)',
                                                        color: 'var(--text-secondary)',
                                                    }}>
                                                        &ldquo;{ext.content?.substring(0, 60)}...&rdquo;
                                                        {ext.source_reference && <span style={{ color: 'var(--text-muted)' }}> — {ext.source_reference}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                            <p style={{ margin: '8px 0 0', fontSize: '0.82rem', fontStyle: 'italic', color: '#e74c3c' }}>
                                                These will have no tags and won&apos;t appear under any theme on the website.
                                            </p>
                                        </div>
                                    )}

                                    {/* Safe extracts count */}
                                    {safeExtracts.length > 0 && (
                                        <div className={styles['modal-info']} style={{ marginBottom: 'var(--space-md)' }}>
                                            <p style={{ margin: 0 }}>
                                                ⚪ {safeExtracts.length} extract{safeExtracts.length !== 1 ? 's have' : ' has'} other tags too — they&apos;ll be fine.
                                            </p>
                                        </div>
                                    )}

                                    {/* Replace option */}
                                    <div className={styles['modal-replace-section']}>
                                        <h4 style={{ fontSize: '0.95rem', marginBottom: 'var(--space-sm)' }}>
                                            Option 1: Replace with another tag
                                        </h4>
                                        <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                                            <select
                                                className="form-select"
                                                value={replacementTagId}
                                                onChange={(e) => setReplacementTagId(e.target.value)}
                                                style={{ flex: 1 }}
                                            >
                                                <option value="">— Select replacement —</option>
                                                {replacementTags.map(t => {
                                                    const parent = t.parent_id ? tags.find(p => p.id === t.parent_id) : null;
                                                    return (
                                                        <option key={t.id} value={t.id}>
                                                            {parent ? `${parent.name} → ` : ''}{t.name}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <button
                                                className="btn btn-primary"
                                                onClick={handleReplaceAndDelete}
                                                disabled={!replacementTagId || processing}
                                                style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}
                                            >
                                                {processing ? 'Processing...' : 'Replace & Delete'}
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                                            All {affectedExtracts.length} extract{affectedExtracts.length !== 1 ? 's' : ''} will get the new tag instead.
                                        </p>
                                    </div>

                                    <div style={{
                                        textAlign: 'center',
                                        fontSize: '0.78rem',
                                        color: 'var(--text-muted)',
                                        padding: 'var(--space-sm) 0',
                                    }}>
                                        — or —
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Footer actions */}
                {!loading && (
                    <div className={styles['modal-actions']}>
                        <button className="btn btn-ghost" onClick={onClose} disabled={processing}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={handleDeleteAnyway}
                            disabled={processing}
                            style={{ fontSize: '0.85rem' }}
                        >
                            {processing ? 'Deleting...' : affectedExtracts.length > 0
                                ? `Delete Anyway${orphanExtracts.length > 0 ? ` (${orphanExtracts.length} will be untagged)` : ''}`
                                : 'Delete Tag'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
