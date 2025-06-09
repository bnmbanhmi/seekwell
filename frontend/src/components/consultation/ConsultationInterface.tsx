// components/consultation/ConsultationInterface.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './ConsultationInterface.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
}

interface MedicalHistory {
  id: string;
  in_diagnosis: string;
  doctor_notes: string;
  created_at: string;
  pulse_rate: number;
  temperature: number;
  blood_pressure: string;
}

interface ConsultationData {
  symptoms: string;
  consultation_notes: string;
  preliminary_diagnosis: string;
  recommended_tests: string;
  current_vitals: {
    pulse_rate: string;
    temperature: string;
    blood_pressure: string;
    respiratory_rate: string;
    weight: string;
  };
}

const ConsultationInterface: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const [consultationData, setConsultationData] = useState<ConsultationData>({
    symptoms: '',
    consultation_notes: '',
    preliminary_diagnosis: '',
    recommended_tests: '',
    current_vitals: {
      pulse_rate: '',
      temperature: '',
      blood_pressure: '',
      respiratory_rate: '',
      weight: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const appointmentId = location.state?.appointmentId;
  const patientId = location.state?.patientId;

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch patient details
      const patientResponse = await axios.get(`${BACKEND_URL}/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatient(patientResponse.data);

      // Fetch medical history
      const historyResponse = await axios.get(`${BACKEND_URL}/medical_reports/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMedicalHistory(historyResponse.data.slice(0, 5)); // Last 5 records

      setLoading(false);
    } catch (err) {
      console.error('Error fetching patient data:', err);
      setError('Failed to load patient information');
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('vitals.')) {
      const vitalField = field.split('.')[1];
      setConsultationData(prev => ({
        ...prev,
        current_vitals: {
          ...prev.current_vitals,
          [vitalField]: value
        }
      }));
    } else {
      setConsultationData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleProceedToEMR = () => {
    navigate('/emr/create', {
      state: {
        appointmentId,
        patientId,
        consultationData,
        fromConsultation: true
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading consultation interface...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.consultationContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.patientInfo}>
          <h1>Consultation: {patient?.name}</h1>
          <div className={styles.patientDetails}>
            <span>Age: {patient?.age}</span>
            <span>Gender: {patient?.gender}</span>
            <span>Phone: {patient?.phone}</span>
          </div>
        </div>
        <div className={styles.stepIndicator}>
          <span className={currentStep >= 1 ? styles.active : ''}>1. Assessment</span>
          <span className={currentStep >= 2 ? styles.active : ''}>2. Examination</span>
          <span className={currentStep >= 3 ? styles.active : ''}>3. Diagnosis</span>
        </div>
      </div>

      <div className={styles.consultationContent}>
        {/* Patient History Sidebar */}
        <div className={styles.historyPanel}>
          <h3>Recent Medical History</h3>
          {medicalHistory.length === 0 ? (
            <p className={styles.noHistory}>No previous records</p>
          ) : (
            <div className={styles.historyList}>
              {medicalHistory.map((record) => (
                <div key={record.id} className={styles.historyItem}>
                  <div className={styles.historyDate}>{formatDate(record.created_at)}</div>
                  <div className={styles.historyDiagnosis}>{record.in_diagnosis}</div>
                  <div className={styles.historyVitals}>
                    {record.pulse_rate && `Pulse: ${record.pulse_rate}`}
                    {record.temperature && ` | Temp: ${record.temperature}°C`}
                    {record.blood_pressure && ` | BP: ${record.blood_pressure}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Consultation Area */}
        <div className={styles.mainPanel}>
          {/* Step 1: Initial Assessment */}
          {currentStep === 1 && (
            <div className={styles.stepContent}>
              <h2>Patient Assessment</h2>
              <div className={styles.formGroup}>
                <label>Chief Complaint & Symptoms:</label>
                <textarea
                  value={consultationData.symptoms}
                  onChange={(e) => handleInputChange('symptoms', e.target.value)}
                  placeholder="Describe the patient's main concerns and symptoms..."
                  rows={4}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Initial Consultation Notes:</label>
                <textarea
                  value={consultationData.consultation_notes}
                  onChange={(e) => handleInputChange('consultation_notes', e.target.value)}
                  placeholder="Initial observations, patient behavior, additional notes..."
                  rows={4}
                />
              </div>
              <button className={styles.nextButton} onClick={() => setCurrentStep(2)}>
                Proceed to Examination
              </button>
            </div>
          )}

          {/* Step 2: Physical Examination & Vitals */}
          {currentStep === 2 && (
            <div className={styles.stepContent}>
              <h2>Physical Examination & Vital Signs</h2>
              <div className={styles.vitalsGrid}>
                <div className={styles.formGroup}>
                  <label>Pulse Rate (bpm):</label>
                  <input
                    type="number"
                    value={consultationData.current_vitals.pulse_rate}
                    onChange={(e) => handleInputChange('vitals.pulse_rate', e.target.value)}
                    placeholder="72"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Temperature (°C):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={consultationData.current_vitals.temperature}
                    onChange={(e) => handleInputChange('vitals.temperature', e.target.value)}
                    placeholder="36.5"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Blood Pressure:</label>
                  <input
                    type="text"
                    value={consultationData.current_vitals.blood_pressure}
                    onChange={(e) => handleInputChange('vitals.blood_pressure', e.target.value)}
                    placeholder="120/80"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Respiratory Rate:</label>
                  <input
                    type="number"
                    value={consultationData.current_vitals.respiratory_rate}
                    onChange={(e) => handleInputChange('vitals.respiratory_rate', e.target.value)}
                    placeholder="16"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Weight (kg):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={consultationData.current_vitals.weight}
                    onChange={(e) => handleInputChange('vitals.weight', e.target.value)}
                    placeholder="70.5"
                  />
                </div>
              </div>
              <div className={styles.buttonGroup}>
                <button className={styles.backButton} onClick={() => setCurrentStep(1)}>
                  Back
                </button>
                <button className={styles.nextButton} onClick={() => setCurrentStep(3)}>
                  Proceed to Diagnosis
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Diagnosis & Treatment Plan */}
          {currentStep === 3 && (
            <div className={styles.stepContent}>
              <h2>Diagnosis & Treatment Planning</h2>
              <div className={styles.formGroup}>
                <label>Preliminary Diagnosis:</label>
                <input
                  type="text"
                  value={consultationData.preliminary_diagnosis}
                  onChange={(e) => handleInputChange('preliminary_diagnosis', e.target.value)}
                  placeholder="Primary diagnosis based on examination..."
                />
              </div>
              <div className={styles.formGroup}>
                <label>Recommended Tests/Investigations:</label>
                <textarea
                  value={consultationData.recommended_tests}
                  onChange={(e) => handleInputChange('recommended_tests', e.target.value)}
                  placeholder="List any laboratory tests, imaging, or additional examinations needed..."
                  rows={3}
                />
              </div>
              <div className={styles.buttonGroup}>
                <button className={styles.backButton} onClick={() => setCurrentStep(2)}>
                  Back
                </button>
                <button className={styles.completeButton} onClick={handleProceedToEMR}>
                  Complete Consultation & Create EMR
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationInterface;
