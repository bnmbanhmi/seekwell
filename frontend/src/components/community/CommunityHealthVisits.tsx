import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './CommunityHealthVisits.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface Patient {
  id: number;
  full_name: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  village?: string;
  district?: string;
}

interface HealthWorker {
  doctor_id: number;
  doctor_name: string;
  specialization?: string;
  is_community_health_worker: boolean;
}

interface CommunityVisit {
  id: string;
  patient: Patient;
  health_worker: HealthWorker;
  visit_type: 'routine' | 'high-risk' | 'follow-up' | 'ai-referral';
  visit_time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  ai_risk_assessment?: {
    risk_level: string;
    confidence_score: number;
    predicted_class: string;
  };
  vital_signs?: {
    blood_pressure?: string;
    temperature?: string;
    pulse_rate?: string;
    weight?: string;
  };
}

const CommunityHealthVisits: React.FC = () => {
  const [visits, setVisits] = useState<CommunityVisit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [healthWorkers, setHealthWorkers] = useState<HealthWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'high-risk' | 'schedule'>('today');
  const [showNewVisitForm, setShowNewVisitForm] = useState(false);
  
  // Form state for new visit
  const [newVisit, setNewVisit] = useState({
    patient_id: '',
    health_worker_id: '',
    visit_type: 'routine' as const,
    notes: '',
    scheduled_time: '',
  });

  useEffect(() => {
    fetchTodayVisits();
    fetchPatients();
    fetchHealthWorkers();
  }, []);

  const fetchTodayVisits = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const today = new Date().toISOString().split('T')[0];
      
      // This would be a new endpoint for community health visits
      const response = await axios.get(`${BACKEND_URL}/community/visits?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setVisits(response.data);
    } catch (err) {
      console.error('Failed to fetch visits:', err);
      // For now, use mock data for demonstration
      setVisits(getMockVisits());
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BACKEND_URL}/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatients(response.data);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  };

  const fetchHealthWorkers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BACKEND_URL}/doctors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHealthWorkers(response.data);
    } catch (err) {
      console.error('Failed to fetch health workers:', err);
    }
  };

  const getMockVisits = (): CommunityVisit[] => [
    {
      id: '1',
      patient: {
        id: 1,
        full_name: 'Nguyen Van A',
        phone_number: '0123456789',
        village: 'Dong Da',
        district: 'Ha Noi',
        gender: 'Male',
        date_of_birth: '1985-03-15'
      },
      health_worker: {
        doctor_id: 1,
        doctor_name: 'Dr. Tran Thi B',
        specialization: 'Community Health',
        is_community_health_worker: true
      },
      visit_type: 'ai-referral',
      visit_time: new Date().toISOString(),
      status: 'scheduled',
      ai_risk_assessment: {
        risk_level: 'HIGH',
        confidence_score: 0.87,
        predicted_class: 'Melanoma'
      },
      notes: 'AI analysis indicated high-risk skin lesion requiring immediate attention'
    },
    {
      id: '2',
      patient: {
        id: 2,
        full_name: 'Le Thi C',
        phone_number: '0987654321',
        village: 'Ba Dinh',
        district: 'Ha Noi',
        gender: 'Female',
        date_of_birth: '1990-07-22'
      },
      health_worker: {
        doctor_id: 2,
        doctor_name: 'Cadre Pham Van D',
        specialization: 'Community Health Worker',
        is_community_health_worker: true
      },
      visit_type: 'routine',
      visit_time: new Date().toISOString(),
      status: 'in-progress',
      vital_signs: {
        blood_pressure: '120/80',
        temperature: '36.5°C',
        pulse_rate: '72 bpm',
        weight: '58 kg'
      }
    }
  ];

  const handleStartVisit = async (visitId: string) => {
    try {
      setVisits(prev => prev.map(visit => 
        visit.id === visitId 
          ? { ...visit, status: 'in-progress' as const }
          : visit
      ));
      
      // In a real app, this would update the backend
      console.log('Started visit:', visitId);
    } catch (err) {
      console.error('Failed to start visit:', err);
    }
  };

  const handleCompleteVisit = async (visitId: string) => {
    try {
      setVisits(prev => prev.map(visit => 
        visit.id === visitId 
          ? { ...visit, status: 'completed' as const }
          : visit
      ));
      
      // In a real app, this would update the backend and possibly create EMR
      console.log('Completed visit:', visitId);
    } catch (err) {
      console.error('Failed to complete visit:', err);
    }
  };

  const handleScheduleNewVisit = async () => {
    try {
      const visitData = {
        ...newVisit,
        id: Date.now().toString(),
        patient: patients.find(p => p.id.toString() === newVisit.patient_id),
        health_worker: healthWorkers.find(hw => hw.doctor_id.toString() === newVisit.health_worker_id),
        visit_time: newVisit.scheduled_time,
        status: 'scheduled' as const,
      };

      setVisits(prev => [...prev, visitData as CommunityVisit]);
      setShowNewVisitForm(false);
      setNewVisit({
        patient_id: '',
        health_worker_id: '',
        visit_type: 'routine',
        notes: '',
        scheduled_time: '',
      });
    } catch (err) {
      console.error('Failed to schedule visit:', err);
    }
  };

  const getVisitsByType = () => {
    switch (activeTab) {
      case 'high-risk':
        return visits.filter(v => v.visit_type === 'ai-referral' || v.visit_type === 'high-risk');
      case 'schedule':
        return visits.filter(v => v.status === 'scheduled');
      default:
        return visits;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#2196F3';
      case 'in-progress': return '#FF9800';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#757575';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH': return '#F44336';
      case 'MEDIUM': return '#FF9800';
      case 'LOW': return '#4CAF50';
      default: return '#757575';
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading community health visits...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Community Health Visits</h2>
        <button 
          className={styles.scheduleButton}
          onClick={() => setShowNewVisitForm(true)}
        >
          Schedule New Visit
        </button>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'today' ? styles.active : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Today's Visits ({visits.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'high-risk' ? styles.active : ''}`}
          onClick={() => setActiveTab('high-risk')}
        >
          High-Risk Cases ({visits.filter(v => v.visit_type === 'ai-referral' || v.visit_type === 'high-risk').length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'schedule' ? styles.active : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          Scheduled ({visits.filter(v => v.status === 'scheduled').length})
        </button>
      </div>

      <div className={styles.visitsList}>
        {getVisitsByType().map(visit => (
          <div key={visit.id} className={styles.visitCard}>
            <div className={styles.visitHeader}>
              <div className={styles.patientInfo}>
                <h3>{visit.patient.full_name}</h3>
                <p>{visit.patient.village}, {visit.patient.district}</p>
              </div>
              <div className={styles.visitStatus}>
                <span 
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(visit.status) }}
                >
                  {visit.status.toUpperCase()}
                </span>
                {visit.ai_risk_assessment && (
                  <span 
                    className={styles.riskBadge}
                    style={{ backgroundColor: getRiskColor(visit.ai_risk_assessment.risk_level) }}
                  >
                    {visit.ai_risk_assessment.risk_level} RISK
                  </span>
                )}
              </div>
            </div>

            <div className={styles.visitDetails}>
              <div className={styles.detailRow}>
                <strong>Health Worker:</strong> {visit.health_worker.doctor_name}
                {visit.health_worker.is_community_health_worker && (
                  <span className={styles.chwBadge}>CHW</span>
                )}
              </div>
              <div className={styles.detailRow}>
                <strong>Visit Type:</strong> {visit.visit_type.replace('-', ' ').toUpperCase()}
              </div>
              <div className={styles.detailRow}>
                <strong>Time:</strong> {new Date(visit.visit_time).toLocaleString()}
              </div>
              
              {visit.notes && (
                <div className={styles.detailRow}>
                  <strong>Notes:</strong> {visit.notes}
                </div>
              )}

              {visit.ai_risk_assessment && (
                <div className={styles.aiAssessment}>
                  <strong>AI Assessment:</strong>
                  <div>Predicted: {visit.ai_risk_assessment.predicted_class}</div>
                  <div>Confidence: {(visit.ai_risk_assessment.confidence_score * 100).toFixed(1)}%</div>
                </div>
              )}

              {visit.vital_signs && (
                <div className={styles.vitalSigns}>
                  <strong>Vital Signs:</strong>
                  <div className={styles.vitalsGrid}>
                    {visit.vital_signs.blood_pressure && (
                      <span>BP: {visit.vital_signs.blood_pressure}</span>
                    )}
                    {visit.vital_signs.temperature && (
                      <span>Temp: {visit.vital_signs.temperature}</span>
                    )}
                    {visit.vital_signs.pulse_rate && (
                      <span>Pulse: {visit.vital_signs.pulse_rate}</span>
                    )}
                    {visit.vital_signs.weight && (
                      <span>Weight: {visit.vital_signs.weight}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.visitActions}>
              {visit.status === 'scheduled' && (
                <button 
                  className={styles.startButton}
                  onClick={() => handleStartVisit(visit.id)}
                >
                  Start Visit
                </button>
              )}
              {visit.status === 'in-progress' && (
                <button 
                  className={styles.completeButton}
                  onClick={() => handleCompleteVisit(visit.id)}
                >
                  Complete Visit
                </button>
              )}
              {visit.status === 'completed' && (
                <button className={styles.viewEMRButton}>
                  View EMR
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showNewVisitForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Schedule New Community Health Visit</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleScheduleNewVisit(); }}>
              <div className={styles.formGroup}>
                <label>Patient:</label>
                <select 
                  value={newVisit.patient_id}
                  onChange={(e) => setNewVisit({...newVisit, patient_id: e.target.value})}
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name} - {patient.village}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Health Worker:</label>
                <select 
                  value={newVisit.health_worker_id}
                  onChange={(e) => setNewVisit({...newVisit, health_worker_id: e.target.value})}
                  required
                >
                  <option value="">Select Health Worker</option>
                  {healthWorkers.map(hw => (
                    <option key={hw.doctor_id} value={hw.doctor_id}>
                      {hw.doctor_name} ({hw.is_community_health_worker ? 'CHW' : 'Doctor'})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Visit Type:</label>
                <select 
                  value={newVisit.visit_type}
                  onChange={(e) => setNewVisit({...newVisit, visit_type: e.target.value as any})}
                >
                  <option value="routine">Routine Check-up</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="high-risk">High-Risk Assessment</option>
                  <option value="ai-referral">AI Referral</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Scheduled Time:</label>
                <input 
                  type="datetime-local"
                  value={newVisit.scheduled_time}
                  onChange={(e) => setNewVisit({...newVisit, scheduled_time: e.target.value})}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Notes:</label>
                <textarea 
                  value={newVisit.notes}
                  onChange={(e) => setNewVisit({...newVisit, notes: e.target.value})}
                  rows={3}
                  placeholder="Visit notes, symptoms, or special instructions..."
                />
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitButton}>
                  Schedule Visit
                </button>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setShowNewVisitForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
    </div>
  );
};

export default CommunityHealthVisits;
