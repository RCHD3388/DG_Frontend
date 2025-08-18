import React, { useState, useRef, useCallback } from 'react';
import { MdCloudUpload } from 'react-icons/md'; // --- PERBAIKAN DI SINI ---

// Jika belum install react-icons:
// npm install react-icons

function FileUploadArea() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null); // Ref untuk input file yang tersembunyi

  // Fungsi untuk menangani penambahan file
  const handleFiles = useCallback((files) => {
    const newFiles = Array.from(files);
    // Anda bisa menambahkan validasi di sini (misal: tipe file, ukuran)
    setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
  }, []);

  // Event handler untuk perubahan input file (klik 'browse')
  const handleFileChange = (event) => {
    if (event.target.files) {
      handleFiles(event.target.files);
      event.target.value = null; // Reset input agar event change bisa terpicu lagi jika file yang sama dipilih
    }
  };

  // Event handler untuk click pada area drag & drop
  const handleAreaClick = () => {
    fileInputRef.current.click(); // Memicu klik pada input file tersembunyi
  };

  // Event handler untuk drag over (untuk mengubah kursor dan indikator visual)
  const handleDragOver = (event) => {
    event.preventDefault(); // Penting: Mencegah perilaku default browser (membuka file)
    setIsDragging(true);
  };

  // Event handler untuk drag leave (ketika kursor meninggalkan area)
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Event handler untuk drop file
  const handleDrop = (event) => {
    event.preventDefault(); // Penting: Mencegah perilaku default browser
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFiles(event.dataTransfer.files);
      event.dataTransfer.clearData(); // Membersihkan data transfer
    }
  };

  // Fungsi untuk menghapus file dari daftar
  const removeFile = (indexToRemove) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  // Fungsi untuk simulasi submit
  const handleSubmit = async () => { // Tambahkan async di sini
    if (selectedFiles.length === 0) {
      alert("Please select files first!");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file); // Pastikan 'files' sesuai dengan backend
    });

    try {
      const response = await fetch('http://localhost:8000/api/upload_files/', { // SESUAIKAN URL API ANDA
        method: 'POST',
        body: formData,
        // Header Content-Type tidak perlu disetel, browser akan otomatis mengaturnya untuk FormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || 'File upload failed');
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      alert(`Files uploaded successfully! Server Response: ${data.message}`);
      setSelectedFiles([]); // Bersihkan daftar file setelah upload berhasil
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload files: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-4">
      <div
        className={`
          w-full max-w-lg p-8 mb-6
          border-4 border-dashed rounded-2xl
          flex flex-col items-center justify-center text-center
          transition-colors duration-300 ease-in-out
          ${isDragging ? 'border-primary-focus bg-primary-content text-primary' : 'border-base-content/50 bg-base-100 text-base-content'}
          cursor-pointer
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleAreaClick}
      >
        <MdCloudUpload className={`text-6xl mb-4 ${isDragging ? 'text-primary' : 'text-base-content/70'}`} /> {/* --- PERBAIKAN DI SINI --- */}
        <p className="text-lg font-semibold mb-2">
          {isDragging ? "Drop your files here!" : "Drag & drop files here"}
        </p>
        <p className="text-sm text-base-content/80">
          or <span className="text-primary font-medium">click to browse</span>
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple // Izinkan multi-file selection
          className="hidden" // Sembunyikan input file secara visual
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="w-full max-w-lg mb-6 p-4 bg-base-100 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold mb-3 text-base-content">Selected Files:</h4>
          <ul className="list-disc list-inside space-y-2">
            {selectedFiles.map((file, index) => (
              <li key={index} className="flex items-center justify-between text-base-content">
                <span>{file.name} ({Math.round(file.size / 1024)} KB)</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(index); }} // Stop propagation untuk mencegah trigger handleAreaClick
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
        className="btn btn-primary btn-lg min-w-[200px]"
        onClick={handleSubmit}
        disabled={selectedFiles.length === 0}
      >
        Submit Files
      </button>
    </div>
  );
}

export default FileUploadArea;