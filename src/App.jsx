import React, { useState } from 'react'; // Import useState
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ToastNotification from './components/ToastNotification'; // Import ToastNotification

function App() {
  const [toast, setToast] = useState(null); // State untuk mengelola toast

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ message, type, duration, id: Date.now() }); // id unik untuk re-render
  };

  const closeToast = () => {
    setToast(null);
  };

  return (
    <div data-theme="light" className="min-h-screen flex flex-col bg-base-200">
      <Navbar />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        {/* Render Outlet dengan prop showToast */}
        <Outlet context={{ showToast }} /> 
      </main>
      <Footer />

      {/* Render ToastNotification jika ada pesan */}
      {toast && (
        <ToastNotification
          key={toast.id} // Penting untuk re-render toast baru
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={closeToast}
        />
      )}
    </div>
  );
}

export default App;