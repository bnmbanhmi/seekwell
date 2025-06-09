// components/dashboards/DoctorDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './DoctorDashboard.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface Appointment {
  id: string;
  patient_name: string;
  appointment_time: string;
  status: string;
  patient_id: string;
}

interface DashboardStats {
  todayAppointments: number;
  completedConsultations: number;
  pendingEmrs: number;
}

const DoctorDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    completedConsultations: 0,
    pendingEmrs: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch today's appointments
      const appointmentsResponse = await axios.get(`${BACKEND_URL}/appointments/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const todayAppointments = appointmentsResponse.data.filter((apt: Appointment) => {
        const appointmentDate = new Date(apt.appointment_time).toDateString();
        const today = new Date().toDateString();
        return appointmentDate === today;
      });

      setAppointments(todayAppointments);
      setStats({
        todayAppointments: todayAppointments.length,
        completedConsultations: todayAppointments.filter((apt: Appointment) => apt.status === 'completed').length,
        pendingEmrs: todayAppointments.filter((apt: Appointment) => apt.status === 'confirmed').length
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const handleStartConsultation = (appointmentId: string, patientId: string) => {
    // Navigate to EMR creation with pre-selected patient
    navigate('/emr/create', { 
      state: { 
        appointmentId, 
        patientId,
        fromConsultation: true 
      } 
    });
  };

  const handleViewPatientHistory = (patientId: string) => {
    navigate(`/patients/${patientId}/history`);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Doctor Dashboard</h1>
        <div className={styles.dateTime}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Today's Appointments</h3>
          <div className={styles.statNumber}>{stats.todayAppointments}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Completed Consultations</h3>
          <div className={styles.statNumber}>{stats.completedConsultations}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Pending EMRs</h3>
          <div className={styles.statNumber}>{stats.pendingEmrs}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionButtons}>
          <button 
            className={styles.actionButton}
            onClick={() => navigate('/emr/create')}
          >
            <span className={styles.actionIcon}>📝</span>
            Create New EMR
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => navigate('/appointments')}
          >
            <span className={styles.actionIcon}>📅</span>
            View All Appointments
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => navigate('/patients')}
          >
            <span className={styles.actionIcon}>👥</span>
            Search Patients
          </button>
        </div>
      </div>

      {/* Today's Patient Queue */}
      <div className={styles.patientQueue}>
        <h2 className={styles.sectionTitle}>Today's Patient Queue</h2>
        {appointments.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No appointments scheduled for today</p>
          </div>
        ) : (
          <div className={styles.appointmentsList}>
            {appointments.map((appointment) => (
              <div key={appointment.id} className={styles.appointmentCard}>
                <div className={styles.appointmentInfo}>
                  <div className={styles.patientName}>{appointment.patient_name}</div>
                  <div className={styles.appointmentTime}>
                    {formatTime(appointment.appointment_time)}
                  </div>
                  <div className={`${styles.status} ${styles[appointment.status]}`}>
                    {appointment.status}
                  </div>
                </div>
                <div className={styles.appointmentActions}>
                  <button
                    className={styles.primaryButton}
                    onClick={() => handleStartConsultation(appointment.id, appointment.patient_id)}
                    disabled={appointment.status === 'completed'}
                  >
                    {appointment.status === 'completed' ? 'Completed' : 'Start Consultation'}
                  </button>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => handleViewPatientHistory(appointment.patient_id)}
                  >
                    View History
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
