import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './StaffDashboard.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

type Appointment = {
  patient_id: number;
  doctor_id: number;
  appointment_time: string;
  appointment_day: string;
  reason: string;
  appointment_id: number;
  patientName?: string;
  doctorName?: string;
};

type DashboardStats = {
  todayAppointments: number;
  totalPatients: number;
  pendingCheckIns: number;
  completedToday: number;
};

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    totalPatients: 0,
    pendingCheckIns: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        // Fetch today's appointments
        const appointmentsResponse = await axios.get(`${BACKEND_URL}/appointments`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = appointmentsResponse.data.filter(
          (appointment: Appointment) => appointment.appointment_day === today
        );

        // Enrich appointments with patient and doctor names
        const enrichedAppointments = await Promise.all(
          todayAppointments.map(async (appointment: Appointment) => {
            try {
              const [patientResponse, doctorResponse] = await Promise.all([
                axios.get(`${BACKEND_URL}/patients/${appointment.patient_id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${BACKEND_URL}/doctors/${appointment.doctor_id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                }),
              ]);
              
              return {
                ...appointment,
                patientName: patientResponse.data.full_name,
                doctorName: doctorResponse.data.doctor_name,
              };
            } catch (err) {
              console.error('Failed to fetch names:', err);
              return {
                ...appointment,
                patientName: 'Unknown Patient',
                doctorName: 'Unknown Doctor',
              };
            }
          })
        );

        // Sort by appointment time
        enrichedAppointments.sort((a, b) => {
          const timeA = new Date(`1970-01-01T${a.appointment_time}`);
          const timeB = new Date(`1970-01-01T${b.appointment_time}`);
          return timeA.getTime() - timeB.getTime();
        });

        setAppointments(enrichedAppointments);

        // Fetch patients count
        const patientsResponse = await axios.get(`${BACKEND_URL}/patients`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStats({
          todayAppointments: enrichedAppointments.length,
          totalPatients: patientsResponse.data.length,
          pendingCheckIns: enrichedAppointments.length, // Simplified - all appointments are pending
          completedToday: 0, // Placeholder
        });

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    {
      title: 'Schedule Appointment',
      description: 'Book appointments for patients',
      icon: '📅',
      action: () => navigate('/dashboard/appointments/schedule'),
      color: '#3498db'
    },
    {
      title: 'Patient Search',
      description: 'Find and view patient records',
      icon: '🔍',
      action: () => navigate('/dashboard/patients'),
      color: '#27ae60'
    },
    {
      title: 'Check-in Patients',
      description: 'Manage patient check-ins',
      icon: '✅',
      action: () => navigate('/dashboard/checkin'),
      color: '#f39c12'
    },
    {
      title: 'Billing & Invoices',
      description: 'Handle billing and payments',
      icon: '💰',
      action: () => navigate('/dashboard/billing'),
      color: '#e74c3c'
    }
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Staff Dashboard</h2>
        <p className={styles.subtitle}>Manage clinic operations and patient care</p>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📅</div>
          <div className={styles.statInfo}>
            <h3>Today's Appointments</h3>
            <p className={styles.statNumber}>{stats.todayAppointments}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statInfo}>
            <h3>Total Patients</h3>
            <p className={styles.statNumber}>{stats.totalPatients}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏰</div>
          <div className={styles.statInfo}>
            <h3>Pending Check-ins</h3>
            <p className={styles.statNumber}>{stats.pendingCheckIns}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <h3>Completed Today</h3>
            <p className={styles.statNumber}>{stats.completedToday}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <div
              key={index}
              className={styles.actionCard}
              onClick={action.action}
              style={{ borderLeftColor: action.color }}
            >
              <div className={styles.actionIcon}>{action.icon}</div>
              <div className={styles.actionContent}>
                <h4>{action.title}</h4>
                <p>{action.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Appointments */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Today's Schedule</h3>
        {appointments.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No appointments scheduled for today</p>
          </div>
        ) : (
          <div className={styles.appointmentsTable}>
            <div className={styles.tableHeader}>
              <div>Time</div>
              <div>Patient</div>
              <div>Doctor</div>
              <div>Reason</div>
              <div>Status</div>
            </div>
            {appointments.map((appointment) => (
              <div key={appointment.appointment_id} className={styles.tableRow}>
                <div className={styles.timeCell}>{appointment.appointment_time}</div>
                <div>{appointment.patientName}</div>
                <div>{appointment.doctorName}</div>
                <div className={styles.reasonCell}>{appointment.reason}</div>
                <div>
                  <span className={styles.statusPending}>Pending</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
