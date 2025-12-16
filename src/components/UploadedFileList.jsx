import React from 'react';
import { MdDeleteForever } from 'react-icons/md';

/**
 * @typedef {object} FileItem
 * @property {string} id - ID unik dari backend untuk file
 * @property {string} name - Nama asli file
 * @property {number} size - Ukuran file dalam bytes
 */

function UploadedFileList({ files, onRemoveFile, onSelectFile, selectedFileId, withSelection=false, withActions=true, maxHeight='800px' }) { // Tambahkan onSelectFile, selectedFileId
  if (!files || files.length === 0) {
    return (
      <div className="text-center p-4 bg-base-100 rounded-lg shadow-md text-base-content/70 h-full flex flex-col items-center justify-center">
        <p className="text-xl font-semibold mb-1">No uploaded files yet.</p>
        <p className="text-sm">Upload some files to see them listed here.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-lg shadow-xl border border-base-content/10">
        <table className="table w-full table-zebra">
          <thead>
            <tr>
              <th className="w-1/12">#</th>
              <th className="w-6/12">File Name</th> {/* Lebar kolom disesuaikan */}
              <th className="w-2/12">Size</th>
              {withSelection && <th className="w-1/12">Select</th>} {/* Kolom baru untuk pemilihan */}
              {withActions && <th className="w-1/12">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {files.map((file, index) => (
              <tr key={file.id} className="hover:bg-base-300">
                <td>{index + 1}</td>
                <td className="font-semibold text-base-content break-all">{file.name}</td>
                <td className="text-base-content/80">{Math.round(file.size / 1024)} KB</td>
                {withSelection && <td>
                  <input
                    type="radio" // Menggunakan radio button untuk single selection
                    name="selectedRepoFile" // Nama yang sama agar hanya satu yang bisa dipilih
                    className="radio radio-primary"
                    checked={selectedFileId === file.id}
                    onChange={() => onSelectFile(file.id)}
                  />
                </td>}
                {withActions && <td>
                  {onRemoveFile && ( // Tombol Remove tetap ada, tapi di-handle oleh parent
                    <button
                      className="btn btn-xs btn-error btn-outline tooltip"
                      data-tip="Remove File"
                      onClick={() => onRemoveFile(file.id)}
                    >
                      <MdDeleteForever className="h-5 w-5" />
                    </button>
                  )}
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UploadedFileList;