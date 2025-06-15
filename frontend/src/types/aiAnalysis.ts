// AI Analysis Types for SeekWell Frontend
export interface PredictionResult {
  class_id: number;
  label: string;
  confidence: number;
  percentage: number;
}

export interface RiskAssessment {
  risk_level: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNCERTAIN';
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';
  needs_professional_review: boolean;
  needs_urgent_attention: boolean;
  base_risk: string;
  confidence_score: number;
  predicted_class: string;
}

export interface WorkflowStatus {
  needs_cadre_review: boolean;
  needs_doctor_review: boolean;
  priority_level: string;
  estimated_follow_up_days: number;
}

export interface AnalysisMetadata {
  predicted_class: string;
  confidence: number;
  body_region?: string;
  analysis_timestamp: string;
}

export interface AIAnalysisResult {
  success: boolean;
  error?: string;
  predictions: PredictionResult[];
  top_prediction?: PredictionResult;
  analysis: AnalysisMetadata;
  risk_assessment: RiskAssessment;
  recommendations: string[];
  workflow: WorkflowStatus;
  patient_id?: number;
  timestamp?: string;
}

export interface SkinLesionAnalysisRequest {
  body_region?: string;
  notes?: string;
}

export interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';
  message?: string;
}

export interface ValidationResult {
  is_valid: boolean;
  issues: string[];
  suggestions: string[];
  image_info: {
    size: string;
    mode: string;
    estimated_size_mb: number;
  };
}

// Body regions supported by the AI system
export const BODY_REGIONS = [
  'face',
  'neck', 
  'chest',
  'back',
  'arms',
  'hands',
  'abdomen',
  'legs',
  'feet',
  'genitals',
  'other'
] as const;

export type BodyRegion = typeof BODY_REGIONS[number];

// Risk level colors for UI
export const RISK_COLORS = {
  URGENT: '#ff1744',
  HIGH: '#f44336',
  MEDIUM: '#ff9800',
  LOW: '#4caf50',
  UNCERTAIN: '#9e9e9e'
} as const;
