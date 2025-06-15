import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CadreDashboard.module.css';
import axios from 'axios';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

type PendingReview = {
  image_id: number;
  patient_name: string;
  upload_timestamp: string;
  body_region: string;
  ai_prediction: string;
  confidence_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: string;
};

type CommunityStats = {
  totalPendingReviews: number;
  urgentCases: number;
  completedReviews: number;
  totalPatients: number;
  aiAnalysesToday: number;
  followUpsNeeded: number;
};

const CadreDashboard = () => {
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [stats, setStats] = useState<CommunityStats>({
    totalPendingReviews: 0,
    urgentCases: 0,
    completedReviews: 0,
    totalPatients: 0,
    aiAnalysesToday: 0,
    followUpsNeeded: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCadreData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        // Fetch pending reviews for this cadre
        const reviewsResponse = await axios.get(`${BACKEND_URL}/skin-lesions/pending-reviews`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Fetch community statistics
        const statsResponse = await axios.get(`${BACKEND_URL}/community/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setPendingReviews(reviewsResponse.data || []);
        setStats(statsResponse.data || stats);
      } catch (err) {
        console.error('Failed to fetch cadre data:', err);
        setError('Unable to load community health worker data.');
        
        // Mock data for demonstration
        setPendingReviews([
          {
            image_id: 1,
            patient_name: 'John Doe',
            upload_timestamp: '2025-06-15T10:30:00Z',
            body_region: 'face',
            ai_prediction: 'MEL (Melanoma)',
            confidence_score: 0.85,
            risk_level: 'URGENT',
            status: 'pending'
          },
          {
            image_id: 2,
            patient_name: 'Jane Smith',
            upload_timestamp: '2025-06-15T09:15:00Z',
            body_region: 'arm',
            ai_prediction: 'NEV (Nevus/Mole)',
            confidence_score: 0.75,
            risk_level: 'LOW',
            status: 'pending'
          }
        ]);
        
        setStats({
          totalPendingReviews: 2,
          urgentCases: 1,
          completedReviews: 15,
          totalPatients: 45,
          aiAnalysesToday: 8,
          followUpsNeeded: 3,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCadreData();
  }, []);

  const handleReviewCase = (imageId: number) => {
    navigate(`/dashboard/cadre-review/${imageId}`);
  };

  const communityActions = [
    {
      title: 'Review AI Analysis',
      description: 'Review pending AI skin lesion assessments',
      icon: '🔍',
      action: () => navigate('/dashboard/pending-reviews'),
      color: '#e74c3c',
      urgent: stats.urgentCases > 0
    },
    {
      title: 'Community Health Records',
      description: 'Access patient records and follow-ups',
      icon: '📋',
      action: () => navigate('/dashboard/community-records'),
      color: '#3498db'
    },
    {
      title: 'Health Education',
      description: 'Share health education materials',
      icon: '📚',
      action: () => navigate('/dashboard/health-education'),
      color: '#27ae60'
    },
    {
      title: 'Escalate to Doctor',
      description: 'Request doctor consultation for complex cases',
      icon: '🏥',
      action: () => navigate('/dashboard/doctor-consultation'),
      color: '#f39c12'
    }
  ];

  const getRiskBadgeClass = (riskLevel: string) => {
    switch (riskLevel) {
      case 'URGENT':
        return styles.riskUrgent;
      case 'HIGH':
        return styles.riskHigh;
      case 'MEDIUM':
        return styles.riskMedium;
      case 'LOW':
        return styles.riskLow;
      default:
        return styles.riskLow;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading community health worker data...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>🏥 Community Health Cadre Dashboard</h2>
        <p className={styles.subtitle}>Supporting Community Health Through AI-Powered Screening</p>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* Community Health Statistics */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⚠️</div>
          <div className={styles.statInfo}>
            <h3>Pending Reviews</h3>
            <p className={styles.statNumber}>{stats.totalPendingReviews}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🚨</div>
          <div className={styles.statInfo}>
            <h3>Urgent Cases</h3>
            <p className={styles.statNumber}>{stats.urgentCases}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <h3>Completed Reviews</h3>
            <p className={styles.statNumber}>{stats.completedReviews}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statInfo}>
            <h3>Community Patients</h3>
            <p className={styles.statNumber}>{stats.totalPatients}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🤖</div>
          <div className={styles.statInfo}>
            <h3>AI Analyses Today</h3>
            <p className={styles.statNumber}>{stats.aiAnalysesToday}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📅</div>
          <div className={styles.statInfo}>
            <h3>Follow-ups Needed</h3>
            <p className={styles.statNumber}>{stats.followUpsNeeded}</p>
          </div>
        </div>
      </div>

      {/* Featured: Urgent Cases Alert */}
      {stats.urgentCases > 0 && (
        <div className={styles.section}>
          <div className={styles.urgentAlert}>
            <div className={styles.alertIcon}>🚨</div>
            <div className={styles.alertContent}>
              <h4>Urgent Cases Require Immediate Attention</h4>
              <p>{stats.urgentCases} high-risk skin lesions need cadre review</p>
            </div>
            <button 
              className={styles.alertButton}
              onClick={() => navigate('/dashboard/urgent-reviews')}
            >
              Review Now
            </button>
          </div>
        </div>
      )}

      {/* Community Actions */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Community Health Actions</h3>
        <div className={styles.actionsGrid}>
          {communityActions.map((action, index) => (
            <div
              key={index}
              className={`${styles.actionCard} ${action.urgent ? styles.actionUrgent : ''}`}
              onClick={action.action}
              style={{ borderLeftColor: action.color }}
            >
              <div className={styles.actionIcon}>{action.icon}</div>
              <div className={styles.actionContent}>
                <h4>{action.title}</h4>
                <p>{action.description}</p>
                {action.urgent && <span className={styles.urgentBadge}>URGENT</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.gridLayout}>
        {/* Pending Reviews Queue */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Pending AI Analysis Reviews</h3>
          {pendingReviews.length === 0 ? (
            <div className={styles.emptyState}>
              <p>✅ No pending reviews - Great work!</p>
            </div>
          ) : (
            <div className={styles.reviewsTable}>
              <div className={styles.tableHeader}>
                <div>Patient</div>
                <div>Time</div>
                <div>AI Prediction</div>
                <div>Risk Level</div>
                <div>Action</div>
              </div>
              {pendingReviews.map((review) => (
                <div key={review.image_id} className={styles.tableRow}>
                  <div className={styles.patientCell}>
                    <strong>{review.patient_name}</strong>
                    <small>{review.body_region}</small>
                  </div>
                  <div className={styles.timeCell}>
                    {new Date(review.upload_timestamp).toLocaleTimeString()}
                  </div>
                  <div className={styles.predictionCell}>
                    <span>{review.ai_prediction}</span>
                    <small>{Math.round(review.confidence_score * 100)}% confidence</small>
                  </div>
                  <div className={`${styles.riskCell} ${getRiskBadgeClass(review.risk_level)}`}>
                    {review.risk_level}
                  </div>
                  <div className={styles.actionCell}>
                    <button 
                      className={styles.reviewButton}
                      onClick={() => handleReviewCase(review.image_id)}
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Community Health Insights */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Community Health Insights</h3>
          <div className={styles.insightsCard}>
            <div className={styles.insight}>
              <h4>🎯 AI Screening Impact</h4>
              <p>AI has helped identify <strong>{stats.urgentCases}</strong> high-risk cases this week</p>
            </div>
            <div className={styles.insight}>
              <h4>📈 Community Engagement</h4>
              <p><strong>{stats.aiAnalysesToday}</strong> patients used AI screening today</p>
            </div>
            <div className={styles.insight}>
              <h4>🏥 Healthcare Access</h4>
              <p>Serving <strong>{stats.totalPatients}</strong> patients in the community</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CadreDashboard;
