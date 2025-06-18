import { AIAnalysisResult, SkinLesionAnalysisRequest } from '../types/AIAnalysisTypes';

/**
 * HuggingFace AI  private async joinQueue(imageData: any): Promise<any> {
    console.log('🔄 Joining processing queue...');
    
    const sessionHash = this.generateSessionHash();
    
    const queueData = {
      data: [imageData], // Pass ImageData object, not string path
      event_data: null,
      fn_index: 2, // Based on config analysis
      trigger_id: 11, // Submit button trigger ID from config
      session_hash: sessionHash
    }; Skin Cancer Detection
 * 
 * This service integrates with the official HuggingFace Spaces API
 * for the bnmbanhmi/seekwell-skin-cancer model.
 * 
 * CRITICAL: Based on error analysis, this Gradio space uses SSE (Server-Sent Events)
 * and requires a specific queue-based approach, not direct HTTP calls.
 * 
 * The space configuration shows:
 * - "protocol":"sse_v3" - Uses Server-Sent Events
 * - "enable_queue":true - Requires queue-based processing
 * - "api_prefix":"/gradio_api" - Correct API prefix
 * 
 * Updated approach: Use Gradio's queue system with proper file upload handling
 */

// HuggingFace Space API configuration
const HUGGINGFACE_SPACE_URL = 'https://bnmbanhmi-seekwell-skin-cancer.hf.space';

// Correct Gradio queue-based endpoints (based on SSE protocol)
const GRADIO_API_PREFIX = '/gradio_api';
const QUEUE_JOIN_ENDPOINT = `${GRADIO_API_PREFIX}/queue/join`;
const QUEUE_DATA_ENDPOINT = `${GRADIO_API_PREFIX}/queue/data`;
const UPLOAD_ENDPOINT = `${GRADIO_API_PREFIX}/upload`;

class HuggingFaceAIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = HUGGINGFACE_SPACE_URL;
  }

  /**
   * Analyze skin lesion using HuggingFace Space API
   * FIXED: Handles ImageData validation and SSE parsing correctly
   */
  async analyzeImageAI(
    file: File,
    analysisData: SkinLesionAnalysisRequest
  ): Promise<AIAnalysisResult> {
    try {
      console.log('🚀 Starting AI Analysis with Gradio Queue System...');
      
      // Step 1: Upload the file first 
      const uploadedFiles = await this.uploadFile(file);
      console.log('📤 File uploaded:', uploadedFiles[0]);
      
      // Step 2: Create proper ImageData object to fix validation error
      const imageData = {
        path: uploadedFiles[0],
        url: null,
        size: file.size,
        orig_name: file.name,
        mime_type: file.type,
        is_stream: false,
        meta: { _type: "gradio.FileData" }
      };
      
      // Step 3: Join the queue for processing with proper ImageData
      const queueData = await this.joinQueue(imageData);
      console.log('📋 Joined queue:', queueData);
      
      // Step 4: Wait for results via SSE with same session
      const result = await this.waitForQueueResults(queueData.event_id, queueData.session_hash);
      console.log('✅ Got results from queue');
      
      return this.parseAPIResponse(result, analysisData);
      
    } catch (error: any) {
      console.error('❌ AI Analysis Error:', error);
      throw new Error(
        error.message || 'Failed to analyze image with AI service'
      );
    }
  }

  /**
   * Upload file to Gradio space
   */
  private async uploadFile(file: File): Promise<string[]> {
    console.log('� Uploading file to Gradio space...');
    
    const formData = new FormData();
    formData.append('files', file);

    const response = await fetch(`${this.baseUrl}${UPLOAD_ENDPOINT}`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`File upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result || !Array.isArray(result) || result.length === 0) {
      throw new Error('Invalid upload response format');
    }

    return result; // Return array of uploaded file paths
  }

  /**
   * Join the processing queue
   */
  private async joinQueue(uploadedFile: any): Promise<any> {
    console.log('� Joining processing queue...');
    
    const sessionHash = this.generateSessionHash();
    
    const queueData = {
      data: [uploadedFile],
      event_data: null,
      fn_index: 2, // Based on config analysis
      trigger_id: null,
      session_hash: sessionHash
    };

    const response = await fetch(`${this.baseUrl}${QUEUE_JOIN_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queueData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Queue join failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.event_id) {
      throw new Error('No event_id received from queue join');
    }

    return {
      event_id: result.event_id,
      session_hash: sessionHash
    };
  }

  /**
   * Wait for results from the queue using SSE - FIXED for session management and SSE parsing
   */
  private async waitForQueueResults(eventId: string, sessionHash: string): Promise<any> {
    console.log('⏳ Waiting for queue results...');
    
    return new Promise((resolve, reject) => {
      const sseUrl = `${this.baseUrl}${QUEUE_DATA_ENDPOINT}?session_hash=${sessionHash}`;
      
      const eventSource = new EventSource(sseUrl);
      const timeout = setTimeout(() => {
        eventSource.close();
        reject(new Error('Timeout waiting for AI analysis results'));
      }, 60000); // 60 second timeout

      eventSource.onmessage = (event) => {
        try {
          console.log('📨 SSE message received:', event.data);
          
          // Fix SSE parsing - handle "data: " prefix causing JSON parse errors
          let eventData = event.data;
          if (eventData.startsWith('data: ')) {
            eventData = eventData.substring(6);
          }
          
          const data = JSON.parse(eventData);
          
          if (data.msg === 'process_completed') {
            clearTimeout(timeout);
            eventSource.close();
            resolve(data.output);
          } else if (data.msg === 'process_starts') {
            console.log('🔄 AI processing started...');
          } else if (data.msg === 'estimation') {
            console.log('⏱️ Estimated wait time:', data.rank, 'in queue');
          } else if (data.msg === 'process_generating') {
            console.log('🧠 AI processing in progress...');
          } else {
            console.log('📋 Queue status:', data.msg);
          }
        } catch (parseError) {
          console.warn('Failed to parse SSE message:', event.data, parseError);
          // Don't reject, keep waiting for valid messages
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        clearTimeout(timeout);
        eventSource.close();
        reject(new Error('SSE connection failed - check network and CORS'));
      };

      eventSource.onopen = () => {
        console.log('✅ SSE connection established');
      };
    });
  }

  /**
   * Generate a session hash for Gradio API
   */
  private generateSessionHash(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
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
      api_approach: 'SSE Queue-based (Gradio v5.34.0)',
      upload_endpoint: `${this.baseUrl}${UPLOAD_ENDPOINT}`,
      queue_join_endpoint: `${this.baseUrl}${QUEUE_JOIN_ENDPOINT}`,
      queue_data_endpoint: `${this.baseUrl}${QUEUE_DATA_ENDPOINT}`
    };
  }

  /**
   * Discover available endpoints
   */
  async discoverEndpoint(): Promise<any> {
    return {
      approach: 'SSE Queue-based Processing',
      base_url: this.baseUrl,
      upload_endpoint: `${this.baseUrl}${UPLOAD_ENDPOINT}`,
      queue_join_endpoint: `${this.baseUrl}${QUEUE_JOIN_ENDPOINT}`,
      queue_data_endpoint: `${this.baseUrl}${QUEUE_DATA_ENDPOINT}`,
      api_documentation: 'Uses Gradio SSE protocol with file upload + queue processing'
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
      endpoints: [UPLOAD_ENDPOINT, QUEUE_JOIN_ENDPOINT, QUEUE_DATA_ENDPOINT],
      method: 'Using Gradio SSE queue-based approach with file upload'
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
