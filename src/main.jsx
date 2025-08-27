import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Import halaman-halaman Anda
import UploadPage from './pages/UploadPage.jsx';
import AnalyzePage from './pages/AnalyzePage.jsx';
import ManagerPage from './pages/ManagerPage.jsx';

// Konfigurasi router
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // App sebagai layout root
    children: [
      {
        index: true, // Ini adalah route default untuk path "/"
        element: <UploadPage />,
      },
      {
        path: "upload",
        element: <UploadPage />,
      },
      {
        path: "analyze",
        element: <AnalyzePage />,
      },
      {
        path: "manager",
        element: <ManagerPage />,
      },
      // Anda bisa menambahkan route lain di sini, misalnya 404 page
      // {
      //   path: "*",
      //   element: <div>404 Not Found</div>,
      // },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);