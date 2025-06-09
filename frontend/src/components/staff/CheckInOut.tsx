import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './CheckInOut.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface Appointment {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_time: string;
  appointment_day: string;
  reason: string;
  status?: string;
  patientName?: string;
  doctorName?: string;
}

interface Patient {
  id: number;
  full_name: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
}

interface CheckInRecord {
  id: string;
  patient: Patient;
  checkInTime: string;
  checkOutTime?: string;
  appointment?: Appointment;
  status: 'checked-in' | 'completed';
}

const CheckInOut: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [checkedInPatients, setCheckedInPatients] = useState<CheckInRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'appointments' | 'checked-in'>('appointments');

  useEffect(() => {
    fetchTodayAppointments();
    loadCheckedInPatients();
  }, []);

  const fetchTodayAppointments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BACKEND_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = response.data.filter(
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
              status: 'scheduled',
            };
          } catch (err) {
            console.error('Failed to fetch names:', err);
            return {
              ...appointment,
              patientName: 'Bệnh nhân không xác định',
              doctorName: 'Bác sĩ không xác định',
              status: 'scheduled',
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
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setError('Không thể tải danh sách cuộc hẹn.');
    } finally {
      setLoading(false);
    }
  };

  const loadCheckedInPatients = () => {
    // Load from localStorage (in a real app, this would be from backend)
    const stored = localStorage.getItem('checkedInPatients');
    if (stored) {
      const checkedIn = JSON.parse(stored);
      // Filter only today's check-ins
      const today = new Date().toDateString();
      const todayCheckedIn = checkedIn.filter((record: CheckInRecord) => 
        new Date(record.checkInTime).toDateString() === today
      );
      setCheckedInPatients(todayCheckedIn);
    }
  };

  const saveCheckedInPatients = (records: CheckInRecord[]) => {
    localStorage.setItem('checkedInPatients', JSON.stringify(records));
    setCheckedInPatients(records);
  };

  const handleCheckIn = async (appointment: Appointment) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch full patient details
      const patientResponse = await axios.get(`${BACKEND_URL}/patients/${appointment.patient_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const checkInRecord: CheckInRecord = {
        id: `${appointment.appointment_id}-${Date.now()}`,
        patient: patientResponse.data,
        checkInTime: new Date().toISOString(),
        appointment,
        status: 'checked-in',
      };

      const existingRecords = JSON.parse(localStorage.getItem('checkedInPatients') || '[]');
      const updatedRecords = [...existingRecords, checkInRecord];
      saveCheckedInPatients(updatedRecords);

      // Update appointment status
      setAppointments(prev => 
        prev.map(apt => 
          apt.appointment_id === appointment.appointment_id 
            ? { ...apt, status: 'checked-in' }
            : apt
        )
      );

      alert(`${appointment.patientName} đã được check-in thành công!`);
    } catch (err) {
      console.error('Failed to check in patient:', err);
      setError('Không thể check-in bệnh nhân.');
    }
  };

  const handleCheckOut = (recordId: string) => {
    const existingRecords = JSON.parse(localStorage.getItem('checkedInPatients') || '[]');
    const updatedRecords = existingRecords.map((record: CheckInRecord) =>
      record.id === recordId
        ? { ...record, checkOutTime: new Date().toISOString(), status: 'completed' }
        : record
    );
    saveCheckedInPatients(updatedRecords);

    alert('Bệnh nhân đã được check-out thành công!');
  };

  const filteredAppointments = appointments.filter(appointment =>
    appointment.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    appointment.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    appointment.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCheckedIn = checkedInPatients.filter(record =>
    record.patient.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'scheduled': styles.statusScheduled,
      'checked-in': styles.statusCheckedIn,
      'completed': styles.statusCompleted,
    };
    return statusClasses[status as keyof typeof statusClasses] || styles.statusScheduled;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải cuộc hẹn...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Check-in / Check-out Bệnh nhân</h2>
        <p className={styles.subtitle}>Quản lý việc đến và rời khỏi của bệnh nhân</p>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Tìm kiếm bệnh nhân, bác sĩ hoặc lý do..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'appointments' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          Cuộc hẹn hôm nay ({filteredAppointments.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'checked-in' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('checked-in')}
        >
          Bệnh nhân đã check-in ({filteredCheckedIn.filter(r => r.status === 'checked-in').length})
        </button>
      </div>

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Cuộc hẹn hôm nay</h3>
          {filteredAppointments.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Không tìm thấy cuộc hẹn nào hôm nay</p>
            </div>
          ) : (
            <div className={styles.appointmentsList}>
              {filteredAppointments.map((appointment) => (
                <div key={appointment.appointment_id} className={styles.appointmentCard}>
                  <div className={styles.appointmentInfo}>
                    <div className={styles.appointmentHeader}>
                      <h4>{appointment.patientName}</h4>
                      <span className={`${styles.statusBadge} ${getStatusBadge(appointment.status || 'scheduled')}`}>
                        {appointment.status === 'scheduled' ? 'Đã lên lịch' : 
                         appointment.status === 'checked-in' ? 'Đã check-in' : 
                         appointment.status === 'completed' ? 'Hoàn thành' : appointment.status}
                      </span>
                    </div>
                    <div className={styles.appointmentDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.label}>Giờ:</span>
                        <span>{appointment.appointment_time}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.label}>Bác sĩ:</span>
                        <span>{appointment.doctorName}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.label}>Lý do:</span>
                        <span>{appointment.reason}</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.appointmentActions}>
                    {appointment.status !== 'checked-in' && appointment.status !== 'completed' && (
                      <button
                        className={styles.checkInButton}
                        onClick={() => handleCheckIn(appointment)}
                      >
                        Nhận bệnh
                      </button>
                    )}
                    {appointment.status === 'checked-in' && (
                      <span className={styles.checkedInLabel}>✓ Đã Check In</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Checked-in Patients Tab */}
      {activeTab === 'checked-in' && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Bệnh nhân đã Check-in</h3>
          {filteredCheckedIn.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Hiện không có bệnh nhân nào đã check-in</p>
            </div>
          ) : (
            <div className={styles.checkedInList}>
              {filteredCheckedIn.map((record) => (
                <div key={record.id} className={styles.checkedInCard}>
                  <div className={styles.patientInfo}>
                    <div className={styles.patientHeader}>
                      <h4>{record.patient.full_name}</h4>
                      <span className={`${styles.statusBadge} ${getStatusBadge(record.status)}`}>
                        {record.status === 'checked-in' ? 'Trong phòng khám' : 'Hoàn thành'}
                      </span>
                    </div>
                    <div className={styles.patientDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.label}>Giờ check-in:</span>
                        <span>{new Date(record.checkInTime).toLocaleTimeString()}</span>
                      </div>
                      {record.checkOutTime && (
                        <div className={styles.detailRow}>
                          <span className={styles.label}>Giờ check-out:</span>
                          <span>{new Date(record.checkOutTime).toLocaleTimeString()}</span>
                        </div>
                      )}
                      {record.appointment && (
                        <>
                          <div className={styles.detailRow}>
                            <span className={styles.label}>Cuộc hẹn:</span>
                            <span>{record.appointment.appointment_time} - {record.appointment.doctorName}</span>
                          </div>
                          <div className={styles.detailRow}>
                            <span className={styles.label}>Lý do:</span>
                            <span>{record.appointment.reason}</span>
                          </div>
                        </>
                      )}
                      {record.patient.phone_number && (
                        <div className={styles.detailRow}>
                          <span className={styles.label}>Điện thoại:</span>
                          <span>{record.patient.phone_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.patientActions}>
                    {record.status === 'checked-in' && (
                      <button
                        className={styles.checkOutButton}
                        onClick={() => handleCheckOut(record.id)}
                      >
                        Rời khỏi
                      </button>
                    )}
                    {record.status === 'completed' && (
                      <span className={styles.completedLabel}>✓ Hoàn thành</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      <div className={styles.statsSection}>
        <h3 className={styles.sectionTitle}>Thống kê hôm nay</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statInfo}>
              <h4>Tổng cuộc hẹn</h4>
              <p className={styles.statNumber}>{appointments.length}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statInfo}>
              <h4>Đã Check In</h4>
              <p className={styles.statNumber}>
                {checkedInPatients.filter(r => r.status === 'checked-in').length}
              </p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏁</div>
            <div className={styles.statInfo}>
              <h4>Hoàn thành</h4>
              <p className={styles.statNumber}>
                {checkedInPatients.filter(r => r.status === 'completed').length}
              </p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏳</div>
            <div className={styles.statInfo}>
              <h4>Đang chờ</h4>
              <p className={styles.statNumber}>
                {appointments.filter(a => a.status !== 'checked-in' && a.status !== 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInOut;
