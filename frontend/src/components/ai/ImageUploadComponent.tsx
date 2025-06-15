import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { ImageUploadData, BodyRegion, BODY_REGIONS } from '../../types/AIAnalysisTypes';

interface ImageUploadComponentProps {
  onImageSelected: (data: ImageUploadData) => void;
  isLoading?: boolean;
  error?: string | null;
  disabled?: boolean;
}

const ImageUploadComponent: React.FC<ImageUploadComponentProps> = ({
  onImageSelected,
  isLoading = false,
  error = null,
  disabled = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [bodyRegion, setBodyRegion] = useState<BodyRegion>('other');
  const [notes, setNotes] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select a valid image file.';
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return 'Image size must be less than 10MB.';
    }

    // Check image dimensions
    return new Promise<string | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 224 || img.height < 224) {
          resolve('Image must be at least 224x224 pixels for accurate analysis.');
        } else if (img.width > 4096 || img.height > 4096) {
          resolve('Image must be smaller than 4096x4096 pixels.');
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve('Invalid image file.');
      img.src = URL.createObjectURL(file);
    }) as any;
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    setValidationError('');
    
    const validation = await validateFile(file);
    if (validation) {
      setValidationError(validation);
      return;
    }

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
  }, [validateFile]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedFile(null);
    setPreview('');
    setValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit for analysis
  const handleSubmit = () => {
    if (selectedFile && bodyRegion) {
      const uploadData: ImageUploadData = {
        file: selectedFile,
        preview,
        body_region: bodyRegion,
        notes: notes.trim()
      };
      onImageSelected(uploadData);
    }
  };

  const canSubmit = selectedFile && bodyRegion && !validationError && !isLoading && !disabled;

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        📸 Upload Skin Lesion Image
        <IconButton size="small" color="info">
          <InfoIcon fontSize="small" />
        </IconButton>
      </Typography>

      {/* Image Upload Area */}
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          border: `2px dashed ${dragActive ? theme.palette.primary.main : theme.palette.grey[300]}`,
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          backgroundColor: dragActive ? theme.palette.action.hover : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.action.hover
          }
        }}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />

        {preview ? (
          <Box sx={{ position: 'relative' }}>
            <img
              src={preview}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                borderRadius: '8px',
                boxShadow: theme.shadows[3]
              }}
            />
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(255,255,255,0.8)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
              }}
              disabled={disabled}
            >
              <DeleteIcon />
            </IconButton>
            <Chip
              label={`${(selectedFile!.size / 1024 / 1024).toFixed(2)} MB`}
              size="small"
              sx={{ position: 'absolute', bottom: 8, left: 8 }}
            />
          </Box>
        ) : (
          <Box>
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {isMobile ? 'Tap to select image' : 'Drop image here or click to select'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supports: JPG, PNG • Max size: 10MB • Min: 224x224px
            </Typography>
            {isMobile && (
              <Button
                variant="outlined"
                startIcon={<PhotoCameraIcon />}
                sx={{ mt: 2 }}
                disabled={disabled}
              >
                Take Photo
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Validation Error */}
      {validationError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {validationError}
        </Alert>
      )}

      {/* General Error */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Form Fields */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth required>
            <InputLabel>Body Region</InputLabel>
            <Select
              value={bodyRegion}
              label="Body Region"
              onChange={(e) => setBodyRegion(e.target.value as BodyRegion)}
              disabled={disabled}
            >
              {BODY_REGIONS.map((region) => (
                <MenuItem key={region.value} value={region.value}>
                  {region.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Additional Notes (Optional)"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe any symptoms, changes, or concerns..."
            disabled={disabled}
          />
        </Grid>
      </Grid>

      {/* Submit Button */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={!canSubmit}
          startIcon={isLoading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          sx={{
            minWidth: 200,
            py: 1.5,
            fontSize: '1.1rem',
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark
            }
          }}
        >
          {isLoading ? 'Analyzing...' : 'Analyze Image'}
        </Button>
      </Box>

      {/* Help Text */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          📋 <strong>Tips for best results:</strong><br />
          • Use good lighting and clear focus<br />
          • Fill the frame with the lesion<br />
          • Avoid shadows and reflections<br />
          • Take multiple angles if needed
        </Typography>
      </Alert>
    </Paper>
  );
};

export default ImageUploadComponent;
