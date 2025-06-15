import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Chip,
  Grid,
} from '@mui/material';
import {
  CameraAlt,
  CloudUpload,
  CheckCircle,
  Warning,
  Info,
  MedicalServices,
} from '@mui/icons-material';
import { AISkinAnalysisDashboard } from '../ai/AISkinAnalysisDashboard';

interface SkinLesionWorkflowProps {
  patientId: number;
}

const steps = [
  'Skin Assessment Guidance',
  'Capture or Upload Image',
  'Select Body Region',
  'AI Analysis',
  'Review Results'
];

const bodyRegions = [
  { value: 'face', label: 'Face', riskLevel: 'high' },
  { value: 'neck', label: 'Neck', riskLevel: 'high' },
  { value: 'scalp', label: 'Scalp', riskLevel: 'high' },
  { value: 'chest', label: 'Chest', riskLevel: 'medium' },
  { value: 'back', label: 'Back', riskLevel: 'medium' },
  { value: 'arms', label: 'Arms', riskLevel: 'medium' },
  { value: 'hands', label: 'Hands', riskLevel: 'high' },
  { value: 'legs', label: 'Legs', riskLevel: 'medium' },
  { value: 'feet', label: 'Feet', riskLevel: 'medium' },
];

const safetyGuidelines = [
  {
    icon: '📸',
    title: 'Good Lighting',
    description: 'Use natural light or bright indoor lighting for clear images'
  },
  {
    icon: '📏',
    title: 'Close-up Focus',
    description: 'Get close enough to see the lesion details clearly'
  },
  {
    icon: '🎯',
    title: 'Steady Shot',
    description: 'Hold the camera steady to avoid blurry images'
  },
  {
    icon: '⚠️',
    title: 'Multiple Angles',
    description: 'Take photos from different angles if the lesion is large'
  }
];

export const SkinLesionWorkflow: React.FC<SkinLesionWorkflowProps> = ({ patientId }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bodyRegion, setBodyRegion] = useState('');
  const [notes, setNotes] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setBodyRegion('');
    setNotes('');
    setImagePreview(null);
    setAnalysisComplete(false);
    stopCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setCameraStream(stream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please use file upload instead.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'skin-lesion-capture.jpg', { type: 'image/jpeg' });
            setSelectedFile(file);
            setImagePreview(canvas.toDataURL());
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const analyzeImage = async () => {
    if (!selectedFile || !bodyRegion) return;
    
    setIsAnalyzing(true);
    
    // Simulate analysis time
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
      handleNext();
    }, 3000);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                🏥 SeekWell AI Skin Analysis
              </Typography>
              <Typography>
                This AI tool helps screen for skin lesions. A local health cadre will review 
                the results and provide guidance. For urgent cases, you'll be connected with a doctor.
              </Typography>
            </Alert>
            
            <Typography variant="h6" gutterBottom color="primary">
              Photography Guidelines
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {safetyGuidelines.map((guideline, index) => (
                <Grid size={{ xs: 12, sm: 6 }} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                        {guideline.icon}
                      </Typography>
                      <Typography variant="subtitle2" gutterBottom>
                        {guideline.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {guideline.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography>
                <strong>Important:</strong> This tool is for screening purposes only. 
                Always consult with healthcare professionals for medical decisions.
              </Typography>
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Capture or Upload Skin Lesion Image
            </Typography>
            
            {!selectedFile && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<CameraAlt />}
                  onClick={startCamera}
                  size="large"
                  sx={{ py: 2 }}
                >
                  Use Camera
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={triggerFileInput}
                  size="large"
                  sx={{ py: 2 }}
                >
                  Upload from Gallery
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </Box>
            )}

            {showCamera && (
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}
                />
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button variant="contained" onClick={capturePhoto}>
                    Capture Photo
                  </Button>
                  <Button variant="outlined" onClick={stopCamera}>
                    Cancel
                  </Button>
                </Box>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </Box>
            )}

            {imagePreview && (
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <img
                  src={imagePreview}
                  alt="Captured lesion"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}
                />
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedFile(null);
                      setImagePreview(null);
                    }}
                  >
                    Retake Photo
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Body Region
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Body Region</InputLabel>
              <Select
                value={bodyRegion}
                label="Body Region"
                onChange={(e) => setBodyRegion(e.target.value)}
              >
                {bodyRegions.map((region) => (
                  <MenuItem key={region.value} value={region.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {region.label}
                      <Chip
                        label={region.riskLevel}
                        size="small"
                        color={region.riskLevel === 'high' ? 'error' : 'warning'}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Additional Notes (Optional)"
              placeholder="Describe any symptoms, changes, or concerns..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ mb: 2 }}
            />

            {bodyRegion && bodyRegions.find(r => r.value === bodyRegion)?.riskLevel === 'high' && (
              <Alert severity="warning">
                <Typography>
                  High-risk area detected. Results will be prioritized for cadre review.
                </Typography>
              </Alert>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ textAlign: 'center' }}>
            {isAnalyzing ? (
              <Box>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  🤖 AI Analyzing Image...
                </Typography>
                <Typography color="text.secondary">
                  Please wait while our AI model analyzes the skin lesion
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Ready for AI Analysis
                </Typography>
                <Typography sx={{ mb: 3 }}>
                  Image: ✅ Captured<br/>
                  Body Region: ✅ {bodyRegions.find(r => r.value === bodyRegion)?.label}<br/>
                  {notes && `Notes: ✅ Added`}
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={analyzeImage}
                  startIcon={<MedicalServices />}
                  disabled={!selectedFile || !bodyRegion}
                >
                  Start AI Analysis
                </Button>
              </Box>
            )}
          </Box>
        );

      case 4:
        return (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                ✅ Analysis Complete!
              </Typography>
              <Typography>
                Your skin lesion has been analyzed. A local health cadre will review 
                the results and provide personalized guidance.
              </Typography>
            </Alert>
            
            {analysisComplete && (
              <AISkinAnalysisDashboard patientId={patientId} />
            )}
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        🩺 SeekWell AI Skin Analysis
      </Typography>
      
      <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        AI-powered skin lesion screening with community health support
      </Typography>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>
                <Typography variant="h6">{label}</Typography>
              </StepLabel>
              <StepContent>
                {getStepContent(index)}
                
                <Box sx={{ mb: 2, mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mr: 1 }}
                    disabled={
                      (index === 1 && !selectedFile) ||
                      (index === 2 && !bodyRegion) ||
                      (index === 3 && !analysisComplete)
                    }
                  >
                    {index === steps.length - 1 ? 'Finish' : 'Continue'}
                  </Button>
                  
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                  >
                    Back
                  </Button>
                  
                  {index === steps.length - 1 && (
                    <Button onClick={handleReset}>
                      New Analysis
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>
    </Container>
  );
};

export default SkinLesionWorkflow;
