import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './AdminDashboard.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface DashboardStats {
  totalUsers: number;
  totalOfficials: number;
  urgentCases: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
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
      </div>

      {/* Quick Actions */}
      <div className={styles.actions}>
        <h3 className={styles.actionsTitle}>Quick Actions</h3>
        <div className={styles.actionsGrid}>
          <Link to="/dashboard/users" className={styles.actionCard}>
            <div className={styles.actionIcon}>👤</div>
            <div className={styles.actionInfo}>
              <h4>Manage Users</h4>
              <p>Add, edit, or remove user accounts.</p>
            </div>
          </Link>
          
          <Link to="/dashboard/reports" className={styles.actionCard}>
            <div className={styles.actionIcon}>📈</div>
            <div className={styles.actionInfo}>
              <h4>View Reports</h4>
              <p>Access system analytics and reports.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
