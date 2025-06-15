import React from 'react';
import { Box, Typography, Container, Alert } from '@mui/material';
import { AISkinAnalysisDashboard } from '../components/ai';

/**
 * Demo page for AI Skin Analysis components
 * Shows how to integrate the AI analysis functionality
 */
export const AISkinAnalysisPage: React.FC = () => {
  // In a real app, this would come from auth context or route params
  const mockPatientId = 1;

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
            <strong>Phase 3 Frontend Integration Complete!</strong> This demo showcases the AI analysis 
            components that integrate with your trained model from Phase 2. The components include:
            image upload with validation, real-time AI analysis, risk assessment display, and 
            comprehensive analysis history tracking.
          </Typography>
        </Alert>

        {/* Main AI Analysis Dashboard */}
        <AISkinAnalysisDashboard patientId={mockPatientId} />

        {/* Integration Guide */}
        <Box sx={{ mt: 6, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            🛠️ Integration Guide
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>To integrate these components in your app:</strong>
          </Typography>
          <Box component="pre" sx={{ fontSize: '0.875rem', overflow: 'auto' }}>
{`import { AISkinAnalysisDashboard } from './components/ai';

function PatientPage({ patientId }) {
  return (
    <AISkinAnalysisDashboard 
      patientId={patientId} 
    />
  );
}`}
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            The dashboard handles all AI functionality including image upload, analysis, 
            results display, and history tracking. It automatically connects to your 
            backend API endpoints from Phase 2.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default AISkinAnalysisPage;
