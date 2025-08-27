import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import UploadedFileList from '../components/UploadedFileList';
import DocxViewer from '../components/DocxViewer'; // Pastikan ini diimpor
import { apiService } from '../services/APIService';


function ManagerPage() {
  const { showToast } = useOutletContext();

  const handleClearRedisData = async () => {
    try {
      const response = await apiService.delete('/red_tasks/clear-all');
      showToast('Redis task data cleared successfully!', 'success');
    } catch (error) {
      console.error('Error clearing Redis data:', error);
      showToast(`Failed to clear Redis data: ${error.message}`, 'error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-start py-8 min-h-[calc(100vh-160px)]">
      <h1 className="text-4xl md:text-5xl font-extrabold text-base-content mb-10 text-center">
        📊 Data Manager Page
      </h1>

      <button 
        className="btn btn-outline btn-error"
        onClick={handleClearRedisData}
      >Clear Redis Task Data</button>
    </div>
  );
}

export default ManagerPage;