import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import FileUploadArea from '../components/FileUploadArea';
import UploadedFileList from '../components/UploadedFileList';
import ModalConfirm from '../components/ModalConfirm';

function UploadPage() {
  const { showToast } = useOutletContext();

  const [historicFiles, setHistoricFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [errorLoadingFiles, setErrorLoadingFiles] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  const fetchHistoricFiles = useCallback(async () => {
    setIsLoadingFiles(true);
    setErrorLoadingFiles(null);
    try {
      const response = await fetch('http://localhost:8000/api/files/'); 
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHistoricFiles(data.files || []);
    } catch (error) {
      console.error("Error fetching historic files:", error);
      setErrorLoadingFiles(error.message);
      showToast('Failed to load uploaded files.', 'error'); 
    } finally {
      setIsLoadingFiles(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchHistoricFiles();
  }, [fetchHistoricFiles]);

  const handleUploadSuccess = (uploadedFilePaths) => {
    fetchHistoricFiles();
    showToast('Files uploaded successfully!', 'success');
  };

  const handleConfirmRemove = (fileId) => {
    setFileToDelete(fileId);
    setIsModalOpen(true);
  };

  const handleExecuteRemove = async () => {
    setIsModalOpen(false);
    if (!fileToDelete) return;

    try {
        const response = await fetch(`http://localhost:8000/api/files/${fileToDelete}`, { 
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || errorData.message || 'Failed to delete file');
        }

        console.log(`File ${fileToDelete} deleted successfully.`);
        // --- PERUBAHAN DI SINI: Ubah tipe toast menjadi 'error' untuk sukses delete ---
        showToast(`File "${fileToDelete}" deleted successfully.`, 'error'); 
        fetchHistoricFiles();
    } catch (error) {
        console.error('Error deleting file:', error);
        showToast(`Failed to delete file "${fileToDelete}": ${error.message}`, 'error');
    } finally {
        setFileToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFileToDelete(null);
  };

  return (
    <div className="flex flex-col items-center justify-start py-8 min-h-[calc(100vh-160px)]">
      <h1 className="text-4xl md:text-5xl font-extrabold text-base-content mb-10 text-center">
        🚀 Manage Your Files
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-8xl mx-auto px-4">
        <div className="md:order-1 flex flex-col">
          <h2 className="text-2xl font-bold text-base-content mb-4">Upload New Files</h2>
          <FileUploadArea onUploadSuccess={handleUploadSuccess} />
        </div>

        <div className="md:order-2 flex flex-col">
          <h2 className="text-2xl font-bold text-base-content mb-4">Uploaded Files History</h2>
          {isLoadingFiles ? (
            <div className="flex justify-center items-center h-full p-8 bg-base-100 rounded-lg shadow-xl">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="ml-4 text-base-content">Loading files...</p>
            </div>
          ) : errorLoadingFiles ? (
            <div className="flex justify-center items-center h-full p-8 bg-error text-error-content rounded-lg shadow-xl">
                <p className="font-semibold">Error: {errorLoadingFiles}</p>
            </div>
          ) : (
            <UploadedFileList
              files={historicFiles}
              onRemoveFile={handleConfirmRemove}
            />
          )}
        </div>
      </div>

      <ModalConfirm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleExecuteRemove}
        title="Confirm Deletion"
        message={`Are you sure you want to delete file "${fileToDelete}"? This action cannot be undone.`}
      />
    </div>
  );
}

export default UploadPage;