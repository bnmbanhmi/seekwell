import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';
import HuggingFaceAIService from '../../services/HuggingFaceAIService';
import { AIAnalysisResult } from '../../types/AIAnalysisTypes';

export const DebugAnalysisHistory: React.FC = () => {
  const [history, setHistory] = useState<AIAnalysisResult[]>([]);
  const [rawData, setRawData] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadHistory();
    }
  }, [currentUser]);

  const loadCurrentUser = () => {
    try {
      // Get user info from localStorage
      const userId = localStorage.getItem('user_id');
      const role = localStorage.getItem('role');
      const userStr = localStorage.getItem('user');
      
      let user = null;
      if (userStr) {
        user = JSON.parse(userStr);
      } else if (userId) {
        // Create user object from available data
        user = {
          id: parseInt(userId, 10),
          role: role || 'Unknown'
        };
      }
      
      setCurrentUser(user);
      console.log('Current user loaded:', user);
    } catch (err) {
      console.error('Error loading current user:', err);
    }
  };

  const loadHistory = () => {
    try {
      // Get current user's analysis history
      const parsedHistory = HuggingFaceAIService.getAnalysisHistory();
      console.log('Parsed history for current user:', parsedHistory);
      setHistory(parsedHistory);
      
      // Get raw localStorage data for current user
      const userId = currentUser?.id;
      const raw = userId ? localStorage.getItem(`seekwell_analysis_history_${userId}`) : 'No user logged in';
      setRawData(raw || 'No data found for current user');
      
      setError('');
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading history:', err);
    }
  };

  const clearHistory = () => {
    HuggingFaceAIService.clearAnalysisHistory();
    setHistory([]);
    setRawData('No data found for current user');
  };

  const addTestData = () => {
    const testResult: AIAnalysisResult = {
      success: true,
      predictions: [
        {
          class_id: 0,
          label: 'Melanoma',
          confidence: 0.85,
          percentage: 85
        }
      ],
      top_prediction: {
        class_id: 0,
        label: 'Melanoma', 
        confidence: 0.85,
        percentage: 85
      },
      analysis: {
        predicted_class: 'Melanoma',
        confidence: 0.85,
        body_region: 'arm',
        analysis_timestamp: new Date().toISOString()
      },
      risk_assessment: {
        risk_level: 'URGENT',
        confidence_level: 'HIGH',
        needs_professional_review: true,
        needs_urgent_attention: true,
        base_risk: 'URGENT',
        confidence_score: 0.85,
        predicted_class: 'Melanoma'
      },
      recommendations: ['Seek immediate medical attention'],
      workflow: {
        needs_cadre_review: true,
        needs_doctor_review: true,
        priority_level: 'URGENT',
        estimated_follow_up_days: 1
      },
      timestamp: new Date().toISOString()
    };

    HuggingFaceAIService.saveAnalysisToHistory(testResult);
    loadHistory();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Debug Analysis History - User Specific
      </Typography>

      {/* Current User Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current User
          </Typography>
          {currentUser ? (
            <Box>
              <Typography variant="body2">
                <strong>ID:</strong> {currentUser.id}
              </Typography>
              <Typography variant="body2">
                <strong>Role:</strong> {currentUser.role}
              </Typography>
              {currentUser.email && (
                <Typography variant="body2">
                  <strong>Email:</strong> {currentUser.email}
                </Typography>
              )}
            </Box>
          ) : (
            <Typography color="text.secondary">No user logged in</Typography>
          )}
        </CardContent>
      </Card>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={loadHistory}>
          Reload History
        </Button>
        <Button variant="outlined" onClick={addTestData}>
          Add Test Data
        </Button>
        <Button variant="outlined" color="error" onClick={clearHistory}>
          Clear History
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User-Specific Analysis History ({history.length} items)
          </Typography>
          {!currentUser ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No user logged in - cannot display user-specific history
            </Alert>
          ) : history.length === 0 ? (
            <Typography color="text.secondary">No analysis history found for user {currentUser.id}</Typography>
          ) : (
            history.map((item, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography variant="subtitle2">
                  Analysis #{index + 1}
                </Typography>
                <Typography variant="body2">
                  Label: {item.top_prediction?.label || item.predictions?.[0]?.label || 'Unknown'}
                </Typography>
                <Typography variant="body2">
                  Risk: {item.risk_assessment?.risk_level || 'Unknown'}
                </Typography>
                <Typography variant="body2">
                  Timestamp: {item.timestamp || item.analysis?.analysis_timestamp || 'Unknown'}
                </Typography>
              </Box>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Raw localStorage Data for User {currentUser?.id || 'Unknown'}
          </Typography>
          <Box
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              bgcolor: 'grey.100',
              p: 2,
              borderRadius: 1,
              fontSize: '0.8rem',
              maxHeight: 400,
              overflow: 'auto'
            }}
          >
            {rawData}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DebugAnalysisHistory;
