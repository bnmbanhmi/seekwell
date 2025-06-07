import React, { useState, useEffect } from 'react';
import ChatbotWidget from '../Chatbot/ChatbotWidget';
import styles from './PatientDashboard.module.css';
import axios from 'axios';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

type Appointment = {
  patient_id: number;
  doctor_id: number;
  appointment_time: string;
  appointment_day: string
  reason: string;
  appointment_id: number;
  doctorName?: string;
};

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
          (appointment: any) => appointment.appointment_day === today
        );

        // Fetch doctor names for each appointment
        const appointmentsWithDoctorNames = await Promise.all(
          todayAppointments.map(async (appointment: any) => {
            try {
              const doctorResponse = await axios.get(`${BACKEND_URL}/doctors/${appointment.doctor_id}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              return {
                ...appointment,
                doctorName: doctorResponse.data.doctor_name, // Add doctorName to the appointment
              };
            } catch (err) {
              console.error(`Failed to fetch doctor name for doctor_id ${appointment.doctor_id}:`, err);
              return {
                ...appointment,
                doctorName: 'Unknown Doctor', // Fallback if doctor name cannot be fetched
              };
            }
          })
        );

        setAppointments(appointmentsWithDoctorNames);
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
            <div className={styles.tableContainer}>
              <table className={styles.appointmentTable}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Doctor</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment: any) => (
                    <tr key={appointment.appointment_id} className={styles.appointmentRow}>
                      <td>{appointment.appointment_time}</td>
                      <td>{appointment.doctorName}</td>
                      <td>{appointment.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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