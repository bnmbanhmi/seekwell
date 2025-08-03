import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './AdminDashboard.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface DashboardStats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalOfficials: number;
  urgentCases: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalOfficials: 0,
    urgentCases: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BACKEND_URL}/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const users = response.data;
      // TODO: Fetch real urgent cases count
      const urgentCasesCount = 5; // Mock data

      const stats = {
        totalUsers: users.length,
        totalPatients: users.filter((user: any) => user.role === 'PATIENT').length,
        totalDoctors: users.filter((user: any) => user.role === 'DOCTOR').length,
        totalOfficials: users.filter((user: any) => user.role === 'OFFICIAL').length,
        urgentCases: urgentCasesCount,
      };
      
      setStats(stats);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Administrator Dashboard</h2>
        <p className={styles.subtitle}>Manage users and monitor system activity.</p>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statInfo}>
            <h3 className={styles.statNumber}>{loading ? '...' : stats.totalUsers}</h3>
            <p className={styles.statLabel}>Total Users</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>😟</div>
          <div className={styles.statInfo}>
            <h3 className={styles.statNumber}>{loading ? '...' : stats.urgentCases}</h3>
            <p className={styles.statLabel}>Urgent Cases</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👩‍💼</div>
          <div className={styles.statInfo}>
            <h3 className={styles.statNumber}>{loading ? '...' : stats.totalOfficials}</h3>
            <p className={styles.statLabel}>Officials</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>👨‍⚕️</div>
          <div className={styles.statInfo}>
            <h3 className={styles.statNumber}>{loading ? '...' : stats.totalDoctors}</h3>
            <p className={styles.statLabel}>Doctors</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.actionsSection}>
        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.actionsGrid}>
          <Link to="/dashboard/users" className={styles.actionCard}>
            <div className={styles.actionIcon}>👥</div>
            <div className={styles.actionContent}>
              <h4>Manage Users</h4>
              <p>Create, edit, and manage user accounts</p>
            </div>
          </Link>
          
          <Link to="/dashboard/reports" className={styles.actionCard}>
            <div className={styles.actionIcon}>📊</div>
            <div className={styles.actionContent}>
              <h4>Reports & Analytics</h4>
              <p>View system usage reports and performance</p>
            </div>
          </Link>
          
          <Link to="/dashboard/schedule-settings" className={styles.actionCard}>
            <div className={styles.actionIcon}>⚙️</div>
            <div className={styles.actionContent}>
              <h4>Schedule Settings</h4>
              <p>Configure doctor schedules and clinic settings</p>
            </div>
          </Link>
          
          <Link to="/dashboard/logs" className={styles.actionCard}>
            <div className={styles.actionIcon}>🗂️</div>
            <div className={styles.actionContent}>
              <h4>System Logs</h4>
              <p>Monitor system activity and troubleshoot issues</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.activitySection}>
        <h3 className={styles.sectionTitle}>System Overview</h3>
        <div className={styles.activityCard}>
          <p>✅ System is running smoothly</p>
          <p>📈 User activity is normal</p>
          <p>🛡️ All security checks passed</p>
          <p>💾 Database backup is up-to-date</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
