import React, { useState, useEffect } from 'react';
import styles from './DoctorDashboard.module.css';
import axios from 'axios';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

type Appointment = {
  patient_id: number;
  doctor_id: number;
  appointment_time: string;
  appointment_day: string;
  reason: string;
  appointment_id: number;
  patientName?: string;
};

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${BACKEND_URL}/appointments`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const today = new Date().toISOString().split('T')[0]; // Get today's date in 'YYYY-MM-DD' format
        const todayAppointments = response.data
          .filter((appointment: Appointment) => appointment.appointment_day === today)
          .sort((a: Appointment, b: Appointment) => {
            const timeA = new Date(`1970-01-01T${a.appointment_time}`);
            const timeB = new Date(`1970-01-01T${b.appointment_time}`);
            return timeA.getTime() - timeB.getTime();
          });

        // Fetch patient names for each appointment
        const appointmentsWithPatientNames = await Promise.all(
          todayAppointments.map(async (appointment: Appointment) => {
            try {
              const patientResponse = await axios.get(`${BACKEND_URL}/patients/${appointment.patient_id}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              return {
                ...appointment,
                patientName: patientResponse.data.full_name, // Add patientName to the appointment
              };
            } catch (err) {
              console.error(`Failed to fetch patient name for patient_id ${appointment.patient_id}:`, err);
              return {
                ...appointment,
                patientName: 'Unknown Patient', // Fallback if patient name cannot be fetched
              };
            }
          })
        );

        setAppointments(appointmentsWithPatientNames);
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
      <div className={styles.header}>
        <h2>Welcome, Doctor</h2>
        <p>Here's your schedule for today</p>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading your appointments...</div>
      ) : appointments.length === 0 ? (
        <div className={styles.card}>
          <h3>Today's Schedule</h3>
          <p>No appointments scheduled for today. Enjoy your free time!</p>
        </div>
      ) : (
        <div className={styles.card}>
          <h3>Today's Appointments ({appointments.length})</h3>
          <div className={styles.tableContainer}>
            <table className={styles.appointmentTable}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => {
                  const currentTime = new Date();
                  const appointmentTime = new Date(`${appointment.appointment_day}T${appointment.appointment_time}`);
                  const isUpcoming = appointmentTime > currentTime;
                  const isNow = Math.abs(appointmentTime.getTime() - currentTime.getTime()) < 3600000; // Within 1 hour
                  
                  return (
                    <tr 
                      key={appointment.appointment_id} 
                      className={`${styles.appointmentRow} ${isNow ? styles.currentAppointment : ''}`}
                    >
                      <td className={styles.timeCell}>{appointment.appointment_time}</td>
                      <td>{appointment.patientName}</td>
                      <td>{appointment.reason}</td>
                      <td>
                        <span className={
                          isNow ? styles.statusCurrent :
                          isUpcoming ? styles.statusUpcoming : styles.statusCompleted
                        }>
                          {isNow ? 'Current' : isUpcoming ? 'Upcoming' : 'Completed'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className={styles.card}>
        <h3>Quick Actions</h3>
        <div className={styles.quickActions}>
          <button 
            className={styles.actionButton}
            onClick={() => window.location.href = '/dashboard/schedule'}
          >
            📅 View Full Schedule
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => window.location.href = '/dashboard/patients'}
          >
            👥 Patient List
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => window.location.href = '/dashboard/create_records'}
          >
            📝 Create Medical Record
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;