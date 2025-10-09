import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Container, Alert } from '@mui/material';
import { AISkinAnalysisDashboard } from '../components/ai';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

/**
 * Demo page for AI Skin Analysis components
 * Shows how to integrate the AI analysis functionality
 * Supports URL parameter ?tab=history to start with history tab
 */
export const AISkinAnalysisPage: React.FC = () => {
  const { t } = useTranslation();
  // In a real app, this would come from auth context or route params
  const mockPatientId = 1;
  
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  
  // Determine initial tab based on URL parameter
  let initialTab = 0; // Default to "Upload & Analyze"
  if (tab === 'history') {
    initialTab = 2; // "My History" tab
  } else if (tab === 'results') {
    initialTab = 1; // "Analysis Results" tab
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h3" gutterBottom>
            🩺 {t('aiAnalysisPage.title')}
          </Typography>
          <LanguageSwitcher />
        </Box>
        
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 4 }}>
          {t('aiAnalysisPage.subtitle')}
        </Typography>

        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body2">
            <strong>🚀 {t('aiAnalysisPage.liveIntegration')}</strong> {t('aiAnalysisPage.integrationDesc')}
          </Typography>
        </Alert>

        {/* Main AI Analysis Dashboard */}
        <AISkinAnalysisDashboard patientId={mockPatientId} initialTab={initialTab} />

        {/* Integration Guide */}
        <Box sx={{ mt: 6, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            🛠️ {t('aiAnalysisPage.integrationGuide')}
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>✅ {t('aiAnalysisPage.liveApiIntegration')}</strong>
          </Typography>
          <Box component="pre" sx={{ fontSize: '0.875rem', overflow: 'auto', bgcolor: 'black', color: 'lime', p: 2, borderRadius: 1 }}>
{`🌐 HuggingFace Space: bnmbanhmi/seekwell-skin-cancer
📡 API Endpoint: /api/predict
🔗 Direct Integration: ✅ ACTIVE

Components:
├── ImageUpload: Connects to HF Space API
├── AnalysisResults: Parses HF predictions
├── AnalysisHistory: Stores results locally
└── AISkinAnalysisDashboard: Orchestrates workflow`}
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            {t('aiAnalysisPage.frontendConnection')}
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default AISkinAnalysisPage;
