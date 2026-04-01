'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker from public directory
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.mjs';

const PDFJS_OPTIONS = {
    cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
    wasmUrl: '/pdfjs/',
};

// How many pages above/below the viewport to render (total window = 2 * BUFFER + visible)
const PAGE_BUFFER = 3;

// Estimated page height in px at scale 1.0 (A4-ish). Used for placeholder sizing.
const EST_PAGE_HEIGHT = 842;
const EST_PAGE_WIDTH = 595;

export default function PdfViewer({ pdfUrl, onTextSelected }) {
    const [numPages, setNumPages] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pdfScale, setPdfScale] = useState(1.2);
    const [goToPageInput, setGoToPageInput] = useState('');
    const [visibleRange, setVisibleRange] = useState({ start: 1, end: PAGE_BUFFER + 1 });

    const scrollContainerRef = useRef(null);
    const pageRefs = useRef({});
    const observerRef = useRef(null);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setVisibleRange({ start: 1, end: Math.min(numPages, PAGE_BUFFER + 1) });
    };

    // Scroll-based virtualization: determine which pages to render
    const updateVisibleRange = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container || !numPages) return;

        const scrollTop = container.scrollTop;
        const viewportHeight = container.clientHeight;
        const pageHeight = EST_PAGE_HEIGHT * pdfScale + 40; // +40 for gap + label

        const firstVisible = Math.max(1, Math.floor(scrollTop / pageHeight) + 1);
        const lastVisible = Math.min(numPages, Math.ceil((scrollTop + viewportHeight) / pageHeight) + 1);

        const start = Math.max(1, firstVisible - PAGE_BUFFER);
        const end = Math.min(numPages, lastVisible + PAGE_BUFFER);

        setVisibleRange(prev => {
            if (prev.start === start && prev.end === end) return prev;
            return { start, end };
        });
    }, [numPages, pdfScale]);

    // Attach scroll listener for virtualization
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        let scrollTimer = null;
        const handleScroll = () => {
            updateVisibleRange();
            // After scroll settles, re-check one more time
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                updateVisibleRange();
            }, 150);
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        // Initial calc
        updateVisibleRange();

        return () => {
            container.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimer);
        };
    }, [updateVisibleRange]);

    // IntersectionObserver to track which page is currently in view (for page counter)
    useEffect(() => {
        if (!numPages || !scrollContainerRef.current) return;

        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        const observer = new IntersectionObserver(
            (entries) => {
                let maxRatio = 0;
                let visiblePage = currentPage;
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                        maxRatio = entry.intersectionRatio;
                        const pageNum = parseInt(entry.target.dataset.pageNum, 10);
                        if (!isNaN(pageNum)) visiblePage = pageNum;
                    }
                });
                if (maxRatio > 0) {
                    setCurrentPage(visiblePage);
                }
            },
            {
                root: scrollContainerRef.current,
                threshold: [0, 0.25, 0.5, 0.75, 1.0],
            }
        );

        observerRef.current = observer;

        // Observe currently-rendered page elements
        Object.values(pageRefs.current).forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [numPages, pdfScale, visibleRange]);

    // "Go to page" — scroll to the target page
    const scrollToPage = useCallback((pageNum) => {
        const pageHeight = EST_PAGE_HEIGHT * pdfScale + 40;
        const container = scrollContainerRef.current;
        if (container) {
            // Immediately render pages around the target so they're not blank
            if (numPages) {
                const start = Math.max(1, pageNum - PAGE_BUFFER);
                const end = Math.min(numPages, pageNum + PAGE_BUFFER);
                setVisibleRange({ start, end });
            }
            container.scrollTo({
                top: (pageNum - 1) * pageHeight,
                behavior: 'smooth',
            });
        }
    }, [pdfScale, numPages]);

    const handleGoToPage = useCallback(() => {
        const val = parseInt(goToPageInput, 10);
        if (!isNaN(val) && val >= 1 && val <= (numPages || 1)) {
            scrollToPage(val);
            setGoToPageInput('');
        }
    }, [goToPageInput, numPages, scrollToPage]);

    // Detect which page the selected text is on
    const getPageFromSelection = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return currentPage;

        const range = selection.getRangeAt(0);
        let node = range.startContainer;

        while (node && node !== scrollContainerRef.current) {
            if (node.dataset && node.dataset.pageNum) {
                return parseInt(node.dataset.pageNum, 10);
            }
            node = node.parentNode;
        }
        return currentPage;
    }, [currentPage]);

    const handleTextSelection = useCallback(() => {
        const selection = window.getSelection();
        const text = selection?.toString()?.trim();
        if (text && text.length > 10) {
            const pageNum = getPageFromSelection();
            onTextSelected(text, pageNum);
        }
    }, [onTextSelected, getPageFromSelection]);

    // Register a page ref for IntersectionObserver
    const setPageRef = useCallback((pageNum, el) => {
        pageRefs.current[pageNum] = el;
        if (el && observerRef.current) {
            observerRef.current.observe(el);
        }
    }, []);

    // Build array of all page numbers
    const pages = numPages ? Array.from({ length: numPages }, (_, i) => i + 1) : [];
    const placeholderHeight = EST_PAGE_HEIGHT * pdfScale;
    const placeholderWidth = EST_PAGE_WIDTH * pdfScale;

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
                {/* Page indicator + Go to page */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        Page {currentPage} / {numPages || '?'}
                    </span>
                    <span style={{ color: 'var(--border)', margin: '0 2px' }}>|</span>
                    <input
                        type="number"
                        min={1}
                        max={numPages || 1}
                        value={goToPageInput}
                        onChange={(e) => setGoToPageInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleGoToPage();
                        }}
                        placeholder="Go to…"
                        style={{
                            width: '68px', textAlign: 'center', fontSize: '0.8rem',
                            border: '1px solid var(--border)',
                            borderRadius: '4px', padding: '3px 6px',
                            background: 'var(--bg-card)',
                        }}
                    />
                    <button
                        className="btn btn-ghost"
                        style={{ padding: '3px 8px', fontSize: '0.78rem' }}
                        onClick={handleGoToPage}
                    >
                        Go
                    </button>
                </div>

                {/* Zoom controls */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '0.8rem' }} onClick={() => setPdfScale(s => Math.max(0.5, s - 0.2))}>−</button>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{Math.round(pdfScale * 100)}%</span>
                    <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '0.8rem' }} onClick={() => setPdfScale(s => Math.min(2.5, s + 0.2))}>+</button>
                </div>
            </div>

            {/* PDF Document — virtualized vertical scroll */}
            <div
                ref={scrollContainerRef}
                style={{
                    flex: 1,
                    overflow: 'auto',
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
                    {pages.map(pageNum => {
                        const isInRange = pageNum >= visibleRange.start && pageNum <= visibleRange.end;

                        return (
                            <div
                                key={pageNum}
                                data-page-num={pageNum}
                                ref={(el) => setPageRef(pageNum, el)}
                                style={{
                                    marginBottom: 'var(--space-lg)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                }}
                            >
                                {/* Page number label */}
                                <div style={{
                                    fontSize: '0.72rem',
                                    color: 'var(--text-muted)',
                                    marginBottom: '6px',
                                    fontWeight: 500,
                                    letterSpacing: '0.03em',
                                }}>
                                    — Page {pageNum} —
                                </div>

                                {isInRange ? (
                                    <Page
                                        pageNumber={pageNum}
                                        scale={pdfScale}
                                        renderTextLayer={true}
                                        renderAnnotationLayer={true}
                                        canvasBackground="white"
                                        loading={
                                            <div style={{
                                                width: `${placeholderWidth}px`,
                                                height: `${placeholderHeight}px`,
                                                background: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--text-muted)',
                                                fontSize: '0.85rem',
                                                border: '1px solid var(--border-subtle)',
                                            }}>
                                                Loading page {pageNum}…
                                            </div>
                                        }
                                    />
                                ) : (
                                    /* Placeholder for off-screen pages to maintain scroll height */
                                    <div style={{
                                        width: `${placeholderWidth}px`,
                                        height: `${placeholderHeight}px`,
                                        background: '#faf8f5',
                                        border: '1px dashed var(--border-subtle)',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.8rem',
                                    }}>
                                        Page {pageNum}
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
                💡 Select text in the PDF — it will be appended to the extract form →
            </div>
        </div>
    );
}
