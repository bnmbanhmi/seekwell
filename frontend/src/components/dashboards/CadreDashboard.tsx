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
      title: 'Bridge AI to Care',
      description: 'Review AI assessments and guide patients to appropriate care',
      icon: '�',
      action: () => navigate('/dashboard/pending-reviews'),
      color: '#e74c3c',
      urgent: stats.urgentCases > 0
    },
    {
      title: 'Cultural Health Guidance',
      description: 'Provide culturally sensitive health education and support',
      icon: '🌍',
      action: () => navigate('/dashboard/cultural-guidance'),
      color: '#27ae60'
    },
    {
      title: 'Doctor-Patient Bridge',
      description: 'Facilitate communication between doctors and community members',
      icon: '🤝',
      action: () => navigate('/dashboard/doctor-bridge'),
      color: '#3498db'
    },
    {
      title: 'Community Health Records',
      description: 'Maintain comprehensive community health documentation',
      icon: '�',
      action: () => navigate('/dashboard/community-records'),
      color: '#9b59b6'
    },
    {
      title: 'First Mile Care Coordination',
      description: 'Coordinate initial care and referrals for your community',
      icon: '🚀',
      action: () => navigate('/dashboard/care-coordination'),
      color: '#f39c12'
    },
    {
      title: 'AI Insights Translation',
      description: 'Translate complex AI results into understandable guidance',
      icon: '🧠',
      action: () => navigate('/dashboard/ai-translation'),
      color: '#2c3e50'
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
        <h2 className={styles.title}>� Community Health Bridge Dashboard</h2>
        <p className={styles.subtitle}>Empowering the First Mile of Healthcare - Connecting Communities with AI-Driven Care</p>
        <div className={styles.missionStatement}>
          <p>🤝 <strong>Your Mission:</strong> Bridge the gap between patients and doctors with culturally sensitive guidance, ensuring AI insights lead to real-world care in your community.</p>
        </div>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* Community Health Statistics */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🔗</div>
          <div className={styles.statInfo}>
            <h3>AI Cases to Bridge</h3>
            <p className={styles.statNumber}>{stats.totalPendingReviews}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🚨</div>
          <div className={styles.statInfo}>
            <h3>Urgent Care Needed</h3>
            <p className={styles.statNumber}>{stats.urgentCases}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <h3>Successfully Bridged</h3>
            <p className={styles.statNumber}>{stats.completedReviews}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statInfo}>
            <h3>Community Members</h3>
            <p className={styles.statNumber}>{stats.totalPatients}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🤖</div>
          <div className={styles.statInfo}>
            <h3>AI Insights Today</h3>
            <p className={styles.statNumber}>{stats.aiAnalysesToday}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📅</div>
          <div className={styles.statInfo}>
            <h3>Care Coordination</h3>
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
              <h4>Community Members Need Your Bridge to Care</h4>
              <p>{stats.urgentCases} high-risk cases require your cultural guidance to connect with appropriate medical care</p>
            </div>
            <button 
              className={styles.alertButton}
              onClick={() => navigate('/dashboard/urgent-reviews')}
            >
              Bridge Now
            </button>
          </div>
        </div>
      )}

      {/* Community Actions */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>🌟 First Mile Healthcare Actions</h3>
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
          <h3 className={styles.sectionTitle}>🔗 AI Cases Awaiting Cultural Bridge</h3>
          {pendingReviews.length === 0 ? (
            <div className={styles.emptyState}>
              <p>✅ No cases awaiting your bridge - Community well-connected!</p>
            </div>
          ) : (
            <div className={styles.reviewsTable}>
              <div className={styles.tableHeader}>
                <div>Community Member</div>
                <div>Time</div>
                <div>AI Insights</div>
                <div>Care Priority</div>
                <div>Bridge Action</div>
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
                      Bridge Care
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Community Health Insights */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>🌍 Cultural Bridge Impact</h3>
          <div className={styles.insightsCard}>
            <div className={styles.insight}>
              <h4>🎯 First Mile Success</h4>
              <p>You've successfully bridged <strong>{stats.completedReviews}</strong> AI insights to real-world care, ensuring no one is left behind</p>
            </div>
            <div className={styles.insight}>
              <h4>🤝 Community Trust</h4>
              <p><strong>{stats.aiAnalysesToday}</strong> community members trusted AI screening today with your cultural guidance</p>
            </div>
            <div className={styles.insight}>
              <h4>🏥 Healthcare Access</h4>
              <p>You're the vital bridge for <strong>{stats.totalPatients}</strong> community members, connecting them to quality healthcare</p>
            </div>
            <div className={styles.insight}>
              <h4>🌟 Cultural Sensitivity</h4>
              <p>Your cultural understanding transforms complex AI insights into actionable, culturally appropriate health guidance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CadreDashboard;
