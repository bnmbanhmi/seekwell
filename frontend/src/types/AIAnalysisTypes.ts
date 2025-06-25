// AI Analysis Types for SeekWell Skin Lesion Detection
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

export interface WorkflowInfo {
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
  workflow: WorkflowInfo;
  patient_id?: number;
  timestamp?: string;
}

export interface SkinLesionAnalysisRequest {
  body_region: string;
  notes?: string;
}

export interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';
  message?: string;
}

export interface ImageUploadData {
  file: File;
  preview: string;
  body_region: string;
  notes?: string;
}

export type BodyRegion = 
  | 'face'
  | 'neck' 
  | 'chest'
  | 'back'
  | 'arms'
  | 'hands'
  | 'abdomen'
  | 'legs'
  | 'feet'
  | 'genitals'
  | 'other';

export const BODY_REGIONS: { value: BodyRegion; label: string }[] = [
  { value: 'face', label: 'Face' },
  { value: 'neck', label: 'Neck' },
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'arms', label: 'Arms' },
  { value: 'hands', label: 'Hands' },
  { value: 'abdomen', label: 'Abdomen' },
  { value: 'legs', label: 'Legs' },
  { value: 'feet', label: 'Feet' },
  { value: 'genitals', label: 'Genitals' },
  { value: 'other', label: 'Other' }
];

export const RISK_LEVEL_COLORS = {
  URGENT: '#dc2626',    // Red
  HIGH: '#f56a00',      // Orange (from palette)
  MEDIUM: '#ffc933',    // Yellow (from palette)
  LOW: '#36a41d',       // Green (from palette)
  UNCERTAIN: '#a0aec0'  // Gray (from palette)
};

export const CONFIDENCE_LEVEL_COLORS = {
  HIGH: '#36a41d',      // Green (from palette)
  MEDIUM: '#f56a00',    // Orange (from palette)
  LOW: '#ffc933',       // Yellow (from palette)
  VERY_LOW: '#4a5568'   // Dark Gray (from palette)
};
