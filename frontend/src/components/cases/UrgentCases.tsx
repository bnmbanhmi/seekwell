import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './UrgentCases.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

type UrgentCase = {
  result_id: number;
  patient_name: string;
  prediction: string;
  risk_level: 'HIGH' | 'URGENT';
  upload_timestamp: string;
};

const UrgentCases = () => {
  const [cases, setCases] = useState<UrgentCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUrgentCases = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        // TODO: Replace with actual API endpoint for fetching urgent cases
        const response = await axios.get(`${BACKEND_URL}/analysis-results/urgent`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCases(response.data);

      } catch (err) {
        console.error('Error fetching urgent cases:', err);
        // setError('Failed to load urgent cases.'); // Temporarily disable error for empty state
        setCases([]); // Default to empty array
      } finally {
        setLoading(false);
      }
    };

    fetchUrgentCases();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading Urgent Cases...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Urgent Cases</h2>
      <div className={styles.caseList}>
        {cases.length === 0 ? (
          <p>No urgent cases at this time.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>AI Prediction</th>
                <th>Risk Level</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.result_id} className={styles[c.risk_level.toLowerCase()]}>
                  <td>{c.patient_name}</td>
                  <td>{c.prediction}</td>
                  <td><span className={styles.riskLabel}>{c.risk_level}</span></td>
                  <td>{new Date(c.upload_timestamp).toLocaleString()}</td>
                  <td>
                    <button className={styles.actionButton}>View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UrgentCases;
