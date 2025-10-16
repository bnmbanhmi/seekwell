import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { AISkinAnalysisDashboard } from '../components/ai';

/**
 * Simplified AI Skin Analysis page - single purpose upload interface
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
        {/* Main AI Analysis Dashboard */}
        <AISkinAnalysisDashboard patientId={mockPatientId} initialTab={initialTab} />
      </Box>
    </Container>
  );
};

export default AISkinAnalysisPage;
