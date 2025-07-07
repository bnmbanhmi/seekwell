import axios from 'axios';
import { AIAnalysisResult, SkinLesionAnalysisRequest } from '../types/AIAnalysisTypes';

// Base URL for the SeekWell backend API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for AI analysis
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export class AIAnalysisService {
  /**
   * Upload image and get AI analysis
   */
  static async analyzeImageAI(
    file: File,
    analysisData: SkinLesionAnalysisRequest
  ): Promise<AIAnalysisResult> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('body_region', analysisData.body_region);
      if (analysisData.notes) {
        formData.append('notes', analysisData.notes);
      }

      const response = await apiClient.post('/skin-lesions/analyze-ai', formData);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.error || 'AI analysis failed');
      }
    } catch (error: any) {
      console.error('AI Analysis Error:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to analyze image'
      );
    }
  }

  /**
   * Upload image for storage and get image ID (without AI analysis)
   */
  static async uploadImage(
    file: File,
    analysisData: SkinLesionAnalysisRequest
  ): Promise<{ image_id: number; image_url: string }> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('body_region', analysisData.body_region);
      if (analysisData.notes) {
        formData.append('notes', analysisData.notes);
      }

      const response = await apiClient.post('/skin-lesions/upload', formData);
      return response.data;
    } catch (error: any) {
      console.error('Image Upload Error:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to upload image'
      );
    }
  }

  /**
   * Get AI analysis for existing image
   */
  static async getAIAnalysis(imageId: number): Promise<AIAnalysisResult> {
    try {
      const response = await apiClient.get(`/skin-lesions/${imageId}/ai-analysis`);
      return response.data;
    } catch (error: any) {
      console.error('Get AI Analysis Error:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to get AI analysis'
      );
    }
  }

  /**
   * Get patient's skin lesion analysis history
   */
  static async getAnalysisHistory(): Promise<AIAnalysisResult[]> {
    try {
      const response = await apiClient.get('/skin-lesions/history');
      return response.data.analyses || response.data;
    } catch (error: any) {
      console.error('Get History Error:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to get analysis history'
      );
    }
  }

  /**
   * Submit analysis for cadre review
   */
  static async submitForReview(
    imageId: number,
    patientNotes?: string
  ): Promise<{ success: boolean; review_id: number }> {
    try {
      const response = await apiClient.post(`/skin-lesions/${imageId}/submit-review`, {
        patient_notes: patientNotes
      });
      return response.data;
    } catch (error: any) {
      console.error('Submit for Review Error:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to submit for review'
      );
    }
  }

  /**
   * Get supported body regions
   */
  static async getBodyRegions(): Promise<{ id: number; name: string; risk_level: string }[]> {
    try {
      const response = await apiClient.get('/skin-lesions/body-regions');
      return response.data;
    } catch (error: any) {
      console.error('Get Body Regions Error:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to get body regions'
      );
    }
  }

  /**
   * Health check for AI service
   */
  static async healthCheck(): Promise<{ status: string; is_ready: boolean }> {
    try {
      const response = await apiClient.get('/skin-lesions/health');
      return response.data;
    } catch (error: any) {
      console.error('Health Check Error:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Health check failed'
      );
    }
  }
}

export default AIAnalysisService;
