import React, { useState } from 'react';
import { Button, Box, Typography, Alert, CircularProgress } from '@mui/material';
import HuggingFaceAIService from '../services/HuggingFaceAIService';

const HuggingFaceAPITest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testConnection = async () => {
    setTesting(true);
    setResults(null);
    
    try {
      const aiService = new HuggingFaceAIService();
      
      // Test basic connection
      console.log('Testing connection...');
      const connectionTest = await aiService.testConnection();
      
      console.log('Testing health check...');
      const healthCheck = await aiService.healthCheck();
      
      setResults({
        connection: connectionTest,
        health: healthCheck,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      setResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  const testWithSampleImage = async () => {
    setTesting(true);
    
    try {
      // Create a small test image (1x1 pixel red PNG)
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 100, 100);
      }
      
      // Convert to blob and then to file
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });
      
      const file = new File([blob], 'test.png', { type: 'image/png' });
      
      const aiService = new HuggingFaceAIService();
      const result = await aiService.analyzeImageAI(file, { body_region: 'other' });
      
      setResults({
        analysis: result,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      setResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        HuggingFace API Test
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Button 
          variant="contained" 
          onClick={testConnection}
          disabled={testing}
          sx={{ mr: 2 }}
        >
          {testing ? <CircularProgress size={20} /> : 'Test Connection'}
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={testWithSampleImage}
          disabled={testing}
        >
          {testing ? <CircularProgress size={20} /> : 'Test with Sample Image'}
        </Button>
      </Box>

      {results && (
        <Box sx={{ mt: 2 }}>
          {results.error ? (
            <Alert severity="error">
              <Typography variant="body2">
                <strong>Error:</strong> {results.error}
              </Typography>
            </Alert>
          ) : (
            <Alert severity="success">
              <Typography variant="body2">
                <strong>Test Results:</strong>
              </Typography>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                fontSize: '12px', 
                marginTop: '10px',
                backgroundColor: '#f5f5f5',
                padding: '10px',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '400px'
              }}>
                {JSON.stringify(results, null, 2)}
              </pre>
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default HuggingFaceAPITest;
