import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  totalSkinAssessments: number;
  pendingReviews: number;
};

type SkinLesionAssessment = {
  image_id: number;
  upload_timestamp: string;
  body_region: string;
  ai_prediction: string;
  confidence_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'pending' | 'reviewed' | 'completed';
};

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<SkinLesionAssessment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalPrescriptions: 0,
    totalSkinAssessments: 0,
    pendingReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSkinCapture, setShowSkinCapture] = useState(false);
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
        
        // Fetch patient's skin assessment stats
        try {
          const statsResponse = await axios.get(`${BACKEND_URL}/community/stats`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          const skinStats = statsResponse.data;
          setStats({
            todayAppointments: todayAppointments.length,
            upcomingAppointments,
            completedAppointments,
            totalPrescriptions: 0, // Placeholder for future implementation
            totalSkinAssessments: skinStats.totalSkinAssessments || 0,
            pendingReviews: skinStats.pendingReviews || 0,
          });
        } catch (statsErr) {
          console.error('Failed to fetch skin assessment stats:', statsErr);
          setStats({
            todayAppointments: todayAppointments.length,
            upcomingAppointments,
            completedAppointments,
            totalPrescriptions: 0,
            totalSkinAssessments: 0,
            pendingReviews: 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
        setError('Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    {
      title: 'AI Skin Analysis',
      description: 'Get AI-powered skin lesion risk assessment',
      icon: '🤖',
      action: () => navigate('/dashboard/ai-analysis'),
      color: '#e74c3c',
      featured: true
    },
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
      title: 'My Appointments',
      description: 'View and manage your appointments',
      icon: '⏰',
      action: () => navigate('/dashboard/appointments'),
      color: '#f39c12'
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
          <div className={styles.statIcon}>🤖</div>
          <div className={styles.statInfo}>
            <h3>AI Skin Assessments</h3>
            <p className={styles.statNumber}>{stats.totalSkinAssessments}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⚠️</div>
          <div className={styles.statInfo}>
            <h3>Pending Reviews</h3>
            <p className={styles.statNumber}>{stats.pendingReviews}</p>
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

      {/* Featured: AI Skin Analysis */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>🩺 AI Skin Analysis - SeekWell</h3>
        <div className={styles.featuredAction}>
          <div className={styles.aiAnalysisCard} onClick={() => navigate('/dashboard/ai-analysis')}>
            <div className={styles.aiIcon}>🤖</div>
            <div className={styles.aiContent}>
              <h4>AI Skin Lesion Screening</h4>
              <p>Get instant AI-powered skin cancer risk assessment with professional review</p>
              <div className={styles.aiStats}>
                <span>📊 {stats.totalSkinAssessments} assessments</span>
                <span>⚠️ {stats.pendingReviews} pending reviews</span>
              </div>
            </div>
            <div className={styles.aiCta}>Start Analysis →</div>
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
          <h3 className={styles.sectionTitle}>Today's Appointments</h3>
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
      </div>
    </div>
  );
};

export default PatientDashboard;