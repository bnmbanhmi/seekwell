import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Container, Typography, Card, CardContent, List, ListItem, Chip, Button, Alert, ThemeProvider } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import Logo from '../components/common/Logo';
import { toast } from 'react-toastify';
import HuggingFaceAIService from '../services/HuggingFaceAIService';
import { AIAnalysisResult, RISK_LEVEL_COLORS, CONFIDENCE_THRESHOLD } from '../types/AIAnalysisTypes';
import { getTheme, useDarkMode } from '../theme/darkTheme';
import '../components/layout/BaseDashboard.css';

/**
 * Standalone Analysis History page
 */
export const AnalysisHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [history, setHistory] = useState<AIAnalysisResult[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const isDarkMode = useDarkMode();
  const theme = getTheme(isDarkMode);

  useEffect(() => {
    loadHistory();
  }, []);

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

  const loadHistory = () => {
    try {
      const historyData = HuggingFaceAIService.getAnalysisHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load analysis history');
    }
  };

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

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
    localStorage.setItem('preferredLanguage', newLang);
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const getRiskColor = (risk: string) => {
    return RISK_LEVEL_COLORS[risk as keyof typeof RISK_LEVEL_COLORS] || '#9e9e9e';
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if result is uncertain based on confidence threshold
  const isUncertainResult = (result: AIAnalysisResult): boolean => {
    const topPrediction = result.top_prediction || result.predictions[0];
    return topPrediction.confidence <= CONFIDENCE_THRESHOLD;
  };

  const viewAnalysis = (result: AIAnalysisResult) => {
    // Navigate to AI analysis page with the result
    navigate('/ai-analysis', { state: { selectedResult: result } });
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        {/* Navigation Header */}
        <header className="header" style={{ position: 'sticky', top: 0, zIndex: 1000, backgroundColor: isDarkMode ? '#2d2d2d' : 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div className="header-left">
          <button
            className="hamburger-menu"
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

        <div className="header-center">
          <button
            className="language-switcher-button"
            onClick={toggleLanguage}
            type="button"
          >
            {t('login.languageSwitcher')}
          </button>
        </div>

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
              <button className="dropdown-item" onClick={handleProfile}>
                Profile
              </button>
              <button className="dropdown-item" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('dashboard.patient.viewHistory')}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadHistory}
          >
            {t('aiAnalysis.refreshHistory') || 'Refresh'}
          </Button>
        </Box>

        {history.length === 0 ? (
          <Alert severity="info">
            {t('aiAnalysis.noHistory') || 'No analysis history found. Start by uploading an image for analysis.'}
          </Alert>
        ) : (
          <Card elevation={2}>
            <CardContent>
              <List>
                {history.map((result, index) => {
                  const topPrediction = result.top_prediction || result.predictions[0];
                  const isUncertain = isUncertainResult(result);
                  const riskLevel = isUncertain ? 'UNCERTAIN' : (result.risk_assessment?.risk_level || 'UNCERTAIN');
                  
                  return (
                    <React.Fragment key={index}>
                      <ListItem
                        sx={{
                          py: 2,
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                        onClick={() => viewAnalysis(result)}
                      >
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {isUncertain 
                              ? (i18n.language === 'vi' ? 'Kết quả không chắc chắn' : 'Uncertain Result')
                              : topPrediction.label
                            }
                          </Typography>
                          <Chip
                            label={riskLevel}
                            size="small"
                            sx={{
                              bgcolor: getRiskColor(riskLevel),
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(result.analysis?.analysis_timestamp || result.timestamp || '')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {i18n.language === 'vi' ? 'Độ tin cậy' : 'Confidence'}: {topPrediction.percentage.toFixed(1)}%
                        </Typography>
                      </ListItem>
                      {index < history.length - 1 && <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}
                    </React.Fragment>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
    </ThemeProvider>
  );
};

export default AnalysisHistoryPage;
