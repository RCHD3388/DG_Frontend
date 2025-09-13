import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiService } from '../services/APIService';
import ModalConfirm from '../components/ModalConfirm';
import ManagerSidebar from '../components/manager_components/ManagerSidebar'; // Import ManagerSidebar

// Definisikan tipe untuk aksi delete yang berbeda
const DELETE_TYPES = {
  REDIS: 'redis',
  DEPENDENCY_GRAPHS: 'dependency_graphs',
  PYCG_OUTPUTS: 'pycg_outputs',
  EXTRACTED_PROJECTS: 'extracted_projects',
  ALL_DATA: 'all_data',
};

function ManagerPage() {
  const { showToast } = useOutletContext();

  // State untuk mengelola Modal Konfirmasi
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTypeToConfirm, setDeleteTypeToConfirm] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationTitle, setConfirmationTitle] = useState('');

  // State untuk mengelola bagian aktif di sidebar
  const [activeManagerSection, setActiveManagerSection] = useState('data_management'); // Default ke Data Management

  // --- HANDLER UNTUK LOGIKA PEMBERSIHAN ---
  const executeDeleteAction = useCallback(async (type) => {
    let endpoint = '';
    let successMessage = '';
    let errorMessage = '';

    switch (type) {
      case DELETE_TYPES.REDIS:
        endpoint = '/data_manager/clear-redis-tasks'; // Endpoint yang sudah ada
        successMessage = 'Redis task data cleared successfully!';
        errorMessage = 'Failed to clear Redis data.';
        break;
      case DELETE_TYPES.DEPENDENCY_GRAPHS:
        endpoint = '/data_manager/clear-dependency-graphs';
        successMessage = 'Dependency graph JSONs cleared successfully!';
        errorMessage = 'Failed to clear dependency graph JSONs.';
        break;
      case DELETE_TYPES.PYCG_OUTPUTS:
        endpoint = '/data_manager/clear-pycg-outputs';
        successMessage = 'PyCG output JSONs cleared successfully!';
        errorMessage = 'Failed to clear PyCG output JSONs.';
        break;
      case DELETE_TYPES.EXTRACTED_PROJECTS:
        endpoint = '/data_manager/clear-extracted-projects';
        successMessage = 'Extracted project folders cleared successfully!';
        errorMessage = 'Failed to clear extracted project folders.';
        break;
      case DELETE_TYPES.ALL_DATA:
        endpoint = '/data_manager/clear-all';
        successMessage = 'All application data cleared successfully!';
        errorMessage = 'Failed to clear all application data.';
        break;
      default:
        showToast('Invalid delete action type.', 'error');
        return;
    }

    try {
      const response = await apiService.delete(endpoint);
      showToast(successMessage, 'success');
      console.log(`${type} deletion success:`, response.data);
    } catch (error) {
      console.error(`Error clearing ${type} data:`, error);
      const apiErrorMessage = error.response?.data?.detail || error.message;
      showToast(`${errorMessage} ${apiErrorMessage}`, 'error');
    } finally {
      setIsModalOpen(false);
      setDeleteTypeToConfirm(null);
    }
  }, [showToast]);

  // --- HANDLER UNTUK MODAL KONFIRMASI ---
  const handleOpenConfirmModal = (type) => {
    setDeleteTypeToConfirm(type);
    let title = "Confirm Deletion";
    let message = "Are you sure you want to delete this data? This action cannot be undone.";

    switch (type) {
      case DELETE_TYPES.REDIS:
        title = "Clear Redis Task Data";
        message = "Are you sure you want to delete ALL active and completed task metadata from Redis? This action cannot be undone.";
        break;
      case DELETE_TYPES.DEPENDENCY_GRAPHS:
        title = "Clear Dependency Graphs";
        message = "Are you sure you want to delete ALL generated dependency graph JSON files? This action cannot be undone.";
        break;
      case DELETE_TYPES.PYCG_OUTPUTS:
        title = "Clear PyCG Outputs";
        message = "Are you sure you want to delete ALL generated PyCG output JSON files? This action cannot be undone.";
        break;
      case DELETE_TYPES.EXTRACTED_PROJECTS:
        title = "Clear Extracted Projects";
        message = "Are you sure you want to delete ALL extracted project folders and their contents? This action cannot be undone.";
        break;
      case DELETE_TYPES.ALL_DATA:
        title = "Clear ALL Application Data";
        message = "WARNING: This will delete ALL Redis data, dependency graphs, PyCG outputs, AND extracted project folders. Are you absolutely sure? This action cannot be undone!";
        break;
    }
    setConfirmationTitle(title);
    setConfirmationMessage(message);
    setIsModalOpen(true);
  };

  const handleConfirmExecute = () => {
    if (deleteTypeToConfirm) {
      executeDeleteAction(deleteTypeToConfirm);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDeleteTypeToConfirm(null);
  };


  // --- RENDERING KONTEN BERDASARKAN activeManagerSection ---
  const renderContent = () => {
    switch (activeManagerSection) {
      case 'dashboard':
        return (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <h2 className="text-3xl font-bold text-base-content mb-6">Manager Dashboard</h2>
            <p className="text-base-content/80 text-lg">Overview of system status and quick actions will be here.</p>
            {/* Tambahkan widget atau statistik di sini */}
          </div>
        );
      case 'data_management':
        return (
          <div className="flex flex-col h-full"> {/* Gunakan flex-col h-full untuk konten main */}
            <h2 className="text-3xl font-bold text-base-content mb-6 text-center">Data Management Panel</h2>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow"> {/* flex-grow agar mengisi ruang */}
              {/* Panel: Redis Data Manager */}
              <div className="card bg-base-100 shadow-xl border border-base-content/10">
                <div className="card-body items-center text-center">
                  <h2 className="card-title text-xl text-primary">Redis Task Data</h2>
                  <p className="text-base-content/80 text-sm">Clear all active and completed task metadata stored in Redis.</p>
                  <div className="card-actions mt-4">
                    <button
                      className="btn btn-outline btn-error"
                      onClick={() => handleOpenConfirmModal(DELETE_TYPES.REDIS)}
                    >
                      Clear All Redis Data
                    </button>
                  </div>
                </div>
              </div>

              {/* Panel: Dependency Graphs JSONs Manager */}
              <div className="card bg-base-100 shadow-xl border border-base-content/10">
                <div className="card-body items-center text-center">
                  <h2 className="card-title text-xl text-info">Dependency Graphs</h2>
                  <p className="text-base-content/80 text-sm">Remove all generated JSON files for dependency graphs.</p>
                  <div className="card-actions mt-4">
                    <button
                      className="btn btn-outline btn-error"
                      onClick={() => handleOpenConfirmModal(DELETE_TYPES.DEPENDENCY_GRAPHS)}
                    >
                      Clear All Graph JSONs
                    </button>
                  </div>
                </div>
              </div>

              {/* Panel: PyCG Output JSONs Manager */}
              <div className="card bg-base-100 shadow-xl border border-base-content/10">
                <div className="card-body items-center text-center">
                  <h2 className="card-title text-xl text-secondary">PyCG Outputs</h2>
                  <p className="text-base-content/80 text-sm">Delete all raw PyCG output JSON files generated during analysis.</p>
                  <div className="card-actions mt-4">
                    <button
                      className="btn btn-outline btn-error"
                      onClick={() => handleOpenConfirmModal(DELETE_TYPES.PYCG_OUTPUTS)}
                    >
                      Clear All PyCG Outputs
                    </button>
                  </div>
                </div>
              </div>

              {/* Panel: Extracted Projects Manager */}
              <div className="card bg-base-100 shadow-xl border border-base-content/10">
                <div className="card-body items-center text-center">
                  <h2 className="card-title text-xl text-accent">Extracted Projects</h2>
                  <p className="text-base-content/80 text-sm">Delete all extracted project folders and their contents from storage.</p>
                  <div className="card-actions mt-4">
                    <button
                      className="btn btn-outline btn-error"
                      onClick={() => handleOpenConfirmModal(DELETE_TYPES.EXTRACTED_PROJECTS)}
                    >
                      Clear All Extracted Projects
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Separator dan Tombol Delete All Global */}
            <div className="divider w-full max-w-4xl mx-auto mt-10 mb-8 text-base-content/50">DANGER ZONE</div>

            <div className="w-full flex justify-center">
              <button
                className="btn btn-error btn-lg btn-outline"
                onClick={() => handleOpenConfirmModal(DELETE_TYPES.ALL_DATA)}
              >
                🚨 Delete ALL Application Data 🚨
              </button>
            </div>
          </div>
        );
      case 'settings': // Contoh halaman lain
        return (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <h2 className="text-3xl font-bold text-base-content mb-6">Settings</h2>
            <p className="text-base-content/80 text-lg">Application settings will be configured here.</p>
          </div>
        );
      case 'activity_log': // Contoh halaman lain
        return (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <h2 className="text-3xl font-bold text-base-content mb-6">Activity Log</h2>
            <p className="text-base-content/80 text-lg">System activity and user actions will be logged here.</p>
          </div>
        );
      default:
        return null;
    }
  };


  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-160px)]">
      <h1 className="text-4xl md:text-5xl font-extrabold text-base-content mb-10 text-center">
        ⚙️ Application Manager
      </h1>

      <div className="w-full mx-auto flex flex-col lg:flex-row gap-4 h-full"
        style={{ minHeight: 'calc(100vh - 250px)', maxHeight: 'calc(100vh - 200px)' }}> {/* Container utama sidebar + content */}
        {/* Sidebar Kiri */}
        <div className="lg:w-1/5 flex-shrink-0 bg-base-100 rounded-lg shadow-xl p-4"> {/* Lebar sidebar */}
          <ManagerSidebar activeSection={activeManagerSection} onSectionChange={setActiveManagerSection} />
        </div>

        {/* Konten Utama Kanan */}
        <div
          className="lg:w-3/4 bg-base-100 rounded-lg shadow-xl p-6 flex-grow"
          style={{ overflowY: 'auto' }}
        >
          {renderContent()}
          {renderContent()}
        </div>
      </div>

      {/* Modal Konfirmasi */}
      <ModalConfirm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmExecute}
        title={confirmationTitle}
        message={confirmationMessage}
      />
    </div>
  );
}

export default ManagerPage;