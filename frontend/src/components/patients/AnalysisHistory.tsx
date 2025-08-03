import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './AnalysisHistory.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

type AnalysisResult = {
  image_id: number;
  upload_timestamp: string;
  body_region: string;
  ai_prediction: string;
  confidence_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: string;
};

const AnalysisHistory = () => {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        // TODO: Update this endpoint to the correct one for fetching analysis history
        const response = await axios.get(`${BACKEND_URL}/ai_assessments/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setHistory(response.data);
      } catch (err) {
        console.error('Error fetching analysis history:', err);
        setError('Failed to load analysis history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading history...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>My Analysis History</h2>
      {history.length === 0 ? (
        <p>You have no past analyses.</p>
      ) : (
        <div className={styles.historyGrid}>
          {history.map((result) => (
            <div key={result.image_id} className={`${styles.historyCard} ${styles[result.risk_level.toLowerCase()]}`}>
              <div className={styles.cardHeader}>
                <strong>{result.ai_prediction}</strong>
                <span>({(result.confidence_score * 100).toFixed(2)}%)</span>
              </div>
              <div className={styles.cardBody}>
                <p><strong>Date:</strong> {new Date(result.upload_timestamp).toLocaleDateString()}</p>
                <p><strong>Region:</strong> {result.body_region}</p>
                <p><strong>Risk Level:</strong> <span className={styles.riskLabel}>{result.risk_level}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalysisHistory;
