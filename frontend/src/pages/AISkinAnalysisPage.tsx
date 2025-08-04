import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, Container, Alert } from '@mui/material';
import { AISkinAnalysisDashboard } from '../components/ai';

/**
 * Demo page for AI Skin Analysis components
 * Shows how to integrate the AI analysis functionality
 * Supports URL parameter ?tab=history to start with history tab
 */
export const AISkinAnalysisPage: React.FC = () => {
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
        <Typography variant="h3" gutterBottom align="center">
          🩺 SeekWell AI Skin Analysis
        </Typography>
        
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Advanced AI-powered skin lesion detection and risk assessment
        </Typography>

        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body2">
            <strong>🚀 Live HuggingFace Integration!</strong> This demo now connects directly to your 
            HuggingFace Space: <strong>bnmbanhmi/seekwell-skin-cancer</strong>. Upload a skin lesion 
            image to get real-time AI analysis from your trained model. The integration includes:
            image upload, live AI prediction, risk assessment, and result history tracking.
          </Typography>
        </Alert>

        {/* Main AI Analysis Dashboard */}
        <AISkinAnalysisDashboard patientId={mockPatientId} initialTab={initialTab} />

        {/* Integration Guide */}
        <Box sx={{ mt: 6, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            🛠️ HuggingFace Space Integration
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>✅ Live API Integration:</strong>
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
            The frontend now connects directly to your deployed HuggingFace Space, 
            providing real-time skin lesion analysis using your trained model!
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default AISkinAnalysisPage;
