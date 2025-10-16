import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CameraAlt, History } from '@mui/icons-material';
import styles from './PatientDashboard.module.css';

const PatientDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleNewAnalysis = () => {
    navigate('/ai-analysis');
  };

  const handleViewHistory = () => {
    navigate('/ai-analysis?tab=history');
  };

  return (
    <div className={styles.container}>
      {/* Main Action Buttons */}
      <div className={styles.actionsContainer}>
        <button className={styles.primaryActionButton} onClick={handleNewAnalysis}>
          <CameraAlt className={styles.buttonIcon} />
          <span className={styles.buttonText}>{t('dashboard.patient.newAnalysis')}</span>
        </button>
        
        <button className={styles.secondaryActionButton} onClick={handleViewHistory}>
          <History className={styles.buttonIcon} />
          <span className={styles.buttonText}>{t('dashboard.patient.viewHistory')}</span>
        </button>
      </div>

      {/* About SeekWell Project Section */}
      <div className={styles.aboutSection}>
        <h3 className={styles.aboutTitle}>{t('dashboard.patient.aboutProject')}</h3>
        
        <div className={styles.aboutContent}>
          <h4 className={styles.aboutSubtitle}>{t('dashboard.patient.aboutProjectWhat')}</h4>
          <p className={styles.aboutText}>{t('dashboard.patient.aboutProjectWhatDesc')}</p>

          <h4 className={styles.aboutSubtitle}>{t('dashboard.patient.aboutProjectWhy')}</h4>
          <p className={styles.aboutText}>{t('dashboard.patient.aboutProjectWhyDesc')}</p>

          <h4 className={styles.aboutSubtitle}>{t('dashboard.patient.aboutProjectHow')}</h4>
          <ol className={styles.aboutList}>
            <li>{t('dashboard.patient.aboutProjectHowStep1')}</li>
            <li>{t('dashboard.patient.aboutProjectHowStep2')}</li>
            <li>{t('dashboard.patient.aboutProjectHowStep3')}</li>
          </ol>

          <p className={styles.aboutImportantNote}>
            <strong>{t('dashboard.patient.aboutProjectImportantNote')}</strong>{' '}
            {t('dashboard.patient.aboutProjectImportantNoteDesc')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;