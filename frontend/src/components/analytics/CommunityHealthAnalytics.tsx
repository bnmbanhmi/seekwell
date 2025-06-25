import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import styles from './CommunityHealthAnalytics.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface CommunityStats {
  total_population: number;
  active_patients: number;
  health_workers: number;
  community_centers: number;
  high_risk_cases: number;
  ai_assessments_completed: number;
  follow_ups_pending: number;
  immunization_coverage: number;
}

interface HealthMetrics {
  nutrition_distribution: Record<string, number>;
  chronic_conditions: Record<string, number>;
  risk_factors: Record<string, number>;
  social_determinants: {
    income_levels: Record<string, number>;
    education_levels: Record<string, number>;
    water_access: Record<string, number>;
    sanitation_access: Record<string, number>;
  };
}

interface GeographicData {
  regions: Array<{
    name: string;
    population: number;
    health_workers: number;
    risk_score: number;
    ai_assessments: number;
  }>;
}

interface TrendData {
  monthly_visits: Array<{
    month: string;
    routine: number;
    high_risk: number;
    ai_referrals: number;
  }>;
  health_outcomes: Array<{
    month: string;
    early_detection: number;
    successful_referrals: number;
    follow_up_completion: number;
  }>;
}

const CommunityHealthAnalytics: React.FC = () => {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [geographicData, setGeographicData] = useState<GeographicData | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, selectedRegion]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      // Fetch all analytics data in parallel
      const [statsRes, metricsRes, geoRes, trendsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/community/analytics/stats?range=${timeRange}&region=${selectedRegion}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BACKEND_URL}/community/analytics/health-metrics?range=${timeRange}&region=${selectedRegion}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BACKEND_URL}/community/analytics/geographic?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BACKEND_URL}/community/analytics/trends?range=${timeRange}&region=${selectedRegion}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      setStats(statsRes.data);
      setHealthMetrics(metricsRes.data);
      setGeographicData(geoRes.data);
      setTrendData(trendsRes.data);
      
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      // Use mock data for demonstration
      setStats(getMockStats());
      setHealthMetrics(getMockHealthMetrics());
      setGeographicData(getMockGeographicData());
      setTrendData(getMockTrendData());
    } finally {
      setLoading(false);
    }
  };

  const getMockStats = (): CommunityStats => ({
    total_population: 15420,
    active_patients: 8932,
    health_workers: 45,
    community_centers: 8,
    high_risk_cases: 234,
    ai_assessments_completed: 1876,
    follow_ups_pending: 89,
    immunization_coverage: 87.5,
  });

  const getMockHealthMetrics = (): HealthMetrics => ({
    nutrition_distribution: {
      underweight: 18,
      normal: 65,
      overweight: 12,
      obese: 5,
    },
    chronic_conditions: {
      diabetes: 145,
      hypertension: 298,
      respiratory: 87,
      cardiovascular: 123,
      skin_conditions: 67,
    },
    risk_factors: {
      smoking: 234,
      alcohol: 156,
      poor_diet: 445,
      sedentary: 567,
      environmental: 123,
    },
    social_determinants: {
      income_levels: { low: 45, middle: 40, high: 15 },
      education_levels: { none: 12, primary: 35, secondary: 38, tertiary: 15 },
      water_access: { improved: 78, unimproved: 15, none: 7 },
      sanitation_access: { improved: 65, unimproved: 25, none: 10 },
    },
  });

  const getMockGeographicData = (): GeographicData => ({
    regions: [
      { name: 'Northern District', population: 4500, health_workers: 12, risk_score: 7.2, ai_assessments: 456 },
      { name: 'Southern District', population: 3800, health_workers: 10, risk_score: 6.8, ai_assessments: 378 },
      { name: 'Eastern District', population: 4200, health_workers: 13, risk_score: 8.1, ai_assessments: 523 },
      { name: 'Western District', population: 2920, health_workers: 10, risk_score: 6.5, ai_assessments: 298 },
    ],
  });

  const getMockTrendData = (): TrendData => ({
    monthly_visits: [
      { month: 'Jan', routine: 234, high_risk: 45, ai_referrals: 23 },
      { month: 'Feb', routine: 267, high_risk: 52, ai_referrals: 31 },
      { month: 'Mar', routine: 298, high_risk: 67, ai_referrals: 43 },
      { month: 'Apr', routine: 321, high_risk: 78, ai_referrals: 56 },
      { month: 'May', routine: 345, high_risk: 89, ai_referrals: 67 },
      { month: 'Jun', routine: 378, high_risk: 98, ai_referrals: 78 },
    ],
    health_outcomes: [
      { month: 'Jan', early_detection: 78, successful_referrals: 45, follow_up_completion: 89 },
      { month: 'Feb', early_detection: 82, successful_referrals: 52, follow_up_completion: 91 },
      { month: 'Mar', early_detection: 85, successful_referrals: 58, follow_up_completion: 88 },
      { month: 'Apr', early_detection: 88, successful_referrals: 65, follow_up_completion: 93 },
      { month: 'May', early_detection: 91, successful_referrals: 72, follow_up_completion: 95 },
      { month: 'Jun', early_detection: 94, successful_referrals: 78, follow_up_completion: 97 },
    ],
  });

  const generateChartOptions = (title: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
  });

  const nutritionChartData = healthMetrics ? {
    labels: Object.keys(healthMetrics.nutrition_distribution),
    datasets: [
      {
        data: Object.values(healthMetrics.nutrition_distribution),
        backgroundColor: [
          '#ef4444',
          '#10b981',
          '#f59e0b',
          '#8b5cf6',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  } : null;

  const chronicsChartData = healthMetrics ? {
    labels: Object.keys(healthMetrics.chronic_conditions),
    datasets: [
      {
        label: 'Cases',
        data: Object.values(healthMetrics.chronic_conditions),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  } : null;

  const trendsChartData = trendData ? {
    labels: trendData.monthly_visits.map(d => d.month),
    datasets: [
      {
        label: 'Routine Visits',
        data: trendData.monthly_visits.map(d => d.routine),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        tension: 0.3,
      },
      {
        label: 'High-Risk Cases',
        data: trendData.monthly_visits.map(d => d.high_risk),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.3,
      },
      {
        label: 'AI Referrals',
        data: trendData.monthly_visits.map(d => d.ai_referrals),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        tension: 0.3,
      },
    ],
  } : null;

  const outcomesChartData = trendData ? {
    labels: trendData.health_outcomes.map(d => d.month),
    datasets: [
      {
        label: 'Early Detection (%)',
        data: trendData.health_outcomes.map(d => d.early_detection),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.3,
      },
      {
        label: 'Successful Referrals (%)',
        data: trendData.health_outcomes.map(d => d.successful_referrals),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.3,
      },
      {
        label: 'Follow-up Completion (%)',
        data: trendData.health_outcomes.map(d => d.follow_up_completion),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        tension: 0.3,
      },
    ],
  } : null;

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading community health analytics...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Community Health Analytics</h1>
        <p>Comprehensive insights into community health trends and outcomes</p>
        
        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label>Time Range:</label>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
            >
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="quarter">Past Quarter</option>
              <option value="year">Past Year</option>
            </select>
          </div>
          
          <div className={styles.controlGroup}>
            <label>Region:</label>
            <select 
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="all">All Regions</option>
              {geographicData?.regions.map(region => (
                <option key={region.name} value={region.name}>{region.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Statistics Cards */}
      <div className={styles.statsGrid}>
        {stats && Object.entries({
          'Total Population': { value: stats.total_population.toLocaleString(), icon: '👥', color: '#3b82f6' },
          'Active Patients': { value: stats.active_patients.toLocaleString(), icon: '🏥', color: '#10b981' },
          'Health Workers': { value: stats.health_workers.toString(), icon: '👨‍⚕️', color: '#8b5cf6' },
          'Community Centers': { value: stats.community_centers.toString(), icon: '🏢', color: '#f59e0b' },
          'High-Risk Cases': { value: stats.high_risk_cases.toString(), icon: '⚠️', color: '#ef4444' },
          'AI Assessments': { value: stats.ai_assessments_completed.toLocaleString(), icon: '🤖', color: '#06b6d4' },
          'Pending Follow-ups': { value: stats.follow_ups_pending.toString(), icon: '📅', color: '#f97316' },
          'Immunization Coverage': { value: `${stats.immunization_coverage}%`, icon: '💉', color: '#84cc16' },
        }).map(([label, data]) => (
          <div key={label} className={styles.statCard} style={{ borderLeftColor: data.color }}>
            <div className={styles.statIcon}>{data.icon}</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{data.value}</div>
              <div className={styles.statLabel}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Nutrition Distribution */}
        <div className={styles.chartCard}>
          <h3>Nutrition Status Distribution</h3>
          <div className={styles.chartContainer}>
            {nutritionChartData && (
              <Pie data={nutritionChartData} options={generateChartOptions('Community Nutrition Status')} />
            )}
          </div>
        </div>

        {/* Chronic Conditions */}
        <div className={styles.chartCard}>
          <h3>Chronic Conditions Prevalence</h3>
          <div className={styles.chartContainer}>
            {chronicsChartData && (
              <Bar data={chronicsChartData} options={generateChartOptions('Chronic Health Conditions')} />
            )}
          </div>
        </div>

        {/* Visit Trends */}
        <div className={styles.chartCard}>
          <h3>Monthly Visit Trends</h3>
          <div className={styles.chartContainer}>
            {trendsChartData && (
              <Line data={trendsChartData} options={generateChartOptions('Community Health Visits Over Time')} />
            )}
          </div>
        </div>

        {/* Health Outcomes */}
        <div className={styles.chartCard}>
          <h3>Health Outcomes Tracking</h3>
          <div className={styles.chartContainer}>
            {outcomesChartData && (
              <Line data={outcomesChartData} options={generateChartOptions('Health Intervention Outcomes')} />
            )}
          </div>
        </div>
      </div>

      {/* Geographic Analysis */}
      <div className={styles.geographicSection}>
        <h2>Regional Health Overview</h2>
        <div className={styles.regionGrid}>
          {geographicData?.regions.map(region => (
            <div key={region.name} className={styles.regionCard}>
              <h4>{region.name}</h4>
              <div className={styles.regionStats}>
                <div className={styles.regionStat}>
                  <span className={styles.regionLabel}>Population:</span>
                  <span className={styles.regionValue}>{region.population.toLocaleString()}</span>
                </div>
                <div className={styles.regionStat}>
                  <span className={styles.regionLabel}>Health Workers:</span>
                  <span className={styles.regionValue}>{region.health_workers}</span>
                </div>
                <div className={styles.regionStat}>
                  <span className={styles.regionLabel}>Risk Score:</span>
                  <span className={`${styles.regionValue} ${region.risk_score > 7 ? styles.highRisk : styles.lowRisk}`}>
                    {region.risk_score}/10
                  </span>
                </div>
                <div className={styles.regionStat}>
                  <span className={styles.regionLabel}>AI Assessments:</span>
                  <span className={styles.regionValue}>{region.ai_assessments}</span>
                </div>
              </div>
              <div className={styles.regionRatio}>
                <strong>Worker-Population Ratio:</strong> 1:{Math.round(region.population / region.health_workers)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social Determinants Analysis */}
      {healthMetrics && (
        <div className={styles.socialSection}>
          <h2>Social Determinants of Health</h2>
          <div className={styles.socialGrid}>
            <div className={styles.socialCard}>
              <h4>Income Distribution</h4>
              <div className={styles.socialBars}>
                {Object.entries(healthMetrics.social_determinants.income_levels).map(([level, percentage]) => (
                  <div key={level} className={styles.socialBar}>
                    <span className={styles.socialLabel}>{level}</span>
                    <div className={styles.socialBarBg}>
                      <div 
                        className={styles.socialBarFill} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className={styles.socialPercent}>{percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.socialCard}>
              <h4>Education Levels</h4>
              <div className={styles.socialBars}>
                {Object.entries(healthMetrics.social_determinants.education_levels).map(([level, percentage]) => (
                  <div key={level} className={styles.socialBar}>
                    <span className={styles.socialLabel}>{level}</span>
                    <div className={styles.socialBarBg}>
                      <div 
                        className={styles.socialBarFill} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className={styles.socialPercent}>{percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.socialCard}>
              <h4>Water Access</h4>
              <div className={styles.socialBars}>
                {Object.entries(healthMetrics.social_determinants.water_access).map(([level, percentage]) => (
                  <div key={level} className={styles.socialBar}>
                    <span className={styles.socialLabel}>{level}</span>
                    <div className={styles.socialBarBg}>
                      <div 
                        className={styles.socialBarFill} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className={styles.socialPercent}>{percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.socialCard}>
              <h4>Sanitation Access</h4>
              <div className={styles.socialBars}>
                {Object.entries(healthMetrics.social_determinants.sanitation_access).map(([level, percentage]) => (
                  <div key={level} className={styles.socialBar}>
                    <span className={styles.socialLabel}>{level}</span>
                    <div className={styles.socialBarBg}>
                      <div 
                        className={styles.socialBarFill} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className={styles.socialPercent}>{percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <p>⚠️ {error}</p>
          <button onClick={fetchAnalyticsData}>Retry</button>
        </div>
      )}
    </div>
  );
};

export default CommunityHealthAnalytics;
