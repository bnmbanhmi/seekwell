// Service to aggregate analysis data across all users for officials/admins
import HuggingFaceAIService from './HuggingFaceAIService';
import PatientMonitoringService from './PatientMonitoringService';
import { AIAnalysisResult } from '../types/AIAnalysisTypes';

export interface UrgentCase {
  patientId: number;
  patientName?: string;
  riskLevel: 'HIGH' | 'URGENT';
  disease: string;
  date: string;
  confidence: number;
}

export interface DiseaseStats {
  [key: string]: number;
}

export class OfficialAnalyticsService {
  /**
   * Get all urgent cases from localStorage across all users with real patient names
   */
  static async getUrgentCasesFromStorage(): Promise<UrgentCase[]> {
    const urgentCases: UrgentCase[] = [];
    
    try {
      // Get all localStorage keys that match our analysis history pattern
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('seekwell_analysis_history_')) {
          const userId = key.replace('seekwell_analysis_history_', '');
          const historyStr = localStorage.getItem(key);
          
          if (historyStr) {
            const userHistory: AIAnalysisResult[] = JSON.parse(historyStr);
            
            // Filter for urgent and high-risk cases
            const userUrgentCases = userHistory.filter(analysis => 
              analysis.risk_assessment?.risk_level === 'URGENT' || 
              analysis.risk_assessment?.risk_level === 'HIGH'
            );
            
            // Get real patient name from backend
            let patientName = `Patient ${userId}`;
            try {
              const patientInfo = await PatientMonitoringService.getPatientInfo(parseInt(userId, 10));
              if (patientInfo && patientInfo.full_name) {
                patientName = patientInfo.full_name;
              }
            } catch (error) {
              console.log(`Could not fetch name for patient ${userId}, using default`);
            }
            
            // Convert to UrgentCase format
            userUrgentCases.forEach(analysis => {
              const topPrediction = analysis.top_prediction || analysis.predictions?.[0];
              
              urgentCases.push({
                patientId: parseInt(userId, 10),
                patientName: patientName,
                riskLevel: analysis.risk_assessment.risk_level as 'HIGH' | 'URGENT',
                disease: topPrediction?.label || 'Unknown',
                date: analysis.analysis?.analysis_timestamp || analysis.timestamp || new Date().toISOString(),
                confidence: topPrediction?.confidence || topPrediction?.percentage || 0
              });
            });
          }
        }
      }
      
      // Sort by date (newest first)
      urgentCases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
    } catch (error) {
      console.error('Error aggregating urgent cases:', error);
    }
    
    return urgentCases;
  }

  /**
   * Get disease statistics across all users
   */
  static getDiseaseStatsFromStorage(): DiseaseStats {
    const diseaseStats: DiseaseStats = {};
    
    try {
      // Get all localStorage keys that match our analysis history pattern
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('seekwell_analysis_history_')) {
          const historyStr = localStorage.getItem(key);
          
          if (historyStr) {
            const userHistory: AIAnalysisResult[] = JSON.parse(historyStr);
            
            // Count diseases for this user
            userHistory.forEach(analysis => {
              const topPrediction = analysis.top_prediction || analysis.predictions?.[0];
              const disease = topPrediction?.label || 'Unknown';
              
              diseaseStats[disease] = (diseaseStats[disease] || 0) + 1;
            });
          }
        }
      }
      
    } catch (error) {
      console.error('Error aggregating disease stats:', error);
    }
    
    return diseaseStats;
  }

  /**
   * Get total number of analyses across all users
   */
  static getTotalAnalysesCount(): number {
    let totalCount = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('seekwell_analysis_history_')) {
          const historyStr = localStorage.getItem(key);
          
          if (historyStr) {
            const userHistory: AIAnalysisResult[] = JSON.parse(historyStr);
            totalCount += userHistory.length;
          }
        }
      }
    } catch (error) {
      console.error('Error counting total analyses:', error);
    }
    
    return totalCount;
  }

  /**
   * Get comprehensive dashboard data for officials
   */
  static async getOfficialDashboardData(backendStats?: any) {
    const urgentCases = await this.getUrgentCasesFromStorage();
    const diseaseStats = this.getDiseaseStatsFromStorage();
    const totalAnalyses = this.getTotalAnalysesCount();
    
    return {
      ...backendStats, // Include backend stats (totalPatients, etc.)
      urgentCases,
      urgentCasesCount: urgentCases.length,
      diseaseStats,
      totalAnalyses
    };
  }
}

export default OfficialAnalyticsService;
