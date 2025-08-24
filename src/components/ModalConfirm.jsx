import React from 'react';

function ModalConfirm({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) {
    return null;
  }

  return (
    // Menggunakan DaisyUI Modal
    <dialog open={isOpen} className="modal modal-bottom sm:modal-middle">
      <div className="modal-box p-6 rounded-lg shadow-2xl bg-base-100 text-base-content">
        <h3 className="font-bold text-2xl text-error mb-4">{title}</h3> {/* Judul merah untuk konfirmasi delete */}
        <p className="py-4 text-lg">{message}</p>
        <div className="modal-action flex justify-end gap-3 mt-6">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-error" onClick={onConfirm}>Delete</button> {/* Tombol delete merah */}
        </div>
      </div>
      {/* Tombol di luar modal-box untuk menutup jika klik di luar modal */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}

export default ModalConfirm;