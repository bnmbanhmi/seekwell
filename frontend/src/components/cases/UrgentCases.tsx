import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OfficialAnalyticsService, { UrgentCase } from '../../services/OfficialAnalyticsService';
import UrgentCaseNotes from './UrgentCaseNotes';
import styles from './UrgentCases.module.css';

const UrgentCases = () => {
  const [cases, setCases] = useState<UrgentCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCase, setSelectedCase] = useState<UrgentCase | null>(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUrgentCases = async () => {
      try {
        setLoading(true);
        
        // Get urgent cases from localStorage analysis data with real patient names
        const urgentCases = await OfficialAnalyticsService.getUrgentCasesFromStorage();
        setCases(urgentCases);

      } catch (err) {
        console.error('Error fetching urgent cases:', err);
        setCases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUrgentCases();
  }, []);

  const handleCaseClick = (patientId: number) => {
    navigate(`/dashboard/patient-monitoring/${patientId}`);
  };

  const handleNotesClick = (urgentCase: UrgentCase, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCase(urgentCase);
    setNotesModalOpen(true);
  };

  const closeNotesModal = () => {
    setNotesModalOpen(false);
    setSelectedCase(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading Urgent Cases...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Urgent Cases ({cases.length})</h2>
        <p className={styles.subtitle}>High-risk skin analysis cases requiring immediate attention</p>
      </div>

      {cases.length === 0 ? (
        <div className={styles.noData}>
          <h3>No Urgent Cases</h3>
          <p>There are currently no high-risk cases that require immediate attention.</p>
        </div>
      ) : (
        <div className={styles.casesList}>
          {cases.map((urgentCase, index) => (
            <div 
              key={`${urgentCase.patientId}-${urgentCase.date}-${index}`} 
              className={styles.caseCard}
              onClick={() => handleCaseClick(urgentCase.patientId)}
            >
              <div className={styles.caseHeader}>
                <h4>{urgentCase.patientName || `Patient ${urgentCase.patientId}`}</h4>
                <span className={styles.riskBadge}>
                  {urgentCase.riskLevel} Risk
                </span>
              </div>
              
              <div className={styles.caseDetails}>
                <p><strong>Disease:</strong> {urgentCase.disease}</p>
                <p><strong>Confidence:</strong> {(urgentCase.confidence * 100).toFixed(1)}%</p>
                <p><strong>Date:</strong> {formatDate(urgentCase.date)}</p>
              </div>

              <div className={styles.caseActions}>
                <button 
                  className={styles.notesButton}
                  onClick={(e) => handleNotesClick(urgentCase, e)}
                >
                  View/Add Notes
                </button>
                <button 
                  className={styles.viewButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCaseClick(urgentCase.patientId);
                  }}
                >
                  View Patient Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes Modal */}
      {selectedCase && (
        <UrgentCaseNotes 
          urgentCase={selectedCase}
          isOpen={notesModalOpen}
          onClose={closeNotesModal}
        />
      )}
    </div>
  );
};

export default UrgentCases;
