import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Container } from '@mui/material';
import { AISkinAnalysisDashboard } from '../components/ai';
import Logo from '../components/common/Logo';
import { toast } from 'react-toastify';
import { AIAnalysisResult } from '../types/AIAnalysisTypes';
import '../components/layout/BaseDashboard.css';

/**
 * Simplified AI Skin Analysis page - single purpose upload interface
 */
export const AISkinAnalysisPage: React.FC = () => {
  const mockPatientId = 1;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Get selected result from navigation state (if coming from history page)
  const selectedResult = location.state?.selectedResult as AIAnalysisResult | undefined;
  
  const tab = searchParams.get('tab');
  
  // Determine initial tab based on URL parameter
  let initialTab = 0; // Default to "Upload & Analyze"
  if (tab === 'history') {
    initialTab = 2; // "My History" tab
  } else if (tab === 'results') {
    initialTab = 1; // "Analysis Results" tab
  }

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
    navigate('/dashboard/profile');
  };

  const handleLogout = () => {
    toast.success('Bạn đã đăng xuất thành công.');
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

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <header className="header" style={{ position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div className="header-left">
          {/* Hamburger menu button */}
          <button
            className={`hamburger-menu ${sidebarOpen ? 'hamburger-active' : ''}`}
            onClick={goToDashboard}
            aria-label="Back to dashboard"
            title="Back to Dashboard"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <div onClick={goToDashboard} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
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

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ flex: 1 }}>
        <Box sx={{ py: 4 }}>
          {/* Main AI Analysis Dashboard */}
          <AISkinAnalysisDashboard 
            patientId={mockPatientId} 
            initialTab={initialTab} 
            selectedResult={selectedResult}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default AISkinAnalysisPage;
