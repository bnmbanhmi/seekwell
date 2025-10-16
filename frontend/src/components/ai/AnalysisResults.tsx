import React from 'react';
import { useTranslation } from 'react-i18next';
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
  Paper,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Info,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { AIAnalysisResult, RISK_LEVEL_COLORS } from '../../types/AIAnalysisTypes';

interface AnalysisResultsProps {
  result: AIAnalysisResult;
}

// Disease key mapping for translations
const getDiseaseKey = (label: string): string => {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('melanoma')) return 'melanoma';
  if (lowerLabel.includes('basal')) return 'basal_cell_carcinoma';
  if (lowerLabel.includes('squamous')) return 'squamous_cell_carcinoma';
  if (lowerLabel.includes('actinic')) return 'actinic_keratosis';
  if (lowerLabel.includes('seborrheic')) return 'seborrheic_keratosis';
  if (lowerLabel.includes('nevus') || lowerLabel.includes('mole')) return 'nevus';
  if (lowerLabel.includes('dermatofibroma')) return 'dermatofibroma';
  if (lowerLabel.includes('vascular')) return 'vascular_lesion';
  return 'default';
};

// Translate disease name based on current language
const getTranslatedDiseaseName = (label: string, t: any): string => {
  const diseaseKey = getDiseaseKey(label);
  const translatedName = t(`aiAnalysis.diseaseNames.${diseaseKey}`, { defaultValue: label });
  return translatedName === label ? label : translatedName;
};

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
}) => {
  const { t, i18n } = useTranslation();
  
  if (!result.success) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        <Typography variant="h6">{t('aiAnalysis.errors.analysisFailed')}</Typography>
        <Typography>{result.error}</Typography>
      </Alert>
    );
  }

  const topPrediction = result.top_prediction || result.predictions[0];
  const riskLevel = result.risk_assessment.risk_level;
  const diseaseKey = getDiseaseKey(topPrediction.label);
  
  const getRiskColor = (risk: string) => {
    return RISK_LEVEL_COLORS[risk as keyof typeof RISK_LEVEL_COLORS] || '#9e9e9e';
  };

  const getNextStepsKey = (risk: string): string => {
    return risk.toLowerCase();
  };

  return (
    <Box sx={{ py: 4, maxWidth: 1200, mx: 'auto' }}>
      {/* 1. MAIN RESULT CARD - The Verdict */}
      <Card 
        elevation={4} 
        sx={{ 
          mb: 4,
          borderTop: `6px solid ${getRiskColor(riskLevel)}`,
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ fontWeight: 700, mb: 3 }}
          >
            {t('aiAnalysis.results.title')}
          </Typography>

          {/* Risk Level Tag */}
          <Box sx={{ mb: 3 }}>
            <Chip
              icon={<WarningIcon />}
              label={t(`aiAnalysis.results.riskLabels.${riskLevel}`)}
              sx={{
                bgcolor: getRiskColor(riskLevel),
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: 700,
                py: 3,
                px: 2,
                height: 'auto',
                '& .MuiChip-icon': {
                  color: 'white',
                  fontSize: 28,
                },
              }}
            />
          </Box>

          {/* Main AI Prediction */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {t('aiAnalysis.results.aiPredicts')}
            </Typography>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: 'text.primary',
                mb: 2,
              }}
            >
              {getTranslatedDiseaseName(topPrediction.label, t)}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Timestamp only - removed confidence percentage */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>{t('aiAnalysis.results.analysisTime')}</strong> {new Date(result.analysis?.analysis_timestamp || Date.now()).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 2. DISEASE INFORMATION SECTION - The Context */}
      <Card elevation={2} sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ fontWeight: 700, mb: 3 }}
          >
            {getTranslatedDiseaseName(topPrediction.label, t)} {t('aiAnalysis.results.diseaseInfo.title')}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {/* Image Placeholder */}
            <Box 
              sx={{ 
                flexShrink: 0,
                width: { xs: '100%', md: 300 },
                height: 200,
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: 'grey.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                [Disease Image]
              </Typography>
            </Box>

            {/* Disease Description */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                {t(`aiAnalysis.results.diseaseInfo.${diseaseKey}.description`)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 3. NEXT STEPS SECTION - The Action Plan */}
      <Card 
        elevation={3} 
        sx={{ 
          mb: 4, 
          borderRadius: 3,
          bgcolor: 'primary.50',
          border: '2px solid',
          borderColor: 'primary.main',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ 
              fontWeight: 700, 
              mb: 3,
              color: 'primary.main',
              textTransform: 'uppercase',
            }}
          >
            {t('aiAnalysis.results.nextSteps.title')}
          </Typography>

          <List sx={{ pl: 0 }}>
            {(t(`aiAnalysis.results.nextSteps.${getNextStepsKey(riskLevel)}`, { returnObjects: true }) as unknown as string[]).map((step, index) => (
              <ListItem 
                key={index}
                sx={{ 
                  alignItems: 'flex-start',
                  py: 2,
                  px: 0,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  <CheckCircle sx={{ color: '#36a41d', fontSize: 28 }} />
                </ListItemIcon>
                <ListItemText
                  primary={step}
                  primaryTypographyProps={{
                    variant: 'body1',
                    sx: { lineHeight: 1.7, fontWeight: 500 },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* 4. OTHER POSSIBILITIES & DISCLAIMER - The Caveat */}
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Other Possibilities */}
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ fontWeight: 600, mb: 2 }}
          >
            {t('aiAnalysis.results.otherPossibilities')}
          </Typography>

          <List dense sx={{ mb: 3 }}>
            {result.predictions.slice(1, 4).map((prediction, index) => (
              <ListItem key={prediction.class_id} sx={{ py: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  • {getTranslatedDiseaseName(prediction.label, t)} - {prediction.percentage.toFixed(1)}%
                </Typography>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 3 }} />

          {/* Disclaimer */}
          <Alert 
            severity="info" 
            icon={<Info />}
            sx={{ 
              bgcolor: 'info.50',
              '& .MuiAlert-icon': {
                fontSize: 28,
              },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              {t('aiAnalysis.results.disclaimer.title')}
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
              {t('aiAnalysis.results.disclaimer.text')}
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AnalysisResults;
