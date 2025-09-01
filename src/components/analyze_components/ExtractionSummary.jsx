import React from 'react';
import { MdOutlineFileCopy, MdOutlineFolder, MdCheckCircle } from 'react-icons/md';

/**
 * Komponen untuk menampilkan ringkasan ekstraksi file, khususnya daftar path file.
 * @param {object} props
 * @param {string[]} props.discovered_files - Array string berisi path file yang ditemukan.
 * @param {string} [props.extracted_folder_name] - Opsional: Nama folder dari mana file diekstrak.
 */
function ExtractionSummary({ discovered_files, extracted_folder_name }) {
  // Pastikan discovered_files adalah array, jika tidak, inisialisasi sebagai array kosong
  const filesList = Array.isArray(discovered_files) ? discovered_files : [];
  const totalFiles = filesList.length;

  // Jika tidak ada file yang ditemukan, tampilkan pesan yang sesuai
  if (totalFiles === 0) {
    return (
      <div className="card bg-base-100 shadow-xl border border-base-content/10 p-6">
        <div className="card-body p-0">
          <h3 className="card-title text-2xl font-bold text-primary mb-4 flex items-center">
            <MdCheckCircle className="h-7 w-7 mr-3 text-success" />
            Extraction Summary {extracted_folder_name ? `for "${extracted_folder_name}"` : ''}
          </h3>
          <div className="alert alert-warning mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span>No files were found in the uploaded archive.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl border border-base-content/10 p-6">
      <div className="card-body p-0">
        <h3 className="card-title text-2xl font-bold text-primary mb-4 flex items-center">
          <MdCheckCircle className="h-7 w-7 mr-3 text-success" />
          Extraction Summary {extracted_folder_name ? `for "${extracted_folder_name}"` : ''}
        </h3>

        <div className="flex items-center text-lg font-semibold text-base-content mb-4">
          <MdOutlineFileCopy className="h-6 w-6 mr-2 text-info" />
          Total Discovered Files: <span className="text-secondary ml-2">{totalFiles}</span>
        </div>

        {filesList.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xl font-semibold text-base-content mb-3 flex items-center">
                <MdOutlineFolder className="h-6 w-6 mr-2 text-primary" />
                Discovered File Paths:
            </h4>
            <div className="max-h-60 overflow-y-auto bg-base-200 rounded-lg p-3 border border-base-content/10">
              <ul className="list-none space-y-2 text-sm text-base-content">
                {filesList.map((path, index) => (
                  <li key={index} className="flex items-start">
                    <span className="badge badge-warning badge-sm mr-2 mt-1 flex-shrink-0">FILE</span> {/* Ubah badge */}
                    <span className="break-all">{path}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExtractionSummary;