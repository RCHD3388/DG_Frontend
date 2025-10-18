import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import UploadedFileList from '../components/UploadedFileList';
import DocxViewer from '../components/DocxViewer'; // Pastikan ini diimpor
import { apiService } from '../services/APIService';
import { configService } from '../services/ConfigService';
import ExtractionSummary from '../components/analyze_components/ExtractionSummary';
import ComponentViewer from '../components/analyze_components/ComponentViewer';
import AnalysisSummaryViewer from '../components/analyze_components/AnalysisSummaryViewer';

function AnalyzePage() {
  const { showToast } = useOutletContext();

  const [historicFiles, setHistoricFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [errorLoadingFiles, setErrorLoadingFiles] = useState(null);

  const [selectedFileId, setSelectedFileId] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestUpdate, setLatestUpdate] = useState(null);
  const [taskId, setTaskId] = useState(null);

  const fetchHistoricFiles = useCallback(async () => {
    setIsLoadingFiles(true);
    setErrorLoadingFiles(null);
    try {
      const response = await apiService.get('/files/');

      setHistoricFiles(response.data.files || []);
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
  }, []);

  useEffect(() => {
    console.log("Selected file ID changed:", taskId);
    if (!taskId) return;

    const ws = new WebSocket(`${configService.getValue('VITE_BACKEND_API_BASE_URL').replace(/^http/, 'ws')}/analyze/ws/subscribe/${taskId}`);

    // 2. MENGATUR EVENT HANDLERS
    ws.onopen = () => {
      console.log(`WebSocket connected for task: ${taskId}`);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received update:", data);
        // Perbarui state dengan data baru, yang akan memicu re-render
        setLatestUpdate(prev => ({ ...prev, ...data }));
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };
    ws.onclose = () => {
      console.log(`WebSocket disconnected for task: ${taskId}`);
      setIsConnected(false);
    };
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      console.log(`Cleaning up WebSocket for task: ${taskId}`);
      ws.close();
    };
  }, [taskId]);


  const handleAnalyzeRepository = async () => {
    if (!selectedFileId) {
      showToast('Please select a repository file first!', 'info');
      return;
    }

    setIsAnalyzing(true);
    setTaskId(null);
    setAnalysisResult(null);

    try {
      const response = await apiService.post(`/analyze/${selectedFileId}`);
      setTaskId(response.data.task_id);

      console.log('Analysis successful:', response);
      setAnalysisResult(response);
      showToast('Repository analysis complete!', 'success');

    } catch (error) {
      console.error('Analysis error:', error);
      showToast(`Repository analysis failed: ${error.message}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
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
            disabled={!selectedFileId || isAnalyzing || (latestUpdate && latestUpdate?.status != "completed")}
          >
            {(isAnalyzing || (latestUpdate && latestUpdate?.status != "completed")) ? (
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
        <div className="lg:col-span-2 bg-base-100 rounded-lg shadow-xl p-6 flex flex-col">
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
              {/* name of each tab group should be unique */}
              <div className="tabs tabs-lift">
                <input type="radio" name="my_tabs_3" className="tab" aria-label="Extracted File" defaultChecked />
                <div className="tab-content bg-base-100 border-base-300 p-2">
                  <ExtractionSummary
                    discovered_files={latestUpdate?.discovered_files || []}
                    extracted_folder_name={latestUpdate?.source_file || "N/A"}
                  />
                </div>

                <input type="radio" name="my_tabs_3" className="tab" aria-label="Components" />
                <div className="tab-content bg-base-100 border-base-300 p-2">
                  <ComponentViewer
                    fileName={latestUpdate?.result_dependency_graph} // Ambil nama file dari URL
                    components={latestUpdate?.components}
                    isComplete={isAnalyzing == false}
                  />
                </div>

                <input type="radio" name="my_tabs_3" className="tab" aria-label="Analysis Summary" />
                <div className="tab-content bg-base-100 border-base-300 p-2">
                  <AnalysisSummaryViewer
                    componentsData={{}} 
                    />

                </div>

                <input type="radio" name="my_tabs_3" className="tab" aria-label="Documentation Result" />
                <div className="tab-content bg-base-100 border-base-300 p-2">
                  {/* AREA PREVIEW DOKUMEN DENGAN DOCXVIEWER */}
                  <div className="flex-grow">
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalyzePage;