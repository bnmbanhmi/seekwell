import React from 'react';
import ChatbotWidget from '../Chatbot/ChatbotWidget';
import styles from './PatientDashboard.module.css';

const PatientDashboard = () => {
  return (
    <div className={styles.dashboardContainer}>
      <h2 className={styles.header}>Welcome, Patient</h2>

      <div className={styles.gridLayout}>
        {/* Left Column */}
        <div>
          <div className={styles.card}>
            <h3>Today's Appointments</h3>
            <p>You have no appointments scheduled for today.</p>
          </div>

          <div className={styles.card}>
            <h3>Quick Actions</h3>
            <div className={styles.quickActions}>
              <button className={`${styles.button} ${styles.bookButton}`}>
                Book New Appointment
              </button>
              <button className={`${styles.button} ${styles.historyButton}`}>
                View Medical History
              </button>
              <button className={`${styles.button} ${styles.prescriptionButton}`}>
                View Prescriptions
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div className={styles.chatCard}>
            <h3>🤖 Your Personal Health Assistant</h3>
            <p className={styles.chatDescription}>
              Chat with our AI assistant for personalized health guidance, appointment help, and medical questions.
            </p>
            <div className={styles.flexGrow}>
              <ChatbotWidget
                userRole="PATIENT"
                isAuthenticated={true}
                position="inline"
                placeholder="Ask about your health, symptoms, or appointments..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Section */}
      <div className={styles.card}>
        <h3>Recent Activity</h3>
        <p>No recent activity to display.</p>
      </div>
    </div>
  );
};

export default PatientDashboard;
