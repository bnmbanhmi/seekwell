import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './OfficialDashboard.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

// Mock data structure - replace with actual data from API
type UrgentCase = {
  patientId: number;
  patientName: string;
  riskLevel: 'HIGH' | 'URGENT';
  disease: string;
  date: string;
};

type DiseaseStats = {
  [key: string]: number;
};

const OfficialDashboard = () => {
  const [urgentCases, setUrgentCases] = useState<UrgentCase[]>([]);
  const [diseaseStats, setDiseaseStats] = useState<DiseaseStats>({});
  const [totalPatients, setTotalPatients] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        // Fetch real stats
        const response = await axios.get(`${BACKEND_URL}/reports/dashboard-stats`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const stats = response.data;

        setUrgentCases(stats.urgentCases || []); // Assuming the API returns an urgentCases array
        setDiseaseStats(stats.diseaseStats || {}); // Assuming the API returns diseaseStats
        setTotalPatients(stats.totalPatients || 0); // Assuming the API returns totalPatients

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        // setError('Failed to load dashboard data.');
        setUrgentCases([]);
        setDiseaseStats({});
        setTotalPatients(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleCaseClick = (patientId: number) => {
    // TODO: Navigate to a detailed patient view for the official
    console.log(`Navigating to details for patient ${patientId}`);
    // navigate(`/dashboard/patients/${patientId}`);
  };

  if (loading) return <div className={styles.loading}>Loading Dashboard...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Official's Dashboard</h2>
        <p className={styles.subtitle}>Monitor community skin health and manage urgent cases.</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>{totalPatients}</h3>
          <p>Total Patients</p>
        </div>
        <div className={styles.statCard}>
          <h3>{urgentCases.length}</h3>
          <p>Urgent Cases</p>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.urgentCases}>
          <h3>Urgent Cases</h3>
          <div className={styles.caseList}>
            {urgentCases.length > 0 ? urgentCases.map(c => (
              <div key={c.patientId} className={styles.caseItem} onClick={() => handleCaseClick(c.patientId)}>
                <p><strong>{c.patientName}</strong></p>
                <p>{c.disease} ({c.riskLevel})</p>
                <p>{c.date}</p>
              </div>
            )) : <p>No urgent cases at this time.</p>}
          </div>
        </div>

        <div className={styles.diseaseStats}>
          <h3>Disease Statistics</h3>
          <div className={styles.statsList}>
            {Object.entries(diseaseStats).map(([disease, count]) => (
              <div key={disease} className={styles.statItem}>
                <span>{disease}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficialDashboard;
