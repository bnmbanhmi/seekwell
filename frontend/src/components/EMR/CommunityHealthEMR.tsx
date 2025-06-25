import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './CommunityHealthEMR.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface Patient {
  id: string;
  name: string;
  village?: string;
  district?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
}

interface CommunityHealthMetrics {
  nutrition_status: 'underweight' | 'normal' | 'overweight' | 'obese';
  immunization_status: 'up-to-date' | 'partial' | 'incomplete';
  chronic_conditions: string[];
  risk_factors: string[];
  family_history: string[];
  social_determinants: {
    income_level: string;
    education_level: string;
    water_access: string;
    sanitation_access: string;
  };
}

interface CommunityHealthRecord {
  id?: string;
  patient_id: string;
  visit_date: string;
  health_worker_name: string;
  visit_type: 'routine' | 'high-risk' | 'follow-up' | 'ai-referral';
  
  // Standard EMR fields
  diagnosis: string;
  doctor_notes: string;
  treatment_plan: string;
  
  // Community Health specific
  community_metrics: CommunityHealthMetrics;
  
  // Vital Signs
  vital_signs: {
    pulse_rate: string;
    temperature: string;
    blood_pressure: string;
    respiratory_rate: string;
    weight: string;
    height: string;
    bmi?: string;
  };
  
  // Prescription
  prescription: Array<{
    name: string;
    dosage: string;
    quantity: string;
    instructions: string;
  }>;
  
  // Follow-up
  follow_up_required: boolean;
  follow_up_date?: string;
  referral_needed: boolean;
  referral_to?: string;
  
  // AI Integration
  ai_assessment?: {
    risk_level: string;
    confidence_score: number;
    predicted_class: string;
    image_id?: string;
  };
}

