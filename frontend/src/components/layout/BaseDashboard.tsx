import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import Logo from '../common/Logo';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

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
    // Navigate to dashboard profile if we're in dashboard context
    navigate('/dashboard/profile');
  };

  const handleLogout = () => {
    toast.success('Ban đã đăng xuất thành công.');
    setTimeout(() => {
      setMenuOpen(false);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('role');
      navigate('/login');
    }, 1000);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
    localStorage.setItem('preferredLanguage', newLang);
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar role={role} />
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            {/* Hamburger menu button */}
            <button
              className={`hamburger-menu ${sidebarOpen ? 'hamburger-active' : ''}`}
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            
            <div onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Logo 
                className="logo"
                alt="SeekWell Logo"
                height={36}
              />
            </div>
          </div>

          {/* Center section with Language Switcher */}
          <div className="header-center">
            <button
              className="language-switcher-button"
              onClick={toggleLanguage}
              type="button"
            >
              {t('login.languageSwitcher')}
            </button>
          </div>

          {/* Account dropdown */}
          <div className="account-menu" ref={menuRef}>
            <button
              className="account-button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Account menu"
            >
              <span className="account-avatar">A</span>
              <span className="account-label">{t('navigation.account')}</span>
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
                  {t('navigation.profile')}
                </button>
                <button
                  className="dropdown-item"
                  onClick={handleLogout}
                >
                  {t('navigation.logout')}
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
