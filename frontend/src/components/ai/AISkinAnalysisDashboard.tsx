import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
} from '@mui/material';
import { Warning, LocalHospital } from '@mui/icons-material';
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
  const navigate = useNavigate();
  const [currentResult, setCurrentResult] = useState<AIAnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AIAnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  
  // Confirmation dialog state
  const [urgentDialogOpen, setUrgentDialogOpen] = useState(false);
  const [pendingUrgentResult, setPendingUrgentResult] = useState<AIAnalysisResult | null>(null);

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
    
    // Show confirmation dialog for urgent/high risk cases instead of auto-redirect
    if (result.risk_assessment?.risk_level === 'URGENT' || 
        result.risk_assessment?.risk_level === 'HIGH') {
      setTimeout(() => {
        setPendingUrgentResult(result);
        setUrgentDialogOpen(true);
      }, 2000); // Give user time to see the results first
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleScheduleFollowUp = (result: AIAnalysisResult) => {
    if (result && 
        (result.risk_assessment?.risk_level === 'URGENT' || 
         result.risk_assessment?.risk_level === 'HIGH')) {
      // Use high-risk consultation for urgent/high cases
      handleScheduleHighRiskConsultation(result);
    } else {
      // TODO: Implement regular follow-up scheduling for low/medium risk
      setSuccess('Follow-up reminder set!');
    }
  };

  const handleScheduleHighRiskConsultation = (result: AIAnalysisResult) => {
    // Navigate to high-risk consultation page with AI analysis data
    navigate('/dashboard/appointments/high-risk', {
      state: {
        aiAnalysisResult: result,
        patientId: patientId,
        autoFill: true
      }
    });
  };

  const handleRequestReview = (result: AIAnalysisResult) => {
    // TODO: Implement professional review request
    setSuccess('Professional review requested!');
  };

  // Confirmation dialog handlers
  const handleUrgentDialogConfirm = () => {
    if (pendingUrgentResult) {
      handleScheduleHighRiskConsultation(pendingUrgentResult);
    }
    setUrgentDialogOpen(false);
    setPendingUrgentResult(null);
  };

  const handleUrgentDialogCancel = () => {
    setUrgentDialogOpen(false);
    setPendingUrgentResult(null);
    setSuccess('You can schedule an urgent consultation later from the Results tab.');
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

      {/* Urgent Consultation Confirmation Dialog */}
      <Dialog
        open={urgentDialogOpen}
        onClose={() => setUrgentDialogOpen(false)}
        aria-labelledby="urgent-consultation-dialog-title"
        aria-describedby="urgent-consultation-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="urgent-consultation-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Urgent Medical Consultation Recommended
        </DialogTitle>
        <DialogContent>
          <Alert severity={pendingUrgentResult?.risk_assessment?.risk_level === 'URGENT' ? 'error' : 'warning'} sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Risk Level: {pendingUrgentResult?.risk_assessment?.risk_level}</strong>
            </Typography>
            <Typography variant="body2">
              Predicted Condition: {pendingUrgentResult?.top_prediction?.label || 'Unknown'}
            </Typography>
            <Typography variant="body2">
              Confidence: {((pendingUrgentResult?.top_prediction?.confidence || 0) * 100).toFixed(1)}%
            </Typography>
          </Alert>
          
          <DialogContentText id="urgent-consultation-dialog-description">
            Based on the AI analysis, this skin lesion requires {pendingUrgentResult?.risk_assessment?.risk_level === 'URGENT' ? 'immediate' : 'priority'} medical attention.
            
            <br /><br />
            
            Would you like to schedule an urgent consultation with a specialist? This will help you:
            
            <br />
            • Get expert medical evaluation
            <br />
            • Receive proper diagnosis and treatment
            <br />
            • Access priority appointment scheduling
            <br /><br />
            
            You can also schedule this consultation later from your dashboard.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleUrgentDialogCancel} 
            color="inherit" 
            variant="outlined"
          >
            Schedule Later
          </Button>
          <Button 
            onClick={handleUrgentDialogConfirm} 
            color={pendingUrgentResult?.risk_assessment?.risk_level === 'URGENT' ? 'error' : 'warning'}
            variant="contained"
            startIcon={<LocalHospital />}
            autoFocus
          >
            Schedule Now
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AISkinAnalysisDashboard;
