import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import OfficialAnalyticsService, { UrgentCase, DiseaseStats } from '../../services/OfficialAnalyticsService';
import LanguageSwitcher from '../common/LanguageSwitcher';
import styles from './OfficialDashboard.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

const OfficialDashboard = () => {
  const { t } = useTranslation();
  const [urgentCases, setUrgentCases] = useState<UrgentCase[]>([]);
  const [diseaseStats, setDiseaseStats] = useState<DiseaseStats>({});
  const [totalPatients, setTotalPatients] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        
        // Fetch backend stats (patient counts, etc.)
        const response = await axios.get(`${BACKEND_URL}/reports/dashboard-stats`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const backendStats = response.data;

        // Get comprehensive dashboard data including localStorage analysis data
        const dashboardData = await OfficialAnalyticsService.getOfficialDashboardData(backendStats);

        setUrgentCases(dashboardData.urgentCases || []);
        setDiseaseStats(dashboardData.diseaseStats || {});
        setTotalPatients(dashboardData.totalPatients || 0);
        
        console.log('Official Dashboard Data:', dashboardData);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data.');
        
        // Fallback: try to get localStorage data even if backend fails
        try {
          const fallbackData = await OfficialAnalyticsService.getOfficialDashboardData();
          setUrgentCases(fallbackData.urgentCases || []);
          setDiseaseStats(fallbackData.diseaseStats || {});
          setTotalPatients(0); // Can't get patient count without backend
        } catch (fallbackErr) {
          console.error('Fallback data loading failed:', fallbackErr);
          setUrgentCases([]);
          setDiseaseStats({});
          setTotalPatients(0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleCaseClick = (patientId: number) => {
    // Navigate to patient monitoring page with specific patient selected
    console.log(`Navigating to details for patient ${patientId}`);
    navigate(`/dashboard/patient-monitoring/${patientId}`);
  };

  if (loading) return <div className={styles.loading}>{t('common.loading')}</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{t('dashboard.official.title')}</h2>
          <p className={styles.subtitle}>{t('dashboard.official.subtitle')}</p>
        </div>
        <LanguageSwitcher />
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>{totalPatients}</h3>
          <p>{t('dashboard.official.totalPatients')}</p>
        </div>
        <div className={styles.statCard}>
          <h3>{urgentCases.length}</h3>
          <p>{t('dashboard.official.urgentCases')}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.urgentCases}>
          <h3>{t('dashboard.official.urgentCasesTitle')}</h3>
          <div className={styles.caseList}>
            {urgentCases.length > 0 ? urgentCases.map(c => (
              <div key={`${c.patientId}-${c.date}`} className={styles.caseItem} onClick={() => handleCaseClick(c.patientId)}>
                <p><strong>{c.patientName || `${t('dashboard.official.patient')} ${c.patientId}`}</strong></p>
                <p>{c.disease} ({c.riskLevel}) - {(c.confidence * 100).toFixed(1)}% {t('dashboard.official.confidence')}</p>
                <p>{new Date(c.date).toLocaleDateString()}</p>
              </div>
            )) : <p>{t('dashboard.official.noCases')}</p>}
          </div>
        </div>

        <div className={styles.diseaseStats}>
          <h3>{t('dashboard.official.diseaseStats')}</h3>
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
