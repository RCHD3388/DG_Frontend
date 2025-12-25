import { apiService } from '../../services/APIService';
import FilePreviewer from './FilePreviewer';
import { configService } from '../../services/ConfigService';

import React, { useState } from 'react';
import {
  FileText, Table as TableIcon, FileDown, RefreshCw,
  CheckCircle2, ArrowLeft, FileType, Settings2,
  Code2, Eye, BookOpen, Layout, Info
} from 'lucide-react';

function DocumentationResultTab({ processId, showToast }) {
  // --- CONFIG PENYIMPANAN & TAMPILAN (Boleh Dimodifikasi) ---
  const [selectedMode, setSelectedMode] = useState('table'); // 'table' or 'non_table'
  const [includeOverview, setIncludeOverview] = useState(true);
  const [sourceCodeMode, setSourceCodeMode] = useState('signature');
  const [includeStyleOverview, setIncludeStyleOverview] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [isDownloading, setIsDownloading] = useState(null); // 'pdf' or 'docx'
  const [previewType, setPreviewType] = useState('pdf');

  // --- FUNCTION HANDLER (WAJIB SESUAI ASLI - TIDAK DIGANTI) ---
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Menggunakan logika asli Anda: hanya mengirimkan selectedMode
      const response = await apiService.post(
        `/documentations/${processId}/generate-result`,
        { mode: selectedMode, include_overview: includeOverview, source_code_mode: sourceCodeMode }
      );
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
      const backendUrl = configService.getValue('VITE_BACKEND_STATIC_BASE_URL');
      const absoluteFileUrl = new URL(`/generated_doc/${relativeUrl}`, backendUrl).href;

      const response = await fetch(absoluteFileUrl);

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const blob = await response.blob();

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
  };

  return (
    <div className="h-full w-full bg-base-200/20 overflow-y-auto custom-scrollbar">
      {!generationResult ? (
        /* --- TAMPILAN 1: KONFIGURASI (LAYOUT PROFESSIONAL) --- */
        <div className="flex justify-center p-6 lg:p-12">
          <div className="max-w-5xl w-full bg-base-100 rounded-[2.5rem] shadow-2xl border border-base-content/5 overflow-hidden flex flex-col lg:flex-row">

            {/* Sisi Kiri: Mode Selection */}
            <div className="flex-1 p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-base-content/5 space-y-8">
              <div>
                <h3 className="text-3xl font-black italic flex items-center gap-3">
                  <Layout className="text-primary" size={28} /> Layout Base
                </h3>
                <p className="text-sm opacity-50 font-medium">Tentukan bagaimana struktur dokumen akan disusun.</p>
              </div>

              <div className="space-y-4">
                <div
                  onClick={() => setSelectedMode('table')}
                  className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-5 ${selectedMode === 'table' ? 'border-primary bg-primary/5' : 'border-base-content/5 hover:border-base-content/20'}`}
                >
                  <div className={`p-4 rounded-2xl ${selectedMode === 'table' ? 'bg-primary text-primary-content' : 'bg-base-200'}`}>
                    <TableIcon size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-lg">Table Mode</p>
                    <p className="text-[10px] opacity-60 font-bold uppercase">Structured Grid</p>
                  </div>
                  <input type="radio" checked={selectedMode === 'table'} className="radio radio-primary" readOnly />
                </div>

                <div
                  onClick={() => setSelectedMode('non_table')}
                  className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-5 ${selectedMode === 'non_table' ? 'border-secondary bg-secondary/5' : 'border-base-content/5 hover:border-base-content/20'}`}
                >
                  <div className={`p-4 rounded-2xl ${selectedMode === 'non_table' ? 'bg-secondary text-secondary-content' : 'bg-base-200'}`}>
                    <FileText size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-lg">Narrative Mode</p>
                    <p className="text-[10px] opacity-60 font-bold uppercase">Fluid Paragraphs</p>
                  </div>
                  <input type="radio" checked={selectedMode === 'non_table'} className="radio radio-secondary" readOnly />
                </div>
              </div>
            </div>

            {/* Sisi Kanan: UI Config (Tampilan) */}
            <div className="flex-1 p-8 lg:p-10 bg-base-200/30 flex flex-col justify-between">
              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Settings2 size={20} /> Content Preferences
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-base-100 p-4 rounded-2xl border border-base-content/5 shadow-sm">
                    <span className="text-sm font-bold opacity-80">Include Overview</span>
                    <input type="checkbox" className="toggle toggle-primary" checked={includeOverview} onChange={(e) => setIncludeOverview(e.target.checked)} />
                  </div>

                  <div className="p-4 bg-base-100 rounded-2xl border border-base-content/5 shadow-sm space-y-2">
                    <label className="text-[10px] font-black uppercase opacity-40 ml-1">Source Code Display</label>
                    <select
                      className="select select-bordered select-sm w-full bg-base-200 focus:outline-none border-none rounded-xl font-bold"
                      value={sourceCodeMode}
                      onChange={(e) => setSourceCodeMode(e.target.value)}
                    >
                      <option value="signature">Signature Only</option>
                      <option value="full">Full Source Code</option>
                    </select>
                  </div>

                </div>
              </div>

              <div className="pt-2 text-center">
                <button className="btn btn-primary w-full" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating && <span className="loading loading-spinner"></span>}
                  Generate
                </button>
              </div>
            </div>
          </div>
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