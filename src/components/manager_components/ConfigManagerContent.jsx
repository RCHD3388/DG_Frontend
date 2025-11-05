import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/APIService';
import ModalConfirm from './../ModalConfirm'; // Pastikan path import ini benar

// Icon untuk UI (opsional, tapi bagus)
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3 3m3-3l3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
  </svg>
);

// Icon baru untuk Download
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const ConfigManagerContent = ({ showToast }) => {
  // --- STATE ---
  const [configs, setConfigs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // Form state
  const [configName, setConfigName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Preview Modal state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);

  // --- DATA FETCHING ---
  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    try {
      // Asumsi endpoint /configs mengembalikan list [{ name: 'config_a.yaml', created_at: '...' }, ...]
      const response = await apiService.get('/configs');
      setConfigs(response.data || []);
    } catch (error) {
      console.error('Error fetching configs:', error);
      showToast('Failed to fetch configurations.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Efek untuk mengambil data saat komponen dimuat
  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // --- HANDLERS ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/x-yaml' || file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        setSelectedFile(file);
      } else {
        showToast('Invalid file type. Please upload a .yaml or .yml file.', 'error');
        e.target.value = null; // Reset input file
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!configName || !selectedFile) {
      showToast('Please provide a config name and select a file.', 'warning');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('name', configName);
    formData.append('file', selectedFile);

    try {
      // Asumsi endpoint POST /configs menangani upload
      await apiService.post('/configs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showToast('Configuration uploaded successfully!', 'success');
      setConfigName('');
      setSelectedFile(null);
      document.getElementById('yaml_file_input').value = null; // Reset file input
      fetchConfigs(); // Refresh list
    } catch (error) {
      console.error('Error uploading config:', error);
      showToast(error.response?.data?.detail || 'Failed to upload configuration.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (filename) => {
    setDownloadingId(filename); // Mulai loading state untuk item ini
    try {
      const endpoint = `/configs/download/${filename}`;
      // PENTING: Minta response sebagai 'blob'
      const response = await apiService.get(endpoint, {
        responseType: 'blob', 
      });
      
      // Buat URL sementara dari blob yang diterima dari API
      const url = window.URL.createObjectURL(new Blob([response]));
      
      // Buat elemen <a> sementara untuk memicu download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename); // Set nama file saat di-download
      
      // Tambahkan ke DOM, klik, lalu hapus
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Hapus URL sementara dari memori
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading config:', error);
      showToast(error.response?.data?.detail || `Failed to download ${filename}.`, 'error');
    } finally {
      setDownloadingId(null); // Hentikan loading state
    }
  };

  const handlePreview = async (name) => {
    try {
      // Asumsi endpoint GET /configs/{name} mengembalikan { content: '...' }
      const response = await apiService.get(`/configs/${name}`);
      setPreviewContent(response.data.content || 'No content found.');
      setPreviewTitle(name);
      setIsPreviewModalOpen(true);
    } catch (error) {
      console.error('Error fetching config content:', error);
      showToast(error.response?.data?.detail || 'Failed to fetch config content.', 'error');
    }
  };

  const handleOpenDeleteModal = (name) => {
    setConfigToDelete(name);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setConfigToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!configToDelete) return;

    try {
      // Asumsi endpoint DELETE /configs/{name}
      await apiService.delete(`/configs/${configToDelete}`);
      showToast('Configuration deleted successfully!', 'success');
      fetchConfigs(); // Refresh list
    } catch (error) {
      console.error('Error deleting config:', error);
      showToast(error.response?.data?.detail || 'Failed to delete configuration.', 'error');
    } finally {
      handleCloseDeleteModal();
    }
  };


  // --- RENDER ---
  return (
    <div className="flex flex-col h-full gap-8">

      {/* 1. UPLOAD FORM CARD */}
      <div className="card bg-base-100 shadow-xl border border-base-content/10">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Upload New Configuration</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            {/* Config Name Input */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Configuration Name</span>
              </label>
              <input
                type="text"
                placeholder="e.g., 'Production Model v2' or 'Testing_GPT4o'"
                className="input input-bordered w-full"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                disabled={isUploading}
              />
            </div>

            {/* File Upload Input */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">YAML File</span>
              </label>
              <input
                type="file"
                id="yaml_file_input"
                className="file-input file-input-bordered file-input-primary w-full"
                accept=".yaml, .yml, application/x-yaml"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>

            {/* Submit Button */}
            <div className="card-actions justify-end mt-4">
              <button type="submit" className="btn btn-primary" disabled={isUploading}>
                {isUploading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <UploadIcon />
                )}
                Upload Configuration
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. CONFIGURATIONS LIST TABLE */}
      <div className="divider">EXISTING CONFIGURATIONS</div>
      <div className="card bg-base-100 shadow-xl border border-base-content/10">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Available Configurations</h2>

          {isLoading ? (
            <div className="text-center p-10">
              <span className="loading loading-lg loading-dots"></span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Configuration Name</th>
                    <th>File Name / ID</th> {/* Asumsi backend memberi nama file unik */}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-base-content/60">
                        No configurations found.
                      </td>
                    </tr>
                  ) : (
                    configs.map((config, index) => (
                      <tr key={config.name} className="hover">
                        <th>{index + 1}</th>
                        <td>{config.name}</td> {/* Ini bisa nama yg diinput user */}
                        <td className="font-mono">{config.filename || config.name}</td> {/* Ini nama file di server */}
                        <td className="flex gap-2">
                          <button
                            className="btn btn-success btn-sm btn-outline"
                            onClick={() => handlePreview(config.filename || config.name)}
                          >
                            Preview
                          </button>
                          <button
                            className="btn btn-info btn-sm btn-outline"
                            onClick={() => handleDownload(config.filename || config.name)}
                            disabled={downloadingId === (config.filename || config.name)} // Nonaktifkan saat item ini di-download
                          >
                            {downloadingId === (config.filename || config.name) ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <DownloadIcon />
                            )}
                            Download
                          </button>
                          <button
                            className="btn btn-error btn-sm btn-outline"
                            onClick={() => handleOpenDeleteModal(config.filename || config.name)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 3. PREVIEW MODAL */}
      <dialog id="preview_modal" className={`modal ${isPreviewModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box w-11/12 max-w-4xl">
          <h3 className="font-bold text-lg mb-4">{previewTitle}</h3>

          <div className="mockup-code p-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <pre data-prefix="" className="text-xs">
              <code>{previewContent}</code>
            </pre>
          </div>

          <div className="modal-action">
            <button className="btn" onClick={() => setIsPreviewModalOpen(false)}>Close</button>
          </div>
        </div>
        {/* Klik di luar untuk menutup */}
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setIsPreviewModalOpen(false)}>close</button>
        </form>
      </dialog>

      {/* 4. DELETE CONFIRM MODAL */}
      <ModalConfirm
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the configuration: "${configToDelete}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="btn-error"
      />
    </div>
  );
};

export default ConfigManagerContent;