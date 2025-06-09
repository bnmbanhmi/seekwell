import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

type DashboardStats = {
  todayAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  totalPrescriptions: number;
};

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalPrescriptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${BACKEND_URL}/appointments/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = response.data.filter(
          (appointment: any) => appointment.appointment_day === today
        );

        // Calculate stats
        const currentTime = new Date();
        const upcomingAppointments = response.data.filter((appointment: any) => {
          const appointmentDate = new Date(appointment.appointment_day);
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          return appointmentDate > todayDate;
        }).length;

        const completedAppointments = response.data.filter((appointment: any) => {
          const appointmentDateTime = new Date(`${appointment.appointment_day}T${appointment.appointment_time}`);
          return appointmentDateTime < currentTime;
        }).length;

        // Fetch doctor names for today's appointments
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
                doctorName: doctorResponse.data.doctor_name,
              };
            } catch (err) {
              console.error(`Failed to fetch doctor name for doctor_id ${appointment.doctor_id}:`, err);
              return {
                ...appointment,
                doctorName: 'Unknown Doctor',
              };
            }
          })
        );

        setAppointments(appointmentsWithDoctorNames);
        setStats({
          todayAppointments: todayAppointments.length,
          upcomingAppointments,
          completedAppointments,
          totalPrescriptions: 0, // We'll fetch this from prescriptions API later
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
      title: 'Book New Appointment',
      description: 'Schedule a new appointment with your doctor',
      icon: '📅',
      action: () => navigate('/dashboard/appointments/book'),
      color: '#3b82f6'
    },
    {
      title: 'View Medical History',
      description: 'Access your complete medical records',
      icon: '📋',
      action: () => navigate('/dashboard/medical-history'),
      color: '#10b981'
    },
    {
      title: 'View Prescriptions',
      description: 'Check your current prescriptions',
      icon: '💊',
      action: () => navigate('/dashboard/prescriptions'),
      color: '#f59e0b'
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
        <h2 className={styles.title}>Patient Dashboard</h2>
        <p className={styles.subtitle}>Manage your appointments and health records</p>
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
          <div className={styles.statIcon}>⏰</div>
          <div className={styles.statInfo}>
            <h3>Upcoming Appointments</h3>
            <p className={styles.statNumber}>{stats.upcomingAppointments}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <h3>Completed Appointments</h3>
            <p className={styles.statNumber}>{stats.completedAppointments}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💊</div>
          <div className={styles.statInfo}>
            <h3>Active Prescriptions</h3>
            <p className={styles.statNumber}>{stats.totalPrescriptions}</p>
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

      <div className={styles.gridLayout}>
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
                <div>Doctor</div>
                <div>Reason</div>
                <div>Status</div>
              </div>
              {appointments.map((appointment: any) => (
                <div key={appointment.appointment_id} className={styles.tableRow}>
                  <div className={styles.timeCell}>{appointment.appointment_time}</div>
                  <div>{appointment.doctorName}</div>
                  <div className={styles.reasonCell}>{appointment.reason}</div>
                  <div className={styles.statusUpcoming}>Scheduled</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Assistant */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>🤖 Your Personal Health Assistant</h3>
          <div className={styles.chatCard}>
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
    </div>
  );
};

export default PatientDashboard;