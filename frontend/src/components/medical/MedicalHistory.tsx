import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './MedicalHistory.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

type MedicalReport = {
  record_id: number;
  patient_id: number;
  doctor_id: number;
  in_day: string;
  out_day: string;
  in_diagnosis: string;
  out_diagnosis: string;
  reason_in: string;
  treatment_process: string;
  pulse_rate: string;
  temperature: string;
  blood_pressure: string;
  respiratory_rate: string;
  weight: string;
  pathological_process: string;
  personal_history: string;
  family_history: string;
  diagnose_from_recommender: string;
  prescription: string;
  doctor_notes: string;
};

const MedicalHistory = () => {
  const [medicalReports, setMedicalReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMedicalHistory = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${BACKEND_URL}/medical_reports/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setMedicalReports(response.data);
      } catch (err) {
        console.error('Failed to fetch medical history:', err);
        setError('Failed to load medical history.');
      } finally {
        setLoading(false);
      }
    };

    fetchMedicalHistory();
  }, []);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleReportSelect = (report: MedicalReport) => {
    setSelectedReport(report);
  };

  const handleCloseDetails = () => {
    setSelectedReport(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const parsePrescription = (prescriptionJson: string) => {
    try {
      return JSON.parse(prescriptionJson || '[]');
    } catch {
      return [];
    }
  };

  return (
    <div className={styles.medicalHistoryContainer}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={handleBackToDashboard}>
          ← Back to Dashboard
        </button>
        <h2>Medical History</h2>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading medical history...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : medicalReports.length === 0 ? (
        <div className={styles.noData}>
          <p>No medical history found.</p>
        </div>
      ) : (
        <div className={styles.reportsGrid}>
          <div className={styles.reportsList}>
            <h3>Medical Reports ({medicalReports.length})</h3>
            {medicalReports.map((report) => (
              <div
                key={report.record_id}
                className={`${styles.reportCard} ${selectedReport?.record_id === report.record_id ? styles.selected : ''}`}
                onClick={() => handleReportSelect(report)}
              >
                <div className={styles.reportHeader}>
                  <h4>Report #{report.record_id}</h4>
                  <span className={styles.date}>{formatDate(report.in_day)}</span>
                </div>
                <div className={styles.reportPreview}>
                  <p><strong>Diagnosis:</strong> {report.in_diagnosis || 'N/A'}</p>
                  <p><strong>Reason:</strong> {report.reason_in || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>

          {selectedReport && (
            <div className={styles.reportDetails}>
              <div className={styles.detailsHeader}>
                <h3>Medical Report #{selectedReport.record_id}</h3>
                <button className={styles.closeButton} onClick={handleCloseDetails}>×</button>
              </div>

              <div className={styles.detailsContent}>
                <div className={styles.section}>
                  <h4>Basic Information</h4>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <strong>Admission Date:</strong> {formatDate(selectedReport.in_day)}
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Discharge Date:</strong> {formatDate(selectedReport.out_day)}
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Reason for Visit:</strong> {selectedReport.reason_in || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className={styles.section}>
                  <h4>Diagnosis & Treatment</h4>
                  <div className={styles.infoItem}>
                    <strong>Initial Diagnosis:</strong>
                    <p>{selectedReport.in_diagnosis || 'N/A'}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <strong>Final Diagnosis:</strong>
                    <p>{selectedReport.out_diagnosis || 'N/A'}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <strong>Treatment Process:</strong>
                    <p>{selectedReport.treatment_process || 'N/A'}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <strong>Doctor's Notes:</strong>
                    <p>{selectedReport.doctor_notes || 'N/A'}</p>
                  </div>
                </div>

                <div className={styles.section}>
                  <h4>Vital Signs</h4>
                  <div className={styles.vitalSignsGrid}>
                    <div className={styles.vitalSign}>
                      <strong>Pulse Rate:</strong> {selectedReport.pulse_rate || 'N/A'}
                    </div>
                    <div className={styles.vitalSign}>
                      <strong>Temperature:</strong> {selectedReport.temperature || 'N/A'}
                    </div>
                    <div className={styles.vitalSign}>
                      <strong>Blood Pressure:</strong> {selectedReport.blood_pressure || 'N/A'}
                    </div>
                    <div className={styles.vitalSign}>
                      <strong>Respiratory Rate:</strong> {selectedReport.respiratory_rate || 'N/A'}
                    </div>
                    <div className={styles.vitalSign}>
                      <strong>Weight:</strong> {selectedReport.weight || 'N/A'}
                    </div>
                  </div>
                </div>

                {selectedReport.prescription && (
                  <div className={styles.section}>
                    <h4>Prescription</h4>
                    <div className={styles.prescriptionList}>
                      {parsePrescription(selectedReport.prescription).map((med: any, index: number) => (
                        <div key={index} className={styles.medicationItem}>
                          <div className={styles.medName}>{med.name}</div>
                          <div className={styles.medDetails}>
                            <span><strong>Dosage:</strong> {med.dosage}</span>
                            <span><strong>Quantity:</strong> {med.quantity}</span>
                            <span><strong>Instructions:</strong> {med.instructions}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedReport.personal_history || selectedReport.family_history) && (
                  <div className={styles.section}>
                    <h4>Patient History</h4>
                    {selectedReport.personal_history && (
                      <div className={styles.infoItem}>
                        <strong>Personal History:</strong>
                        <p>{selectedReport.personal_history}</p>
                      </div>
                    )}
                    {selectedReport.family_history && (
                      <div className={styles.infoItem}>
                        <strong>Family History:</strong>
                        <p>{selectedReport.family_history}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicalHistory;
