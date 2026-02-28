'use client';

import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker from public directory (co-located with OpenJPEG WASM decoder)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.mjs';

// Configure paths for standard resources and WASM decoders
const PDFJS_OPTIONS = {
    cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
    wasmUrl: '/pdfjs/',
};

export default function PdfViewer({ pdfUrl, onTextSelected }) {
    const [numPages, setNumPages] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pdfScale, setPdfScale] = useState(1.2);


    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const handleTextSelection = useCallback(() => {
        const selection = window.getSelection();
        const text = selection?.toString()?.trim();
        if (text && text.length > 10) {
            onTextSelected(text, currentPage);
        }
    }, [currentPage, onTextSelected]);

    return (
        <div style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            background: '#f5f0eb',
            position: 'sticky',
            top: 'calc(var(--nav-height) + var(--space-md))',
            maxHeight: 'calc(100vh - var(--nav-height) - 2rem)',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* PDF Controls */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px',
                background: 'var(--bg-card)',
                borderBottom: '1px solid var(--border-subtle)',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                        className="btn btn-ghost"
                        style={{ padding: '4px 10px', fontSize: '0.85rem' }}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                    >
                        ◀
                    </button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Page
                        <input
                            type="number"
                            min={1}
                            max={numPages || 1}
                            value={currentPage}
                            onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val) && val >= 1 && val <= (numPages || 1)) {
                                    setCurrentPage(val);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') e.target.blur();
                            }}
                            style={{
                                width: '52px', textAlign: 'center', fontSize: '0.85rem',
                                fontWeight: 600, border: '1px solid var(--border)',
                                borderRadius: '4px', padding: '2px 4px',
                                background: 'var(--bg-card)',
                            }}
                        />
                        / {numPages || '?'}
                    </span>
                    <button
                        className="btn btn-ghost"
                        style={{ padding: '4px 10px', fontSize: '0.85rem' }}
                        onClick={() => setCurrentPage(p => Math.min(numPages || p, p + 1))}
                        disabled={currentPage >= numPages}
                    >
                        ▶
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '0.8rem' }} onClick={() => setPdfScale(s => Math.max(0.5, s - 0.2))}>−</button>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{Math.round(pdfScale * 100)}%</span>
                    <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '0.8rem' }} onClick={() => setPdfScale(s => Math.min(2.5, s + 0.2))}>+</button>
                </div>
            </div>

            {/* PDF Document */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    justifyContent: 'center',
                    padding: 'var(--space-md)',
                    position: 'relative',
                }}
                onMouseUp={handleTextSelection}
            >
                <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    options={PDFJS_OPTIONS}
                    loading={
                        <div style={{ padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>Loading PDF...</div>
                    }
                    error={
                        <div style={{ padding: 'var(--space-xl)', color: '#e74c3c' }}>Failed to load PDF. Check that the file is accessible.</div>
                    }
                >
                    {/* Pre-render adjacent pages hidden, show only current */}
                    {[currentPage - 1, currentPage, currentPage + 1]
                        .filter(p => p >= 1 && p <= (numPages || 1))
                        .map(pageNum => (
                            <div
                                key={pageNum}
                                style={pageNum === currentPage
                                    ? {}
                                    : { position: 'absolute', left: '-9999px', pointerEvents: 'none' }
                                }
                            >
                                <Page
                                    pageNumber={pageNum}
                                    scale={pdfScale}
                                    renderTextLayer={pageNum === currentPage}
                                    renderAnnotationLayer={pageNum === currentPage}
                                    canvasBackground="white"
                                    loading={<></>}
                                />
                            </div>
                        ))
                    }
                </Document>
            </div>

            {/* Selection hint */}
            <div style={{
                padding: '8px 16px',
                background: 'rgba(184, 132, 58, 0.08)',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                flexShrink: 0,
            }}>
                💡 Select text in the PDF to auto-fill the extract form →
            </div>
        </div>
    );
}
