import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import { AIAnalysisResult } from '../../types/AIAnalysisTypes';
import { ImageUpload } from './ImageUpload';
import { AnalysisResults } from './AnalysisResults';
import { AnalysisHistory } from './AnalysisHistory';
import HuggingFaceAIService from '../../services/HuggingFaceAIService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

interface AISkinAnalysisDashboardProps {
  patientId: number;
}

export const AISkinAnalysisDashboard: React.FC<AISkinAnalysisDashboardProps> = ({
  patientId,
}) => {
  const [currentResult, setCurrentResult] = useState<AIAnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AIAnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [serviceStatus, setServiceStatus] = useState<any>(null);

  // Load analysis history on component mount
  useEffect(() => {
    loadAnalysisHistory();
    checkServiceStatus();
  }, [patientId]);

  const loadAnalysisHistory = async () => {
    try {
      setLoading(true);
      const history = await HuggingFaceAIService.getAnalysisHistory();
      setAnalysisHistory(history);
    } catch (error: any) {
      console.error('Failed to load analysis history:', error);
      setError('Failed to load analysis history');
    } finally {
      setLoading(false);
    }
  };

  const checkServiceStatus = async () => {
    try {
      const aiService = new HuggingFaceAIService();
      const status = await aiService.healthCheck();
      setServiceStatus(status);
    } catch (error) {
      console.error('Service health check failed:', error);
    }
  };

  const handleAnalysisComplete = (result: AIAnalysisResult) => {
    setCurrentResult(result);
    setSuccess('Image analysis completed successfully!');
    setTabValue(1); // Switch to results tab
    
    // Add to history
    setAnalysisHistory(prev => [result, ...prev]);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleScheduleFollowUp = () => {
    // TODO: Implement follow-up scheduling
    setSuccess('Follow-up reminder set!');
  };

  const handleRequestReview = () => {
    // TODO: Implement professional review request
    setSuccess('Professional review requested!');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  const urgentCount = analysisHistory.filter(
    result => result.risk_assessment?.risk_level === 'URGENT'
  ).length;

  const pendingReviewCount = analysisHistory.filter(
    result => result.risk_assessment?.needs_professional_review
  ).length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        🩺 AI Skin Lesion Analysis
      </Typography>

      {/* Service Status Alert */}
      {serviceStatus && !serviceStatus.is_ready && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          AI Analysis Service is currently unavailable. Please try again later.
        </Alert>
      )}

      {/* Main Content */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Upload & Analyze" />
          <Tab 
            label={
              currentResult ? (
                <Badge color="success" variant="dot">
                  Analysis Results
                </Badge>
              ) : (
                'Analysis Results'
              )
            }
            disabled={!currentResult}
          />
          <Tab 
            label={
              <Badge badgeContent={urgentCount} color="error">
                History
              </Badge>
            }
          />
          <Tab 
            label={
              <Badge badgeContent={pendingReviewCount} color="warning">
                Reviews
              </Badge>
            }
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <ImageUpload
            patientId={patientId}
            onAnalysisComplete={handleAnalysisComplete}
            onError={handleError}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {currentResult ? (
            <AnalysisResults
              result={currentResult}
              onScheduleFollowUp={handleScheduleFollowUp}
              onRequestReview={handleRequestReview}
            />
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No analysis results yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload an image to get started with AI analysis
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <AnalysisHistory
            history={analysisHistory}
            loading={loading}
            onSelectAnalysis={(result: AIAnalysisResult) => {
              setCurrentResult(result);
              setTabValue(1);
            }}
            onRefresh={loadAnalysisHistory}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              Professional Reviews
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review queue for healthcare professionals - Coming soon
            </Typography>
          </Box>
        </TabPanel>
      </Paper>

      {/* Loading Overlay */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2, color: 'white' }}>
              Loading...
            </Typography>
          </Box>
        </Box>
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
