import React, { useState, useEffect } from 'react';
import { MdCheckCircle, MdError, MdInfo } from 'react-icons/md'; // Ikon untuk status

function ToastNotification({ message, type = 'info', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);

      return () => clearTimeout(timer); // Cleanup timer jika komponen di-unmount
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible || !message) {
    return null;
  }

  // Menentukan warna dan ikon berdasarkan tipe
  let bgColorClass = '';
  let iconComponent = null;
  switch (type) {
    case 'success':
      bgColorClass = 'alert-success';
      iconComponent = <MdCheckCircle className="h-6 w-6" />;
      break;
    case 'error':
      bgColorClass = 'alert-error';
      iconComponent = <MdError className="h-6 w-6" />;
      break;
    case 'info':
    default:
      bgColorClass = 'alert-info';
      iconComponent = <MdInfo className="h-6 w-6" />;
      break;
  }

  return (
    <div className={`toast toast-end z-50`}> {/* toast-end untuk posisi di kanan bawah, z-50 agar di atas semua */}
      <div className={`alert ${bgColorClass}`}>
        <div className="flex items-center">
          {iconComponent}
          <span className="ml-2">{message}</span>
        </div>
        <button className="btn btn-ghost btn-xs" onClick={handleClose}>
          ✕
        </button>
      </div>
    </div>
  );
}

export default ToastNotification;