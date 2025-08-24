// src/pages/AnalyzePage.jsx
import React from 'react';
import { useOutletContext } from 'react-router-dom';

function AnalyzePage() {
  const { showToast } = useOutletContext(); // Dapatkan showToast dari context

  return (
    <div className="flex flex-col items-center justify-start py-8 min-h-[calc(100vh-160px)]">
      <h1 className="text-4xl md:text-5xl font-extrabold text-base-content mb-10 text-center">
        📊 Analyze Your Data
      </h1>
      <div className="w-full max-w-4xl px-4 mt-8 p-6 bg-base-100 rounded-lg shadow-xl text-center">
        <p className="text-lg text-base-content mb-4">
          This section is currently under construction.
        </p>
        <p className="text-md text-base-content/80">
          We're constantly working on providing the best tools for your data.
        </p>
        <button className="btn btn-secondary mt-6">Start Analysis (Coming Soon)</button>
      </div>
    </div>
  );
}

export default AnalyzePage;