import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import UploadedFileList from '../components/UploadedFileList';
import DocxViewer from '../components/DocxViewer'; // Pastikan ini diimpor

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

function AnalyzePage() {
  const { showToast } = useOutletContext();

  const [historicFiles, setHistoricFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [errorLoadingFiles, setErrorLoadingFiles] = useState(null);

  const [selectedFileId, setSelectedFileId] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const fetchHistoricFiles = useCallback(async () => {
    setIsLoadingFiles(true);
    setErrorLoadingFiles(null);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/files/`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHistoricFiles(data.files || []);
    } catch (error) {
      console.error("Error fetching historic files:", error);
      setErrorLoadingFiles(error.message);
      showToast('Failed to load uploaded files for analysis.', 'error');
    } finally {
      setIsLoadingFiles(false);
    }
  }, [showToast]);

  const handleRemoveHistoricFile = () => {
    showToast('File deletion is not allowed from this page.', 'info');
  };

  useEffect(() => {
    fetchHistoricFiles();
  }, [fetchHistoricFiles]);


  const handleAnalyzeRepository = async () => {
    if (!selectedFileId) {
      showToast('Please select a repository file first!', 'info');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/analyze/${selectedFileId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || 'Analysis failed');
      }

      const data = await response.json();
      console.log('Analysis successful:', data);
      setAnalysisResult(data);
      showToast('Repository analysis complete!', 'success');

    } catch (error) {
      console.error('Analysis error:', error);
      showToast(`Repository analysis failed: ${error.message}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateTotalComponents = (analysis) => {
    return (analysis.total_classes || 0) + (analysis.total_functions || 0) + (analysis.total_methods || 0);
  };


  return (
    <div className="flex flex-col items-center justify-start py-8 min-h-[calc(100vh-160px)]">
      <h1 className="text-4xl md:text-5xl font-extrabold text-base-content mb-10 text-center">
        📊 Analyze Your Code Repository
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full px-4">
        {/* Kolom Kiri: Pemilihan File */}
        <div className="lg:col-span-1 bg-base-100 rounded-lg shadow-xl p-6 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-base-content mb-4 text-center">Select Repository File</h2>
          <div className="w-full max-h-96 overflow-y-auto">
            {isLoadingFiles ? (
              <div className="flex justify-center items-center h-48">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="ml-4 text-base-content">Loading files...</p>
              </div>
            ) : errorLoadingFiles ? (
              <div className="flex justify-center items-center h-48 p-4 bg-error text-error-content rounded-lg">
                <p className="font-semibold">Error: {errorLoadingFiles}</p>
              </div>
            ) : (
              <UploadedFileList
                files={historicFiles}
                onSelectFile={setSelectedFileId}
                selectedFileId={selectedFileId}
                onRemoveFile={handleRemoveHistoricFile}
                withSelection={true} // Aktifkan mode pemilihan
              />
            )}
          </div>
          <button
            className="btn btn-primary btn-lg mt-6 w-full"
            onClick={handleAnalyzeRepository}
            disabled={!selectedFileId || isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="loading loading-spinner loading-md"></span>
                Analyzing...
              </>
            ) : (
              <>
                Analyze & Generate Docs
              </>
            )}
          </button>
        </div>

        {/* Kolom Kanan: Area Hasil Analisis / Preview */}
        <div className="lg:col-span-2 bg-base-100 rounded-lg shadow-xl p-6 flex flex-col h-full">
          <h2 className="text-2xl font-bold text-base-content mb-4 text-center">Analysis Results & Preview</h2>

          {!analysisResult && !isAnalyzing && (
            <div className="flex-grow flex flex-col items-center justify-center text-center text-base-content/80">
              <p className="text-lg mb-4">
                Select a file from the left and click "Analyze" to see the results here.
              </p>
              <p className="text-sm">This area will show analysis summaries, dependency graphs, and documentation previews.</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex-grow flex flex-col items-center justify-center text-center text-base-content">
              <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
              <p className="text-xl font-semibold">Analyzing your repository...</p>
              <p className="text-md">This might take a moment.</p>
            </div>
          )}

          {analysisResult && (
            <div className="flex-grow flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2 text-center">
                <div className="stat place-items-center bg-base-200 rounded-lg p-3 shadow-sm">
                  <div className="stat-title text-base-content/70 text-xs">Total Classes</div>
                  <div className="stat-value text-primary text-2xl">{analysisResult.total_classes || 0}</div>
                </div>
                <div className="stat place-items-center bg-base-200 rounded-lg p-3 shadow-sm">
                  <div className="stat-title text-base-content/70 text-xs">Total Functions</div>
                  <div className="stat-value text-secondary text-2xl">{analysisResult.total_functions || 0}</div>
                </div>
                <div className="stat place-items-center bg-base-200 rounded-lg p-2 shadow-sm">
                  <div className="stat-title text-base-content/70 text-xs">Total Methods</div>
                  <div className="stat-value text-accent text-2xl">{analysisResult.total_methods || 0}</div>
                </div>
                <div className="stat place-items-center bg-base-200 rounded-lg p-2 shadow-sm">
                  <div className="stat-title text-base-content/70 text-xs">Total Components</div>
                  <div className="stat-value text-black text-2xl">{calculateTotalComponents(analysisResult)}</div>
                </div>
              </div>

              {/* Download Links */}
              <div className="flex flex-col md:flex-row justify-center items-center w-full mb-2">
                {analysisResult.graph_json_download_url && (
                  <a
                    href={`${BACKEND_BASE_URL}${analysisResult.graph_json_download_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-info btn-sm flex-grow"
                  >
                    Download Dependency Graph (JSON)
                  </a>
                )}
              </div>
              {/* <div className="flex flex-col md:flex-row justify-center items-center w-full">
                {analysisResult && (
                  <a
                    href={`${BACKEND_BASE_URL}${analysisResult.doc_download_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-accent btn-sm flex-grow"
                  >
                    Download Documentation (DOCX)
                  </a>
                )}
              </div> */}

              {/* AREA PREVIEW DOKUMEN DENGAN DOCXVIEWER */}
              <div className="mt-8 flex-grow">
                {analysisResult.doc_download_url ? (
                  // Meneruskan prop height ke DocxViewer
                  <DocxViewer docxUrl={`${BACKEND_BASE_URL}${analysisResult.doc_download_url}`} height="800px" />
                  // Tinggi disesuaikan: 100vh - (Navbar + Footer + Margin atas + Judul + Stat + Download Links)
                ) : (
                  <div className="flex-grow w-full bg-base-200 rounded-lg p-4 flex items-center justify-center text-base-content/70 h-96">
                    <p>No document URL provided for preview.</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalyzePage;