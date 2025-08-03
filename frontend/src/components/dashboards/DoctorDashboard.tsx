import React, { useState, useEffect } from 'react';
import styles from './DoctorDashboard.module.css';
import axios from 'axios';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

type UrgentCase = {
  patientId: number;
  patientName: string;
  patientContact: string;
  riskLevel: 'HIGH' | 'URGENT';
  disease: string;
  date: string;
  imageUrl: string; // URL to the lesion image
  officialNotes: string; // Notes from the official who forwarded the case
};

const DoctorDashboard = () => {
  const [urgentCases, setUrgentCases] = useState<UrgentCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCase, setSelectedCase] = useState<UrgentCase | null>(null);

  useEffect(() => {
    const fetchUrgentCases = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        // TODO: Replace with actual API endpoint for doctor's urgent cases
        const response = await axios.get(`${BACKEND_URL}/doctors/me/urgent-cases`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setUrgentCases(response.data);
      } catch (err) {
        console.error('Error fetching urgent cases:', err);
        // setError('Failed to load urgent cases.');
        setUrgentCases([]); // Default to empty array
      } finally {
        setLoading(false);
      }
    };

    fetchUrgentCases();
  }, []);

  const handleViewDetails = (caseData: UrgentCase) => {
    setSelectedCase(caseData);
  };

  const handleCloseModal = () => {
    setSelectedCase(null);
  };

  if (loading) return <div className={styles.loading}>Loading Urgent Cases...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Doctor's Review Queue</h2>
        <p className={styles.subtitle}>Review high-risk cases flagged by the AI and forwarded by officials.</p>
      </div>

      <div className={styles.caseGrid}>
        {urgentCases.length > 0 ? urgentCases.map(c => (
          <div key={c.patientId} className={`${styles.caseCard} ${styles[c.riskLevel.toLowerCase()]}`} onClick={() => handleViewDetails(c)}>
            <h4>{c.patientName}</h4>
            <p><strong>AI Prediction:</strong> {c.disease}</p>
            <p><strong>Risk:</strong> {c.riskLevel}</p>
            <p><strong>Reported:</strong> {c.date}</p>
          </div>
        )) : <p>No urgent cases in your queue.</p>}
      </div>

      {selectedCase && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>Case Details: {selectedCase.patientName}</h3>
            <p><strong>Contact:</strong> {selectedCase.patientContact}</p>
            <p><strong>AI Prediction:</strong> {selectedCase.disease} ({selectedCase.riskLevel})</p>
            <p><strong>Official's Notes:</strong> {selectedCase.officialNotes}</p>
            <div className={styles.imageContainer}>
              {/* In a real app, you'd have a proper image component */}
              <img src={selectedCase.imageUrl} alt="Skin Lesion" style={{ maxWidth: '100%', borderRadius: '8px' }} />
            </div>
            <div className={styles.modalActions}>
              <button onClick={handleCloseModal}>Close</button>
              <button className={styles.confirmButton}>Confirm Diagnosis & Contact Patient</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;