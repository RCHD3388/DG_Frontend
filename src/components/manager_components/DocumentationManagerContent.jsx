// src/components/manager_components/DocumentationManagerContent.js

import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/APIService'; // Sesuaikan path jika perlu
import DocumentationWebPreview from '../analyze_components/DocumentationWebPreview'; // Impor komponen yang akan digunakan kembali
import DocumentationResultTab from '../analyze_components/DocumentationResultTab'; // Impor komponen yang akan digunakan kembali

// Komponen ini akan menjadi isi dari dashboard utama di halaman Manager
function DocumentationManagerContent({ showToast }) {
  // State untuk daftar proses ringkas
  const [processes, setProcesses] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  // State untuk data detail dari proses yang dipilih
  const [selectedProcessId, setSelectedProcessId] = useState(null);
  const [detailedData, setDetailedData] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Fase 1: Mengambil daftar semua proses saat komponen dimuat
  const fetchProcessesList = useCallback(async () => {
    setIsLoadingList(true);
    try {
      // Endpoint ini diasumsikan mengembalikan array: [{ id: '...', name: '...' }]
      const response = await apiService.get('/documentations');
      setProcesses(response.data || []);
    } catch (error) {
      console.error("Error fetching processes list:", error);
      showToast('Failed to load documentation processes.', 'error');
    } finally {
      setIsLoadingList(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProcessesList();
  }, []);


  // Fase 3: Mengambil data detail KETIKA sebuah proses dipilih
  useEffect(() => {
    // Jika tidak ada ID yang dipilih, jangan lakukan apa-apa
    if (!selectedProcessId) {
      setDetailedData(null); // Bersihkan data lama
      return;
    }

    const fetchProcessDetails = async () => {
      setIsLoadingDetails(true);
      setDetailedData(null); // Bersihkan data lama selagi memuat
      try {
        // Endpoint ini diasumsikan mengembalikan objek data dokumentasi lengkap
        const response = await apiService.get(`/documentations/${selectedProcessId}`);
        // Data ini akan diteruskan ke DocumentationWebPreview
        setDetailedData(response.data);
      } catch (error) {
        console.error(`Error fetching details for process ${selectedProcessId}:`, error);
        showToast('Failed to load process details.', 'error');
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchProcessDetails();
  }, [selectedProcessId, showToast]); // Dijalankan setiap kali selectedProcessId berubah


  // Fungsi untuk menangani klik pada item di sidebar
  const handleSelectProcess = (processId) => {
    setSelectedProcessId(processId);
  };


  return (
    <div className="grid grid-cols-5 gap-2 h-full">

      {/* Kolom Kiri: Sidebar Daftar Proses */}
      {/* <aside className="lg:col-span-1 bg-base-200 rounded-box p-2 h-full overflow-y-auto">
        <h3 className="text-lg font-bold p-4">Documentation Processes</h3>
        {isLoadingList ? (
          <div className="flex justify-center p-2">
            <span className="loading loading-spinner"></span>
          </div>
        ) : (
          <ul className="menu bg-base-200 rounded-box w-full">
            {processes.length > 0 ? (
              processes.map(process => (
                <li key={process.id}>
                  <a
                    className={selectedProcessId === process.id ? 'active' : ''}
                    onClick={() => handleSelectProcess(process.id)}
                  >
                    {process.name} ({process.id.slice(0, 5) + "..."})
                  </a>
                </li>
              ))
            ) : (
              <li className="p-4 text-base-content/60">No processes found.</li>
            )}
          </ul>
        )}
      </aside> */}
      {isLoadingList ? (
        <div className="flex justify-center p-2">
          <span className="loading loading-spinner"></span>
        </div>
      ) : (
        <div className='overflow-y-auto'>
          <ul className="menu bg-base-200 w-full rounded-box p-2 text-base-content font-semibold">
            {processes.length > 0 ? (
              processes.map(process => (
                <li key={process.id} className='mb-2'>
                  <a
                    className={selectedProcessId === process.id ? "active bg-success text-success-content" : "bg-base-300 text-base-content"}
                    onClick={() => handleSelectProcess(process.id)}
                  >
                    {process.name} ({process.id.slice(0, 5) + "..."})
                  </a>
                </li>
              ))
            ) : (
              <li className="p-4 text-base-content/60">No processes found.</li>
            )}
          </ul>
        </div>
      )}

      {/* Kolom Kanan: Area Konten dengan Tabs */}
      <main className="lg:col-span-4 bg-base-100 rounded-box w-full">
        {!selectedProcessId ? (
          // Tampilan saat tidak ada proses yang dipilih
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <h3 className="text-2xl font-bold">Welcome to the Documentation Manager</h3>
              <p className="text-base-content/70 mt-2">Please select a process from the list on the left to view its details.</p>
            </div>
          </div>
        ) : isLoadingDetails ? (
          // Tampilan saat data detail sedang dimuat
          <div className="flex items-center justify-center h-full">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="ml-4 text-lg">Loading process details...</p>
          </div>
        ) : detailedData ? (
          <div className="tabs tabs-lift">
            <input type="radio" name="my_tabs_3" className="tab" aria-label="Documentation Web Preview" defaultChecked />
            <div className="tab-content bg-base-100 border-base-300 p-6 min-h-0">
              <DocumentationWebPreview documentationData={detailedData} />
            </div>

            <input type="radio" name="my_tabs_3" className="tab" aria-label="Documentation Result" />
            <div className="tab-content bg-base-100 border-base-300 p-6">
              <DocumentationResultTab
                key={selectedProcessId} // Ini akan menjaga state komponen tetap ada
                processId={selectedProcessId}
                showToast={showToast}
              />
            </div>
          </div>

        ) : (
          // Tampilan jika terjadi error saat memuat detail
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <h3 className="text-2xl font-bold text-error">Failed to Load Details</h3>
              <p className="text-base-content/70 mt-2">Could not retrieve the data for the selected process. Please try again or select another process.</p>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}

export default DocumentationManagerContent;