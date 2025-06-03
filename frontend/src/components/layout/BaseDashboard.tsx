import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { UserRole } from '../../types/UserType';
import './BaseDashboard.css'; // Assuming you have a CSS file for styles

import { Outlet } from 'react-router-dom';
import { toast } from 'react-toastify';

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
    toast.success('Ban đã đăng xuất thành công.');
    setTimeout(() => {
      setMenuOpen(false);
      navigate('/login');
    }, 1000);
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <Sidebar role={role} />
      </aside>

      {/* Main content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <img
              src="/logo192.png"
              alt="Clinic Logo"
              className="logo"
            />
            <h1 className="title">
              Clinic Management System
            </h1>
          </div>

          {/* Account dropdown */}
          <div className="account-menu" ref={menuRef}>
            <button
              className="account-button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Account menu"
            >
              <span className="account-avatar">A</span>
              <span className="account-label">Account</span>
              <svg
                className="chevron"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="dropdown">
                <button
                  className="dropdown-item"
                  onClick={handleProfile}
                >
                  Profile
                </button>
                <button
                  className="dropdown-item"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="content">
          {children}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default BaseDashboard;
