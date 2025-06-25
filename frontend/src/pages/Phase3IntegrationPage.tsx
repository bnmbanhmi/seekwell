import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CommunityHealthAnalytics from '../components/analytics/CommunityHealthAnalytics';
import MobileCHWInterface from '../components/mobile/MobileCHWInterface';
import LoadingSpinner, { OfflineIndicator, ErrorBoundary } from '../components/common/PerformanceComponents';
import styles from './Phase3IntegrationPage.module.css';

const Phase3IntegrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'analytics' | 'mobile' | 'overview'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for component initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      id: 'analytics',
      title: 'Community Health Analytics',
      description: 'Comprehensive analytics dashboard with regional health metrics, social determinants tracking, and AI performance monitoring.',
      icon: '📊',
      highlights: [
        'Regional health distribution',
        'Social determinants correlation',
        'AI model performance metrics',
        'CHW activity tracking'
      ]
    },
    {
      id: 'mobile',
      title: 'Mobile CHW Interface',
      description: 'Optimized mobile interface for community health workers with offline support and quick actions.',
      icon: '📱',
      highlights: [
        'Offline-first design',
        'Quick patient registration',
        'Emergency referral system',
        'Performance monitoring'
      ]
    },
    {
      id: 'performance',
      title: 'Performance Optimizations',
      description: 'Enhanced system performance with lazy loading, caching, and offline capabilities.',
      icon: '⚡',
      highlights: [
        'Virtual scrolling',
        'Image optimization',
        'Cache management',
        'Offline indicator'
      ]
    }
  ];

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner />
        <p>Loading Phase 3 Integration Dashboard...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={styles.integrationPage}>
        <header className={styles.header}>
          <h1>SeekWell Phase 3 - Community Health Enhancement</h1>
          <p>Advanced analytics, mobile optimization, and performance improvements</p>
          
          <nav className={styles.sectionNav}>
            <button
              className={`${styles.navButton} ${activeSection === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveSection('overview')}
            >
              Overview
            </button>
            <button
              className={`${styles.navButton} ${activeSection === 'analytics' ? styles.active : ''}`}
              onClick={() => setActiveSection('analytics')}
            >
              Analytics
            </button>
            <button
              className={`${styles.navButton} ${activeSection === 'mobile' ? styles.active : ''}`}
              onClick={() => setActiveSection('mobile')}
            >
              Mobile CHW
            </button>
          </nav>
        </header>

        <main className={styles.mainContent}>
          {activeSection === 'overview' && (
            <div className={styles.overviewSection}>
              <div className={styles.featuresGrid}>
                {features.map((feature) => (
                  <div key={feature.id} className={styles.featureCard}>
                    <div className={styles.featureIcon}>{feature.icon}</div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                    <ul className={styles.highlightsList}>
                      {feature.highlights.map((highlight, index) => (
                        <li key={index}>{highlight}</li>
                      ))}
                    </ul>
                    <button
                      className={styles.exploreButton}
                      onClick={() => setActiveSection(feature.id as 'analytics' | 'mobile')}
                    >
                      Explore {feature.title}
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.implementationStatus}>
                <h2>Implementation Status</h2>
                <div className={styles.statusGrid}>
                  <div className={styles.statusItem}>
                    <div className={styles.statusBadge}>✅ Complete</div>
                    <h4>Community Health Analytics</h4>
                    <p>Full analytics dashboard with charts and regional metrics</p>
                  </div>
                  <div className={styles.statusItem}>
                    <div className={styles.statusBadge}>✅ Complete</div>
                    <h4>Mobile CHW Interface</h4>
                    <p>Mobile-optimized interface with offline support</p>
                  </div>
                  <div className={styles.statusItem}>
                    <div className={styles.statusBadge}>✅ Complete</div>
                    <h4>Performance Components</h4>
                    <p>Optimization utilities and performance monitoring</p>
                  </div>
                  <div className={styles.statusItem}>
                    <div className={styles.statusBadge}>✅ Complete</div>
                    <h4>Backend API Integration</h4>
                    <p>Analytics and mobile CHW API endpoints</p>
                  </div>
                </div>
              </div>

              <div className={styles.nextSteps}>
                <h2>Next Steps</h2>
                <div className={styles.stepsList}>
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>1</div>
                    <div className={styles.stepContent}>
                      <h4>User Training & Documentation</h4>
                      <p>Create comprehensive user guides and training materials for community health workers</p>
                    </div>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>2</div>
                    <div className={styles.stepContent}>
                      <h4>Real-world Testing</h4>
                      <p>Deploy pilot version in select communities for real-world testing and feedback</p>
                    </div>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>3</div>
                    <div className={styles.stepContent}>
                      <h4>Service Worker Implementation</h4>
                      <p>Implement comprehensive offline support with service workers for mobile CHW app</p>
                    </div>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>4</div>
                    <div className={styles.stepContent}>
                      <h4>Advanced Analytics</h4>
                      <p>Implement machine learning for predictive health analytics and trend analysis</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'analytics' && (
            <div className={styles.analyticsSection}>
              <CommunityHealthAnalytics />
            </div>
          )}

          {activeSection === 'mobile' && (
            <div className={styles.mobileSection}>
              <MobileCHWInterface />
            </div>
          )}
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.footerSection}>
              <h4>Integration Complete</h4>
              <p>Phase 3 features have been successfully integrated into the main application</p>
            </div>
            <div className={styles.footerSection}>
              <h4>Navigation</h4>
              <p>Access these features through the main dashboard navigation</p>
            </div>
            <div className={styles.footerActions}>
              <button
                className={styles.primaryButton}
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </button>
              <button
                className={styles.secondaryButton}
                onClick={() => navigate('/dashboard/analytics')}
              >
                Go to Analytics
              </button>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default Phase3IntegrationPage;
