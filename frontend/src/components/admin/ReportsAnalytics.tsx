import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from './ReportsAnalytics.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface ReportData {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalStaff: number;
  totalAppointments: number;
  todayAppointments: number;
  weeklyAppointments: number;
  monthlyAppointments: number;
  appointmentStatusBreakdown: {
    pending: number;
    completed: number;
    cancelled: number;
  };
  userRegistrationTrend: Array<{
    date: string;
    count: number;
  }>;
  appointmentTrend: Array<{
    date: string;
    count: number;
  }>;
}

const ReportsAnalytics: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>({
    totalUsers: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalStaff: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    weeklyAppointments: 0,
    monthlyAppointments: 0,
    appointmentStatusBreakdown: { pending: 0, completed: 0, cancelled: 0 },
    userRegistrationTrend: [],
    appointmentTrend: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch users data
      const usersResponse = await axios.get(`${BACKEND_URL}/users/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const users = usersResponse.data;

      // Fetch appointments data
      const appointmentsResponse = await axios.get(`${BACKEND_URL}/appointments/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const appointments = appointmentsResponse.data;

      // Fetch patients data
      const patientsResponse = await axios.get(`${BACKEND_URL}/patients/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const patients = patientsResponse.data;

      // Calculate statistics
      const today = new Date().toISOString().split('T')[0];
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const stats = {
        totalUsers: users.length,
        totalPatients: users.filter((user: any) => user.role === 'PATIENT').length,
        totalDoctors: users.filter((user: any) => user.role === 'DOCTOR').length,
        totalStaff: users.filter((user: any) => user.role === 'CLINIC_STAFF').length,
        totalAppointments: appointments.length,
        todayAppointments: appointments.filter((apt: any) => apt.appointment_day === today).length,
        weeklyAppointments: appointments.filter((apt: any) => apt.appointment_day >= oneWeekAgo).length,
        monthlyAppointments: appointments.filter((apt: any) => apt.appointment_day >= oneMonthAgo).length,
        appointmentStatusBreakdown: {
          pending: appointments.filter((apt: any) => new Date(`${apt.appointment_day}T${apt.appointment_time}`) > new Date()).length,
          completed: appointments.filter((apt: any) => new Date(`${apt.appointment_day}T${apt.appointment_time}`) < new Date()).length,
          cancelled: 0 // Placeholder - would need status field in appointments
        },
        userRegistrationTrend: generateTrendData(users, 'created_at'),
        appointmentTrend: generateTrendData(appointments, 'appointment_day')
      };

      setReportData(stats);
    } catch (err: any) {
      console.error('Error fetching report data:', err);
      setError('Không thể tải dữ liệu báo cáo');
      toast.error('Không thể tải dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const generateTrendData = (data: any[], dateField: string) => {
    const trendMap = new Map<string, number>();
    const days = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365;
    
    // Initialize dates
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      trendMap.set(dateStr, 0);
    }

    // Count items per date
    data.forEach((item: any) => {
      const date = item[dateField]?.split('T')[0];
      if (date && trendMap.has(date)) {
        trendMap.set(date, (trendMap.get(date) || 0) + 1);
      }
    });

    return Array.from(trendMap.entries()).map(([date, count]) => ({
      date,
      count
    }));
  };

  const exportReport = () => {
    const reportContent = `
Hệ thống quản lý phòng khám - Báo cáo phân tích
Tạo vào ngày: ${new Date().toLocaleDateString('vi-VN')}

=== TỔNG QUAN ===
Tổng số người dùng: ${reportData.totalUsers}
Tổng số bệnh nhân: ${reportData.totalPatients}
Tổng số bác sĩ: ${reportData.totalDoctors}
Tổng số nhân viên: ${reportData.totalStaff}

=== CUỘC HẸN ===
Tổng số cuộc hẹn: ${reportData.totalAppointments}
Cuộc hẹn hôm nay: ${reportData.todayAppointments}
Tuần này: ${reportData.weeklyAppointments}
Tháng này: ${reportData.monthlyAppointments}

=== PHÂN LOẠI TRẠNG THÁI ===
Chờ xử lý: ${reportData.appointmentStatusBreakdown.pending}
Hoàn thành: ${reportData.appointmentStatusBreakdown.completed}
Đã hủy: ${reportData.appointmentStatusBreakdown.cancelled}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-phong-kham-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Xuất báo cáo thành công!');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải báo cáo...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Báo cáo & Phân tích</h2>
        <div className={styles.headerActions}>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'year')}
            className={styles.periodSelect}
          >
            <option value="week">7 ngày qua</option>
            <option value="month">30 ngày qua</option>
            <option value="year">Năm qua</option>
          </select>
          <button onClick={exportReport} className={styles.exportButton}>
            Xuất báo cáo
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* Overview Statistics */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Tổng quan hệ thống</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statInfo}>
              <h4>Tổng người dùng</h4>
              <p className={styles.statNumber}>{reportData.totalUsers}</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏥</div>
            <div className={styles.statInfo}>
              <h4>Bệnh nhân</h4>
              <p className={styles.statNumber}>{reportData.totalPatients}</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👨‍⚕️</div>
            <div className={styles.statInfo}>
              <h4>Bác sĩ</h4>
              <p className={styles.statNumber}>{reportData.totalDoctors}</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👩‍💼</div>
            <div className={styles.statInfo}>
              <h4>Nhân viên</h4>
              <p className={styles.statNumber}>{reportData.totalStaff}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Statistics */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Phân tích cuộc hẹn</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statInfo}>
              <h4>Tổng cuộc hẹn</h4>
              <p className={styles.statNumber}>{reportData.totalAppointments}</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📍</div>
            <div className={styles.statInfo}>
              <h4>Hôm nay</h4>
              <p className={styles.statNumber}>{reportData.todayAppointments}</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statInfo}>
              <h4>Tuần này</h4>
              <p className={styles.statNumber}>{reportData.weeklyAppointments}</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📈</div>
            <div className={styles.statInfo}>
              <h4>Tháng này</h4>
              <p className={styles.statNumber}>{reportData.monthlyAppointments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Phân bố trạng thái cuộc hẹn</h3>
        <div className={styles.statusGrid}>
          <div className={styles.statusCard}>
            <div className={styles.statusIcon} style={{ backgroundColor: '#f39c12' }}>⏳</div>
            <div className={styles.statusInfo}>
              <h4>Chờ xử lý</h4>
              <p className={styles.statusNumber}>{reportData.appointmentStatusBreakdown.pending}</p>
            </div>
          </div>
          
          <div className={styles.statusCard}>
            <div className={styles.statusIcon} style={{ backgroundColor: '#27ae60' }}>✅</div>
            <div className={styles.statusInfo}>
              <h4>Hoàn thành</h4>
              <p className={styles.statusNumber}>{reportData.appointmentStatusBreakdown.completed}</p>
            </div>
          </div>
          
          <div className={styles.statusCard}>
            <div className={styles.statusIcon} style={{ backgroundColor: '#e74c3c' }}>❌</div>
            <div className={styles.statusInfo}>
              <h4>Đã hủy</h4>
              <p className={styles.statusNumber}>{reportData.appointmentStatusBreakdown.cancelled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trends */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Xu hướng hoạt động ({selectedPeriod})</h3>
        <div className={styles.trendsGrid}>
          <div className={styles.trendCard}>
            <h4>Đăng ký người dùng</h4>
            <div className={styles.trendChart}>
              {reportData.userRegistrationTrend.slice(-7).map((item, index) => (
                <div key={index} className={styles.trendBar}>
                  <div 
                    className={styles.trendBarFill}
                    style={{ 
                      height: `${Math.max(item.count * 20, 5)}px`,
                      backgroundColor: '#3498db'
                    }}
                  ></div>
                  <span className={styles.trendLabel}>{item.date.split('-')[2]}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.trendCard}>
            <h4>Cuộc hẹn được đặt</h4>
            <div className={styles.trendChart}>
              {reportData.appointmentTrend.slice(-7).map((item, index) => (
                <div key={index} className={styles.trendBar}>
                  <div 
                    className={styles.trendBarFill}
                    style={{ 
                      height: `${Math.max(item.count * 10, 5)}px`,
                      backgroundColor: '#27ae60'
                    }}
                  ></div>
                  <span className={styles.trendLabel}>{item.date.split('-')[2]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
