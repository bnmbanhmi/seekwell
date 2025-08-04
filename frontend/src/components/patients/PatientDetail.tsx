import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PatientMonitoringService, { PatientMonitoringData } from '../../services/PatientMonitoringService';
import styles from './PatientDetail.module.css';

const PatientDetail: React.FC = () => {
  const [patientData, setPatientData] = useState<PatientMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) {
        setError('Patient ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await PatientMonitoringService.getPatientMonitoringData(parseInt(patientId));
        
        if (data) {
          setPatientData(data);
        } else {
          setError('Patient not found');
        }
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to load patient data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (loading) return <div className={styles.loading}>Loading patient data...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!patientData) return <div className={styles.error}>Patient not found</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/dashboard/patient-monitoring')}
        >
          ← Back to Patient List
        </button>
        <h2 className={styles.title}>Patient Details</h2>
      </div>

      <div className={styles.content}>
        {/* Patient Information */}
        <div className={styles.patientHeader}>
          <div className={styles.patientProfile}>
            <div className={styles.avatar}>
              {patientData.patient.full_name ? patientData.patient.full_name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className={styles.patientBasicInfo}>
              <h3>{patientData.patient.full_name || 'Unknown Patient'}</h3>
              <p><strong>Email:</strong> {patientData.patient.email || 'No email provided'}</p>
              {patientData.patient.phone_number && (
                <p><strong>Phone:</strong> {patientData.patient.phone_number}</p>
              )}
              {patientData.patient.identification_id && (
                <p><strong>ID:</strong> {patientData.patient.identification_id}</p>
              )}
              {patientData.patient.date_of_birth && (
                <p><strong>DOB:</strong> {new Date(patientData.patient.date_of_birth).toLocaleDateString()}</p>
              )}
              {patientData.patient.gender && (
                <p><strong>Gender:</strong> {patientData.patient.gender}</p>
              )}
              {patientData.patient.health_insurance_card_no && (
                <p><strong>Insurance:</strong> {patientData.patient.health_insurance_card_no}</p>
              )}
            </div>
          </div>

          <div className={styles.patientOverview}>
            <div className={styles.overviewCard}>
              <h4>{patientData.totalAnalyses}</h4>
              <p>Total Analyses</p>
            </div>
            <div className={styles.overviewCard}>
              <h4 style={{ color: '#dc3545' }}>{patientData.urgentCases.length}</h4>
              <p>Urgent Cases</p>
            </div>
            <div className={styles.overviewCard}>
              <h4>{patientData.lastAnalysisDate ? formatDate(patientData.lastAnalysisDate).split(',')[0] : 'N/A'}</h4>
              <p>Last Analysis</p>
            </div>
          </div>
        </div>

        {/* Urgent Cases Section */}
        {patientData.urgentCases.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>🚨 Urgent Cases ({patientData.urgentCases.length})</h4>
            <div className={styles.casesList}>
              {patientData.urgentCases.map((analysis, index) => (
                <div key={`${analysis.id}-${index}`} className={styles.caseCard}>
                  <div className={styles.caseImage}>
                    <img src={analysis.image} alt="Analysis" />
                  </div>
                  <div className={styles.caseDetails}>
                    <div className={styles.caseHeader}>
                      <h5>{analysis.result?.disease || 'Unknown Condition'}</h5>
                      <span 
                        className={styles.riskBadge}
                        style={{ backgroundColor: getRiskLevelColor(analysis.result?.riskLevel || 'Low') }}
                      >
                        {analysis.result?.riskLevel || 'Low'} Risk
                      </span>
                    </div>
                    <p><strong>Confidence:</strong> {analysis.result?.confidence ? (analysis.result.confidence * 100).toFixed(1) : '0'}%</p>
                    <p><strong>Date:</strong> {formatDate(analysis.date)}</p>
                    <p><strong>Description:</strong> {analysis.result?.description || 'No description available'}</p>
                    
                    {analysis.result?.recommendations && analysis.result.recommendations.length > 0 && (
                      <div className={styles.recommendations}>
                        <strong>Recommendations:</strong>
                        <ul>
                          {analysis.result.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis History */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>📊 Analysis History ({patientData.analysisHistory.length})</h4>
          <div className={styles.historyList}>
            {patientData.analysisHistory.length > 0 ? (
              patientData.analysisHistory.map((analysis, index) => (
                <div key={`${analysis.id}-${index}`} className={styles.historyCard}>
                  <div className={styles.historyImage}>
                    <img src={analysis.image} alt="Analysis" />
                  </div>
                  <div className={styles.historyDetails}>
                    <div className={styles.historyHeader}>
                      <h6>{analysis.result?.disease || 'Unknown Condition'}</h6>
                      <span 
                        className={styles.riskBadge}
                        style={{ backgroundColor: getRiskLevelColor(analysis.result?.riskLevel || 'Low') }}
                      >
                        {analysis.result?.riskLevel || 'Low'}
                      </span>
                    </div>
                    <p>{analysis.result?.confidence ? (analysis.result.confidence * 100).toFixed(1) : '0'}% confidence</p>
                    <p>{formatDate(analysis.date)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.noData}>No analysis history available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
