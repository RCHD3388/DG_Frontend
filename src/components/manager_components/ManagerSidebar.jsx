import React from 'react';
import { NavLink } from 'react-router-dom';
import { MdDashboard, MdStorage, MdSettings, MdHistory } from 'react-icons/md'; // Contoh ikon

/**
 * Komponen Sidebar untuk halaman Manager.
 * Menerima prop `onNavigate` untuk memberitahu parent saat item diklik,
 * atau bisa juga menggunakan state lokal jika ingin sidebar mengelola routing internalnya.
 * Untuk saat ini, kita akan menggunakan prop `activeSection` dan `onSectionChange`
 * agar parent `ManagerPage` yang mengelola bagian mana yang aktif.
 */
function ManagerSidebar({ activeSection, onSectionChange }) {
  const sidebarItems = [
    { id: 'documentations', label: 'Documentations', icon: <MdDashboard className="h-5 w-5" /> },
    { id: 'data_management', label: 'Data Management', icon: <MdStorage className="h-5 w-5" /> },
    { id: 'config', label: 'Configs', icon: <MdSettings className="h-5 w-5" /> },
  ];

  return (
    <ul className="menu menu-horizontal bg-base-200 w-full rounded-box p-2 text-base-content font-semibold">
      {sidebarItems.map(item => (
        <li key={item.id}>
          <a
            className={activeSection === item.id ? "active bg-primary text-primary-content" : ""}
            onClick={() => onSectionChange(item.id)}
          >
            {item.icon}
            {item.label}
          </a>
        </li>
      ))}
    </ul>

    
  );
}

export default ManagerSidebar;