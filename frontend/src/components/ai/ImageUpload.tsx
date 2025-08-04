import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  LinearProgress,
  Alert,
  Grid,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload,
  PhotoCamera,
  Cancel,
  Refresh,
  Info,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { BodyRegion, BODY_REGIONS, UploadProgress } from '../../types/AIAnalysisTypes';
import HuggingFaceAIService from '../../services/HuggingFaceAIService';

// Styled components
const UploadBox = styled(Box)(({ theme, isDragActive }: { theme?: any; isDragActive: boolean }) => ({
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.grey[300]}`,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backgroundColor: isDragActive ? theme.palette.action.hover : 'transparent',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

const PreviewImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '300px',
  borderRadius: '8px',
  objectFit: 'contain',
});

const HiddenInput = styled('input')({
  display: 'none',
});

interface ImageUploadProps {
  patientId: number;
  onAnalysisComplete: (result: any) => void;
  onError: (error: string) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  patientId,
  onAnalysisComplete,
  onError,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bodyRegion, setBodyRegion] = useState<BodyRegion>('other');
  const [notes, setNotes] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle',
  });
  const [isDragActive, setIsDragActive] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError('Image size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Validate image quality
    validateImage(file);
  }, [onError]);

  // Validate image
  const validateImage = async (file: File) => {
    try {
      setValidationMessage('Validating image...');
      // Basic client-side validation
      const img = new Image();
      img.onload = () => {
        if (img.width >= 224 && img.height >= 224) {
          setValidationMessage('✅ Image is suitable for analysis');
        } else {
          setValidationMessage('⚠️ Image resolution is low, consider using higher quality');
        }
      };
      img.src = URL.createObjectURL(file);
    } catch (error) {
      setValidationMessage('Unable to validate image');
    }
  };

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Clear selected file
  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setValidationMessage(null);
    setUploadProgress({ progress: 0, status: 'idle' });
    
    // Clear file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Submit for analysis
  const handleAnalyze = async () => {
    if (!selectedFile) {
      onError('Please select an image first');
      return;
    }

    try {
      setUploadProgress({ progress: 0, status: 'uploading', message: 'Connecting to AI...' });

      // Create HuggingFace AI service instance
      const aiService = new HuggingFaceAIService();
      
      setUploadProgress({ progress: 30, status: 'analyzing', message: 'Analyzing with AI...' });

      // Use HuggingFace Space API for analysis
      const result = await aiService.analyzeImageAI(
        selectedFile,
        { body_region: bodyRegion, notes }
      );

      // Save to local history
      HuggingFaceAIService.saveAnalysisToHistory(result);

      setUploadProgress({ progress: 100, status: 'complete', message: 'Analysis complete!' });
      onAnalysisComplete(result);
      
      // Keep the image for reference but clear the form
      setNotes('');
      setBodyRegion('other');

    } catch (error: any) {
      setUploadProgress({ progress: 0, status: 'error', message: error.message });
      onError(error.message || 'Analysis failed');
    }
  };

  const isAnalyzing = uploadProgress.status === 'uploading' || uploadProgress.status === 'analyzing';
  const canAnalyze = selectedFile && !isAnalyzing && uploadProgress.status !== 'complete';

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhotoCamera color="primary" />
          Skin Lesion Image Upload
        </Typography>

        <Grid container spacing={3}>
          {/* Image Upload Area */}
          <Grid size={{ xs: 12, md: 6 }}>
            {!selectedFile ? (
              <UploadBox
                isDragActive={isDragActive}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <CloudUpload sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive ? 'Drop image here' : 'Upload Skin Lesion Image'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Drag and drop an image here, or click to select
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
                  <Button variant="outlined" size="small">
                    Choose File
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                  >
                    Take Photo
                  </Button>
                </Box>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Supported: JPEG, PNG (max 10MB)
                </Typography>
              </UploadBox>
            ) : (
              <Paper elevation={1} sx={{ p: 2, position: 'relative' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Selected Image
                  </Typography>
                  <IconButton onClick={clearSelection} size="small">
                    <Cancel />
                  </IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <PreviewImage src={previewUrl || ''} alt="Selected skin lesion" />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>

                {validationMessage && (
                  <Alert 
                    severity={validationMessage.includes('✅') ? 'success' : 'warning'} 
                    sx={{ mt: 1 }}
                  >
                    {validationMessage}
                  </Alert>
                )}
              </Paper>
            )}

            {/* Hidden file inputs */}
            <HiddenInput
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
            />
            <HiddenInput
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileInputChange}
            />
          </Grid>

          {/* Analysis Settings */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Body Region"
                value={bodyRegion}
                onChange={(e) => setBodyRegion(e.target.value as BodyRegion)}
                fullWidth
                required
                helperText="Select where the lesion is located"
              >
                {BODY_REGIONS.map((region) => (
                  <MenuItem key={region.value} value={region.value}>
                    {region.label}
                  </MenuItem>
                ))}
              </TextField>

                <TextField
                label="Additional Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                fullWidth
                placeholder="Any additional information about the lesion (optional)&#x000A;Include a link to the image (in Google Drive or other cloud storage, set to anyone can view) for the doctor to review"
                helperText="Describe any symptoms, changes, or concerns"
                />

              {/* Analysis Progress */}
              {uploadProgress.status !== 'idle' && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {uploadProgress.status === 'complete' ? (
                      <CheckCircle color="success" />
                    ) : uploadProgress.status === 'error' ? (
                      <Warning color="error" />
                    ) : (
                      <CircularProgress size={20} />
                    )}
                    <Typography variant="body2">
                      {uploadProgress.message}
                    </Typography>
                  </Box>
                  
                  {isAnalyzing && (
                    <LinearProgress 
                      variant="determinate" 
                      value={uploadProgress.progress} 
                      sx={{ mb: 1 }}
                    />
                  )}
                </Box>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  startIcon={isAnalyzing ? <CircularProgress size={20} /> : <CloudUpload />}
                  fullWidth
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
                </Button>
                
                {selectedFile && (
                  <Tooltip title="Select a different image">
                    <IconButton onClick={clearSelection}>
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              {/* Info Alert */}
              <Alert severity="info" icon={<Info />}>
                <Typography variant="body2">
                  <strong>AI Analysis:</strong> Our AI will analyze the image and provide a risk assessment. 
                  Results will be reviewed by healthcare professionals.
                </Typography>
              </Alert>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ImageUpload;
