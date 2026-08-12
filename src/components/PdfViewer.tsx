import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const { t } = useTranslation();
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.getBoundingClientRect().width);
      }
    };
    
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setScale(1);

  return (
    <div className="flex flex-col h-full bg-surface-container overflow-hidden rounded-xl" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 sm:p-3 bg-surface-container-highest border-b border-outline-variant/20 z-10">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button 
            onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1}
            className="p-1 sm:p-2 rounded-lg hover:bg-surface-container-highest disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-on-surface"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <span className="text-xs sm:text-sm font-medium text-on-surface-variant min-w-[3rem] sm:min-w-[4rem] text-center">
            {pageNumber} / {numPages || '-'}
          </span>
          <button 
            onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages || 1))}
            disabled={pageNumber >= (numPages || 1)}
            className="p-1 sm:p-2 rounded-lg hover:bg-surface-container-highest disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-on-surface"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button 
            onClick={handleZoomOut}
            className="p-1 sm:p-2 rounded-lg hover:bg-surface-container-highest transition-colors text-on-surface"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button 
            onClick={resetZoom}
            className="px-2 py-1 text-xs sm:text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors min-w-[2.5rem] sm:min-w-[3rem] text-center"
            title="Reset Zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button 
            onClick={handleZoomIn}
            className="p-1 sm:p-2 rounded-lg hover:bg-surface-container-highest transition-colors text-on-surface"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Viewer Area */}
      <div className="flex-1 overflow-auto bg-[#E5E7EB] dark:bg-[#1E1E1E] relative custom-scrollbar flex justify-center p-4 sm:p-8">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center h-full w-full absolute inset-0 text-on-surface-variant">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>Loading PDF...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center h-full w-full absolute inset-0 text-error">
              <AlertCircle className="w-8 h-8 mb-4" />
              <p>Failed to load PDF.</p>
            </div>
          }
          className="flex flex-col items-center"
        >
          <div className="shadow-lg bg-white">
            <Page 
              pageNumber={pageNumber} 
              scale={scale}
              width={containerWidth > 0 ? (containerWidth < 600 ? containerWidth - 32 : undefined) : undefined}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="max-w-full"
            />
          </div>
        </Document>
      </div>
    </div>
  );
}
