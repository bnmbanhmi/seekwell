// components/layout/BaseDashboard.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

import {UserRole} from '../../types/UserType'; // Adjust the import path as necessary

type Props = {
  role: UserRole;
  children: React.ReactNode;
};

const BaseDashboard: React.FC<Props> = ({ role, children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleProfile = () => {
    setMenuOpen(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <div className="flex flex-col flex-1">
        <header className="bg-gray-100 p-4 shadow flex items-center justify-between">
          <h1 className="text-xl font-semibold">Clinic Management System</h1>
          <div className="relative" ref={menuRef}>
            <button
              className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold focus:outline-none"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Account menu"
            >
              {/* You can replace this with user's initials or avatar */}
              <span className="text-lg">A</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded shadow-lg z-10">
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={handleProfile}
                >
                  Profile
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default BaseDashboard;
