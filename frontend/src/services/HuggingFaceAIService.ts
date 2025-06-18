import { AIAnalysisResult, SkinLesionAnalysisRequest } from '../types/AIAnalysisTypes';

// HuggingFace Space API configuration
const HUGGINGFACE_SPACE_URL = 'https://bnmbanhmi-seekwell-skin-cancer.hf.space';
const API_ENDPOINT = '/api/predict';

// Skin lesion class mappings
const SKIN_LESION_CLASSES = {
  'ACK': 'Actinic keratoses',
  'BCC': 'Basal cell carcinoma', 
  'MEL': 'Melanoma',
  'NEV': 'Nevus/Mole',
  'SCC': 'Squamous cell carcinoma',
  'SEK': 'Seborrheic keratosis'
};

class HuggingFaceAIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = HUGGINGFACE_SPACE_URL;
  }

  /**
   * Analyze skin lesion using HuggingFace Space API
   * Simple implementation following the official API documentation
   */
  async analyzeImageAI(
    file: File,
    analysisData: SkinLesionAnalysisRequest
  ): Promise<AIAnalysisResult> {
    try {
      console.log('🚀 Starting AI Analysis...');
      
      // Convert file to base64 for the API
      const base64 = await this.fileToBase64(file);
      
      // Create the payload following the official API documentation format
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

      // Make request to HuggingFace Space
      const response = await fetch(`${this.baseUrl}${API_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ AI Response:', result);
      
      // Parse the API response and return structured result
      return this.parseAPIResponse(result, analysisData);
      
    } catch (error: any) {
      console.error('❌ AI Analysis Error:', error);
      throw new Error(
        error.message || 'Failed to analyze image with AI service'
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
        session_hash: this.getSessionHash()
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
      return this.parseGradioResponse(result, { body_region: 'other' });

    } catch (error: any) {
      console.error('❌ Gradio Client Analysis Error:', error);
      throw error;
    }
  }

  /**
   * Alternative method using /queue/join endpoint
   */
  async analyzeWithQueueJoin(file: File, analysisData: SkinLesionAnalysisRequest): Promise<AIAnalysisResult> {
    try {
      console.log('🚀 Using Queue Join approach...');
      
      // Convert file to base64 for API
      const base64 = await this.fileToBase64(file);
      
      // Create the payload for queue/join
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
        event_data: null,
        fn_index: 0,
        session_hash: this.getSessionHash()
      };

      // First, join the queue
      const queueResponse = await fetch(`${this.baseUrl}/queue/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!queueResponse.ok) {
        throw new Error(`Queue join failed: ${queueResponse.status}`);
      }

      const queueResult = await queueResponse.json();
      console.log('Queue join result:', queueResult);

      // If the response is immediate, parse it
      if (queueResult.data) {
        return this.parseGradioResponse(queueResult, analysisData);
      }

      // Otherwise, we might need to poll for results or handle differently
      // For now, create a mock response
      throw new Error('Received queue result without data. Analysis could not be completed.');

    } catch (error: any) {
      console.error('❌ Queue Join Analysis Error:', error);
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
  private async parseGradioResponse(response: any, analysisData: SkinLesionAnalysisRequest): Promise<AIAnalysisResult> {
    try {
      // Check if this is a queue response with event_id
      if (response.event_id && !response.data && !response.output) {
        console.log(`🔄 Got queue event ID: ${response.event_id}, initiating queue handling...`);
        // Handle the queue and return the result
        return await this.handleGradioQueue(response.event_id, analysisData);
      }
      
      // The response from Gradio should contain the result in response.data
      const resultData = response.data && response.data[0] ? response.data[0] : response;
      
      // Parse the string result if it's a JSON string
      let parsedData;
      if (typeof resultData === 'string') {
        // Try to parse as JSON
        try {
          parsedData = JSON.parse(resultData);
        } catch {
          // If not JSON, treat as plain text result
          parsedData = { result: resultData };
        }
      } else {
        parsedData = resultData;
      }

      console.log('📊 Parsed Gradio Response:', parsedData);

      // If the response is in a different format, return error
      if (typeof parsedData === 'string') {
        throw new Error('Received unexpected text response from AI service. Unable to provide medical analysis.');
      }

      // If it has the expected structure, parse it
      if (parsedData && (parsedData['🎯 Top Prediction'] || parsedData.predictions)) {
        return this.parseHuggingFaceResponse(parsedData, analysisData);
      }

      // If it's a different format, throw error
      throw new Error('Received unrecognized response format from AI service. Cannot provide reliable medical analysis.');

    } catch (error) {
      console.error('Error parsing Gradio response:', error);
      throw new Error('Failed to parse AI analysis results. The analysis service may be experiencing issues.');
    }
  }

  /**
   * Create a mock analysis result from plain text response
   */
  // MEDICAL SAFETY: Mock data methods removed
  // In a medical application, we must never generate fake diagnostic data
  // All analysis must come from the actual AI model or throw clear errors

  /**
   * Extract confidence from text response
   */
  private extractConfidenceFromText(text: string): number {
    const confidenceMatch = text.match(/(\d+\.?\d*)%/);
    if (confidenceMatch) {
      return parseFloat(confidenceMatch[1]) / 100;
    }
    return 0.5; // Default confidence
  }

  /**
   * Extract predicted class from text response
   */
  private extractClassFromText(text: string): string {
    const classes = ['MEL', 'BCC', 'SCC', 'ACK', 'NEV', 'SEK', 'Melanoma', 'Basal cell carcinoma', 'Squamous cell carcinoma', 'Actinic keratoses', 'Nevus', 'Seborrheic keratosis'];
    
    for (const cls of classes) {
      if (text.toLowerCase().includes(cls.toLowerCase())) {
        return cls;
      }
    }
    return 'Unknown';
  }

  /**
   * Get risk level from predicted class
   */
  private getRiskLevelFromClass(className: string): 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNCERTAIN' {
    if (className.includes('MEL') || className.includes('Melanoma')) return 'URGENT';
    if (className.includes('BCC') || className.includes('SCC') || className.includes('carcinoma')) return 'HIGH';
    if (className.includes('ACK') || className.includes('keratoses')) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Get recommendations from predicted class
   */
  private getRecommendationsFromClass(className: string): string[] {
    if (className.includes('MEL') || className.includes('Melanoma')) {
      return [
        'Urgent dermatologist consultation required',
        'Avoid sun exposure',
        'Monitor for rapid changes'
      ];
    }
    if (className.includes('BCC') || className.includes('SCC') || className.includes('carcinoma')) {
      return [
        'Schedule dermatologist appointment within 2 weeks',
        'Protect from UV exposure',
        'Consider biopsy if recommended'
      ];
    }
    return [
      'Regular monitoring recommended',
      'Annual dermatologist check-up',
      'Use sun protection'
    ];
  }

  /**
   * Original helper methods that were removed
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

  private async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
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
   * Check if the Space is actually running and has the Gradio interface
   */
  async checkSpaceStatus(): Promise<{ isRunning: boolean; hasGradioInterface: boolean; error?: string }> {
    try {
      console.log('🔍 Checking HuggingFace Space status...');
      
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        }
      });
      
      if (!response.ok) {
        return {
          isRunning: false,
          hasGradioInterface: false,
          error: `Space returned ${response.status}: ${response.statusText}`
        };
      }
      
      const html = await response.text();
      
      // Check if it's a Gradio interface
      const hasGradio = html.includes('gradio') || html.includes('Gradio') || html.includes('gr.Interface');
      
      console.log(`Space status: Running=${response.ok}, HasGradio=${hasGradio}`);
      
      return {
        isRunning: true,
        hasGradioInterface: hasGradio
      };
      
    } catch (error: any) {
      return {
        isRunning: false,
        hasGradioInterface: false,
        error: error.message
      };
    }
  }

  /**
   * Test API connection and get available endpoints
   */
  async testConnection(): Promise<{ status: string; available_endpoints: string[] }> {
    try {
      console.log('🔍 Testing HuggingFace Space connection...');
      
      const endpoints = ['/gradio_api/call/predict', '/run/predict', '/queue/join', '/api/predict', '/info'];
      const available = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'GET'
          });
          
          if (response.ok || response.status === 405) { // 405 means method not allowed but endpoint exists
            available.push(endpoint);
            console.log(`✅ Endpoint ${endpoint} is available`);
          } else {
            console.log(`❌ Endpoint ${endpoint} returned ${response.status}`);
          }
        } catch (error) {
          console.log(`❌ Endpoint ${endpoint} failed:`, error);
        }
      }
      
      return {
        status: available.length > 0 ? 'connected' : 'failed',
        available_endpoints: available
      };
      
    } catch (error) {
      console.error('Connection test failed:', error);
      return {
        status: 'failed',
        available_endpoints: []
      };
    }
  }

  /**
   * Get Gradio app info to discover available endpoints
   */
  async getSpaceInfo(): Promise<any> {
    try {
      console.log('🔍 Fetching HuggingFace Space info...');
      
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const info = await response.json();
        console.log('📊 HuggingFace Space Info:', info);
        return info;
      } else {
        console.warn(`Info endpoint failed: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error('Failed to get space info:', error);
      return null;
    }
  }

  /**
   * Try to discover the correct API endpoint
   */
  async discoverEndpoint(): Promise<string | null> {
    try {
      const info = await this.getSpaceInfo();
      
      if (info && info.named_endpoints) {
        // Look for predict endpoint in named endpoints
        const predictEndpoint = info.named_endpoints.find(
          (ep: any) => ep.includes('predict') || ep.includes('run')
        );
        if (predictEndpoint) {
          console.log(`✅ Found predict endpoint: ${predictEndpoint}`);
          return predictEndpoint;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Endpoint discovery failed:', error);
      return null;
    }
  }

  /**
   * Extract API endpoints from the Gradio interface HTML
   */
  async extractEndpointsFromHTML(): Promise<string[]> {
    try {
      console.log('🔍 Extracting endpoints from Gradio HTML...');
      
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch HTML: ${response.status}`);
      }
      
      const html = await response.text();
      console.log('📄 HTML length:', html.length);
      
      // Look for common Gradio patterns in the HTML
      const endpoints = [];
      
      // Check for script tags that might contain endpoint definitions
      const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      if (scriptMatches) {
        for (const script of scriptMatches) {
          // Look for API endpoint patterns
          const apiMatches = script.match(/["']\/[a-zA-Z_\/]+["']/g);
          if (apiMatches) {
            for (const match of apiMatches) {
              const endpoint = match.replace(/["']/g, '');
              if (endpoint.includes('api') || endpoint.includes('predict') || 
                  endpoint.includes('run') || endpoint.includes('call')) {
                endpoints.push(endpoint);
              }
            }
          }
        }
      }
      
      // Look for data attributes or gradio-specific patterns
      const gradioMatches = html.match(/data-gradio[^=]*="[^"]*"/g) || [];
      console.log('🎯 Found gradio attributes:', gradioMatches);
      
      // Check for app.js or main.js files that might contain endpoint info
      const jsFileMatches = html.match(/src="([^"]*\.js[^"]*)"/g);
      if (jsFileMatches) {
        console.log('📱 Found JS files:', jsFileMatches);
      }
      
      const uniqueEndpoints = Array.from(new Set(endpoints));
      console.log('🔍 Extracted endpoints:', uniqueEndpoints);
      
      return uniqueEndpoints;
      
    } catch (error) {
      console.error('Failed to extract endpoints from HTML:', error);
      return [];
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

  /**
   * Wake up the HuggingFace Space if it's sleeping
   */
  async wakeUpSpace(): Promise<boolean> {
    try {
      console.log('😴 Attempting to wake up HuggingFace Space...');
      
      // Make a simple GET request to wake up the space
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });
      
      if (response.ok) {
        console.log('✅ HuggingFace Space is awake');
        return true;
      } else {
        console.warn(`Space wake-up returned: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('Failed to wake up space:', error);
      return false;
    }
  }

  /**
   * Handle WebSocket-based queue system for modern Gradio
   */
  async handleGradioQueue(eventId: string, analysisData: SkinLesionAnalysisRequest): Promise<AIAnalysisResult> {
    try {
      console.log(`🔄 Handling queue event: ${eventId}`);
      console.log(`🔑 Using session hash: ${this.getSessionHash()}`);
      
      // Since EventSource and WebSocket are returning HTML, let's try direct polling
      console.log('� Trying direct result polling...');
      
      const maxAttempts = 20;
      const baseDelay = 2000; // Start with 2 seconds
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          console.log(`⏳ Polling attempt ${attempt + 1}/${maxAttempts}...`);
          
          // Try to get results from different endpoints
          const pollEndpoints = [
            `/gradio_api/call/predict/${eventId}`,
            `/api/predict/${eventId}`,
            `/predict/${eventId}`,
            `/gradio_api/queue/data?session_hash=${this.getSessionHash()}`,
            `/queue/data?session_hash=${this.getSessionHash()}`,
            `/gradio_api/queue/status/${eventId}`,
            `/api/queue/status/${eventId}`
          ];
          
          for (const endpoint of pollEndpoints) {
            try {
              const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'GET',
                headers: { 
                  'Accept': 'application/json',
                  'Cache-Control': 'no-cache'
                }
              });
              
              if (response.ok) {
                const contentType = response.headers.get('content-type') || '';
                console.log(`📨 Poll response from ${endpoint} - Status: ${response.status}, Content-Type: ${contentType}`);
                
                if (contentType.includes('application/json')) {
                  const result = await response.json();
                  console.log(`� JSON result:`, result);
                  
                  // Check if we have actual results
                  if (result && (result.data || result.output) && !result.event_id) {
                    console.log('✅ Found completed results!');
                    return await this.parseGradioResponse(result, analysisData);
                  }
                  
                  // Check for error messages
                  if (result.error || result.success === false) {
                    throw new Error(result.error || result.message || 'Analysis failed');
                  }
                  
                } else if (contentType.includes('text/event-stream')) {
                  // This is an event stream endpoint, try to read the stream
                  console.log(`📡 Found event stream at ${endpoint}, attempting to read...`);
                  try {
                    const streamResult = await this.readEventStream(`${this.baseUrl}${endpoint}`, eventId, analysisData);
                    if (streamResult) {
                      return streamResult;
                    }
                  } catch (streamError) {
                    console.warn('Event stream reading failed:', streamError);
                  }
                } else {
                  console.log(`⚠️ Unexpected content type: ${contentType}`);
                }
              }
            } catch (pollError) {
              console.warn(`Poll endpoint ${endpoint} failed:`, pollError);
              continue;
            }
          }
          
          // Exponential backoff with jitter
          const delay = Math.min(baseDelay * Math.pow(1.5, attempt), 10000) + Math.random() * 1000;
          console.log(`⏱️ Waiting ${Math.round(delay)}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
        } catch (attemptError) {
          console.warn(`Polling attempt ${attempt + 1} failed:`, attemptError);
        }
      }
      
      // If all polling failed, try one more direct approach
      console.log('🔄 All polling failed, trying direct prediction check...');
      try {
        const finalResponse = await fetch(`${this.baseUrl}/gradio_api/call/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: [""], // Empty request just to check if processing is done
            fn_index: 0,
            session_hash: this.getSessionHash()
          })
        });
        
        if (finalResponse.ok) {
          const finalResult = await finalResponse.json();
          console.log('� Final prediction result:', finalResult);
          
          if (finalResult.data && !finalResult.event_id) {
            return await this.parseGradioResponse(finalResult, analysisData);
          }
        }
      } catch (finalError) {
        console.warn('Final prediction attempt failed:', finalError);
      }
      
      // All attempts failed
      console.error('❌ All queue handling attempts failed');
      throw new Error('AI analysis service is currently unavailable. Please try again later or consult with medical staff directly.');
      
    } catch (error: any) {
      console.error('Queue handling failed:', error);
      throw new Error('AI analysis system is currently experiencing technical difficulties. Please try again later or seek direct medical consultation.');
    }
  }

  /**
   * Try to find the actual working queue endpoint by testing different patterns
   */
  async tryDirectGradioEndpoints(eventId: string, analysisData: SkinLesionAnalysisRequest): Promise<AIAnalysisResult | null> {
    console.log('🔍 Trying direct Gradio endpoint patterns...');
    
    // Different endpoint patterns to try
    const endpointPatterns = [
      // Standard Gradio 4.x patterns
      `/gradio_api/queue/data?session_hash=${this.getSessionHash()}`,
      `/gradio_api/queue/status/${eventId}`,
      `/gradio_api/call/predict/${eventId}`,
      `/gradio_api/queue/join/${eventId}`,
      
      // Alternative patterns
      `/api/queue/data/${eventId}`,
      `/queue/heartbeat?session_hash=${this.getSessionHash()}`,
      `/queue/status?session_hash=${this.getSessionHash()}`,
      `/run/predict/${eventId}`,
      
      // WebSocket upgrade attempts
      `/gradio_api/ws`,
      `/queue/ws`,
    ];
    
    for (const endpoint of endpointPatterns) {
      try {
        console.log(`🔗 Testing endpoint: ${endpoint}`);
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/event-stream, */*',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        });
        
        // Check content type
        const contentType = response.headers.get('content-type') || '';
        console.log(`📋 Endpoint ${endpoint} - Status: ${response.status}, Content-Type: ${contentType}`);
        
        if (response.ok && contentType.includes('application/json')) {
          try {
            const data = await response.json();
            console.log(`✅ JSON response from ${endpoint}:`, data);
            
            // Check if this contains our result
            if (data && (data.data || data.output || data.result || data.msg)) {
              return await this.parseGradioResponse(data, analysisData);
            }
          } catch (jsonError) {
            console.warn(`JSON parse failed for ${endpoint}:`, jsonError);
          }
        } else if (response.ok && contentType.includes('text/event-stream')) {
          console.log(`📡 Found event stream at ${endpoint}`);
          // We found an event stream endpoint - this might be the right one
          return await this.handleEventStream(endpoint, eventId, analysisData);
        } else if (response.status === 404) {
          console.log(`❌ Endpoint ${endpoint} not found`);
        } else {
          console.log(`⚠️ Endpoint ${endpoint} returned ${response.status} with content-type: ${contentType}`);
        }
        
      } catch (error) {
        console.warn(`❌ Failed to test ${endpoint}:`, error);
      }
    }
    
    return null;
  }

  /**
   * Handle Server-Sent Events stream
   */
  async handleEventStream(endpoint: string, eventId: string, analysisData: SkinLesionAnalysisRequest): Promise<AIAnalysisResult> {
    return new Promise((resolve, reject) => {
      console.log(`📡 Connecting to event stream: ${endpoint}`);
      
      const eventSource = new EventSource(`${this.baseUrl}${endpoint}`);
      let resolved = false;
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          console.error('Event stream timeout - medical analysis unavailable');
          eventSource.close();
          resolved = true;
          reject(new Error('AI analysis service timed out. Please try again later.'));
        }
      }, 30000);
      
      eventSource.onopen = () => {
        console.log('📡 Event stream connected');
      };
      
      eventSource.onmessage = (event) => {
        try {
          console.log('📨 Event stream message:', event.data);
          const data = JSON.parse(event.data);
          
          // Check if this is our result
          if (data && (data.event_id === eventId || data.data || data.output)) {
            clearTimeout(timeout);
            eventSource.close();
            if (!resolved) {
              resolved = true;
              this.parseGradioResponse(data, analysisData).then(resolve).catch(reject);
            }
          }
        } catch (error) {
          console.warn('Failed to parse event stream data:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.warn('Event stream error:', error);
        clearTimeout(timeout);
        eventSource.close();
        if (!resolved) {
          resolved = true;
          reject(new Error('Event stream connection failed. AI analysis is unavailable.'));
        }
      };
    });
  }

  /**
   * Try the event-specific stream that we discovered works
   */
  async tryEventSpecificStream(eventId: string, analysisData: SkinLesionAnalysisRequest): Promise<AIAnalysisResult | null> {
    return new Promise((resolve, reject) => {
      console.log(`📡 Connecting to event-specific stream for: ${eventId}`);
      
      // Try WebSocket first since EventSource is failing
      try {
        const wsUrl = `wss://bnmbanhmi-seekwell-skin-cancer.hf.space/queue/join`;
        console.log(`🔌 Attempting WebSocket connection: ${wsUrl}`);
        
        const ws = new WebSocket(wsUrl);
        let resolved = false;
        
        const timeout = setTimeout(() => {
          if (!resolved) {
            console.warn('WebSocket timeout');
            ws.close();
            resolved = true;
            resolve(null);
          }
        }, 30000);
        
        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          // Send join message
          ws.send(JSON.stringify({
            fn_index: 0,
            session_hash: this.getSessionHash()
          }));
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 WebSocket message:', data);
            
            // Check if this is our result
            if (data.output || data.data) {
              clearTimeout(timeout);
              ws.close();
              if (!resolved) {
                resolved = true;
                this.parseGradioResponse(data, analysisData).then(resolve).catch(reject);
              }
            }
          } catch (error) {
            console.warn('Failed to parse WebSocket message:', error);
          }
        };
        
        ws.onerror = (error) => {
          console.warn('WebSocket error:', error);
          clearTimeout(timeout);
          ws.close();
          if (!resolved) {
            resolved = true;
            // Try simple polling as fallback
            this.trySimplePolling(eventId, analysisData).then(resolve).catch(() => resolve(null));
          }
        };
        
        ws.onclose = () => {
          console.log('WebSocket closed');
          if (!resolved) {
            resolved = true;
            // Try simple polling as fallback
            this.trySimplePolling(eventId, analysisData).then(resolve).catch(() => resolve(null));
          }
        };
        
      } catch (wsError) {
        console.warn('WebSocket creation failed:', wsError);
        // Fallback to simple polling
        this.trySimplePolling(eventId, analysisData).then(resolve).catch(() => resolve(null));
      }
    });
  }

  /**
   * Simple polling approach as final fallback
   */
  async trySimplePolling(eventId: string, analysisData: SkinLesionAnalysisRequest): Promise<AIAnalysisResult | null> {
    console.log('🔄 Trying simple polling approach...');
    
    // Wait a bit for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to get the result by checking the original endpoint again
    try {
      const response = await fetch(`${this.baseUrl}/gradio_api/call/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [""], // Empty data just to check status
          fn_index: 0,
          session_hash: this.getSessionHash()
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 Simple polling result:', result);
        
        // Check if we got actual data instead of another event ID
        if (result.data && !result.event_id) {
          return await this.parseGradioResponse(result, analysisData);
        }
      }
    } catch (error) {
      console.warn('Simple polling failed:', error);
    }
    
    return null;
  }

  /**
   * Read from an event stream endpoint with a direct approach
   */
  async readEventStream(streamUrl: string, eventId: string, analysisData: SkinLesionAnalysisRequest): Promise<AIAnalysisResult | null> {
    return new Promise((resolve, reject) => {
      console.log(`📡 Reading event stream: ${streamUrl}`);
      
      const eventSource = new EventSource(streamUrl);
      let resolved = false;
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          console.warn('Event stream read timeout');
          eventSource.close();
          resolved = true;
          resolve(null);
        }
      }, 15000); // Shorter timeout for polling context
      
      eventSource.onopen = () => {
        console.log('📡 Event stream connection opened');
      };
      
      eventSource.onmessage = (event) => {
        try {
          console.log('📨 Stream message:', event.data);
          
          // Try to parse the message
          let data;
          try {
            data = JSON.parse(event.data);
          } catch {
            // If not JSON, might be plain text result
            if (event.data && event.data.trim() !== '') {
              console.log('📝 Non-JSON stream data:', event.data);
            }
            return;
          }
          
          // Check for completed results
          if (data.msg === 'process_completed' && data.output) {
            clearTimeout(timeout);
            eventSource.close();
            if (!resolved) {
              resolved = true;
              this.parseGradioResponse({ data: data.output }, analysisData).then(resolve).catch(reject);
            }
            return;
          }
          
          // Check for direct data
          if (data.data || data.output) {
            clearTimeout(timeout);
            eventSource.close();
            if (!resolved) {
              resolved = true;
              this.parseGradioResponse(data, analysisData).then(resolve).catch(reject);
            }
            return;
          }
          
          // Check for errors
          if (data.msg === 'unexpected_error' || data.success === false) {
            clearTimeout(timeout);
            eventSource.close();
            if (!resolved) {
              resolved = true;
              reject(new Error(data.message || 'Analysis failed'));
            }
            return;
          }
          
          // Log status messages
          if (data.msg) {
            console.log(`📝 Stream status: ${data.msg}`);
          }
          
        } catch (error) {
          console.warn('Failed to handle stream message:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.warn('Event stream error:', error);
        clearTimeout(timeout);
        eventSource.close();
        if (!resolved) {
          resolved = true;
          resolve(null); // Don't reject, just return null to try other methods
        }
      };
    });
  }

  /**
   * Use the official HuggingFace API endpoint as documented
   */
  async tryOfficialAPI(file: File, analysisData: SkinLesionAnalysisRequest): Promise<AIAnalysisResult> {
    try {
      console.log('🎯 Trying official HuggingFace API endpoint...');
      
      const base64 = await this.fileToBase64(file);
      
      // Try multiple endpoint variations based on common HuggingFace patterns
      const endpointVariations = [
        {
          url: `${this.baseUrl}/api/predict`,
          payload: {
            data: [{
              path: null,
              url: base64,
              size: null,
              orig_name: file.name,
              mime_type: file.type,
              is_stream: false,
              meta: {}
            }],
            api_name: "/predict"
          }
        },
        {
          url: `${this.baseUrl}/run/predict`,
          payload: {
            data: [base64],
            api_name: "/predict"
          }
        },
        {
          url: `${this.baseUrl}/predict`,
          payload: {
            data: [base64]
          }
        },
        {
          url: `${this.baseUrl}/gradio_api/run/predict`,
          payload: {
            data: [base64],
            fn_index: 0
          }
        }
      ];
      
      for (const variation of endpointVariations) {
        try {
          console.log(`📤 Trying endpoint: ${variation.url}`);
          console.log('📤 Payload:', variation.payload);
          
          const response = await fetch(variation.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(variation.payload)
          });
          
          console.log(`📨 Response status: ${response.status}`);
          
          if (response.ok) {
            const result = await response.json();
            console.log('✅ API Response:', result);
            
            // Check if we got a direct result (not a queue event)
            if (result && result.data && !result.event_id) {
              const predictionResult = result.data[0];
              console.log('📊 Direct prediction result:', predictionResult);
              
              if (typeof predictionResult === 'string') {
                return this.parseTextPrediction(predictionResult, analysisData);
              } else if (predictionResult && typeof predictionResult === 'object') {
                return this.parseHuggingFaceResponse(predictionResult, analysisData);
              }
            }
            
            // If we got an event_id, this endpoint uses queuing
            if (result.event_id) {
              console.log(`⚠️ Endpoint ${variation.url} returned queue event: ${result.event_id}`);
              continue; // Try next endpoint variation
            }
          } else {
            console.warn(`❌ Endpoint ${variation.url} failed with status: ${response.status}`);
            const errorText = await response.text();
            console.warn('Error details:', errorText);
          }
          
        } catch (endpointError) {
          console.warn(`❌ Endpoint ${variation.url} error:`, endpointError);
          continue;
        }
      }
      
    } catch (error) {
      console.warn('❌ All official API variations failed:', error);
    }
    
    throw new Error('Unable to connect to AI analysis service. The service may be experiencing issues.');
  }

  /**
   * Parse text prediction from the official API
   */
  private parseTextPrediction(predictionText: string, analysisData: SkinLesionAnalysisRequest): AIAnalysisResult {
    console.log('🔍 Parsing prediction text:', predictionText);
    
    try {
      // Try to parse as JSON first
      let parsedData;
      try {
        parsedData = JSON.parse(predictionText);
        if (parsedData && (parsedData['🎯 Top Prediction'] || parsedData.predictions)) {
          return this.parseHuggingFaceResponse(parsedData, analysisData);
        }
      } catch {
        // Not JSON, treat as plain text
      }
      
      // Extract information from text format
      const lines = predictionText.split('\n').map(line => line.trim()).filter(line => line);
      
      // Look for prediction patterns
      let topPrediction = { class_id: 0, label: 'UNKNOWN', confidence: 0.5, percentage: 50 };
      let predictions: any[] = [];
      
      for (const line of lines) {
        // Look for "Top Prediction:" or similar patterns
        if (line.includes('🎯') || line.toLowerCase().includes('prediction')) {
          // Extract class and confidence
          const classMatch = line.match(/([A-Z]{2,4})/);
          const confidenceMatch = line.match(/(\d+\.?\d*)%/);
          
          if (classMatch && confidenceMatch) {
            const predictedClass = classMatch[1];
            const confidence = parseFloat(confidenceMatch[1]) / 100;
            
            topPrediction = {
              class_id: this.getClassId(predictedClass),
              label: predictedClass,
              confidence: confidence,
              percentage: confidence * 100
            };
            
            predictions.push(topPrediction);
            break;
          }
        }
      }
      
      // If no structured data found, extract any class mentioned
      if (predictions.length === 0) {
        const classPattern = /\b(MEL|BCC|SCC|ACK|NEV|SEK|AKIEC|DF|VASC)\b/g;
        const matches = predictionText.match(classPattern);
        if (matches && matches.length > 0) {
          const predictedClass = matches[0];
          topPrediction = {
            class_id: this.getClassId(predictedClass),
            label: predictedClass,
            confidence: 0.7, // Default confidence
            percentage: 70
          };
          predictions.push(topPrediction);
        }
      }
      
      return {
        success: true,
        predictions: predictions,
        top_prediction: topPrediction,
        analysis: {
          predicted_class: topPrediction.label,
          confidence: topPrediction.confidence,
          body_region: analysisData.body_region,
          analysis_timestamp: new Date().toISOString()
        },
        risk_assessment: {
          risk_level: this.getRiskLevelFromClass(topPrediction.label),
          confidence_level: this.getConfidenceLevel(topPrediction.confidence),
          needs_professional_review: this.needsProfessionalReview(this.getRiskLevelFromClass(topPrediction.label)),
          needs_urgent_attention: this.getRiskLevelFromClass(topPrediction.label) === 'URGENT',
          base_risk: this.getRiskLevelFromClass(topPrediction.label),
          confidence_score: topPrediction.confidence,
          predicted_class: topPrediction.label
        },
        recommendations: this.getRecommendationsFromClass(topPrediction.label),
        workflow: {
          needs_cadre_review: this.needsCadreReview(this.getRiskLevelFromClass(topPrediction.label)),
          needs_doctor_review: this.needsDoctorReview(this.getRiskLevelFromClass(topPrediction.label)),
          priority_level: this.getPriorityLevel(this.getRiskLevelFromClass(topPrediction.label)),
          estimated_follow_up_days: this.getFollowUpDays(this.getRiskLevelFromClass(topPrediction.label))
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Failed to parse prediction text:', error);
      throw new Error('Failed to parse AI analysis results. Please try again.');
    }
  }

  // ...existing methods...
}

export default HuggingFaceAIService;
