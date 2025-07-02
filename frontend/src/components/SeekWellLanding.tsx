import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import {
  CameraAlt,
  Smartphone,
  MedicalServices,
  LocalHospital,
  Psychology,
  Groups,
  Analytics,
  HealthAndSafety,
  Visibility,
  Speed,
  Security,
  Public,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SeekWellLanding: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const ecosystemComponents = [
    {
      icon: <Smartphone />,
      title: 'AI Triage Tool',
      subtitle: 'Mobile Web App',
      description: 'Simple, intuitive mobile app used by trained community health workers. Take a photo of a skin lesion and get instant AI risk classification.',
      features: ['Instant AI analysis', 'Risk classification', 'One-paragraph summaries', 'Gemini API integration'],
      color: '#e74c3c'
    },
    {
      icon: <Groups />,
      title: 'Community Health Workers',
      subtitle: 'The People',
      description: 'Leverages existing "Cadre" network in Southeast Asian countries. Empowers existing healthcare workers with AI tools.',
      features: ['First mile healthcare', 'Community visits', 'Early detection', 'Local guidance'],
      color: '#27ae60'
    },
    {
      icon: <Analytics />,
      title: 'Health Data Platform',
      subtitle: 'The Backend',
      description: 'Secure platform that stores images, patient data, and creates standardized digital referral process to provincial hospitals.',
      features: ['Standardized referrals', 'Anonymized datasets', 'Geographic distribution', 'Research enablement'],
      color: '#3498db'
    }
  ];

  const workflowSteps = [
    {
      step: '1',
      title: 'Patient Concern',
      description: 'Community member notices skin lesion',
      icon: <HealthAndSafety />,
      color: '#f39c12'
    },
    {
      step: '2',
      title: 'AI Screening',
      description: 'Health worker uses SeekWell app for instant analysis',
      icon: <Psychology />,
      color: '#e74c3c'
    },
    {
      step: '3',
      title: 'Risk Assessment',
      description: 'AI provides risk classification: Low, Medium, High, Urgent',
      icon: <Visibility />,
      color: '#9b59b6'
    },
    {
      step: '4',
      title: 'Cadre Review',
      description: 'Local health worker reviews and provides guidance',
      icon: <Groups />,
      color: '#27ae60'
    },
    {
      step: '5',
      title: 'Healthcare Access',
      description: 'Treatment plan or referral to provincial hospital',
      icon: <LocalHospital />,
      color: '#3498db'
    }
  ];

  const impactMetrics = [
    { number: '5,000', label: 'Workers Screened', icon: <Groups /> },
    { number: '200', label: 'High-Risk Cases Referred', icon: <MedicalServices /> },
    { number: '90%', label: 'Reduction in Time-to-Triage', icon: <Speed /> },
    { number: '69%', label: 'AI Model Accuracy', icon: <Psychology /> },
  ];

  const features = [
    { icon: <CameraAlt />, text: 'Mobile camera integration for field use' },
    { icon: <Psychology />, text: 'AI-powered skin cancer detection' },
    { icon: <Groups />, text: 'Community health worker workflow' },
    { icon: <Security />, text: 'Medical-grade data protection' },
    { icon: <Speed />, text: 'Real-time analysis and results' },
    { icon: <Public />, text: 'Designed for ASEAN communities' },
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            🩺 SeekWell
          </Typography>
          <Typography variant="h5" gutterBottom sx={{ opacity: 0.9 }}>
            AI-Powered Skin Cancer Detection for Community Health
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, maxWidth: '800px', mx: 'auto', opacity: 0.8 }}>
            Democratizing early skin cancer detection through AI technology and community health workers
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/dashboard/ai-analysis')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Start AI Analysis
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/auth/login')}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Healthcare Worker Login
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Impact Metrics */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
          Measuring What Matters
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {impactMetrics.map((metric, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card
                sx={{
                  textAlign: 'center',
                  p: 3,
                  height: '100%',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    width: 60,
                    height: 60,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {metric.icon}
                </Avatar>
                <Typography variant="h3" component="div" color="primary" fontWeight="bold">
                  {metric.number}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {metric.label}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* SeekWell Ecosystem */}
      <Box sx={{ bgcolor: '#f8fafc', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
            The SeekWell Ecosystem
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            A multi-layered system, not just an application
          </Typography>

          <Grid container spacing={4}>
            {ecosystemComponents.map((component, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    borderTop: `4px solid ${component.color}`,
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: component.color, mr: 2 }}>
                        {component.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {component.title}
                        </Typography>
                        <Chip
                          label={component.subtitle}
                          size="small"
                          sx={{ bgcolor: component.color, color: 'white' }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {component.description}
                    </Typography>
                    <List dense>
                      {component.features.map((feature, featureIndex) => (
                        <ListItem key={featureIndex} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Typography color={component.color}>•</Typography>
                          </ListItemIcon>
                          <ListItemText primary={feature} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Workflow */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
          Patient → Cadre → Doctor Workflow
        </Typography>
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          Seamless healthcare delivery from community to clinic
        </Typography>

        <Grid container spacing={3}>
          {workflowSteps.map((step, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={index}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  height: '100%',
                  borderTop: `3px solid ${step.color}`,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: step.color,
                    width: 50,
                    height: 50,
                    mx: 'auto',
                    mb: 2,
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                  }}
                >
                  {step.step}
                </Avatar>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features */}
      <Box sx={{ bgcolor: '#f8fafc', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
            Built for Real-World Impact
          </Typography>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {features.map((feature, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    {feature.icon}
                  </Avatar>
                  <Typography variant="body1">{feature.text}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Demo Account Section */}
      <Box sx={{ bgcolor: '#e8f5e8', py: 6 }}>
        <Container maxWidth="md">
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              border: '2px solid #27ae60',
              borderRadius: 2,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fff8 100%)',
            }}
          >
            <Typography variant="h5" component="h2" gutterBottom fontWeight="bold" color="primary">
              🚀 Try SeekWell Instantly
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              Don't want to create an account? Use our demo patient account to explore SeekWell's features immediately.
            </Typography>
            
            <Box
              sx={{
                bgcolor: '#f0f9f0',
                p: 3,
                borderRadius: 2,
                border: '1px solid #27ae60',
                mb: 3,
                maxWidth: 400,
                mx: 'auto',
              }}
            >
              <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                Demo Patient Account
              </Typography>
              <Box sx={{ textAlign: 'left', mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Email:</strong>
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: 'monospace',
                    bgcolor: 'rgba(255,255,255,0.8)',
                    p: 1,
                    borderRadius: 1,
                    border: '1px solid #ddd',
                  }}
                >
                  patient1@seekwell.health
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Password:</strong>
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: 'monospace',
                    bgcolor: 'rgba(255,255,255,0.8)',
                    p: 1,
                    borderRadius: 1,
                    border: '1px solid #ddd',
                  }}
                >
                  PatientDemo2025
                </Typography>
              </Box>
            </Box>
            
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/auth/login')}
              sx={{
                bgcolor: '#27ae60',
                '&:hover': { bgcolor: '#219a52' },
                px: 4,
              }}
            >
              Go to Login Page
            </Button>
          </Paper>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #27ae60 0%, #219a52 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
            Ready to Transform Community Healthcare?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join the SeekWell ecosystem and bring AI-powered early detection to underserved communities
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/auth/register')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Get Started Today
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => window.open('https://bnmbanhmi-seekwell-skin-cancer.hf.space', '_blank')}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Try AI Demo
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default SeekWellLanding;