const CommunityHealthEMR: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<CommunityHealthRecord>({
    patient_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    health_worker_name: '',
    visit_type: 'routine',
    diagnosis: '',
    doctor_notes: '',
    treatment_plan: '',
    community_metrics: {
      nutrition_status: 'normal',
      immunization_status: 'up-to-date',
      chronic_conditions: [],
      risk_factors: [],
      family_history: [],
      social_determinants: {
        income_level: '',
        education_level: '',
        water_access: '',
        sanitation_access: '',
      }
    },
    vital_signs: {
      pulse_rate: '',
      temperature: '',
      blood_pressure: '',
      respiratory_rate: '',
      weight: '',
      height: '',
    },
    prescription: [],
    follow_up_required: false,
    referral_needed: false,
  });

  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    quantity: '',
    instructions: '',
  });

  useEffect(() => {
    fetchPatients();
    // Get current user for health worker name
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setFormData(prev => ({
      ...prev,
      health_worker_name: user.full_name || user.username || 'Unknown'
    }));
  }, []);

  useEffect(() => {
    if (formData.vital_signs.weight && formData.vital_signs.height) {
      calculateBMI();
    }
  }, [formData.vital_signs.weight, formData.vital_signs.height]);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BACKEND_URL}/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatients(response.data);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      setError('Failed to load patients');
    }
  };

  const calculateBMI = () => {
    const weight = parseFloat(formData.vital_signs.weight);
    const height = parseFloat(formData.vital_signs.height) / 100; // Convert cm to m
    
    if (weight > 0 && height > 0) {
      const bmi = weight / (height * height);
      setFormData(prev => ({
        ...prev,
        vital_signs: {
          ...prev.vital_signs,
          bmi: bmi.toFixed(1)
        }
      }));
    }
  };

  const handleVitalSignsChange = (field: keyof typeof formData.vital_signs, value: string) => {
    setFormData(prev => ({
      ...prev,
      vital_signs: {
        ...prev.vital_signs,
        [field]: value
      }
    }));
  };

  const handleCommunityMetricsChange = (field: keyof CommunityHealthMetrics, value: any) => {
    setFormData(prev => ({
      ...prev,
      community_metrics: {
        ...prev.community_metrics,
        [field]: value
      }
    }));
  };

  const handleSocialDeterminantsChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      community_metrics: {
        ...prev.community_metrics,
        social_determinants: {
          ...prev.community_metrics.social_determinants,
          [field]: value
        }
      }
    }));
  };

  const addMedication = () => {
    if (newMedication.name && newMedication.dosage) {
      setFormData(prev => ({
        ...prev,
        prescription: [...prev.prescription, { ...newMedication }]
      }));
      setNewMedication({
        name: '',
        dosage: '',
        quantity: '',
        instructions: '',
      });
    }
  };

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prescription: prev.prescription.filter((_, i) => i !== index)
    }));
  };

  const addConditionOrRisk = (type: 'chronic_conditions' | 'risk_factors' | 'family_history', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        community_metrics: {
          ...prev.community_metrics,
          [type]: [...prev.community_metrics[type], value.trim()]
        }
      }));
    }
  };

  const removeConditionOrRisk = (type: 'chronic_conditions' | 'risk_factors' | 'family_history', index: number) => {
    setFormData(prev => ({
      ...prev,
      community_metrics: {
        ...prev.community_metrics,
        [type]: prev.community_metrics[type].filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      
      // In a real app, this would be a dedicated community health EMR endpoint
      const response = await axios.post(`${BACKEND_URL}/community/health-records`, {
        ...formData,
        patient_id: selectedPatientId,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess('Community health record created successfully!');
      
      // Reset form
      setFormData({
        patient_id: '',
        visit_date: new Date().toISOString().split('T')[0],
        health_worker_name: formData.health_worker_name,
        visit_type: 'routine',
        diagnosis: '',
        doctor_notes: '',
        treatment_plan: '',
        community_metrics: {
          nutrition_status: 'normal',
          immunization_status: 'up-to-date',
          chronic_conditions: [],
          risk_factors: [],
          family_history: [],
          social_determinants: {
            income_level: '',
            education_level: '',
            water_access: '',
            sanitation_access: '',
          }
        },
        vital_signs: {
          pulse_rate: '',
          temperature: '',
          blood_pressure: '',
          respiratory_rate: '',
          weight: '',
          height: '',
        },
        prescription: [],
        follow_up_required: false,
        referral_needed: false,
      });
      setSelectedPatientId('');
      
    } catch (err) {
      console.error('Failed to create community health record:', err);
      setError('Failed to create community health record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Community Health EMR</h2>
        <p>Comprehensive electronic medical record for community health tracking</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Patient Selection */}
        <div className={styles.section}>
          <h3>Patient Information</h3>
          <div className={styles.formGroup}>
            <label>Select Patient *</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              required
            >
              <option value="">Choose a patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.village || 'Unknown Village'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Visit Information */}
        <div className={styles.section}>
          <h3>Visit Information</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Visit Date *</label>
              <input
                type="date"
                value={formData.visit_date}
                onChange={(e) => setFormData({...formData, visit_date: e.target.value})}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Health Worker *</label>
              <input
                type="text"
                value={formData.health_worker_name}
                onChange={(e) => setFormData({...formData, health_worker_name: e.target.value})}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Visit Type *</label>
              <select
                value={formData.visit_type}
                onChange={(e) => setFormData({...formData, visit_type: e.target.value as any})}
              >
                <option value="routine">Routine Check-up</option>
                <option value="follow-up">Follow-up Visit</option>
                <option value="high-risk">High-Risk Assessment</option>
                <option value="ai-referral">AI-Referred Case</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vital Signs */}
        <div className={styles.section}>
          <h3>Vital Signs</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.vital_signs.weight}
                onChange={(e) => handleVitalSignsChange('weight', e.target.value)}
                placeholder="e.g., 65.5"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Height (cm)</label>
              <input
                type="number"
                value={formData.vital_signs.height}
                onChange={(e) => handleVitalSignsChange('height', e.target.value)}
                placeholder="e.g., 170"
              />
            </div>
            <div className={styles.formGroup}>
              <label>BMI</label>
              <input
                type="text"
                value={formData.vital_signs.bmi || ''}
                readOnly
                placeholder="Auto-calculated"
                className={styles.readOnly}
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Blood Pressure</label>
              <input
                type="text"
                value={formData.vital_signs.blood_pressure}
                onChange={(e) => handleVitalSignsChange('blood_pressure', e.target.value)}
                placeholder="e.g., 120/80"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Pulse Rate (bpm)</label>
              <input
                type="number"
                value={formData.vital_signs.pulse_rate}
                onChange={(e) => handleVitalSignsChange('pulse_rate', e.target.value)}
                placeholder="e.g., 72"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={formData.vital_signs.temperature}
                onChange={(e) => handleVitalSignsChange('temperature', e.target.value)}
                placeholder="e.g., 36.5"
              />
            </div>
          </div>
        </div>

        {/* Community Health Metrics */}
        <div className={styles.section}>
          <h3>Community Health Metrics</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Nutrition Status</label>
              <select
                value={formData.community_metrics.nutrition_status}
                onChange={(e) => handleCommunityMetricsChange('nutrition_status', e.target.value)}
              >
                <option value="underweight">Underweight</option>
                <option value="normal">Normal</option>
                <option value="overweight">Overweight</option>
                <option value="obese">Obese</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Immunization Status</label>
              <select
                value={formData.community_metrics.immunization_status}
                onChange={(e) => handleCommunityMetricsChange('immunization_status', e.target.value)}
              >
                <option value="up-to-date">Up-to-date</option>
                <option value="partial">Partial</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>
          </div>

          {/* Social Determinants */}
          <h4>Social Determinants of Health</h4>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Income Level</label>
              <select
                value={formData.community_metrics.social_determinants.income_level}
                onChange={(e) => handleSocialDeterminantsChange('income_level', e.target.value)}
              >
                <option value="">Select income level</option>
                <option value="low">Low Income</option>
                <option value="middle">Middle Income</option>
                <option value="high">High Income</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Education Level</label>
              <select
                value={formData.community_metrics.social_determinants.education_level}
                onChange={(e) => handleSocialDeterminantsChange('education_level', e.target.value)}
              >
                <option value="">Select education level</option>
                <option value="none">No formal education</option>
                <option value="primary">Primary education</option>
                <option value="secondary">Secondary education</option>
                <option value="tertiary">Tertiary education</option>
              </select>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Water Access</label>
              <select
                value={formData.community_metrics.social_determinants.water_access}
                onChange={(e) => handleSocialDeterminantsChange('water_access', e.target.value)}
              >
                <option value="">Select water access</option>
                <option value="improved">Improved water source</option>
                <option value="unimproved">Unimproved water source</option>
                <option value="none">No access to clean water</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Sanitation Access</label>
              <select
                value={formData.community_metrics.social_determinants.sanitation_access}
                onChange={(e) => handleSocialDeterminantsChange('sanitation_access', e.target.value)}
              >
                <option value="">Select sanitation access</option>
                <option value="improved">Improved sanitation</option>
                <option value="unimproved">Unimproved sanitation</option>
                <option value="none">No sanitation facilities</option>
              </select>
            </div>
          </div>
        </div>

        {/* Clinical Information */}
        <div className={styles.section}>
          <h3>Clinical Assessment</h3>
          <div className={styles.formGroup}>
            <label>Diagnosis *</label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
              rows={3}
              placeholder="Primary and secondary diagnoses..."
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Clinical Notes</label>
            <textarea
              value={formData.doctor_notes}
              onChange={(e) => setFormData({...formData, doctor_notes: e.target.value})}
              rows={4}
              placeholder="Detailed clinical observations, symptoms, examination findings..."
            />
          </div>
          <div className={styles.formGroup}>
            <label>Treatment Plan</label>
            <textarea
              value={formData.treatment_plan}
              onChange={(e) => setFormData({...formData, treatment_plan: e.target.value})}
              rows={3}
              placeholder="Treatment recommendations and care plan..."
            />
          </div>
        </div>

        {/* Prescription */}
        <div className={styles.section}>
          <h3>Prescription</h3>
          <div className={styles.medicationAdd}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Medication Name</label>
                <input
                  type="text"
                  value={newMedication.name}
                  onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                  placeholder="e.g., Paracetamol"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Dosage</label>
                <input
                  type="text"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                  placeholder="e.g., 500mg"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Quantity</label>
                <input
                  type="text"
                  value={newMedication.quantity}
                  onChange={(e) => setNewMedication({...newMedication, quantity: e.target.value})}
                  placeholder="e.g., 20 tablets"
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Instructions</label>
              <input
                type="text"
                value={newMedication.instructions}
                onChange={(e) => setNewMedication({...newMedication, instructions: e.target.value})}
                placeholder="e.g., Take twice daily after meals"
              />
            </div>
            <button type="button" onClick={addMedication} className={styles.addButton}>
              Add Medication
            </button>
          </div>

          {formData.prescription.length > 0 && (
            <div className={styles.prescriptionList}>
              <h4>Prescribed Medications</h4>
              {formData.prescription.map((med, index) => (
                <div key={index} className={styles.medicationItem}>
                  <div className={styles.medicationInfo}>
                    <strong>{med.name}</strong> - {med.dosage}
                    <br />
                    Quantity: {med.quantity}
                    <br />
                    Instructions: {med.instructions}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMedication(index)}
                    className={styles.removeButton}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Follow-up and Referral */}
        <div className={styles.section}>
          <h3>Follow-up and Referral</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.follow_up_required}
                  onChange={(e) => setFormData({...formData, follow_up_required: e.target.checked})}
                />
                Follow-up Required
              </label>
            </div>
            {formData.follow_up_required && (
              <div className={styles.formGroup}>
                <label>Follow-up Date</label>
                <input
                  type="date"
                  value={formData.follow_up_date || ''}
                  onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})}
                />
              </div>
            )}
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.referral_needed}
                  onChange={(e) => setFormData({...formData, referral_needed: e.target.checked})}
                />
                Referral Needed
              </label>
            </div>
            {formData.referral_needed && (
              <div className={styles.formGroup}>
                <label>Refer to</label>
                <input
                  type="text"
                  value={formData.referral_to || ''}
                  onChange={(e) => setFormData({...formData, referral_to: e.target.value})}
                  placeholder="e.g., District Hospital, Specialist clinic"
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className={styles.submitSection}>
          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Saving...' : 'Save Community Health Record'}
          </button>
        </div>
      </form>

      {/* Messages */}
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}
    </div>
  );
};

export default CommunityHealthEMR;
