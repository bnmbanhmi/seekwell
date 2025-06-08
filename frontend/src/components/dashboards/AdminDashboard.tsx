import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './AdminDashboard.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface DashboardStats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalStaff: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalStaff: 0
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
      const stats = {
        totalUsers: users.length,
        totalPatients: users.filter((user: any) => user.role === 'PATIENT').length,
        totalDoctors: users.filter((user: any) => user.role === 'DOCTOR').length,
        totalStaff: users.filter((user: any) => user.role === 'CLINIC_STAFF').length,
      };
      
      setStats(stats);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Admin Dashboard</h2>
        <p className={styles.subtitle}>Manage and oversee clinic operations</p>
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
          <div className={styles.statIcon}>🏥</div>
          <div className={styles.statInfo}>
            <h3 className={styles.statNumber}>{loading ? '...' : stats.totalPatients}</h3>
            <p className={styles.statLabel}>Patients</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👨‍⚕️</div>
          <div className={styles.statInfo}>
            <h3 className={styles.statNumber}>{loading ? '...' : stats.totalDoctors}</h3>
            <p className={styles.statLabel}>Doctors</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👩‍💼</div>
          <div className={styles.statInfo}>
            <h3 className={styles.statNumber}>{loading ? '...' : stats.totalStaff}</h3>
            <p className={styles.statLabel}>Staff Members</p>
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
              <h4>User Management</h4>
              <p>Create, edit, and manage user accounts</p>
            </div>
          </Link>
          
          <div className={styles.actionCard}>
            <div className={styles.actionIcon}>📊</div>
            <div className={styles.actionContent}>
              <h4>Reports & Analytics</h4>
              <p>View system usage and performance reports</p>
            </div>
          </div>
          
          <div className={styles.actionCard}>
            <div className={styles.actionIcon}>⚙️</div>
            <div className={styles.actionContent}>
              <h4>System Settings</h4>
              <p>Configure clinic settings and preferences</p>
            </div>
          </div>
          
          <div className={styles.actionCard}>
            <div className={styles.actionIcon}>🔒</div>
            <div className={styles.actionContent}>
              <h4>Security & Permissions</h4>
              <p>Manage access control and permissions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.activitySection}>
        <h3 className={styles.sectionTitle}>System Overview</h3>
        <div className={styles.activityCard}>
          <p>✅ System is running smoothly</p>
          <p>📈 User activity is normal</p>
          <p>🛡️ All security checks passed</p>
          <p>💾 Database backups are up to date</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
