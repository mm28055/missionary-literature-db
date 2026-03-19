'use client';

import { useState, useEffect } from 'react';
import styles from './ExtractPanel.module.css';

export default function InfoPanel({ type, id, onClose, supabase }) {
    const [data, setData] = useState(null);
    const [extracts, setExtracts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) loadInfo();
    }, [id, type]);

    const loadInfo = async () => {
        setLoading(true);

        if (type === 'missionary') {
            const { data: missionary } = await supabase
                .from('missionaries')
                .select('*, denominations(name)')
                .eq('id', id)
                .single();

            setData(missionary);

            // Get all extracts by this missionary
            const { data: works } = await supabase
                .from('works')
                .select('id, title, year_published, source_type')
                .eq('missionary_id', id)
                .order('year_published');

            const workIds = (works || []).map(w => w.id);
            if (workIds.length > 0) {
                const { data: exts } = await supabase
                    .from('extracts')
                    .select('id, content, source_reference, work_id')
                    .in('work_id', workIds);
                setExtracts((exts || []).map(e => ({
                    ...e,
                    work: works.find(w => w.id === e.work_id)
                })));
            } else {
                setExtracts([]);
            }
        } else if (type === 'work') {
            const { data: work } = await supabase
                .from('works')
                .select('*, missionaries(id, name, denominations(name))')
                .eq('id', id)
                .single();

            setData(work);

            const { data: exts } = await supabase
                .from('extracts')
                .select('id, content, source_reference')
                .eq('work_id', id)
                .order('created_at');

            setExtracts(exts || []);
        }

        setLoading(false);
    };

    // Close on escape key
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const renderMissionary = () => {
        if (!data) return null;
        const years = [data.birth_year, data.death_year].filter(Boolean).join('–');
        return (
            <>
                <h2 className={styles.infoPanelName}>{data.name}</h2>
                <div className={styles.infoPanelMeta}>
                    {data.denominations?.name && <span>{data.denominations.name}</span>}
                    {years && <span> · {years}</span>}
                </div>
                {data.bio && (
                    <div className={styles.infoPanelBio}>{data.bio}</div>
                )}
                {extracts.length > 0 && (
                    <div className={styles.infoPanelSection}>
                        <div className={styles.infoPanelSectionTitle}>
                            Extracts in Database ({extracts.length})
                        </div>
                        {extracts.map(ext => (
                            <div key={ext.id} className={styles.infoPanelExtract}>
                                <div className={styles.infoPanelExtractMeta}>
                                    {ext.work?.title}{ext.source_reference ? `, ${ext.source_reference}` : ''}
                                    {ext.work?.year_published ? ` (${ext.work.year_published})` : ''}
                                </div>
                                <div className={styles.infoPanelExtractPreview}>
                                    {ext.content?.substring(0, 200)}...
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    };

    const renderWork = () => {
        if (!data) return null;
        const author = data.missionaries?.name || data.author || 'Unknown';
        return (
            <>
                <h2 className={styles.infoPanelName}>{data.title}</h2>
                <div className={styles.infoPanelMeta}>
                    <span>{author}</span>
                    {data.year_published && <span> · {data.year_published}</span>}
                    {data.source_type && <span> · {data.source_type}</span>}
                    {data.missionaries?.denominations?.name && <span> · {data.missionaries.denominations.name}</span>}
                </div>
                {data.publisher && (
                    <div className={styles.infoPanelDetail}>
                        <strong>Publisher:</strong> {data.publisher}
                    </div>
                )}
                {data.bibliographic_info && (
                    <div className={styles.infoPanelBio}>{data.bibliographic_info}</div>
                )}
                {extracts.length > 0 && (
                    <div className={styles.infoPanelSection}>
                        <div className={styles.infoPanelSectionTitle}>
                            Extracts from this Work ({extracts.length})
                        </div>
                        {extracts.map(ext => (
                            <div key={ext.id} className={styles.infoPanelExtract}>
                                {ext.source_reference && (
                                    <div className={styles.infoPanelExtractMeta}>{ext.source_reference}</div>
                                )}
                                <div className={styles.infoPanelExtractPreview}>
                                    {ext.content?.substring(0, 200)}...
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    };

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.panel}>
                <div className={styles.panelHeader}>
                    <span className={styles.panelTitle}>
                        {type === 'missionary' ? 'Missionary' : 'Work'}
                    </span>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>
                <div className={styles.panelBody}>
                    {loading ? (
                        <div className={styles.loading}>Loading...</div>
                    ) : data ? (
                        type === 'missionary' ? renderMissionary() : renderWork()
                    ) : (
                        <div className={styles.loading}>Not found</div>
                    )}
                </div>
            </div>
        </>
    );
}
