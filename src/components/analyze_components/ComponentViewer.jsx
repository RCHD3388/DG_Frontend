import React, { useState, useEffect, useCallback } from 'react';
import { MdOutlineDownload, MdOutlineError, MdOutlineInfo, MdCheckCircle, MdClose, MdFunctions, MdClass, MdCode, MdOutlineFolder } from 'react-icons/md'; // Tambah ikon
import { useOutletContext } from 'react-router-dom';
import { apiService } from '../../services/APIService';
import { configService } from '../../services/ConfigService';

// Base URL backend
const BACKEND_BASE_URL = configService.getValue('VITE_BACKEND_API_BASE_URL');

/**
 * Komponen untuk menampilkan daftar komponen kode yang ditemukan (classes, functions, methods)
 * dan ringkasan jumlahnya dari file JSON tertentu.
 * @param {object} props
 * @param {string} props.fileName - Nama file JSON yang berisi data komponen untuk ditampilkan/diunduh.
 */
function ComponentViewer({ fileName, components = {}, isComplete = false }) {
  const { showToast } = useOutletContext();
  const [componentsData, setComponentsData] = useState(null); // Ganti nama state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Endpoint untuk download/fetch data komponen
  const componentsApiUrl = `analyze/download_components/${fileName}`; // URL relatif ke API
  const downloadFullUrl = `${BACKEND_BASE_URL}/${componentsApiUrl}`; // URL lengkap untuk download

  const fetchComponentsData = useCallback(async () => {
    try {
      setComponentsData(components)
    } catch (err) {
      console.error("Error fetching component data JSON:", err);
      // Tangani error Axios lebih baik
      const errorMessage = err.response?.data?.detail || err.message;
      setError(`Failed to load component data: ${errorMessage}`);
      showToast(`Failed to load component data: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [fileName, showToast, componentsApiUrl]); // Tambahkan componentsApiUrl ke dependencies

  useEffect(() => {
    console.log("dari comp page: "+ fileName)
    fetchComponentsData();
  }, [fileName]);

  // Hitung total dan kategori komponen
  const totalComponents = componentsData ? Object.keys(componentsData).length : 0;
  const classesCount = componentsData ? Object.values(componentsData).filter(c => c.component_type === 'class').length : 0;
  const functionsCount = componentsData ? Object.values(componentsData).filter(c => c.component_type === 'function').length : 0;
  const methodsCount = componentsData ? Object.values(componentsData).filter(c => c.component_type === 'method').length : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-base-200 rounded-lg h-96 text-base-content">
        <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
        <p className="text-lg">Loading components data...</p>
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

  if (!componentsData || totalComponents === 0) {
    return (
        <div className="flex flex-col items-center justify-center p-6 bg-base-200 rounded-lg h-96 text-base-content/70">
            <MdOutlineInfo className="h-10 w-10 mb-4" />
            <p className="text-lg">No component data available for this file.</p>
        </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl border border-base-content/10 p-6">
      <div className="card-body p-0">
        <h3 className="card-title text-2xl font-bold text-primary mb-4 flex items-center">
          <MdCode className="h-7 w-7 mr-3 text-info" /> {/* Ganti ikon */}
          Code Components Summary: {fileName}
        </h3>

        {/* Ringkasan Jumlah Komponen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
          <div className="stat place-items-center bg-base-200 rounded-lg p-3 shadow-sm">
            <div className="stat-title text-base-content/70 text-xs">Total Components</div>
            <div className="stat-value text-primary text-2xl">{totalComponents}</div>
          </div>
          <div className="stat place-items-center bg-base-200 rounded-lg p-3 shadow-sm">
            <div className="stat-title text-base-content/70 text-xs">Classes</div>
            <div className="stat-value text-secondary text-2xl">{classesCount}</div>
          </div>
          <div className="stat place-items-center bg-base-200 rounded-lg p-3 shadow-sm">
            <div className="stat-title text-base-content/70 text-xs">Functions & Methods</div>
            <div className="stat-value text-accent text-2xl">{functionsCount + methodsCount}</div>
          </div>
        </div>

        {/* Tombol Download */}
        {fileName && isComplete && (
          <div className="flex justify-end mb-4">
            <a 
              href={downloadFullUrl} 
              download={fileName} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-outline btn-info btn-sm"
            >
              <MdOutlineDownload className="h-5 w-5 mr-2" />
              Download {fileName}
            </a>
          </div>
        )}

        {/* Daftar Detail Komponen */}
        <div className="mt-6">
          <h4 className="text-xl font-semibold text-base-content mb-3 flex items-center">
            <MdOutlineFolder className="h-6 w-6 mr-2 text-primary" />
            Detailed Components List:
          </h4>
          <div className="max-h-[400px] overflow-y-auto bg-base-200 rounded-lg p-3 border border-base-content/10">
            <ul className="list-none space-y-3 text-sm text-base-content">
              {Object.values(componentsData).map((component) => (
                <li key={component.id} className="bg-base-100 rounded-md p-3 shadow-sm border border-base-content/10">
                  <div className="flex items-center mb-1">
                    {/* Ikon berdasarkan tipe komponen */}
                    {component.component_type === 'class' && <MdClass className="h-5 w-5 mr-2 text-warning" />}
                    {component.component_type === 'function' && <MdFunctions className="h-5 w-5 mr-2 text-success" />}
                    {component.component_type === 'method' && <MdFunctions className="h-5 w-5 mr-2 text-info" />}
                    <span className="font-bold text-base-content text-md">{component.id.split('.').pop()}</span>
                    <span className="badge badge-outline badge-sm ml-2 text-xs">
                      {component.component_type.toUpperCase()}
                    </span>
                    <span className="badge badge-ghost badge-sm ml-2 text-xs">
                      Code Line: {component.start_line} - {component.end_line}
                    </span>
                  </div>
                  <p className="text-xs text-base-content/70 mb-1">
                    <span className="font-semibold">Path:</span> {component.relative_path}
                  </p>
                  <p className="text-xs text-base-content/70 flex items-center">
                    <span className="font-semibold mr-1">Docstring:</span>
                    {component.has_docstring ? <MdCheckCircle className="h-4 w-4 text-success" /> : <MdClose className="h-4 w-4 text-error" />}
                    {component.has_docstring ? (
                      <span className="ml-1 text-base-content">Yes</span>
                    ) : (
                      <span className="ml-1 text-base-content/60">No</span>
                    )}
                  </p>
                  {/* Tampilkan docstring awal jika ada */}
                  {component.docstring && (
                      <blockquote className="text-xs text-base-content/80 italic border-l-2 border-primary pl-2 mt-2 max-h-20 overflow-y-auto">
                          {component.docstring.split('\n')[0]} {/* Hanya baris pertama docstring untuk ringkasan */}
                      </blockquote>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComponentViewer;