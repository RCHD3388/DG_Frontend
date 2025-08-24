import React from 'react';
import { NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <div className="navbar bg-base-100 shadow-md">
      <div className="flex-1">
        <NavLink to="/" className="btn btn-ghost text-xl normal-case">
          Documentation Generator
        </NavLink>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1">
          <li>
            <NavLink
              to="/upload"
              className={({ isActive }) =>
                isActive ? "btn btn-sm btn-primary" : "btn btn-sm btn-ghost"
              }
            >
              Upload Files
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/analyze"
              className={({ isActive }) =>
                isActive ? "btn btn-sm btn-primary" : "btn btn-sm btn-ghost"
              }
            >
              Analyze Data
            </NavLink>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Navbar;