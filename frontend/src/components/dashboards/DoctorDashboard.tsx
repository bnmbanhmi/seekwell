import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

type DashboardStats = {
  todayAppointments: number;
  totalPatients: number;
  upcomingAppointments: number;
  completedToday: number;
  totalMedicalReports: number;
};

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    totalPatients: 0,
    upcomingAppointments: 0,
    completedToday: 0,
    totalMedicalReports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        // Fetch appointments
        const appointmentsResponse = await axios.get(`${BACKEND_URL}/appointments`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const today = new Date().toISOString().split('T')[0];
        const currentTime = new Date();
        
        // Filter today's appointments
        const todayAppointments = appointmentsResponse.data
          .filter((appointment: Appointment) => appointment.appointment_day === today)
          .sort((a: Appointment, b: Appointment) => {
            const timeA = new Date(`1970-01-01T${a.appointment_time}`);
            const timeB = new Date(`1970-01-01T${b.appointment_time}`);
            return timeA.getTime() - timeB.getTime();
          });

        // Count upcoming appointments (future dates)
        const upcomingAppointments = appointmentsResponse.data.filter((appointment: Appointment) => {
          const appointmentDate = new Date(appointment.appointment_day);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return appointmentDate > today;
        }).length;

        // Count completed appointments today
        const completedToday = todayAppointments.filter((appointment: Appointment) => {
          const appointmentTime = new Date(`${appointment.appointment_day}T${appointment.appointment_time}`);
          return appointmentTime < currentTime;
        }).length;

        // Fetch patient names for today's appointments
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
                patientName: patientResponse.data.full_name,
              };
            } catch (err) {
              console.error(`Failed to fetch patient name for patient_id ${appointment.patient_id}:`, err);
              return {
                ...appointment,
                patientName: 'Unknown Patient',
              };
            }
          })
        );

        // Fetch total patients count
        const patientsResponse = await axios.get(`${BACKEND_URL}/patients`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Fetch medical reports count
        let totalMedicalReports = 0;
        try {
          const reportsResponse = await axios.get(`${BACKEND_URL}/medical_reports/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          totalMedicalReports = reportsResponse.data.length;
        } catch (err) {
          console.log('Medical reports endpoint not accessible or no reports found');
        }

        setAppointments(appointmentsWithPatientNames);
        setStats({
          todayAppointments: todayAppointments.length,
          totalPatients: patientsResponse.data.length,
          upcomingAppointments,
          completedToday,
          totalMedicalReports,
        });
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    {
      title: 'View Full Schedule',
      description: 'Manage your appointment calendar',
      icon: '📅',
      action: () => navigate('/dashboard/schedule'),
      color: '#3498db'
    },
    {
      title: 'Patient Search',
      description: 'Find and view patient records',
      icon: '👥',
      action: () => navigate('/dashboard/patients'),
      color: '#27ae60'
    },
    {
      title: 'Create Medical Record',
      description: 'Document patient consultations',
      icon: '📝',
      action: () => navigate('/dashboard/create_records'),
      color: '#e74c3c'
    },
    {
      title: 'Medical Reports',
      description: 'Manage your medical reports',
      icon: '📊',
      action: () => navigate('/dashboard/medical-reports'),
      color: '#f39c12'
    },
    {
      title: 'Medical History',
      description: 'View patient medical histories',
      icon: '📋',
      action: () => navigate('/dashboard/medical-history'),
      color: '#9b59b6'
    },
    {
      title: 'Prescriptions',
      description: 'Manage patient prescriptions',
      icon: '💊',
      action: () => navigate('/dashboard/prescriptions'),
      color: '#1abc9c'
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
        <h2 className={styles.title}>Doctor Dashboard</h2>
        <p className={styles.subtitle}>Manage your patients and medical practice</p>
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
            <h3>Upcoming Appointments</h3>
            <p className={styles.statNumber}>{stats.upcomingAppointments}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <h3>Completed Today</h3>
            <p className={styles.statNumber}>{stats.completedToday}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statInfo}>
            <h3>Medical Reports</h3>
            <p className={styles.statNumber}>{stats.totalMedicalReports}</p>
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

      {/* Today's Schedule */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Today's Schedule</h3>
        {appointments.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No appointments scheduled for today. Enjoy your free time!</p>
          </div>
        ) : (
          <div className={styles.appointmentsTable}>
            <div className={styles.tableHeader}>
              <div>Time</div>
              <div>Patient</div>
              <div>Reason</div>
              <div>Status</div>
            </div>
            {appointments.map((appointment) => {
              const currentTime = new Date();
              const appointmentTime = new Date(`${appointment.appointment_day}T${appointment.appointment_time}`);
              const isUpcoming = appointmentTime > currentTime;
              const isNow = Math.abs(appointmentTime.getTime() - currentTime.getTime()) < 3600000; // Within 1 hour
              
              return (
                <div key={appointment.appointment_id} className={styles.tableRow}>
                  <div className={styles.timeCell}>{appointment.appointment_time}</div>
                  <div>{appointment.patientName}</div>
                  <div className={styles.reasonCell}>{appointment.reason}</div>
                  <div>
                    <span className={
                      isNow ? styles.statusCurrent :
                      isUpcoming ? styles.statusUpcoming : styles.statusCompleted
                    }>
                      {isNow ? 'Current' : isUpcoming ? 'Upcoming' : 'Completed'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;