import axios from 'axios';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

export interface PatientInfo {
  patient_id: number;
  full_name: string;
  email?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  identification_id?: string;
  health_insurance_card_no?: string;
  age?: number;
}

export interface AnalysisResult {
  id: string;
  userId: string;
  patientName?: string;
  image: string;
  result: {
    disease: string;
    confidence: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    recommendations: string[];
    description: string;
  };
  timestamp: string;
  date: string;
}

export interface PatientMonitoringData {
  patient: PatientInfo;
  analysisHistory: AnalysisResult[];
  urgentCases: AnalysisResult[];
  totalAnalyses: number;
  lastAnalysisDate?: string;
}

class PatientMonitoringService {
  
  async getPatientInfo(patientId: number): Promise<PatientInfo | null> {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BACKEND_URL}/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const backendData = response.data;
      // Transform backend data structure to frontend expectations
      return {
        patient_id: backendData.patient_id,
        full_name: backendData.user?.full_name || '',
        email: backendData.user?.email || '',
        phone_number: backendData.phone_number,
        date_of_birth: backendData.date_of_birth,
        gender: backendData.gender,
        identification_id: backendData.identification_id,
        health_insurance_card_no: backendData.health_insurance_card_no,
        age: backendData.age
      };
    } catch (error) {
      console.error('Error getting patient info:', error);
      return null;
    }
  }

  async getAllPatients(): Promise<PatientInfo[]> {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BACKEND_URL}/patients/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Transform each patient in the array
      return response.data.map((backendData: any) => ({
        patient_id: backendData.patient_id,
        full_name: backendData.user?.full_name || '',
        email: backendData.user?.email || '',
        phone_number: backendData.phone_number,
        date_of_birth: backendData.date_of_birth,
        gender: backendData.gender,
        identification_id: backendData.identification_id,
        health_insurance_card_no: backendData.health_insurance_card_no,
        age: backendData.age
      }));
    } catch (error) {
      console.error('Error getting all patients:', error);
      return [];
    }
  }

  async searchPatients(searchTerm: string): Promise<PatientInfo[]> {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BACKEND_URL}/patients/search/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: searchTerm },
      });
      
      // Transform each patient in the search results
      return response.data.map((backendData: any) => ({
        patient_id: backendData.patient_id,
        full_name: backendData.user?.full_name || '',
        email: backendData.user?.email || '',
        phone_number: backendData.phone_number,
        date_of_birth: backendData.date_of_birth,
        gender: backendData.gender,
        identification_id: backendData.identification_id,
        health_insurance_card_no: backendData.health_insurance_card_no,
        age: backendData.age
      }));
    } catch (error) {
      console.error('Error searching patients:', error);
      return [];
    }
  }

  getPatientAnalysisHistory(patientId: string): AnalysisResult[] {
    try {
      const historyKey = `seekwell_analysis_history_${patientId}`;
      const historyData = localStorage.getItem(historyKey);
      
      if (!historyData) return [];
      
      const analyses = JSON.parse(historyData);
      if (!Array.isArray(analyses)) return [];
      
      // Transform AIAnalysisResult format to AnalysisResult format
      return analyses.map((analysis: any, index: number) => {
        const topPrediction = analysis.top_prediction || analysis.predictions?.[0];
        const riskLevel = analysis.risk_assessment?.risk_level;
        
        // Map risk levels
        let mappedRiskLevel: 'Low' | 'Medium' | 'High' = 'Low';
        if (riskLevel === 'HIGH' || riskLevel === 'URGENT') {
          mappedRiskLevel = 'High';
        } else if (riskLevel === 'MEDIUM') {
          mappedRiskLevel = 'Medium';
        }
        
        return {
          id: analysis.id || `analysis_${patientId}_${index}`,
          userId: patientId,
          image: analysis.image_url || analysis.image || '',
          result: {
            disease: topPrediction?.label || 'Unknown',
            confidence: topPrediction?.confidence || topPrediction?.percentage || 0,
            riskLevel: mappedRiskLevel,
            recommendations: analysis.risk_assessment?.recommendations || [],
            description: topPrediction?.label || 'No description available'
          },
          timestamp: analysis.analysis?.analysis_timestamp || analysis.timestamp || new Date().toISOString(),
          date: analysis.analysis?.analysis_timestamp || analysis.timestamp || new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Error getting patient analysis history:', error);
      return [];
    }
  }

  async getPatientAnalysisFromBackend(patientId: number): Promise<AnalysisResult[]> {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BACKEND_URL}/patients/${patientId}/analysis`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Transform backend data to frontend format if needed
      return response.data.map((item: any) => ({
        id: item.result_id?.toString() || item.id?.toString() || Math.random().toString(),
        userId: patientId.toString(),
        image: item.image_url || '',
        result: {
          disease: item.prediction || 'Unknown',
          confidence: item.confidence_score || 0,
          riskLevel: item.risk_level || 'Low',
          recommendations: [], // TODO: Add recommendations field to backend
          description: item.prediction || 'No description available'
        },
        timestamp: item.created_at || new Date().toISOString(),
        date: item.created_at || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error getting patient analysis from backend:', error);
      return [];
    }
  }

  async getPatientMonitoringData(patientId: number): Promise<PatientMonitoringData | null> {
    try {
      // Get patient info from backend
      const patient = await this.getPatientInfo(patientId);
      if (!patient) return null;

      const currentRole = localStorage.getItem('role');
      
      let analysisHistory: AnalysisResult[] = [];
      
      // For all users (including officials), try to get analysis data from localStorage first
      // This ensures we get the same data as the urgent cases page
      const localStorageHistory = this.getPatientAnalysisHistory(patientId.toString());
      
      if (localStorageHistory.length > 0) {
        // Use localStorage data if available
        analysisHistory = localStorageHistory;
      } else if (currentRole !== 'PATIENT') {
        // If no localStorage data and user is official/doctor, try backend
        analysisHistory = await this.getPatientAnalysisFromBackend(patientId);
      }
      
      // Filter urgent cases (High risk level)
      const urgentCases = analysisHistory.filter(analysis => 
        analysis.result?.riskLevel === 'High'
      );

      // Sort by date (most recent first)
      analysisHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      urgentCases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        patient,
        analysisHistory,
        urgentCases,
        totalAnalyses: analysisHistory.length,
        lastAnalysisDate: analysisHistory.length > 0 ? analysisHistory[0].date : undefined
      };
    } catch (error) {
      console.error('Error getting patient monitoring data:', error);
      return null;
    }
  }

  async getAllPatientsWithAnalysisData(): Promise<PatientMonitoringData[]> {
    try {
      const patients = await this.getAllPatients();
      const patientsData: PatientMonitoringData[] = [];
      
      for (const patient of patients) {
        // For officials/doctors viewing patients, we don't have analysis data from backend yet
        // So we'll create basic patient data structure
        const patientData: PatientMonitoringData = {
          patient,
          analysisHistory: [], // TODO: Implement backend endpoint for patient analysis history
          urgentCases: [], // TODO: Implement backend endpoint for urgent cases
          totalAnalyses: 0,
          lastAnalysisDate: undefined
        };
        patientsData.push(patientData);
      }
      
      return patientsData;
    } catch (error) {
      console.error('Error getting patients with analysis data:', error);
      return [];
    }
  }
}

export default new PatientMonitoringService();
