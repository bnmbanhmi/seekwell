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
        
        // Fetch appointments
        const appointmentsResponse = await axios.get(`${BACKEND_URL}/appointments/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Fetch skin assessments (placeholder - will implement API in Phase 2)
        // const assessmentsResponse = await axios.get(`${BACKEND_URL}/skin-lesions/my-assessments`, {
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //   },
        // });

        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = appointmentsResponse.data.filter(
          (appointment: any) => appointment.appointment_day === today
        );

        // Calculate stats
        const currentTime = new Date();
        const upcomingAppointments = appointmentsResponse.data.filter((appointment: any) => {
          const appointmentDate = new Date(appointment.appointment_day);
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          return appointmentDate > todayDate;
        }).length;

        const completedAppointments = appointmentsResponse.data.filter((appointment: any) => {
          const appointmentDate = new Date(appointment.appointment_day);
          return appointmentDate < currentTime;
        }).length;

        // Mock skin assessment data for now
        const mockAssessments: SkinLesionAssessment[] = [
          {
            image_id: 1,
            upload_timestamp: new Date().toISOString(),
            body_region: 'Face',
            ai_prediction: 'Benign nevus',
            confidence_score: 0.89,
            risk_level: 'LOW',
            status: 'completed'
          },
          {
            image_id: 2,
            upload_timestamp: new Date(Date.now() - 86400000).toISOString(),
            body_region: 'Arm',
            ai_prediction: 'Seborrheic keratosis',
            confidence_score: 0.76,
            risk_level: 'MEDIUM',
            status: 'pending'
          }
        ];

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
        setRecentAssessments(mockAssessments);
        setStats({
          todayAppointments: todayAppointments.length,
          upcomingAppointments,
          completedAppointments,
          totalPrescriptions: 0, // Will fetch from prescriptions API
          totalSkinAssessments: mockAssessments.length,
          pendingReviews: mockAssessments.filter(a => a.status === 'pending').length,
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSkinCapture = () => {
    setShowSkinCapture(true);
    // Will implement skin capture modal in Phase 4
    alert('Skin Lesion Capture will be implemented in Phase 4!');
  };

  const getRiskBadgeClass = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'risk-low';
      case 'MEDIUM': return 'risk-medium';
      case 'HIGH': return 'risk-high';
      case 'URGENT': return 'risk-urgent';
      default: return 'risk-low';
    }
  };

  const quickActions = [
    {
      title: 'Skin Assessment',
      description: 'Take a photo for AI skin lesion analysis',
      action: handleSkinCapture,
      color: '#e74c3c',
      featured: true
    },
    {
      title: 'Book Appointment',
      description: 'Schedule with a doctor or local cadre',
      action: () => navigate('/dashboard/appointments/book'),
      color: '#3498db'
    },
    {
      title: 'Medical History',
      description: 'View your complete health records',
      action: () => navigate('/dashboard/medical-history'),
      color: '#2ecc71'
    },
    {
      title: 'Assessment History',
      description: 'Track your skin lesion assessments',
      action: () => navigate('/dashboard/skin-assessments'),
      color: '#9b59b6'
    }
  ];

  if (loading) {
    return (
      <div className={`${styles.container} mobile-container`}>
        <div className="mobile-loading">
          <div className="mobile-spinner"></div>
          <p>Loading your health dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} mobile-container safe-area-top`}>
      {/* Mobile Header */}
      <div className={styles.header}>
        <h2 className={`${styles.title} mobile-heading-responsive`}>SeekWell Dashboard</h2>
        <p className={`${styles.subtitle} mobile-text-responsive`}>Your AI-powered health companion</p>
      </div>

      {error && (
        <div className={`${styles.error} mobile-card`}>{error}</div>
      )}

      {/* Statistics Cards - Mobile Grid */}
      <div className={`${styles.statsGrid} mobile-grid`}>
        <div className={`${styles.statCard} mobile-card`}>
          <div className={styles.statInfo}>
            <h3>Today's Appointments</h3>
            <p className={styles.statNumber}>{stats.todayAppointments}</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} mobile-card`}>
          <div className={styles.statInfo}>
            <h3>Skin Assessments</h3>
            <p className={styles.statNumber}>{stats.totalSkinAssessments}</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} mobile-card`}>
          <div className={styles.statInfo}>
            <h3>Pending Reviews</h3>
            <p className={styles.statNumber}>{stats.pendingReviews}</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} mobile-card`}>
          <div className={styles.statInfo}>
            <h3>Completed</h3>
            <p className={styles.statNumber}>{stats.completedAppointments}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Mobile First */}
      <div className={styles.section}>
        <h3 className={`${styles.sectionTitle} mobile-text-lg`}>Quick Actions</h3>
        <div className={`mobile-grid mobile-grid-2`}>
          {quickActions.map((action, index) => (
            <div
              key={index}
              className={`mobile-card touch-target haptic-medium ${action.featured ? styles.featuredAction : ''}`}
              onClick={action.action}
              style={{ 
                borderLeft: `4px solid ${action.color}`,
                cursor: 'pointer'
              }}
            >
              <div className={styles.actionContent}>
                <h4 className="mobile-text-responsive" style={{ margin: '8px 0 4px 0' }}>
                  {action.title}
                </h4>
                <p className="mobile-text-sm" style={{ margin: 0, color: '#666' }}>
                  {action.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Skin Assessments */}
      {recentAssessments.length > 0 && (
        <div className={styles.section}>
          <h3 className={`${styles.sectionTitle} mobile-text-lg`}>Recent Skin Assessments</h3>
          <div className="mobile-grid">
            {recentAssessments.map((assessment) => (
              <div key={assessment.image_id} className="mobile-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 className="mobile-text-base" style={{ margin: '0 0 4px 0' }}>
                      {assessment.body_region}
                    </h4>
                    <p className="mobile-text-sm" style={{ margin: 0, color: '#666' }}>
                      {new Date(assessment.upload_timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`risk-badge ${getRiskBadgeClass(assessment.risk_level)}`}>
                    {assessment.risk_level}
                  </span>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <p className="mobile-text-sm" style={{ margin: '0 0 4px 0' }}>
                    <strong>AI Analysis:</strong> {assessment.ai_prediction}
                  </p>
                  <p className="mobile-text-sm" style={{ margin: 0 }}>
                    <strong>Confidence:</strong> {(assessment.confidence_score * 100).toFixed(1)}%
                  </p>
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  Status: {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Appointments */}
      <div className={styles.section}>
        <h3 className={`${styles.sectionTitle} mobile-text-lg`}>Today's Schedule</h3>
        {appointments.length === 0 ? (
          <div className="mobile-card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p className="mobile-text-responsive" style={{ color: '#666', margin: 0 }}>
              No appointments scheduled for today
            </p>
          </div>
        ) : (
          <div className="mobile-grid">
            {appointments.map((appointment: any) => (
              <div key={appointment.appointment_id} className="mobile-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 className="mobile-text-base" style={{ margin: '0 0 4px 0' }}>
                      {appointment.appointment_time}
                    </h4>
                    <p className="mobile-text-sm" style={{ margin: '0 0 4px 0' }}>
                      Dr. {appointment.doctorName}
                    </p>
                    <p className="mobile-text-sm" style={{ margin: 0, color: '#666' }}>
                      {appointment.reason}
                    </p>
                  </div>
                  <span className="risk-badge risk-medium">Scheduled</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Spacer */}
      <div style={{ height: '80px' }} className="safe-area-bottom"></div>
    </div>
  );
};

export default PatientDashboard;
