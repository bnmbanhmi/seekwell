import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { UserRole } from '../../types/UserType';
import styles from '../../styles/styles'; 

type Props = {
  role: UserRole;
  children: React.ReactNode;
};

const BaseDashboard: React.FC<Props> = ({ role, children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
    <div className="flex min-h-screen bg-gray-100 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm">
        <Sidebar role={role} />
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="bg-white px-6 py-4 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo192.png"
              alt="Clinic Logo"
              className="h-10 w-10 rounded-full shadow"
            />
            <h1 className="text-2xl font-bold text-blue-700 tracking-tight">
              Clinic Management System
            </h1>
          </div>

          {/* Account dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow transition"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Account menu"
            >
              <span className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold">
                A
              </span>
              <span className="hidden sm:inline font-medium">Account</span>
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
                <button
                  className="block w-full text-left px-5 py-3 hover:bg-gray-100 text-gray-700"
                  onClick={handleProfile}
                >
                  Profile
                </button>
                <button
                  className="block w-full text-left px-5 py-3 hover:bg-gray-100 text-gray-700"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default BaseDashboard;
