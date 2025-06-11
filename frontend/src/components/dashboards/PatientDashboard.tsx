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
        setStats({
          todayAppointments: todayAppointments.length,
          upcomingAppointments,
          completedAppointments,
          totalPrescriptions: 0, // We'll fetch this from prescriptions API later
          totalSkinAssessments: 0, // Will be implemented in Phase 2
          pendingReviews: 0, // Will be implemented in Phase 2
        });
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
        setError('Không thể tải dữ liệu bảng điều khiển.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    {
      title: 'Đặt cuộc hẹn mới',
      description: 'Lên lịch cuộc hẹn mới với bác sĩ của bạn',
      icon: '📅',
      action: () => navigate('/dashboard/appointments/book'),
      color: '#3b82f6'
    },
    {
      title: 'Xem tiền sử bệnh án',
      description: 'Truy cập hồ sơ y tế đầy đủ của bạn',
      icon: '📋',
      action: () => navigate('/dashboard/medical-history'),
      color: '#10b981'
    },
    {
      title: 'Xem đơn thuốc',
      description: 'Kiểm tra đơn thuốc hiện tại của bạn',
      icon: '💊',
      action: () => navigate('/dashboard/prescriptions'),
      color: '#f59e0b'
    }
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải bảng điều khiển...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Dashboard Bệnh nhân</h2>
        <p className={styles.subtitle}>Quản lý cuộc hẹn và hồ sơ sức khỏe của bạn</p>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📅</div>
          <div className={styles.statInfo}>
            <h3>Cuộc hẹn hôm nay</h3>
            <p className={styles.statNumber}>{stats.todayAppointments}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏰</div>
          <div className={styles.statInfo}>
            <h3>Cuộc hẹn sắp tới</h3>
            <p className={styles.statNumber}>{stats.upcomingAppointments}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <h3>Cuộc hẹn đã hoàn thành</h3>
            <p className={styles.statNumber}>{stats.completedAppointments}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💊</div>
          <div className={styles.statInfo}>
            <h3>Đơn thuốc đang hoạt động</h3>
            <p className={styles.statNumber}>{stats.totalPrescriptions}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Hành động nhanh</h3>
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
          <h3 className={styles.sectionTitle}>Lịch hẹn hôm nay</h3>
          {appointments.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Không có cuộc hẹn nào được lên lịch cho hôm nay</p>
            </div>
          ) : (
            <div className={styles.appointmentsTable}>
              <div className={styles.tableHeader}>
                <div>Thời gian</div>
                <div>Bác sĩ</div>
                <div>Lý do</div>
                <div>Trạng thái</div>
              </div>
              {appointments.map((appointment: any) => (
                <div key={appointment.appointment_id} className={styles.tableRow}>
                  <div className={styles.timeCell}>{appointment.appointment_time}</div>
                  <div>{appointment.doctorName}</div>
                  <div className={styles.reasonCell}>{appointment.reason}</div>
                  <div className={styles.statusUpcoming}>Đã lên lịch</div>
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