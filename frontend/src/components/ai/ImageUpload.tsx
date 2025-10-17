import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  CircularProgress,
  LinearProgress,
  Grid,
  Paper,
  Checkbox,
  FormControlLabel,
  Alert,
} from '@mui/material';
import {
  CloudUpload,
  PhotoCamera,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import HuggingFaceAIService from '../../services/HuggingFaceAIService';

// Styled components
const PreviewImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '400px',
  borderRadius: '8px',
  objectFit: 'contain',
});

const HiddenInput = styled('input')({
  display: 'none',
});

const ExampleImage = styled('img')({
  width: '100%',
  height: '200px',
  objectFit: 'cover',
  borderRadius: '8px',
  border: '2px solid',
});

const ActionButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(3, 6),
  fontSize: '1.1rem',
  fontWeight: 600,
  borderRadius: 16,
  textTransform: 'none',
  minWidth: 250,
  minHeight: 70,
  boxShadow: '0 4px 20px rgba(54, 164, 29, 0.3)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 30px rgba(54, 164, 29, 0.4)',
  },
  '&:active': {
    transform: 'translateY(-2px)',
  },
}));

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
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [allowDataCollection, setAllowDataCollection] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    progress: 0,
    status: 'idle' as 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error',
    message: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Upload image to ImgBB
  const uploadToImgBB = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`https://api.imgbb.com/1/upload?key=f4808957a454827017c2f8c137f4a035`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (data.success) {
        return data.data.url;
      }
      return null;
    } catch (error) {
      console.error('ImgBB upload failed:', error);
      return null;
    }
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError(t('aiAnalysis.errors.invalidFormat'));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError(t('aiAnalysis.errors.fileTooLarge'));
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Auto-analyze after selection
    analyzeImage(file);
  }, [onError, t]);

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
    setUploadProgress({ progress: 0, status: 'idle', message: '' });
    
    // Clear file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Analyze image
  const analyzeImage = async (file: File) => {
    try {
      setUploadProgress({ 
        progress: 0, 
        status: 'uploading', 
        message: t('aiAnalysis.analyzing')
      });

      // Upload to ImgBB if user consented
      let imgbbUrl = null;
      if (allowDataCollection) {
        imgbbUrl = await uploadToImgBB(file);
      }

      const aiService = new HuggingFaceAIService();
      
      setUploadProgress({ 
        progress: 30, 
        status: 'analyzing', 
        message: t('aiAnalysis.pleaseWait')
      });

      const result = await aiService.analyzeImageAI(
        file,
        { 
          body_region: 'other', 
          notes: imgbbUrl ? `${notes}\n[Image URL: ${imgbbUrl}]` : notes 
        }
      );

      HuggingFaceAIService.saveAnalysisToHistory(result);

      setUploadProgress({ 
        progress: 100, 
        status: 'complete', 
        message: t('aiAnalysis.success')
      });
      
      onAnalysisComplete(result);

    } catch (error: any) {
      setUploadProgress({ 
        progress: 0, 
        status: 'error', 
        message: error.message 
      });
      onError(error.message || t('aiAnalysis.errors.analysisFailed'));
    }
  };

  const isAnalyzing = uploadProgress.status === 'uploading' || uploadProgress.status === 'analyzing';

  return (
    <Card elevation={0} sx={{ boxShadow: 'none' }}>
      <CardContent sx={{ p: 0 }}>
        {/* Page Title */}
        <Typography variant="h4" gutterBottom sx={{ mb: 2, fontWeight: 700, textAlign: 'center' }}>
          {t('aiAnalysis.pageTitle')}
        </Typography>

        {/* Scroll Down Hint */}
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 4, 
            textAlign: 'center', 
            color: 'text.secondary',
            fontWeight: 500,
            animation: 'bounce 2s infinite'
          }}
        >
          {t('aiAnalysis.scrollDownHint')}
        </Typography>

        {/* How to Photograph Section - MOVED TO TOP */}
        <Paper elevation={2} sx={{ p: 4, mb: 4, bgcolor: 'info.lighter' }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
            {t('aiAnalysis.howToPhotoTitle')}
          </Typography>

          {/* Photography Tips */}
          <Box sx={{ mb: 3, bgcolor: 'background.paper', p: 2, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              {t('aiAnalysis.photoTips.title')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="body1">{t('aiAnalysis.photoTips.tip1')}</Typography>
              <Typography variant="body1">{t('aiAnalysis.photoTips.tip2')}</Typography>
              <Typography variant="body1">{t('aiAnalysis.photoTips.tip3')}</Typography>
              <Typography variant="body1">{t('aiAnalysis.photoTips.tip4')}</Typography>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Good Example */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h1" sx={{ fontSize: '48px', mb: 2 }}>
                  ✅
                </Typography>
                <ExampleImage 
                  src="https://hikarieyecare.com/wp-content/uploads/Not-ruoi-lanh-tinh-co-2-nua-doi-xung-ve-hinh-dang-thuong-la-hinh-tron-hoac-bau-duc.png"
                  alt="Good example"
                  sx={{ borderColor: 'success.main' }}
                />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 600, color: 'success.main' }}>
                  {t('aiAnalysis.goodExampleLabel')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('aiAnalysis.goodExampleDesc')}
                </Typography>
              </Box>
            </Grid>

            {/* Bad Example */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h1" sx={{ fontSize: '48px', mb: 2 }}>
                  ❌
                </Typography>
                <ExampleImage 
                  src="https://benhvienthammykangnam.vn/wp-content/webp-express/webp-images/uploads/2019/12/1-17.jpg.webp"
                  alt="Bad example"
                  sx={{ borderColor: 'error.main' }}
                />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 600, color: 'error.main' }}>
                  {t('aiAnalysis.badExampleLabel')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('aiAnalysis.badExampleDesc')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Notes Field */}
        <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
          <TextField
            label={t('aiAnalysis.notesLabel')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={3}
            fullWidth
            placeholder={t('aiAnalysis.notesPlaceholder')}
          />
          
          {/* Data Collection Consent */}
          <Box sx={{ mt: 3 }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={allowDataCollection}
                  onChange={(e) => setAllowDataCollection(e.target.checked)}
                  color="primary"
                />
              }
              label={t('aiAnalysis.allowDataCollection')}
            />
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">
                {t('aiAnalysis.dataCollectionNote')}
              </Typography>
            </Alert>
          </Box>
        </Paper>

        {/* Upload Module */}
        <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
            {t('aiAnalysis.uploadTitle')}
          </Typography>

          {!selectedFile ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
                <ActionButton 
                  variant="contained" 
                  size="large"
                  startIcon={<PhotoCamera sx={{ fontSize: 28 }} />}
                  onClick={() => cameraInputRef.current?.click()}
                  sx={{
                    background: 'linear-gradient(135deg, #36a41d 0%, #2d8617 100%)',
                    color: 'white',
                    border: 'none',
                  }}
                >
                  {t('aiAnalysis.takePhoto')}
                </ActionButton>
                
                <ActionButton 
                  variant="outlined" 
                  size="large"
                  startIcon={<CloudUpload sx={{ fontSize: 28 }} />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    background: 'white',
                    color: '#36a41d',
                    border: '2px solid #36a41d',
                    boxShadow: '0 4px 20px rgba(54, 164, 29, 0.2)',
                    '&:hover': {
                      border: '2px solid #36a41d',
                      background: 'white',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 30px rgba(54, 164, 29, 0.3)',
                    },
                  }}
                >
                  {t('aiAnalysis.chooseFile')}
                </ActionButton>
              </Box>
            </Box>
          ) : (
            <Box>
              <Box sx={{ position: 'relative', mb: 2 }}>
                <PreviewImage src={previewUrl || ''} alt="Selected mole" />
                {uploadProgress.status !== 'analyzing' && uploadProgress.status !== 'uploading' && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Cancel />}
                    onClick={clearSelection}
                    sx={{ mt: 2 }}
                  >
                    Chọn ảnh khác
                  </Button>
                )}
              </Box>

              {/* Analysis Progress */}
              {isAnalyzing && (
                <Box sx={{ my: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2">
                      {uploadProgress.message}
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={uploadProgress.progress} />
                </Box>
              )}

              {uploadProgress.status === 'complete' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 2, color: 'success.main' }}>
                  <CheckCircle />
                  <Typography variant="body2">
                    {uploadProgress.message}
                  </Typography>
                </Box>
              )}
            </Box>
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
        </Paper>
      </CardContent>
    </Card>
  );
};

export default ImageUpload;
