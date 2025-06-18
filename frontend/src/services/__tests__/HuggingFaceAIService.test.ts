/**
 * Tests for HuggingFace AI Service
 * 
 * This file contains unit tests for validating the HuggingFace API integration
 * based on the official Gradio API documentation.
 */

import HuggingFaceAIService from '../HuggingFaceAIService';

describe('HuggingFaceAIService', () => {
  let service: HuggingFaceAIService;

  beforeEach(() => {
    service = new HuggingFaceAIService();
  });

  describe('Configuration', () => {
    test('should have correct API endpoint', async () => {
      const endpointInfo = await service.discoverEndpoint();
      expect(endpointInfo.discovered_endpoint).toBe('/api/predict');
      expect(endpointInfo.base_url).toBe('https://bnmbanhmi-seekwell-skin-cancer.hf.space');
      expect(endpointInfo.full_url).toBe('https://bnmbanhmi-seekwell-skin-cancer.hf.space/api/predict');
      expect(endpointInfo.api_documentation).toContain('official Gradio API');
    });

    test('should have correct space information', async () => {
      const spaceInfo = await service.getSpaceInfo();
      expect(spaceInfo.space_id).toBe('bnmbanhmi/seekwell-skin-cancer');
      expect(spaceInfo.url).toBe('https://bnmbanhmi-seekwell-skin-cancer.hf.space');
      expect(spaceInfo.api_endpoint).toBe('/api/predict');
    });
  });

  describe('Health Checks', () => {
    test('should be able to check service health', async () => {
      const healthStatus = await service.healthCheck();
      expect(healthStatus).toHaveProperty('status');
      expect(healthStatus).toHaveProperty('is_ready');
      expect(typeof healthStatus.status).toBe('string');
      expect(typeof healthStatus.is_ready).toBe('boolean');
    });

    test('should be able to test connection', async () => {
      const connectionTest = await service.testConnection();
      expect(connectionTest).toHaveProperty('success');
      expect(typeof connectionTest.success).toBe('boolean');
    });
  });

  describe('API Response Parsing', () => {
    test('should parse classification results correctly', () => {
      // Mock a typical response from the HuggingFace API
      const mockResponse = {
        data: ["Classification Results:\n\nMEL: 85.32%\nBCC: 10.15%\nSCC: 3.21%\nNEV: 1.12%\nACK: 0.15%\nSEK: 0.05%"]
      };

      const analysisData = {
        body_region: 'arm',
        description: 'test lesion',
        symptoms: [],
        duration: '1 week',
        changes_observed: []
      };

      // Test the private parseAPIResponse method through reflection
      const result = (service as any).parseAPIResponse(mockResponse, analysisData);
      
      expect(result.success).toBe(true);
      expect(result.predictions).toBeDefined();
      expect(result.top_prediction).toBeDefined();
      expect(result.risk_assessment).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    test('should handle error responses gracefully', () => {
      const invalidResponse = { error: 'Invalid input' };
      const analysisData = {
        body_region: 'arm',
        description: 'test lesion',
        symptoms: [],
        duration: '1 week',
        changes_observed: []
      };

      expect(() => {
        (service as any).parseAPIResponse(invalidResponse, analysisData);
      }).toThrow();
    });
  });

  describe('Risk Assessment', () => {
    test('should classify melanoma as URGENT', () => {
      const riskLevel = (service as any).getRiskLevel('Melanoma');
      expect(riskLevel).toBe('URGENT');
    });

    test('should classify carcinomas as HIGH', () => {
      const bccRisk = (service as any).getRiskLevel('Basal cell carcinoma');
      const sccRisk = (service as any).getRiskLevel('Squamous cell carcinoma');
      expect(bccRisk).toBe('HIGH');
      expect(sccRisk).toBe('HIGH');
    });

    test('should classify keratoses as MEDIUM', () => {
      const ackRisk = (service as any).getRiskLevel('Actinic keratoses');
      expect(ackRisk).toBe('MEDIUM');
    });

    test('should classify benign lesions as LOW', () => {
      const nevRisk = (service as any).getRiskLevel('Nevus/Mole');
      const sekRisk = (service as any).getRiskLevel('Seborrheic keratosis');
      expect(nevRisk).toBe('LOW');
      expect(sekRisk).toBe('LOW');
    });
  });

  describe('Workflow Logic', () => {
    test('should require professional review for high-risk cases', () => {
      expect((service as any).needsProfessionalReview('URGENT')).toBe(true);
      expect((service as any).needsProfessionalReview('HIGH')).toBe(true);
      expect((service as any).needsProfessionalReview('MEDIUM')).toBe(false);
      expect((service as any).needsProfessionalReview('LOW')).toBe(false);
    });

    test('should require cadre review for medium+ risk cases', () => {
      expect((service as any).needsCadreReview('URGENT')).toBe(true);
      expect((service as any).needsCadreReview('HIGH')).toBe(true);
      expect((service as any).needsCadreReview('MEDIUM')).toBe(true);
      expect((service as any).needsCadreReview('LOW')).toBe(false);
    });

    test('should set correct follow-up days', () => {
      expect((service as any).getFollowUpDays('URGENT')).toBe(1);
      expect((service as any).getFollowUpDays('HIGH')).toBe(14);
      expect((service as any).getFollowUpDays('MEDIUM')).toBe(30);
      expect((service as any).getFollowUpDays('LOW')).toBe(90);
    });
  });
});

// Integration test example (requires actual network access)
describe('HuggingFaceAIService Integration', () => {
  let service: HuggingFaceAIService;

  beforeEach(() => {
    service = new HuggingFaceAIService();
  });

  // This test should be skipped in CI/CD unless we have a stable test environment
  test.skip('should connect to actual HuggingFace space', async () => {
    const healthCheck = await service.healthCheck();
    expect(healthCheck.is_ready).toBe(true);
  }, 10000); // 10 second timeout

  test.skip('should wake up the space successfully', async () => {
    const wakeUpResult = await service.wakeUpSpace();
    expect(typeof wakeUpResult).toBe('boolean');
  }, 15000); // 15 second timeout for cold start
});
