import { AIAnalysisResult, SkinLesionAnalysisRequest } from '../types/AIAnalysisTypes';

/**
 * HuggingFace AI Service for Skin Cancer Detection
 * 
 * This service integrates with the official HuggingFace Spaces API
 * for the bnmbanhmi/seekwell-skin-cancer model.
 * 
 * API Documentation Reference:
 * - Space: https://huggingface.co/spaces/bnmbanhmi/seekwell-skin-cancer
 * - Endpoint: /api/predict
 * - Input: Image file (PIL format expected)
 * - Output: String with classification results
 * 
 * Python Equivalent:
 * ```python
 * from gradio_client import Client, handle_file
 * 
 * client = Client("bnmbanhmi/seekwell-skin-cancer")
 * result = client.predict(
 *     image=handle_file('path/to/image.jpg'),
 *     api_name="/predict"
 * )
 * ```
 */

// HuggingFace Space API configuration
const HUGGINGFACE_SPACE_URL = 'https://bnmbanhmi-seekwell-skin-cancer.hf.space';
const API_ENDPOINT = '/api/predict'; // Correct endpoint based on official Gradio API documentation

class HuggingFaceAIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = HUGGINGFACE_SPACE_URL;
  }

  /**
   * Analyze skin lesion using HuggingFace Space API
   * Using the correct /api/predict endpoint as per official Gradio API documentation
   */
  async analyzeImageAI(
    file: File,
    analysisData: SkinLesionAnalysisRequest
  ): Promise<AIAnalysisResult> {
    try {
      console.log('🚀 Starting AI Analysis...');
      
      // Prepare FormData following Gradio's API specification
      // According to the official docs, for image inputs we need to handle the file properly
      const formData = new FormData();
      
      // Gradio expects files in a specific format
      // The predict function in app.py expects a PIL Image, so we structure accordingly
      formData.append('data', JSON.stringify([{
        "path": null,
        "url": null,
        "size": file.size,
        "orig_name": file.name,
        "mime_type": file.type,
        "is_stream": false,
        "meta": {}
      }]));
      
      // Add the actual file
      formData.append('file', file);

      console.log('📤 Sending request to:', `${this.baseUrl}${API_ENDPOINT}`);

      // Make request to HuggingFace Space using the correct /api/predict endpoint
      const response = await fetch(`${this.baseUrl}${API_ENDPOINT}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ AI Response:', result);
      
      // Parse the response according to Gradio's response format
      return this.parseAPIResponse(result, analysisData);
      
    } catch (error: any) {
      console.error('❌ AI Analysis Error:', error);
      
      // If it's a network error, try alternative approach
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        console.log('🔄 Trying alternative API approach...');
        return await this.analyzeImageFallback(file, analysisData);
      }
      
      throw new Error(
        error.message || 'Failed to analyze image with AI service'
      );
    }
  }

  /**
   * Fallback method using direct base64 approach
   */
  private async analyzeImageFallback(
    file: File,
    analysisData: SkinLesionAnalysisRequest
  ): Promise<AIAnalysisResult> {
    try {
      // Convert file to base64
      const base64 = await this.fileToBase64(file);
      
      // Try with JSON payload as alternative
      const payload = {
        data: [{
          path: null,
          url: `data:${file.type};base64,${base64}`,
          size: file.size,
          orig_name: file.name,
          mime_type: file.type,
          is_stream: false,
          meta: {}
        }]
      };

      const response = await fetch(`${this.baseUrl}${API_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Fallback API request failed: ${response.status}`);
      }

      const result = await response.json();
      return this.parseAPIResponse(result, analysisData);
      
    } catch (error: any) {
      throw new Error(`Fallback method failed: ${error.message}`);
    }
  }

  /**
   * Convert file to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Parse the API response and convert to our internal format
   */
  private parseAPIResponse(
    response: any, 
    analysisData: SkinLesionAnalysisRequest
  ): AIAnalysisResult {
    try {
      // According to Gradio API docs, the response should contain data array
      // with the string result from our predict function
      let resultText: string;
      
      if (response.data && Array.isArray(response.data)) {
        resultText = response.data[0];
      } else if (typeof response === 'string') {
        resultText = response;
      } else {
        throw new Error('Unexpected response format from AI service');
      }

      if (typeof resultText !== 'string') {
        throw new Error('Expected string result from AI service');
      }

      console.log('📊 Raw AI Result:', resultText);

      // Parse the result text to extract classification information
      const { predictedClass, confidence } = this.parseResultText(resultText);
      
      // Create prediction result
      const prediction = {
        class_id: this.getClassId(predictedClass),
        label: predictedClass,
        confidence: confidence,
        percentage: confidence * 100
      };

      // Determine risk level based on predicted class
      const riskLevel = this.getRiskLevel(predictedClass);
      
      // Generate recommendations
      const recommendations = this.getRecommendations(predictedClass, riskLevel);

      return {
        success: true,
        predictions: [prediction],
        top_prediction: prediction,
        analysis: {
          predicted_class: predictedClass,
          confidence: confidence,
          body_region: analysisData.body_region,
          analysis_timestamp: new Date().toISOString()
        },
        risk_assessment: {
          risk_level: riskLevel,
          confidence_level: this.getConfidenceLevel(confidence),
          needs_professional_review: this.needsProfessionalReview(riskLevel),
          needs_urgent_attention: riskLevel === 'URGENT',
          base_risk: riskLevel,
          confidence_score: confidence,
          predicted_class: predictedClass
        },
        recommendations: recommendations,
        workflow: {
          needs_cadre_review: this.needsCadreReview(riskLevel),
          needs_doctor_review: this.needsDoctorReview(riskLevel),
          priority_level: this.getPriorityLevel(riskLevel),
          estimated_follow_up_days: this.getFollowUpDays(riskLevel)
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error parsing API response:', error);
      throw new Error('Failed to parse AI analysis results');
    }
  }

  /**
   * Parse the result text to extract predicted class and confidence
   */
  private parseResultText(resultText: string): { predictedClass: string; confidence: number } {
    // Skin lesion class mappings
    const skinLesionClasses = {
      'ACK': 'Actinic keratoses',
      'BCC': 'Basal cell carcinoma', 
      'MEL': 'Melanoma',
      'NEV': 'Nevus/Mole',
      'SCC': 'Squamous cell carcinoma',
      'SEK': 'Seborrheic keratosis'
    };
    
    // Look for known skin lesion classes in the result
    let predictedClass = 'Unknown';
    let confidence = 0.5;

    // Check for class names (both short and long forms)
    for (const [shortName, longName] of Object.entries(skinLesionClasses)) {
      if (resultText.toLowerCase().includes(shortName.toLowerCase()) || 
          resultText.toLowerCase().includes(longName.toLowerCase())) {
        predictedClass = longName;
        break;
      }
    }

    // Try to extract confidence percentage
    const confidenceMatch = resultText.match(/(\d+\.?\d*)%/);
    if (confidenceMatch) {
      confidence = parseFloat(confidenceMatch[1]) / 100;
    } else {
      // Try to find decimal confidence (e.g., 0.85)
      const decimalMatch = resultText.match(/0\.(\d+)/);
      if (decimalMatch) {
        confidence = parseFloat(`0.${decimalMatch[1]}`);
      }
    }

    return { predictedClass, confidence };
  }

  /**
   * Get class ID for a given class name
   */
  private getClassId(className: string): number {
    const classIds: { [key: string]: number } = {
      'Melanoma': 0,
      'Basal cell carcinoma': 1,
      'Squamous cell carcinoma': 2,
      'Nevus/Mole': 3,
      'Actinic keratoses': 4,
      'Seborrheic keratosis': 5
    };
    return classIds[className] || 6;
  }

  /**
   * Determine risk level based on predicted class
   */
  private getRiskLevel(className: string): 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' {
    if (className.toLowerCase().includes('melanoma')) return 'URGENT';
    if (className.toLowerCase().includes('carcinoma')) return 'HIGH';
    if (className.toLowerCase().includes('keratoses')) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Get confidence level description
   */
  private getConfidenceLevel(confidence: number): 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW' {
    if (confidence >= 0.8) return 'HIGH';
    if (confidence >= 0.6) return 'MEDIUM';
    if (confidence >= 0.4) return 'LOW';
    return 'VERY_LOW';
  }

  /**
   * Generate recommendations based on classification
   */
  private getRecommendations(className: string, riskLevel: string): string[] {
    const baseRecommendations = [
      'Monitor the lesion for any changes in size, color, or texture',
      'Protect the area from sun exposure',
      'Take photos to track changes over time'
    ];

    if (riskLevel === 'URGENT') {
      return [
        'Seek immediate medical attention from a dermatologist',
        'Do not delay - schedule appointment within 1-2 days',
        ...baseRecommendations
      ];
    }

    if (riskLevel === 'HIGH') {
      return [
        'Schedule consultation with a dermatologist within 1-2 weeks',
        'Document any changes with photos',
        ...baseRecommendations
      ];
    }

    if (riskLevel === 'MEDIUM') {
      return [
        'Consult with your local health worker or family doctor',
        'Consider professional evaluation if concerned',
        ...baseRecommendations
      ];
    }

    return [
      'Continue routine skin monitoring',
      'Annual skin check-up recommended',
      ...baseRecommendations
    ];
  }

  /**
   * Check if professional review is needed
   */
  private needsProfessionalReview(riskLevel: string): boolean {
    return ['URGENT', 'HIGH'].includes(riskLevel);
  }

  /**
   * Check if cadre review is needed
   */
  private needsCadreReview(riskLevel: string): boolean {
    return ['URGENT', 'HIGH', 'MEDIUM'].includes(riskLevel);
  }

  /**
   * Check if doctor review is needed
   */
  private needsDoctorReview(riskLevel: string): boolean {
    return ['URGENT', 'HIGH'].includes(riskLevel);
  }

  /**
   * Get priority level for workflow
   */
  private getPriorityLevel(riskLevel: string): string {
    const priorities: { [key: string]: string } = {
      'URGENT': 'EMERGENCY',
      'HIGH': 'HIGH',
      'MEDIUM': 'MODERATE',
      'LOW': 'ROUTINE'
    };
    return priorities[riskLevel] || 'ROUTINE';
  }

  /**
   * Get estimated follow-up days
   */
  private getFollowUpDays(riskLevel: string): number {
    const followUpDays: { [key: string]: number } = {
      'URGENT': 1,
      'HIGH': 14,
      'MEDIUM': 30,
      'LOW': 90
    };
    return followUpDays[riskLevel] || 90;
  }

  /**
   * Check if the AI service is available and working
   */
  async healthCheck(): Promise<{ status: string; is_ready: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (response.ok) {
        return {
          status: 'healthy',
          is_ready: true
        };
      } else {
        return {
          status: 'unhealthy',
          is_ready: false
        };
      }
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        is_ready: false
      };
    }
  }

  /**
   * Check space status (for testing/debugging)
   */
  async checkSpaceStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/`);
      return {
        status: response.ok ? 'running' : 'error',
        status_code: response.status,
        accessible: response.ok
      };
    } catch (error) {
      return {
        status: 'error',
        status_code: 0,
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test connection to the service
   */
  async testConnection(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/`);
      return {
        success: response.ok,
        status: response.status,
        response_time: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  /**
   * Get space information
   */
  async getSpaceInfo(): Promise<any> {
    return {
      space_id: 'bnmbanhmi/seekwell-skin-cancer',
      url: this.baseUrl,
      api_endpoint: API_ENDPOINT
    };
  }

  /**
   * Discover available endpoints
   */
  async discoverEndpoint(): Promise<any> {
    return {
      discovered_endpoint: API_ENDPOINT,
      base_url: this.baseUrl,
      full_url: `${this.baseUrl}${API_ENDPOINT}`,
      api_documentation: 'Uses official Gradio API format: /api/predict'
    };
  }

  /**
   * Wake up space (for testing)
   */
  async wakeUpSpace(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract endpoints from HTML (for testing)
   */
  async extractEndpointsFromHTML(): Promise<any> {
    return {
      endpoints: [API_ENDPOINT],
      method: 'Using official Gradio API documentation endpoint'
    };
  }

  // Static methods for maintaining compatibility with existing code

  /**
   * Save analysis to local storage (keeping for compatibility)
   */
  static saveAnalysisToHistory(result: AIAnalysisResult): void {
    try {
      const history = this.getAnalysisHistory();
      const newEntry = {
        ...result,
        id: Date.now(),
        saved_at: new Date().toISOString()
      };
      
      history.unshift(newEntry);
      
      // Keep only last 50 analyses
      const limitedHistory = history.slice(0, 50);
      
      localStorage.setItem('seekwell_analysis_history', JSON.stringify(limitedHistory));
    } catch (error) {
      console.warn('Failed to save analysis to history:', error);
    }
  }

  /**
   * Get analysis history from local storage
   */
  static getAnalysisHistory(): any[] {
    try {
      const history = localStorage.getItem('seekwell_analysis_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.warn('Failed to get analysis history:', error);
      return [];
    }
  }
}

export default HuggingFaceAIService;
