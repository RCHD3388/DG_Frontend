
import React, { useEffect, useRef, useState } from 'react';
import { apiService } from '../../services/APIService';
import { renderAsync } from 'docx-preview';
import { configService } from '../../services/ConfigService';

const VITE_BACKEND_STATIC_BASE_URL = configService.getValue('VITE_BACKEND_STATIC_BASE_URL');

function FilePreviewer({ fileUrl, fileType }) {
  const previewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fileUrl || !previewRef.current) return;

    setIsLoading(true);
    setError(null);

    const absoluteFileUrl = `${VITE_BACKEND_STATIC_BASE_URL}generated_doc/${fileUrl}`;

    fetch(absoluteFileUrl)
      .then(response => {
        // Cek jika response dari server adalah error (misal, 404 Not Found)
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        return response.blob(); // Dapatkan konten sebagai blob
      })
      .then(blob => {
        previewRef.current.innerHTML = '';
        if (fileType === 'pdf') {
          const blobUrl = URL.createObjectURL(blob);
          const iframe = document.createElement('iframe');
          iframe.src = blobUrl;
          iframe.style.width = '100%';
          iframe.style.height = '200%';
          iframe.style.border = 'none';
          previewRef.current.appendChild(iframe);
          // Kita tidak perlu fungsi cleanup di sini karena akan ditangani oleh unmount
        } else if (fileType === 'docs') {
          renderAsync(blob, previewRef.current)
            .catch(err => {
              console.error("Error rendering DOCX:", err);
              setError("Failed to render DOCX preview.");
            });
        }
      })
      .catch(err => {
        console.error(`Error fetching file for preview:`, err);
        // Periksa apakah error adalah karena CORS
        if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
          setError("CORS policy blocked the request. Please check the server configuration.");
        } else {
          setError(`Could not load the file for preview. ${err.message}`);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });

  }, [fileUrl, fileType]);

  return (
    <div className="w-full h-full border border-base-300 rounded-lg bg-base-200 relative">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">Loading Preview...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <p className="font-bold text-error">Preview Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      <div ref={previewRef} className="w-full h-full"></div>
    </div>
  );
}

export default FilePreviewer;