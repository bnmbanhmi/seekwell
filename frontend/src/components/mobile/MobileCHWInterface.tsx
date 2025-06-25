import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './MobileCHWInterface.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  path: string;
  color: string;
  urgent?: boolean;
}

interface PatientAlert {
  id: string;
  patient_name: string;
  alert_type: 'high-risk' | 'follow-up' | 'medication' | 'appointment';
  message: string;
  priority: 'high' | 'medium' | 'low';
  created_at: string;
}

interface TodaySchedule {
  visits: number;
  high_risk: number;
  follow_ups: number;
  completed: number;
}

interface CHWStats {
  patients_assigned: number;
  visits_this_week: number;
  high_risk_cases: number;
  completion_rate: number;
}

const MobileCHWInterface: React.FC = () => {
  const [alerts, setAlerts] = useState<PatientAlert[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<TodaySchedule | null>(null);
  const [chwStats, setChwStats] = useState<CHWStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'patients' | 'tools'>('dashboard');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchCHWData();
  }, []);

  const fetchCHWData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch CHW-specific data
      const [alertsRes, scheduleRes, statsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/chw/alerts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BACKEND_URL}/chw/schedule/today`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BACKEND_URL}/chw/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      setAlerts(alertsRes.data);
      setTodaySchedule(scheduleRes.data);
      setChwStats(statsRes.data);
      
    } catch (err) {
      console.error('Failed to fetch CHW data:', err);
      // Use mock data for demonstration
      setAlerts(getMockAlerts());
      setTodaySchedule(getMockSchedule());
      setChwStats(getMockStats());
    } finally {
      setLoading(false);
    }
  };

  const getMockAlerts = (): PatientAlert[] => [
    {
      id: '1',
      patient_name: 'Nguyen Thi Mai',
      alert_type: 'high-risk',
      message: 'AI detected high-risk skin lesion requiring immediate attention',
      priority: 'high',
      created_at: '2024-06-25T08:30:00Z'
    },
    {
      id: '2',
      patient_name: 'Le Van Duc',
      alert_type: 'follow-up',
      message: 'Follow-up visit overdue by 3 days',
      priority: 'medium',
      created_at: '2024-06-25T09:15:00Z'
    },
    {
      id: '3',
      patient_name: 'Tran Thi Lan',
      alert_type: 'medication',
      message: 'Medication refill reminder',
      priority: 'low',
      created_at: '2024-06-25T10:00:00Z'
    },
  ];

  const getMockSchedule = (): TodaySchedule => ({
    visits: 8,
    high_risk: 2,
    follow_ups: 3,
    completed: 5,
  });

  const getMockStats = (): CHWStats => ({
    patients_assigned: 156,
    visits_this_week: 23,
    high_risk_cases: 7,
    completion_rate: 94.2,
  });

  const quickActions: QuickAction[] = [
    {
      id: 'ai-scan',
      title: 'AI Skin Analysis',
      icon: '🤖',
      path: '/dashboard/ai-analysis',
      color: '#8b5cf6',
    },
    {
      id: 'emergency',
      title: 'High-Risk Consultation',
      icon: '🚨',
      path: '/dashboard/appointments/high-risk',
      color: '#ef4444',
      urgent: true,
    },
    {
      id: 'visit',
      title: 'Schedule Visit',
      icon: '📅',
      path: '/dashboard/community-health',
      color: '#10b981',
    },
    {
      id: 'emr',
      title: 'Create Health Record',
      icon: '📝',
      path: '/dashboard/community-emr',
      color: '#3b82f6',
    },
    {
      id: 'patients',
      title: 'My Patients',
      icon: '👥',
      path: '/dashboard/patients',
      color: '#f59e0b',
    },
    {
      id: 'analytics',
      title: 'Community Stats',
      icon: '📊',
      path: '/dashboard/analytics',
      color: '#06b6d4',
    },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'high-risk': return '⚠️';
      case 'follow-up': return '📅';
      case 'medication': return '💊';
      case 'appointment': return '🏥';
      default: return '📢';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.urgent) {
      // Show confirmation for urgent actions
      if (window.confirm(`Are you sure you want to start a ${action.title}?`)) {
        window.location.href = action.path;
      }
    } else {
      window.location.href = action.path;
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading your CHW dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </div>
          <div className={styles.userDetails}>
            <h2>Hello, {user?.full_name || user?.username}!</h2>
            <p>Community Health Worker</p>
          </div>
        </div>
        <div className={styles.date}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabNav}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
          { id: 'alerts', label: 'Alerts', icon: '🔔' },
          { id: 'patients', label: 'Patients', icon: '👥' },
          { id: 'tools', label: 'Tools', icon: '🛠️' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
            {tab.id === 'alerts' && alerts.length > 0 && (
              <span className={styles.badge}>{alerts.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className={styles.content}>
          {/* Today's Schedule */}
          <div className={styles.section}>
            <h3>Today's Schedule</h3>
            {todaySchedule && (
              <div className={styles.scheduleGrid}>
                <div className={styles.scheduleCard}>
                  <div className={styles.scheduleNumber}>{todaySchedule.visits}</div>
                  <div className={styles.scheduleLabel}>Total Visits</div>
                </div>
                <div className={styles.scheduleCard}>
                  <div className={styles.scheduleNumber} style={{ color: '#ef4444' }}>
                    {todaySchedule.high_risk}
                  </div>
                  <div className={styles.scheduleLabel}>High-Risk</div>
                </div>
                <div className={styles.scheduleCard}>
                  <div className={styles.scheduleNumber} style={{ color: '#f59e0b' }}>
                    {todaySchedule.follow_ups}
                  </div>
                  <div className={styles.scheduleLabel}>Follow-ups</div>
                </div>
                <div className={styles.scheduleCard}>
                  <div className={styles.scheduleNumber} style={{ color: '#10b981' }}>
                    {todaySchedule.completed}
                  </div>
                  <div className={styles.scheduleLabel}>Completed</div>
                </div>
              </div>
            )}
          </div>

          {/* CHW Statistics */}
          <div className={styles.section}>
            <h3>Your Statistics</h3>
            {chwStats && (
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{chwStats.patients_assigned}</span>
                  <span className={styles.statLabel}>Patients Assigned</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{chwStats.visits_this_week}</span>
                  <span className={styles.statLabel}>Visits This Week</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{chwStats.high_risk_cases}</span>
                  <span className={styles.statLabel}>High-Risk Cases</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{chwStats.completion_rate}%</span>
                  <span className={styles.statLabel}>Completion Rate</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className={styles.section}>
            <h3>Quick Actions</h3>
            <div className={styles.actionsGrid}>
              {quickActions.map(action => (
                <button
                  key={action.id}
                  className={`${styles.actionButton} ${action.urgent ? styles.urgent : ''}`}
                  style={{ borderLeftColor: action.color }}
                  onClick={() => handleQuickAction(action)}
                >
                  <div className={styles.actionIcon}>{action.icon}</div>
                  <div className={styles.actionTitle}>{action.title}</div>
                  {action.urgent && <div className={styles.urgentIndicator}>!</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className={styles.content}>
          <div className={styles.section}>
            <h3>Patient Alerts ({alerts.length})</h3>
            {alerts.length === 0 ? (
              <div className={styles.noAlerts}>
                <div className={styles.noAlertsIcon}>✅</div>
                <p>No alerts at this time</p>
                <p>All patients are up to date!</p>
              </div>
            ) : (
              <div className={styles.alertsList}>
                {alerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className={styles.alertCard}
                    style={{ borderLeftColor: getPriorityColor(alert.priority) }}
                  >
                    <div className={styles.alertHeader}>
                      <div className={styles.alertIcon}>
                        {getAlertIcon(alert.alert_type)}
                      </div>
                      <div className={styles.alertInfo}>
                        <div className={styles.alertPatient}>{alert.patient_name}</div>
                        <div className={styles.alertTime}>{formatTime(alert.created_at)}</div>
                      </div>
                      <div 
                        className={styles.alertPriority}
                        style={{ backgroundColor: getPriorityColor(alert.priority) }}
                      >
                        {alert.priority.toUpperCase()}
                      </div>
                    </div>
                    <div className={styles.alertMessage}>
                      {alert.message}
                    </div>
                    <div className={styles.alertActions}>
                      <button className={styles.alertAction}>View Patient</button>
                      <button className={styles.alertAction}>Take Action</button>
                      <button className={styles.alertDismiss}>Dismiss</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Patients Tab */}
      {activeTab === 'patients' && (
        <div className={styles.content}>
          <div className={styles.section}>
            <h3>Quick Patient Access</h3>
            <div className={styles.patientActions}>
              <button 
                className={styles.patientActionButton}
                onClick={() => window.location.href = '/dashboard/patients'}
              >
                <div className={styles.patientActionIcon}>🔍</div>
                <div className={styles.patientActionText}>
                  <div className={styles.patientActionTitle}>Search Patients</div>
                  <div className={styles.patientActionDesc}>Find and view patient records</div>
                </div>
              </button>
              
              <button 
                className={styles.patientActionButton}
                onClick={() => window.location.href = '/dashboard/community-health'}
              >
                <div className={styles.patientActionIcon}>📋</div>
                <div className={styles.patientActionText}>
                  <div className={styles.patientActionTitle}>Today's Visits</div>
                  <div className={styles.patientActionDesc}>Manage scheduled visits</div>
                </div>
              </button>
              
              <button 
                className={styles.patientActionButton}
                onClick={() => window.location.href = '/dashboard/community-emr'}
              >
                <div className={styles.patientActionIcon}>📝</div>
                <div className={styles.patientActionText}>
                  <div className={styles.patientActionTitle}>Create Record</div>
                  <div className={styles.patientActionDesc}>New health record</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tools Tab */}
      {activeTab === 'tools' && (
        <div className={styles.content}>
          <div className={styles.section}>
            <h3>CHW Tools & Resources</h3>
            <div className={styles.toolsGrid}>
              <button 
                className={styles.toolButton}
                onClick={() => window.location.href = '/dashboard/ai-analysis'}
              >
                <div className={styles.toolIcon}>🤖</div>
                <div className={styles.toolTitle}>AI Skin Scanner</div>
                <div className={styles.toolDesc}>Instant skin lesion analysis</div>
              </button>
              
              <button 
                className={styles.toolButton}
                onClick={() => window.location.href = '/dashboard/analytics'}
              >
                <div className={styles.toolIcon}>📊</div>
                <div className={styles.toolTitle}>Community Analytics</div>
                <div className={styles.toolDesc}>Health trends and insights</div>
              </button>
              
              <button className={styles.toolButton}>
                <div className={styles.toolIcon}>📚</div>
                <div className={styles.toolTitle}>Health Guidelines</div>
                <div className={styles.toolDesc}>Clinical references</div>
              </button>
              
              <button className={styles.toolButton}>
                <div className={styles.toolIcon}>📞</div>
                <div className={styles.toolTitle}>Emergency Contacts</div>
                <div className={styles.toolDesc}>Quick access to specialists</div>
              </button>
              
              <button className={styles.toolButton}>
                <div className={styles.toolIcon}>🎯</div>
                <div className={styles.toolTitle}>Health Campaigns</div>
                <div className={styles.toolDesc}>Community initiatives</div>
              </button>
              
              <button className={styles.toolButton}>
                <div className={styles.toolIcon}>📱</div>
                <div className={styles.toolTitle}>Offline Sync</div>
                <div className={styles.toolDesc}>Sync when connected</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileCHWInterface;
