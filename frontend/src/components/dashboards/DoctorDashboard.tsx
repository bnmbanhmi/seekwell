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
      <h2 className={styles.header}>Welcome, Doctor</h2>

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
                    <th>Patient</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment: Appointment) => (
                    <tr key={appointment.appointment_id} className={styles.appointmentRow}>
                      <td>{appointment.appointment_time}</td>
                      <td>{appointment.patientName}</td>
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
      </div>
    </div>
  );
};

export default DoctorDashboard;