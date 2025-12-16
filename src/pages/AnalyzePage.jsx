import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import UploadedFileList from '../components/UploadedFileList';
import DocxViewer from '../components/DocxViewer'; // Pastikan ini diimpor
import { apiService } from '../services/APIService';
import { configService } from '../services/ConfigService';
import ExtractionSummary from '../components/analyze_components/ExtractionSummary';
import ComponentViewer from '../components/analyze_components/ComponentViewer';
import DocumentationWebPreview from '../components/analyze_components/DocumentationWebPreview';
import dummydata from '../../componentsdata.json';
import DocumentationResultTab from '../components/analyze_components/DocumentationResultTab'; // Impor komponen yang akan digunakan kembali


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

  // === STATE Konfigurasi: Untuk Modal Konfigurasi ===
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableConfigs, setAvailableConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState('');
  const [processName, setProcessName] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [rootFolder, setRootFolder] = useState('');
  // ===========================================

  const [detailDocumentation, setDetailDocumentation] = useState(null);

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

  // === FUNGSI BARU: Mengambil daftar konfigurasi untuk dropdown ===
  const fetchAvailableConfigs = useCallback(async () => {
    try {
      const response = await apiService.get('/configs');
      setAvailableConfigs(response.data || []);
    } catch (error) {
      console.error("Error fetching configs:", error);
      showToast('Failed to load available configurations.', 'error');
    }
  }, [showToast]);

  const handleRemoveHistoricFile = () => {
    showToast('File deletion is not allowed from this page.', 'info');
  };

  useEffect(() => {
    fetchHistoricFiles();
    fetchAvailableConfigs();
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

  // === HANDLER BARU: Membuka dan menutup modal ===
  const handleOpenModal = () => {
    if (!selectedFileId) {
      showToast('Please select a repository file first!', 'info');
      return;
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Reset state modal agar bersih saat dibuka lagi
    setProcessName('');
    setSelectedConfig('');
    setPreviewContent('');
    setRootFolder('');
  };

  // === HANDLER BARU: Saat pilihan konfigurasi di dropdown berubah ===
  const handleConfigChange = async (e) => {
    const filename = e.target.value;
    setSelectedConfig(filename);

    if (!filename) {
      setPreviewContent('');
      return;
    }

    setIsPreviewLoading(true);
    setPreviewContent('');
    try {
      // Menggunakan endpoint yang ada untuk mengambil konten file
      const response = await apiService.get(`/configs/${filename}`);
      setPreviewContent(response.data.content || 'Preview not available.');
    } catch (error) {
      console.error('Error fetching config preview:', error);
      showToast('Failed to load config preview.', 'error');
      setPreviewContent('Error loading preview.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleAnalyzeRepository = async () => {
    if (!selectedFileId || !selectedConfig || !processName.trim()) {
      showToast('Please provide a process name and select a configuration.', 'warning');
      return;
    }

    setIsAnalyzing(true);
    setTaskId(null);
    setAnalysisResult(null);
    setLatestUpdate(null);  // Reset update dari websocket sebelumnya
    handleCloseModal();     // Tutup modal setelah submit

    try {
      const payload = {
        config_filename: selectedConfig,
        process_name: processName.trim(),
        root_folder: rootFolder.trim()
      };

      const response = await apiService.post(`/analyze/${selectedFileId}`, payload);

      setTaskId(response.data.task_id);
      setAnalysisResult(response);

      console.log('Analysis successful:', response);
      showToast('Repository analysis complete!', 'success');

    } catch (error) {
      console.error('Analysis error:', error);
      showToast(`Repository analysis failed: ${error.message}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // === SETELAH hasil documentation

  const fetchProcessDetails = async () => {
    setDetailDocumentation(null); // Bersihkan data lama selagi memuat
    try {
      // Endpoint ini diasumsikan mengembalikan objek data dokumentasi lengkap
      const response = await apiService.get(`/documentations/${taskId}`);
      // Data ini akan diteruskan ke DocumentationWebPreview
      setDetailDocumentation(response.data);
    } catch (error) {
      console.error(`Error fetching details for process ${selectedProcessId}:`, error);
    }
  };

  useEffect(() => {
    if (latestUpdate?.status == "completed") {
      showToast(`Documentation is being generated`, 'success');
      fetchProcessDetails();
    } else if (latestUpdate?.status == "failed") {
      setDetailDocumentation(null);
      showToast(`Documentation generation failed`, 'error');
    }
  }, [latestUpdate])

  return (
    <div className="flex flex-col items-center justify-start py-8 min-h-[calc(100vh-160px)]">
      <h1 className="text-4xl md:text-5xl font-extrabold text-base-content mb-10 text-center">
        📊 Document Your Code Repository
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
                withActions={false}
              />
            )}
          </div>
          <button
            className="btn btn-primary btn-lg mt-6 w-full"
            onClick={handleOpenModal}
            disabled={!selectedFileId || isAnalyzing || (latestUpdate && latestUpdate?.status != "completed" && latestUpdate?.status != "failed")}
          >
            {(isAnalyzing || (latestUpdate && latestUpdate?.status != "completed" && latestUpdate?.status != "failed")) ? (
              <>
                <div className="flex flex-col items-center w-full">
                  {/* Pesan status saat ini */}
                  <span className="text-sm font-semibold text-base-content/70">
                    {'Processing'} {latestUpdate?.components ? Object.keys(latestUpdate?.components).length : 0} components <span className="loading loading-dots loading-xs"></span>
                  </span>

                  {/* Progress Bar */}
                  <progress
                    className="progress progress-info w-full"
                    // Hitung persentase progres
                    value={latestUpdate?.completed_components_count || 0}
                    max={latestUpdate?.components ? Object.keys(latestUpdate?.components).length : 0}
                  ></progress>
                </div>
              </>
            ) : (
              <>
                Analyze & Generate Docs
              </>
            )}
          </button>
        </div>

        {/* Kolom Kanan: Area Hasil Analisis / Preview */}
        <div className="lg:col-span-2 bg-base-100 rounded-lg shadow-xl p-6 flex flex-col max-h-screen overflow-y-auto">
          <h2 className="text-2xl font-bold text-base-content mb-4 text-center">Documentation Results & Preview</h2>

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

                <input type="radio" name="my_tabs_3" className="tab" aria-label="Web Preview Result" />
                <div className="tab-content bg-base-100 border-base-300 p-2">
                  {detailDocumentation ?
                    (<DocumentationWebPreview
                      documentationData={detailDocumentation}
                    />) : (
                      <div className="flex-grow w-full bg-base-200 rounded-lg p-4 flex items-center justify-center text-base-content/70 h-96">
                        <p>No document provided for preview.</p>
                      </div>
                    )
                  }
                </div>

                <input type="radio" name="my_tabs_3" className="tab" aria-label="Documentation Result" />
                <div className="tab-content bg-base-100 border-base-300 p-2">
                  {/* AREA PREVIEW DOKUMEN DENGAN DOCXVIEWER */}
                  <div className="flex-grow">
                    {latestUpdate?.task_id && latestUpdate?.status == "completed" ? (
                      <DocumentationResultTab
                        key={latestUpdate.task_id} // Ini akan menjaga state komponen tetap ada
                        processId={latestUpdate.task_id}
                        showToast={showToast}
                      />
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


      {/* === MODAL BARU UNTUK KONFIGURASI ANALISIS === */}
      <dialog id="analyze_config_modal" className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box w-11/12 max-w-3xl">
          <h3 className="font-bold text-2xl">Configure Analysis Process</h3>
          <p className="py-4 text-base-content/80">Provide a name for this process and select a configuration to use.</p>

          {/* Form Inputs */}
          <div className="space-y-4">
            <div className="form-control w-full">
              <legend class="fieldset-legend">Process Name</legend>
              <input
                type="text"
                placeholder="e.g., 'Analysis for Project Alpha v1'"
                className="input input-bordered w-full"
                value={processName}
                onChange={(e) => setProcessName(e.target.value)}
              />
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Source Root Folder (Optional)</span>
                <span className="label-text-alt">Leave blank to analyze from the root</span>
              </label>
              <input
                type="text"
                placeholder="e.g., 'src/app' or 'source'"
                className="input input-bordered w-full"
                value={rootFolder}
                onChange={(e) => setRootFolder(e.target.value)}
              />
            </div>
            <div className="form-control w-full">
              <legend class="fieldset-legend">Configurations</legend>
              <select
                className="select select-bordered"
                value={selectedConfig}
                onChange={handleConfigChange}
              >
                <option value="">Select a configuration</option>
                {availableConfigs.map(config => (
                  <option key={config.filename} value={config.filename}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Configuration Preview */}
          {selectedConfig && (
            <>
              <div className="divider mt-6">Configuration Preview</div>
              <div className="mockup-code p-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {isPreviewLoading ? (
                  <div className="flex justify-center items-center h-24">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : (
                  <pre data-prefix=""><code>{previewContent}</code></pre>
                )}
              </div>
            </>
          )}

          {/* Modal Actions */}
          <div className="modal-action mt-6">
            <button className="btn btn-ghost" onClick={handleCloseModal}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleAnalyzeRepository}
              disabled={!processName.trim() || !selectedConfig}
            >
              Start Analysis
            </button>
          </div>
        </div>
        {/* Klik di luar untuk menutup */}
        <form method="dialog" className="modal-backdrop">
          <button onClick={handleCloseModal}>close</button>
        </form>
      </dialog>

    </div>
  );
}

export default AnalyzePage;