import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientMonitoringService, { PatientMonitoringData } from '../../services/PatientMonitoringService';
import styles from './PatientMonitoring.module.css';

const PatientMonitoring: React.FC = () => {
  const [patientsData, setPatientsData] = useState<PatientMonitoringData[]>([]);
  const [filteredPatientsData, setFilteredPatientsData] = useState<PatientMonitoringData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatientsData = async () => {
      try {
        setLoading(true);
        const data = await PatientMonitoringService.getAllPatientsWithAnalysisData();
        setPatientsData(data);
        setFilteredPatientsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientsData();
  }, []);

  const handleSearch = (searchValue: string) => {
    setSearchTerm(searchValue);
    
    if (!searchValue.trim()) {
      setFilteredPatientsData(patientsData);
      return;
    }

    const filtered = patientsData.filter(patientData => {
      const patient = patientData.patient;
      const term = searchValue.toLowerCase();
      return (
        (patient.full_name && patient.full_name.toLowerCase().includes(term)) ||
        (patient.email && patient.email.toLowerCase().includes(term)) ||
        (patient.phone_number && patient.phone_number.includes(term))
      );
    });
    
    setFilteredPatientsData(filtered);
  };

  const handlePatientClick = (patient: PatientMonitoringData) => {
    navigate(`/dashboard/patient-monitoring/${patient.patient.patient_id}`);
  };

  if (loading) return <div className={styles.loading}>Loading patient data...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Patient Monitoring</h2>
        <p className={styles.subtitle}>Monitor patients' skin analysis results and manage urgent cases</p>
      </div>

      <div className={styles.patientListContainer}>
        <div className={styles.patientListHeader}>
          <h3>Patients ({filteredPatientsData.length})</h3>
          <div className={styles.searchBar}>
            <input 
              type="text" 
              placeholder="Search patients by name, email or phone..." 
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className={styles.patientGrid}>
          {filteredPatientsData.map((patientData) => (
            <div
              key={patientData.patient.patient_id}
              className={styles.patientCard}
              onClick={() => handlePatientClick(patientData)}
            >
              <div className={styles.patientInfo}>
                <h4>{patientData.patient.full_name || 'Unknown Patient'}</h4>
                <p><strong>Email:</strong> {patientData.patient.email || 'No email provided'}</p>
                {patientData.patient.phone_number && (
                  <p><strong>Phone:</strong> {patientData.patient.phone_number}</p>
                )}
                {patientData.patient.gender && (
                  <p><strong>Gender:</strong> {patientData.patient.gender}</p>
                )}
                {patientData.patient.age && (
                  <p><strong>Age:</strong> {patientData.patient.age}</p>
                )}
              </div>
              
              <div className={styles.patientStats}>
                <div className={styles.stat}>
                  <span>{patientData.totalAnalyses}</span>
                  <small>Analyses</small>
                </div>
                <div className={styles.stat}>
                  <span>{patientData.urgentCases.length}</span>
                  <small>Urgent</small>
                </div>
              </div>

              {patientData.urgentCases.length > 0 && (
                <div className={styles.urgentBadge}>!</div>
              )}
            </div>
          ))}
        </div>

        {filteredPatientsData.length === 0 && !loading && (
          <div className={styles.noData}>
            <h3>No Patients Found</h3>
            <p>
              {searchTerm 
                ? `No patients match your search for "${searchTerm}"`
                : "No patients with analysis data found."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientMonitoring;
