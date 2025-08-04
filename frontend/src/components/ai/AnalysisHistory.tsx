import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
  Button,
  Alert,
  Divider,
} from '@mui/material';
import {
  Visibility,
  Refresh,
  Info,
} from '@mui/icons-material';
import { AIAnalysisResult, RISK_LEVEL_COLORS } from '../../types/AIAnalysisTypes';

interface AnalysisHistoryProps {
  history: AIAnalysisResult[];
  loading: boolean;
  onSelectAnalysis: (result: AIAnalysisResult) => void;
  onRefresh: () => void;
}

export const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({
  history,
  loading,
  onSelectAnalysis,
  onRefresh,
}) => {
  const getRiskColor = (risk: string) => {
    return RISK_LEVEL_COLORS[risk as keyof typeof RISK_LEVEL_COLORS] || '#9e9e9e';
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (history.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Info sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Analysis History
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Your skin analyses will appear here once you start uploading images.
        </Typography>
        <Button onClick={onRefresh} variant="outlined" sx={{ mt: 2 }}>
          Refresh
        </Button>
      </Box>
    );
  }

  // Show urgent cases alert
  const urgentAnalyses = history.filter(h => h.risk_assessment?.risk_level === 'URGENT');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">My Analysis History</Typography>
        <Button onClick={onRefresh} startIcon={<Refresh />} variant="outlined" size="small">
          Refresh
        </Button>
      </Box>

      {/* Urgent Cases Alert */}
      {urgentAnalyses.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>{urgentAnalyses.length}</strong> urgent case(s) detected. A local health cadre will contact you about next steps.
          </Typography>
        </Alert>
      )}

      {/* Analysis List */}
      <Card>
        <CardContent>
          <List>
            {history.map((analysis, index) => {
              const topPrediction = analysis.top_prediction || analysis.predictions?.[0];
              const riskLevel = analysis.risk_assessment?.risk_level || 'UNCERTAIN';
              const timestamp = analysis.analysis?.analysis_timestamp || analysis.timestamp;

              return (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {topPrediction?.label || 'Unknown'}
                          </Typography>
                          <Chip
                            label={riskLevel}
                            size="small"
                            sx={{
                              bgcolor: getRiskColor(riskLevel),
                              color: 'white',
                              fontWeight: 'bold',
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Confidence: {topPrediction?.percentage?.toFixed(1) || topPrediction?.confidence?.toFixed(1) || 0}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {timestamp ? formatDate(timestamp) : 'Unknown date'}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        onClick={() => onSelectAnalysis(analysis)}
                        color="primary"
                        title="View detailed results"
                      >
                        <Visibility />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < history.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip
          label={`Total Analyses: ${history.length}`}
          variant="outlined"
          color="primary"
        />
        <Chip
          label={`Urgent: ${urgentAnalyses.length}`}
          variant={urgentAnalyses.length > 0 ? 'filled' : 'outlined'}
          color="error"
        />
      </Box>
    </Box>
  );
};

export default AnalysisHistory;
