import React, { useState, useEffect } from 'react';
import ChatbotWidget from '../Chatbot/ChatbotWidget';
import styles from './PatientDashboard.module.css';
import axios from 'axios';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${BACKEND_URL}/appointments/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const today = new Date().toISOString().split('T')[0]; // Get today's date in 'YYYY-MM-DD' format
        const todayAppointments = response.data.filter(
          (appointment: any) => appointment.date === today
        );

        setAppointments(todayAppointments);
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
        setError('Failed to load appointments.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      <h2 className={styles.header}>Welcome, Patient</h2>

      <div className={styles.gridLayout}>
        {/* Left Column */}
        <div>
          <div className={styles.card}>
            <h3>Today's Appointments</h3>
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className={styles.error}>{error}</p>
            ) : appointments.length > 0 ? (
              <ul>
                {appointments.map((appointment: any) => (
                  <li key={appointment.id}>
                    <strong>Time:</strong> {appointment.time} <br />
                    <strong>Doctor:</strong> {appointment.doctorName} <br />
                    <strong>Reason:</strong> {appointment.reason}
                  </li>
                ))}
              </ul>
            ) : (
              <p>You have no appointments scheduled for today.</p>
            )}
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