import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PatientDashboard.module.css';

const PatientDashboard = () => {
  const navigate = useNavigate();

  const handleNewAnalysis = () => {
    navigate('/dashboard/ai-analysis');
  };

  const handleViewHistory = () => {
    navigate('/dashboard/analysis-history');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Patient Dashboard</h2>
        <p className={styles.subtitle}>Welcome to your personal skin health center.</p>
      </div>

      <div className={styles.actionsGrid}>
        <div className={styles.actionCard} onClick={handleNewAnalysis}>
          <div className={styles.actionIcon}>🔍</div>
          <div className={styles.actionInfo}>
            <h3 className={styles.actionTitle}>New AI Skin Analysis</h3>
            <p className={styles.actionDescription}>Upload a photo to get an instant analysis of a skin lesion.</p>
          </div>
        </div>
        
        <div className={styles.actionCard} onClick={handleViewHistory}>
          <div className={styles.actionIcon}>📜</div>
          <div className={styles.actionInfo}>
            <h3 className={styles.actionTitle}>View Analysis History</h3>
            <p className={styles.actionDescription}>Review your past results and track your skin's health over time.</p>
          </div>
        </div>
      </div>

      <div className={styles.infoBox}>
        <h4>What's Next?</h4>
        <p>If the AI detects a high-risk lesion, you will be notified. An official may contact you to coordinate further steps with a doctor.</p>
      </div>
    </div>
  );
};

export default PatientDashboard;