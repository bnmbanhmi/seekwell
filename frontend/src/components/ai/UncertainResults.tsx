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
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Info,
  HelpOutline,
} from '@mui/icons-material';
import { AIAnalysisResult } from '../../types/AIAnalysisTypes';

interface UncertainResultsProps {
  result: AIAnalysisResult;
  onRetakePhoto: () => void;
}

export const UncertainResults: React.FC<UncertainResultsProps> = ({
  result,
  onRetakePhoto,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <Box sx={{ py: 4, maxWidth: 1200, mx: 'auto' }}>
      {/* 1. MAIN RESULT CARD - Uncertain Verdict */}
      <Card 
        elevation={4} 
        sx={{ 
          mb: 4,
          borderTop: '6px solid #64b5f6', // Light blue for uncertainty
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ fontWeight: 700, mb: 3 }}
          >
            {t('aiAnalysis.uncertainResults.title')}
          </Typography>

          {/* Uncertain Status Tag */}
          <Box sx={{ mb: 3 }}>
            <Chip
              icon={<HelpOutline />}
              label={t('aiAnalysis.uncertainResults.statusLabel')}
              sx={{
                bgcolor: '#64b5f6', // Light blue
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

          {/* Main Finding */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <HelpOutline sx={{ fontSize: 48, color: '#64b5f6' }} />
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                }}
              >
                {t('aiAnalysis.uncertainResults.mainFinding')}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Timestamp */}
          <Box>
            <Typography variant="body2" color="text.secondary">
              <strong>{t('aiAnalysis.uncertainResults.analysisTime')}</strong> {new Date(result.analysis?.analysis_timestamp || Date.now()).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 2. EXPLANATION SECTION - The Context */}
      <Card elevation={2} sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ fontWeight: 700, mb: 3 }}
          >
            {t('aiAnalysis.uncertainResults.explanation.title')}
          </Typography>

          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            {t('aiAnalysis.uncertainResults.explanation.text')}
          </Typography>
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
            }}
          >
            {t('aiAnalysis.uncertainResults.nextSteps.title')}
          </Typography>

          <List sx={{ pl: 0 }}>
            {(t('aiAnalysis.uncertainResults.nextSteps.steps', { returnObjects: true }) as unknown as string[]).map((step, index) => (
              <ListItem 
                key={index}
                sx={{ 
                  alignItems: 'flex-start',
                  py: 2,
                  px: 0,
                  cursor: index === 0 ? 'pointer' : 'default',
                }}
                onClick={index === 0 ? onRetakePhoto : undefined}
              >
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  <CheckCircle sx={{ color: '#36a41d', fontSize: 28 }} />
                </ListItemIcon>
                <ListItemText
                  primary={step}
                  primaryTypographyProps={{
                    variant: 'body1',
                    sx: { 
                      lineHeight: 1.7, 
                      fontWeight: 500,
                      textDecoration: index === 0 ? 'underline' : 'none',
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* 4. DISCLAIMER */}
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
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
              {t('aiAnalysis.uncertainResults.disclaimer.title')}
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
              {t('aiAnalysis.uncertainResults.disclaimer.text')}
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UncertainResults;
