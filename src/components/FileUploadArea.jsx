import React, { useState, useRef, useCallback } from 'react';
import { MdCloudUpload } from 'react-icons/md';
import { useOutletContext } from 'react-router-dom';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

function FileUploadArea({ onUploadSuccess }) {
  const { showToast } = useOutletContext();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleAddFiles = useCallback((files) => {
    const newFiles = Array.from(files);
    const validFiles = [];
    const invalidFiles = [];

    newFiles.forEach(file => {
      // Validasi format file: hanya .zip yang diterima
      if (file.name.toLowerCase().endsWith('.zip')) {
        // Cek duplikasi sebelum menambahkan
        if (!selectedFiles.some(existingFile => existingFile.name === file.name)) {
          validFiles.push(file);
        } else {
          showToast(`File "${file.name}" is already in the list.`, 'info');
        }
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      const message = `The following files are not .zip format and cannot be uploaded: ${invalidFiles.join(', ')}`;
      showToast(message, 'error'); // Berikan toast error untuk file yang salah
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prevFiles => [...prevFiles, ...validFiles]);
    }
  }, [selectedFiles, showToast]); // Tambahkan showToast ke dependencies useCallback

  const handleFileChange = (event) => {
    if (event.target.files) {
      handleAddFiles(event.target.files);
      event.target.value = null; 
    }
  };

  const handleAreaClick = () => fileInputRef.current.click();
  const handleDragOver = (event) => { event.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleAddFiles(event.dataTransfer.files);
      event.dataTransfer.clearData();
    }
  };

  const handleRemoveSelectedFile = (fileNameToRemove) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileNameToRemove));
  };


  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      showToast("Please select .zip files to upload first!", 'info'); // Ubah pesan
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/files/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || errorData.message || 'File upload failed');
        }

        const data = await response.json();
        console.log('Upload successful:', data);
        showToast(`Files uploaded successfully!`, 'success');
        setSelectedFiles([]); 
        
        if (onUploadSuccess) {
            onUploadSuccess(data.uploaded_files);
        }

    } catch (error) {
        console.error('Upload error:', error);
        showToast(`Failed to upload files: ${error.message}`, 'error');
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-6 bg-base-100 rounded-lg shadow-xl">
      <div>
        <div
            className={`
            w-full p-10 mb-4
            border-4 border-dashed rounded-2xl
            flex flex-col items-center justify-center text-center
            transition-colors duration-300 ease-in-out
            ${isDragging ? 'border-primary-focus bg-primary-content text-primary' : 'border-base-content/50 bg-base-200 text-base-content'}
            cursor-pointer
            shadow-md hover:shadow-lg
            min-h-[200px]
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleAreaClick}
        >
            <MdCloudUpload className={`text-7xl mb-4 ${isDragging ? 'text-primary' : 'text-base-content/70'}`} />
            <p className="text-xl font-bold mb-2">
            {isDragging ? "Drop your .zip files here!" : "Drag & drop .zip files here"} {/* Ubah teks */}
            </p>
            <p className="text-md text-base-content/80">
            or <span className="text-primary font-medium">click to browse</span>
            </p>
            <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
            // Tambahkan accept=".zip" untuk dialog file browser
            accept=".zip"
            />
        </div>
      </div>
      
        {selectedFiles.length > 0 && (
            <div className="w-full mt-4 p-4 bg-base-200 rounded-lg shadow-inner">
                <h5 className="text-lg font-semibold text-base-content mb-3">Files to Upload:</h5>
                <ul className="list-disc list-inside space-y-2 text-base-content text-sm">
                    {selectedFiles.map((file) => (
                        <li key={file.name} className="flex items-center justify-between">
                            <span className="break-all">{file.name} (<span className="text-xs">{Math.round(file.size / 1024)} KB</span>)</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveSelectedFile(file.name); }}
                                className="btn btn-xs btn-outline btn-error ml-2"
                            >
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        )}

      <button
        className="btn btn-primary btn-lg w-full mt-6"
        onClick={handleSubmit}
        disabled={selectedFiles.length === 0}
      >
        Submit Files
      </button>
    </div>
  );
}

export default FileUploadArea;