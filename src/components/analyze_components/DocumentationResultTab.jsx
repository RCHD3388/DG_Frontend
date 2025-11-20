// src/components/manager_components/DocumentationResultTab.js

import React, { useState } from 'react';
import { apiService } from '../../services/APIService';
import FilePreviewer from './FilePreviewer';
import { configService } from '../../services/ConfigService';

function DocumentationResultTab({ processId, showToast }) {
  const [selectedMode, setSelectedMode] = useState('table'); // 'table' or 'non_table'
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [isDownloading, setIsDownloading] = useState(null); // 'pdf' or 'docx'
  const [previewType, setPreviewType] = useState('pdf');

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Asumsi endpoint POST baru untuk memicu generasi hasil
      const response = await apiService.post(
        `/documentations/${processId}/generate-result`,
        { mode: selectedMode }
      );
      // Asumsi response berisi URL untuk download
      console.log("Generated result:", response.data);
      setGenerationResult(response.data);
    } catch (error) {
      console.error("Error generating result:", error);
      showToast(error.response?.data?.detail || 'Failed to generate result.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (format) => {
    if (!generationResult || !generationResult[`${format}_url`]) {
      return;
    }

    setIsDownloading(format);
    try {
      const relativeUrl = generationResult[`${format}_url`];
      // 1. Dapatkan base URL backend
      const backendUrl = configService.getValue('VITE_BACKEND_STATIC_BASE_URL');

      // 2. Buat URL absolut yang benar dan aman
      const absoluteFileUrl = new URL(`/generated_doc/${relativeUrl}`, backendUrl).href;

      // 3. Gunakan fetch() untuk mengambil file
      const response = await fetch(absoluteFileUrl);

      // 4. Cek jika terjadi error di server (misalnya file tidak ditemukan)
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      // 5. Dapatkan konten file sebagai blob
      const blob = await response.blob();

      // Logika untuk memicu download (tidak berubah, sekarang menggunakan blob dari fetch)
      const filename = `${processId}_documentation.${format === 'docs' ? 'docx' : format}`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(`Error downloading ${format} file:`, error);
      showToast(`Failed to download ${format.toUpperCase()} file.`, 'error');
    } finally {
      setIsDownloading(null);
    }
  };

  const resetGeneration = () => {
    setGenerationResult(null);
    setSelectedMode('table');
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      {!generationResult ? (
        // Tampilan Awal: Konfigurasi Generasi
        <div className="text-center w-full max-w-lg">
          <h3 className="text-xl font-bold">Generate Documentation Output</h3>
          <p className="py-4 text-base-content/80">
            Please select a generation mode. The system will process the documentation and prepare downloadable files.
          </p>

          <div className="my-6">
            <label className="label"><span className="label-text">Select Mode</span></label>
            <div className="join w-full">
              <input
                className="join-item btn w-1/2"
                type="radio"
                name="mode_options"
                aria-label="Table Mode"
                checked={selectedMode === 'table'}
                onChange={() => setSelectedMode('table')}
              />
              <input
                className="join-item btn w-1/2"
                type="radio"
                name="mode_options"
                aria-label="Non-Table Mode"
                checked={selectedMode === 'non_table'}
                onChange={() => setSelectedMode('non_table')}
              />
            </div>
            <p className="text-xs text-base-content/60 mt-2">
              {selectedMode === 'table' ? 'Generates a structured document with tables for parameters, returns, etc.' : 'Generates a document in a more narrative, paragraph-based format.'}
            </p>
          </div>

          <button className="btn btn-primary btn-wide" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating && <span className="loading loading-spinner"></span>}
            Generate
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-full w-full">
          <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-base-300">
            <div className="flex items-center gap-2" style={{ width: "100%" }}>
              <div className='flex flex-row' style={{ width: "100%", justifyContent: "space-between" }}>
                <button className="btn btn-info btn-sm" onClick={resetGeneration}>
                  Generate Again
                </button>
                <div>
                  <button className="btn btn-secondary btn-sm mr-2" onClick={() => handleDownload('pdf')} disabled={isDownloading === 'pdf'}>
                    {isDownloading === 'pdf' && <span className="loading loading-spinner loading-xs"></span>}
                    Download PDF
                  </button>
                  <button className="btn btn-accent btn-sm" onClick={() => handleDownload('docx')} disabled={isDownloading === 'docx'}>
                    {isDownloading === 'docx' && <span className="loading loading-spinner loading-xs"></span>}
                    Download DOCX
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="py-2" style={{ height: '250vh' }}>
            <FilePreviewer
              key={previewType} // Penting untuk me-remount komponen saat tipe berubah
              fileUrl={generationResult[`${previewType}_url`]}
              fileType={previewType}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentationResultTab;