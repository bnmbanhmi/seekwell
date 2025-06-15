import { AIAnalysisResult, SkinLesionAnalysisRequest } from '../types/AIAnalysisTypes';

// HuggingFace Space API configuration
const HUGGINGFACE_SPACE_URL = 'https://bnmbanhmi-seekwell-skin-cancer.hf.space';
const API_ENDPOINT = '/api/predict';

class HuggingFaceAIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = HUGGINGFACE_SPACE_URL;
  }

  /**
   * Analyze skin lesion using HuggingFace Space API
   */
  async analyzeImageAI(
    file: File,
    analysisData: SkinLesionAnalysisRequest
  ): Promise<AIAnalysisResult> {
    try {
      console.log('🚀 Starting HuggingFace AI Analysis...');
      
      // Create FormData for the API request
      const formData = new FormData();
      formData.append('data', JSON.stringify([file]));

      // Make request to HuggingFace Space
      const response = await fetch(`${this.baseUrl}${API_ENDPOINT}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ HuggingFace AI Response:', result);

      // Parse the result and convert to our format
      return this.parseHuggingFaceResponse(result, analysisData);

    } catch (error: any) {
      console.error('❌ HuggingFace AI Analysis Error:', error);
      throw new Error(
        error.message || 'Failed to analyze image with HuggingFace AI'
      );
    }
  }

  /**
   * Alternative method using gradio_client approach
   */
  async analyzeWithGradioClient(file: File): Promise<AIAnalysisResult> {
    try {
      console.log('🚀 Using Gradio Client approach...');
      
      // Convert file to base64 for API
      const base64 = await this.fileToBase64(file);
      
      const payload = {
        data: [{
          path: null,
          url: `data:${file.type};base64,${base64}`,
          size: file.size,
          orig_name: file.name,
          mime_type: file.type,
          is_stream: false,
          meta: {}
        }],
        fn_index: 0,
        session_hash: this.generateSessionHash()
      };

      const response = await fetch(`${this.baseUrl}/run/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Gradio API error: ${response.status}`);
      }

      const result = await response.json();
      return this.parseGradioResponse(result);

    } catch (error: any) {
      console.error('❌ Gradio Client Analysis Error:', error);
      throw error;
    }
  }

  /**
   * Parse HuggingFace Space response to our format
   */
  private parseHuggingFaceResponse(
    response: any, 
    analysisData: SkinLesionAnalysisRequest
  ): AIAnalysisResult {
    try {
      // Parse the JSON string response
      let parsedData;
      if (typeof response.data === 'string') {
        parsedData = JSON.parse(response.data[0]);
      } else {
        parsedData = response.data;
      }

      // Extract predictions from the response
      const predictions = [];
      const topPrediction = parsedData['🎯 Top Prediction'];
      
      // Parse all predictions
      if (parsedData['📊 All Predictions']) {
        for (const pred of parsedData['📊 All Predictions']) {
          predictions.push({
            class_id: this.getClassId(pred.Class),
            label: pred.Class,
            confidence: parseFloat(pred.Confidence.replace('%', '')) / 100,
            percentage: parseFloat(pred.Confidence.replace('%', ''))
          });
        }
      }

      // Determine risk level from response
      const riskLevel = parsedData['⚠️ Risk Level'] || 'UNCERTAIN';
      const recommendations = parsedData['💡 Recommendations'] || [
        'Professional medical evaluation recommended',
        'Monitor for any changes'
      ];

      return {
        success: true,
        predictions,
        top_prediction: predictions[0],
        analysis: {
          predicted_class: predictions[0]?.label || 'Unknown',
          confidence: predictions[0]?.confidence || 0,
          body_region: analysisData.body_region,
          analysis_timestamp: new Date().toISOString()
        },
        risk_assessment: {
          risk_level: this.normalizeRiskLevel(riskLevel),
          confidence_level: this.getConfidenceLevel(predictions[0]?.confidence || 0),
          needs_professional_review: this.needsProfessionalReview(riskLevel),
          needs_urgent_attention: riskLevel.includes('URGENT'),
          base_risk: riskLevel,
          confidence_score: predictions[0]?.confidence || 0,
          predicted_class: predictions[0]?.label || 'Unknown'
        },
        recommendations,
        workflow: {
          needs_cadre_review: this.needsCadreReview(riskLevel),
          needs_doctor_review: this.needsDoctorReview(riskLevel),
          priority_level: this.getPriorityLevel(riskLevel),
          estimated_follow_up_days: this.getFollowUpDays(riskLevel)
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error parsing HuggingFace response:', error);
      throw new Error('Failed to parse AI analysis results');
    }
  }

  /**
   * Parse Gradio response format
   */
  private parseGradioResponse(response: any): AIAnalysisResult {
    // Implementation for gradio response parsing
    // This would be similar to parseHuggingFaceResponse but adapted for gradio format
    return this.parseHuggingFaceResponse(response, { body_region: 'other' });
  }

  /**
   * Helper methods
   */
  private getClassId(className: string): number {
    const classMap: { [key: string]: number } = {
      'ACK (Actinic keratoses)': 0,
      'BCC (Basal cell carcinoma)': 1,
      'MEL (Melanoma)': 2,
      'NEV (Nevus/Mole)': 3,
      'SCC (Squamous cell carcinoma)': 4,
      'SEK (Seborrheic keratosis)': 5
    };
    return classMap[className] || 0;
  }

  private normalizeRiskLevel(riskLevel: string): 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNCERTAIN' {
    if (riskLevel.includes('URGENT')) return 'URGENT';
    if (riskLevel.includes('HIGH')) return 'HIGH';
    if (riskLevel.includes('MEDIUM')) return 'MEDIUM';
    if (riskLevel.includes('LOW')) return 'LOW';
    return 'UNCERTAIN';
  }

  private getConfidenceLevel(confidence: number): 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW' {
    if (confidence > 0.8) return 'HIGH';
    if (confidence > 0.6) return 'MEDIUM';
    if (confidence > 0.4) return 'LOW';
    return 'VERY_LOW';
  }

  private needsProfessionalReview(riskLevel: string): boolean {
    return riskLevel.includes('URGENT') || riskLevel.includes('HIGH');
  }

  private needsCadreReview(riskLevel: string): boolean {
    return riskLevel.includes('MEDIUM') || riskLevel.includes('HIGH');
  }

  private needsDoctorReview(riskLevel: string): boolean {
    return riskLevel.includes('URGENT') || riskLevel.includes('HIGH');
  }

  private getPriorityLevel(riskLevel: string): string {
    if (riskLevel.includes('URGENT')) return 'CRITICAL';
    if (riskLevel.includes('HIGH')) return 'HIGH';
    if (riskLevel.includes('MEDIUM')) return 'MEDIUM';
    return 'LOW';
  }

  private getFollowUpDays(riskLevel: string): number {
    if (riskLevel.includes('URGENT')) return 1;
    if (riskLevel.includes('HIGH')) return 7;
    if (riskLevel.includes('MEDIUM')) return 30;
    return 90;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  }

  private generateSessionHash(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Health check for HuggingFace Space
   */
  async healthCheck(): Promise<{ status: string; is_ready: boolean }> {
    try {
      const response = await fetch(this.baseUrl);
      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        is_ready: response.ok
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        is_ready: false
      };
    }
  }

  /**
   * Get analysis history (mock implementation)
   */
  static async getAnalysisHistory(): Promise<AIAnalysisResult[]> {
    // Return empty array or load from localStorage
    const stored = localStorage.getItem('ai_analysis_history');
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Save analysis to history
   */
  static saveAnalysisToHistory(result: AIAnalysisResult): void {
    const history = JSON.parse(localStorage.getItem('ai_analysis_history') || '[]');
    history.unshift({ ...result, id: Date.now() });
    // Keep only last 50 analyses
    const trimmed = history.slice(0, 50);
    localStorage.setItem('ai_analysis_history', JSON.stringify(trimmed));
  }
}

export default HuggingFaceAIService;
