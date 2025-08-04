import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Paper,
  Grid,
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  Info,
  TrendingUp,
} from '@mui/icons-material';
import { AIAnalysisResult, RISK_LEVEL_COLORS } from '../../types/AIAnalysisTypes';

interface AnalysisResultsProps {
  result: AIAnalysisResult;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
}) => {
  if (!result.success) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        <Typography variant="h6">Analysis Failed</Typography>
        <Typography>{result.error}</Typography>
      </Alert>
    );
  }

  const topPrediction = result.top_prediction || result.predictions[0];
  const riskLevel = result.risk_assessment.risk_level;

  const getRiskColor = (risk: string) => {
    return RISK_LEVEL_COLORS[risk as keyof typeof RISK_LEVEL_COLORS] || '#9e9e9e';
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'URGENT':
        return <Warning sx={{ color: getRiskColor(risk) }} />;
      case 'HIGH':
        return <Warning sx={{ color: getRiskColor(risk) }} />;
      case 'MEDIUM':
        return <Info sx={{ color: getRiskColor(risk) }} />;
      case 'LOW':
        return <CheckCircle sx={{ color: getRiskColor(risk) }} />;
      default:
        return <Info sx={{ color: getRiskColor(risk) }} />;
    }
  };

  const getUrgencyMessage = (risk: string) => {
    switch (risk) {
      case 'URGENT':
        return 'Immediate attention required - A local health cadre will contact you';
      case 'HIGH':
        return 'High risk detected - Please monitor closely';
      case 'MEDIUM':
        return 'Medium risk - Continue monitoring';
      case 'LOW':
        return 'Low risk - Routine monitoring recommended';
      default:
        return 'Professional review recommended';
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TrendingUp color="primary" />
        AI Analysis Results
      </Typography>

      <Grid container spacing={3}>
        {/* Main Results */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Risk Assessment Card */}
          <Card elevation={3} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {getRiskIcon(riskLevel)}
                <Box>
                  <Typography variant="h6" sx={{ color: getRiskColor(riskLevel) }}>
                    Risk Level: {riskLevel}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getUrgencyMessage(riskLevel)}
                  </Typography>
                </Box>
              </Box>

              {/* Prediction Details */}
              <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  AI Prediction
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body1">
                    <strong>{topPrediction.label}</strong>
                  </Typography>
                  <Chip 
                    label={`${topPrediction.percentage.toFixed(1)}%`} 
                    color={topPrediction.percentage > 70 ? 'success' : topPrediction.percentage > 50 ? 'warning' : 'error'}
                    variant="filled"
                  />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={topPrediction.percentage} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Paper>

              {/* All Predictions */}
              <Typography variant="subtitle2" gutterBottom>
                Detailed Analysis:
              </Typography>
              <List dense>
                {result.predictions.slice(0, 3).map((prediction, index) => (
                  <ListItem key={prediction.class_id}>
                    <ListItemText
                      primary={prediction.label}
                      secondary={`${prediction.percentage.toFixed(1)}% confidence`}
                    />
                    <Box sx={{ width: 100, ml: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={prediction.percentage} 
                        color={index === 0 ? 'primary' : 'inherit'}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recommendations
              </Typography>
              
              <List>
                {result.recommendations.map((recommendation, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={recommendation} />
                  </ListItem>
                ))}
              </List>

              {/* Next Steps Information */}
              {riskLevel === 'URGENT' && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    URGENT: A local health cadre will contact you about next steps and may arrange a doctor consultation if needed.
                  </Typography>
                </Alert>
              )}

              {riskLevel === 'HIGH' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    HIGH RISK: Please monitor this area closely and contact a healthcare provider if any changes occur.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Info Panel */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analysis Details
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2">
                    <strong>Analysis Date:</strong> {new Date(result.analysis?.analysis_timestamp || Date.now()).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Body Region:</strong> {result.analysis?.body_region || 'Not specified'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Confidence:</strong> {result.risk_assessment.confidence_level || 'N/A'}
                  </Typography>
                </Box>

                {/* Disclaimer */}
                <Alert severity="info">
                  <Typography variant="caption">
                    This AI analysis is for informational purposes only. 
                    Always consult with healthcare professionals for medical decisions.
                  </Typography>
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalysisResults;
