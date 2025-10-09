import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './PatientDashboard.module.css';

const PatientDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleNewAnalysis = () => {
    navigate('/dashboard/ai-analysis');
  };

  const handleViewHistory = () => {
    navigate('/dashboard/ai-analysis?tab=history');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('dashboard.patient.title')}</h2>
        <p className={styles.subtitle}>{t('dashboard.patient.subtitle')}</p>
      </div>

      <div className={styles.actionsGrid}>
        <div className={styles.actionCard} onClick={handleNewAnalysis}>
          <div className={styles.actionIcon}>🔍</div>
          <div className={styles.actionInfo}>
            <h3 className={styles.actionTitle}>{t('dashboard.patient.newAnalysis')}</h3>
            <p className={styles.actionDescription}>{t('dashboard.patient.newAnalysisDesc')}</p>
          </div>
        </div>
        
        <div className={styles.actionCard} onClick={handleViewHistory}>
          <div className={styles.actionIcon}>📜</div>
          <div className={styles.actionInfo}>
            <h3 className={styles.actionTitle}>{t('dashboard.patient.viewHistory')}</h3>
            <p className={styles.actionDescription}>{t('dashboard.patient.viewHistoryDesc')}</p>
          </div>
        </div>
      </div>

      <div className={styles.infoBox}>
        <h4>{t('dashboard.patient.whatsNext')}</h4>
        <p>{t('dashboard.patient.whatsNextDesc')}</p>
      </div>
    </div>
  );
};

export default PatientDashboard;