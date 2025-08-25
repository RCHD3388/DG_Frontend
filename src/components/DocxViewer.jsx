import React, { useRef, useEffect, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { MdError, MdDownload, MdZoomIn, MdZoomOut } from 'react-icons/md';
import { FiFileText } from 'react-icons/fi';

import './docx-preview.css';

function DocxViewer({ docxUrl, height = '1800px', showToolbar = true }) {
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    if (!docxUrl || !containerRef.current) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const abortController = new AbortController();
    const signal = abortController.signal;

    const fetchAndRenderDocx = async () => {
      try {
        const response = await fetch(docxUrl, { signal });
        if (!response.ok) {
          throw new Error(`Failed to fetch DOCX: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        await renderAsync(arrayBuffer, containerRef.current, null, {
          className: "docx-viewer",
          inWrapper: true,
          ignoreWebWorkers: false,
          breakPages: true,
          useMathMLPolyfill: true,
        });
        
        // Hitung jumlah halaman setelah render
        const pages = containerRef.current.querySelectorAll('.docx-page');
        setPageCount(pages.length);
        
        setIsLoading(false);

      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Fetch aborted for DOCX viewer');
        } else {
          console.error("Error rendering DOCX:", err);
          setError(`Failed to load document: ${err.message}`);
          setIsLoading(false);
        }
      }
    };

    fetchAndRenderDocx();

    return () => {
      abortController.abort();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [docxUrl]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleDownload = () => {
    if (docxUrl) {
      const link = document.createElement('a');
      link.href = docxUrl;
      link.download = 'document.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div 
      className="docx-viewer-container rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-white dark:bg-gray-800 dark:border-gray-700" 
      style={{height}}
    >
      {showToolbar && (
        <div className="docx-toolbar flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 dark:bg-gray-700 dark:border-gray-600">
          <div className="flex items-center space-x-2">
            <FiFileText className="text-blue-500 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              DOCX Preview {pageCount > 0 && `(${pageCount} pages)`}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
              className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200"
              title="Zoom Out"
            >
              <MdZoomOut size={18} />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button 
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2}
              className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200"
              title="Zoom In"
            >
              <MdZoomIn size={18} />
            </button>
            <button 
              onClick={handleDownload}
              className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
              title="Download Document"
            >
              <MdDownload size={18} />
            </button>
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-full p-6 bg-white dark:bg-gray-800">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Loading document preview...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This may take a moment</p>
        </div>
      )}
      
      {error && (
        <div className="flex flex-col items-center justify-center h-full p-6 bg-white dark:bg-gray-800">
          <div className="p-3 bg-red-100 rounded-full dark:bg-red-900/30">
            <MdError className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200">{error}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center max-w-md">
            Please ensure the file is a valid DOCX document and is accessible at the provided URL.
          </p>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className={`docx-preview-content w-full h-full overflow-auto bg-gray-100 dark:bg-gray-900 ${isLoading || error ? 'hidden' : ''}`}
        style={{ 
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top center',
          padding: `${20 * zoomLevel}px ${40 * zoomLevel}px`
        }}
      ></div>
    </div>
  );
}

export default DocxViewer;