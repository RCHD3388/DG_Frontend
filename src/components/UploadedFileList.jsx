import React from 'react';
import { MdDeleteForever } from 'react-icons/md';

/**
 * @typedef {object} FileItem
 * @property {string} id - ID unik dari backend untuk file
 * @property {string} name - Nama asli file
 * @property {number} size - Ukuran file dalam bytes
 */

function UploadedFileList({ files, onRemoveFile }) {
  if (!files || files.length === 0) {
    return (
      <div className="text-center p-4 bg-base-100 rounded-lg shadow-md text-base-content/70 h-full flex flex-col items-center justify-center"> {/* Tambahkan h-full, flex untuk senter */}
        <p className="text-xl font-semibold mb-1">No uploaded files yet.</p> {/* Ubah teks */}
        <p className="text-sm">Files you upload will appear here.</p>
      </div>
    );
  }

  return (
    <div className="w-full"> {/* Menghapus max-w dan mx-auto karena akan diatur oleh parent */}
      <div className="overflow-x-auto rounded-lg shadow-xl border border-base-content/10 max-h-[calc(100vh-34rem)]">
        <table className="table w-full table-zebra">
          <thead className="bg-base-200 text-base-content uppercase text-sm">
            <tr>
              <th className="w-1/12">#</th>
              <th className="w-7/12">File Name</th>
              <th className="w-2/12">Size</th>
              <th className="w-2/12">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, index) => (
              <tr key={file.id} className="hover:bg-base-300"> {/* Pastikan key menggunakan file.id dari backend */}
                <td>{index + 1}</td>
                <td className="font-semibold text-base-content break-all">{file.name}</td>
                <td className="text-base-content/80">{Math.round(file.size / 1024)} KB</td>
                <td>
                  <button
                    className="btn btn-sm btn-error btn-outline tooltip"
                    data-tip="Remove File"
                    onClick={() => onRemoveFile(file.id)}
                  >
                    <MdDeleteForever className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UploadedFileList;