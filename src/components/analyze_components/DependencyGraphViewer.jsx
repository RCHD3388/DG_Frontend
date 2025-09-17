
import React, { useState, useEffect, useCallback } from 'react';
import { MdOutlineDownload, MdOutlineError, MdOutlineInfo } from 'react-icons/md';
import { useOutletContext } from 'react-router-dom'; // Untuk showToast
import { apiService } from '../../services/APIService';

/**
 * Komponen untuk menampilkan isi file JSON Dependency Graph.
 * @param {object} props
 * @param {string} props.jsonUrl - URL untuk mengambil file JSON graph.
 * @param {string} props.downloadUrl - URL untuk mengunduh file JSON graph.
 * @param {string} props.fileName - Nama file JSON untuk ditampilkan/diunduh.
 */
function DependencyGraphViewer({ fileName }) {
  const { showToast } = useOutletContext();
  const [graphData, setGraphData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const downloadUrl = (name) => { return "analyze/download_components/" + name}

  const fetchGraphData = useCallback(async () => {
    if (!fileName) {
      setError("No JSON graph URL provided.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.get(downloadUrl(fileName));
      
      const data = response;
      setGraphData(data);
    } catch (err) {
      console.error("Error fetching dependency graph JSON:", err);
      setError(`Failed to load dependency graph: ${err.message}`);
      showToast(`Failed to load dependency graph: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [fileName, showToast]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-base-200 rounded-lg h-96">
        <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
        <p className="text-base-content">Loading components data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-error text-error-content rounded-lg h-96">
        <MdOutlineError className="h-10 w-10 mb-4" />
        <p className="text-xl font-bold mb-2">Error Loading Components</p>
        <p className="text-md text-center">{error}</p>
      </div>
    );
  }

  if (!graphData) {
    return (
        <div className="flex flex-col items-center justify-center p-6 bg-base-200 rounded-lg h-96 text-base-content/70">
            <MdOutlineInfo className="h-10 w-10 mb-4" />
            <p className="text-lg">No components data available.</p>
        </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl border border-base-content/10 p-6">
      <div className="card-body p-0">
        <h3 className="card-title text-2xl font-bold text-primary mb-4 flex items-center">
          <MdOutlineInfo className="h-7 w-7 mr-3 text-info" />
          Component Data Viewer
        </h3>

        {/* Tombol Download */}
        {fileName && (
          <div className="flex justify-end mb-4">
            <a 
              href={downloadUrl(fileName)} 
              download={fileName} // Atribut download untuk menyarankan nama file
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-outline btn-info btn-sm"
            >
              <MdOutlineDownload className="h-5 w-5 mr-2" />
              Download {fileName}
            </a>
          </div>
        )}

        {/* Tampilan JSON Data */}
        <div className="mockup-code rounded-lg p-4 overflow-auto max-h-[500px] border border-base-content/10"> {/* max-h dan overflow */}
          <pre><code>  
            {JSON.stringify(graphData, null, 2)}
          </code></pre>
        </div>
      </div>
    </div>
  );
}

export default DependencyGraphViewer;