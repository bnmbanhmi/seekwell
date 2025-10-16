import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Alert,
  Snackbar,
} from '@mui/material';
import { AIAnalysisResult } from '../../types/AIAnalysisTypes';
import { ImageUpload } from './ImageUpload';
import { AnalysisResults } from './AnalysisResults';
import HuggingFaceAIService from '../../services/HuggingFaceAIService';

interface AISkinAnalysisDashboardProps {
  patientId: number;
  initialTab?: number;
}

export const AISkinAnalysisDashboard: React.FC<AISkinAnalysisDashboardProps> = ({
  patientId,
  initialTab = 0,
}) => {
  const [currentResult, setCurrentResult] = useState<AIAnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AIAnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Load analysis history on component mount
  useEffect(() => {
    loadAnalysisHistory();
  }, [patientId]);

  const loadAnalysisHistory = () => {
    try {
      setLoading(true);
      const history = HuggingFaceAIService.getAnalysisHistory();
      console.log('Loaded analysis history:', history);
      setAnalysisHistory(history);
      setError(null);
    } catch (error: any) {
      console.error('Failed to load analysis history:', error);
      setError('Failed to load analysis history');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysisComplete = (result: AIAnalysisResult) => {
    setCurrentResult(result);
    setSuccess('Image analysis completed successfully!');
    setShowResults(true);
    
    // Add to history
    setAnalysisHistory(prev => [result, ...prev]);
    
    // Show alert for urgent cases
    if (result.risk_assessment?.risk_level === 'URGENT') {
      setSuccess('URGENT: Please wait for a local health cadre to contact you about next steps.');
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Main Content */}
      {!showResults ? (
        <ImageUpload
          patientId={patientId}
          onAnalysisComplete={handleAnalysisComplete}
          onError={handleError}
        />
      ) : (
        <AnalysisResults result={currentResult!} />
      )}

      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={handleCloseSnackbar}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={handleCloseSnackbar}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AISkinAnalysisDashboard;
