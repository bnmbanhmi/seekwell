import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './MedicalReportsManagement.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

type MedicalReport = {
  record_id: number;
  patient_id: number;
  doctor_id: number;
  in_day: string;
  out_day: string | null;
  in_diagnosis: string;
  out_diagnosis: string | null;
  reason_in: string;
  treatment_process: string;
  pulse_rate: string | null;
  temperature: string | null;
  blood_pressure: string | null;
  respiratory_rate: string | null;
  weight: string | null;
  pathological_process: string | null;
  personal_history: string | null;
  family_history: string | null;
  diagnose_from_recommender: string | null;
  prescription: string | null;
  doctor_notes: string | null;
};

type Patient = {
  patient_id: number;
  full_name: string;
  date_of_birth: string;
  gender: string;
  phone_number: string;
  email: string;
};

type SearchFilters = {
  patientName: string;
  diagnosis: string;
  dateFrom: string;
  dateTo: string;
  status: 'all' | 'active' | 'completed';
};

const MedicalReportsManagement = () => {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<MedicalReport[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReport, setEditingReport] = useState<Partial<MedicalReport>>({});
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    patientName: '',
    diagnosis: '',
    dateFrom: '',
    dateTo: '',
    status: 'all'
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchMedicalReports();
    fetchPatients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, searchFilters]);

  const fetchMedicalReports = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BACKEND_URL}/medical_reports/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setReports(response.data);
    } catch (err) {
      console.error('Failed to fetch medical reports:', err);
      setError('Failed to load medical reports.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BACKEND_URL}/patients/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPatients(response.data);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  };

  const getPatientName = (patientId: number): string => {
    const patient = patients.find(p => p.patient_id === patientId);
    return patient ? patient.full_name : `Patient ID: ${patientId}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const applyFilters = () => {
    let filtered = [...reports];

    if (searchFilters.patientName) {
      filtered = filtered.filter(report => {
        const patientName = getPatientName(report.patient_id).toLowerCase();
        return patientName.includes(searchFilters.patientName.toLowerCase());
      });
    }

    if (searchFilters.diagnosis) {
      filtered = filtered.filter(report =>
        (report.in_diagnosis || '').toLowerCase().includes(searchFilters.diagnosis.toLowerCase()) ||
        (report.out_diagnosis || '').toLowerCase().includes(searchFilters.diagnosis.toLowerCase())
      );
    }

    if (searchFilters.dateFrom) {
      filtered = filtered.filter(report =>
        new Date(report.in_day) >= new Date(searchFilters.dateFrom)
      );
    }

    if (searchFilters.dateTo) {
      filtered = filtered.filter(report =>
        new Date(report.in_day) <= new Date(searchFilters.dateTo)
      );
    }

    if (searchFilters.status !== 'all') {
      filtered = filtered.filter(report => {
        const isCompleted = report.out_day !== null;
        return searchFilters.status === 'completed' ? isCompleted : !isCompleted;
      });
    }

    setFilteredReports(filtered);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setSearchFilters({
      patientName: '',
      diagnosis: '',
      dateFrom: '',
      dateTo: '',
      status: 'all'
    });
  };

  const handleEditReport = (report: MedicalReport) => {
    setEditingReport(report);
    setShowEditModal(true);
  };

  const handleDeleteReport = async (recordId: number) => {
    if (!window.confirm('Are you sure you want to delete this medical report?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${BACKEND_URL}/medical_reports/${recordId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Refresh the reports list
      fetchMedicalReports();
      setSelectedReport(null);
    } catch (err) {
      console.error('Failed to delete medical report:', err);
      alert('Failed to delete medical report. Please try again.');
    }
  };

  const handleUpdateReport = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const updateData = {
        ...editingReport,
        // Only include fields that have been modified
        in_day: editingReport.in_day ? editingReport.in_day.split('T')[0] : undefined,
        out_day: editingReport.out_day ? editingReport.out_day.split('T')[0] : undefined,
      };

      await axios.put(`${BACKEND_URL}/medical_reports/${editingReport.record_id}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setShowEditModal(false);
      setEditingReport({});
      fetchMedicalReports();
      alert('Medical report updated successfully!');
    } catch (err) {
      console.error('Failed to update medical report:', err);
      alert('Failed to update medical report. Please try again.');
    }
  };

  const getStatusBadge = (report: MedicalReport) => {
    const isCompleted = report.out_day !== null;
    return (
      <span className={`${styles.statusBadge} ${isCompleted ? styles.completed : styles.active}`}>
        {isCompleted ? 'Completed' : 'Active'}
      </span>
    );
  };

  const parsePrescription = (prescriptionJson: string | null) => {
    if (!prescriptionJson) return [];
    try {
      return JSON.parse(prescriptionJson);
    } catch {
      return [];
    }
  };

  const exportReport = (report: MedicalReport) => {
    const reportData = {
      'Report ID': report.record_id,
      'Patient': getPatientName(report.patient_id),
      'Date': formatDate(report.in_day),
      'Diagnosis': report.in_diagnosis || 'N/A',
      'Treatment': report.treatment_process || 'N/A',
      'Notes': report.doctor_notes || 'N/A'
    };

    const csvContent = Object.entries(reportData)
      .map(([key, value]) => `${key},${value}`)
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medical-report-${report.record_id}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading medical reports...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h2>Medical Reports Management</h2>
        <button 
          className={styles.createButton}
          onClick={() => navigate('/dashboard/create_records')}
        >
          + Create New Report
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Search and Filter Controls */}
      <div className={styles.filtersContainer}>
        <h3>Search & Filter Reports</h3>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label>Patient Name:</label>
            <input
              type="text"
              name="patientName"
              value={searchFilters.patientName}
              onChange={handleFilterChange}
              placeholder="Search by patient name..."
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label>Diagnosis:</label>
            <input
              type="text"
              name="diagnosis"
              value={searchFilters.diagnosis}
              onChange={handleFilterChange}
              placeholder="Search by diagnosis..."
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label>Date From:</label>
            <input
              type="date"
              name="dateFrom"
              value={searchFilters.dateFrom}
              onChange={handleFilterChange}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label>Date To:</label>
            <input
              type="date"
              name="dateTo"
              value={searchFilters.dateTo}
              onChange={handleFilterChange}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label>Status:</label>
            <select
              name="status"
              value={searchFilters.status}
              onChange={handleFilterChange}
              className={styles.filterSelect}
            >
              <option value="all">All Reports</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className={styles.filterActions}>
            <button onClick={clearFilters} className={styles.clearButton}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <h4>Total Reports</h4>
          <span className={styles.statNumber}>{reports.length}</span>
        </div>
        <div className={styles.statCard}>
          <h4>Active</h4>
          <span className={styles.statNumber}>
            {reports.filter(r => !r.out_day).length}
          </span>
        </div>
        <div className={styles.statCard}>
          <h4>Completed</h4>
          <span className={styles.statNumber}>
            {reports.filter(r => r.out_day).length}
          </span>
        </div>
        <div className={styles.statCard}>
          <h4>This Month</h4>
          <span className={styles.statNumber}>
            {reports.filter(r => {
              const reportMonth = new Date(r.in_day).getMonth();
              const currentMonth = new Date().getMonth();
              return reportMonth === currentMonth;
            }).length}
          </span>
        </div>
      </div>

      {/* Reports Grid */}
      <div className={styles.reportsGrid}>
        <div className={styles.reportsList}>
          <h3>Reports ({filteredReports.length})</h3>
          {filteredReports.length === 0 ? (
            <div className={styles.noData}>
              <p>No medical reports found matching your criteria.</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.record_id}
                className={`${styles.reportCard} ${selectedReport?.record_id === report.record_id ? styles.selected : ''}`}
                onClick={() => setSelectedReport(report)}
              >
                <div className={styles.reportHeader}>
                  <div>
                    <h4>Report #{report.record_id}</h4>
                    <p className={styles.patientName}>{getPatientName(report.patient_id)}</p>
                  </div>
                  <div>
                    {getStatusBadge(report)}
                    <span className={styles.date}>{formatDate(report.in_day)}</span>
                  </div>
                </div>
                <div className={styles.reportPreview}>
                  <p><strong>Diagnosis:</strong> {report.in_diagnosis || 'N/A'}</p>
                  <p><strong>Reason:</strong> {report.reason_in || 'N/A'}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Report Details */}
        {selectedReport && (
          <div className={styles.reportDetails}>
            <div className={styles.detailsHeader}>
              <h3>Medical Report #{selectedReport.record_id}</h3>
              <div className={styles.detailsActions}>
                <button
                  className={styles.actionButton}
                  onClick={() => handleEditReport(selectedReport)}
                >
                  ✏️ Edit
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => exportReport(selectedReport)}
                >
                  📤 Export
                </button>
                <button
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  onClick={() => handleDeleteReport(selectedReport.record_id)}
                >
                  🗑️ Delete
                </button>
                <button
                  className={styles.closeButton}
                  onClick={() => setSelectedReport(null)}
                >
                  ×
                </button>
              </div>
            </div>

            <div className={styles.detailsContent}>
              <div className={styles.section}>
                <h4>Patient Information</h4>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <strong>Patient:</strong> {getPatientName(selectedReport.patient_id)}
                  </div>
                  <div className={styles.infoItem}>
                    <strong>Status:</strong> {getStatusBadge(selectedReport)}
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h4>Basic Information</h4>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <strong>Admission Date:</strong> {formatDate(selectedReport.in_day)}
                  </div>
                  <div className={styles.infoItem}>
                    <strong>Discharge Date:</strong> {formatDate(selectedReport.out_day)}
                  </div>
                  <div className={styles.infoItem}>
                    <strong>Reason for Visit:</strong>
                    <p>{selectedReport.reason_in || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h4>Diagnosis & Treatment</h4>
                <div className={styles.infoItem}>
                  <strong>Initial Diagnosis:</strong>
                  <p>{selectedReport.in_diagnosis || 'N/A'}</p>
                </div>
                {selectedReport.out_diagnosis && (
                  <div className={styles.infoItem}>
                    <strong>Final Diagnosis:</strong>
                    <p>{selectedReport.out_diagnosis}</p>
                  </div>
                )}
                <div className={styles.infoItem}>
                  <strong>Treatment Process:</strong>
                  <p>{selectedReport.treatment_process || 'N/A'}</p>
                </div>
                <div className={styles.infoItem}>
                  <strong>Doctor's Notes:</strong>
                  <p>{selectedReport.doctor_notes || 'N/A'}</p>
                </div>
              </div>

              {(selectedReport.pulse_rate || selectedReport.temperature || selectedReport.blood_pressure || selectedReport.respiratory_rate || selectedReport.weight) && (
                <div className={styles.section}>
                  <h4>Vital Signs</h4>
                  <div className={styles.vitalSignsGrid}>
                    {selectedReport.pulse_rate && (
                      <div className={styles.vitalSign}>
                        <strong>Pulse Rate:</strong> {selectedReport.pulse_rate}
                      </div>
                    )}
                    {selectedReport.temperature && (
                      <div className={styles.vitalSign}>
                        <strong>Temperature:</strong> {selectedReport.temperature}
                      </div>
                    )}
                    {selectedReport.blood_pressure && (
                      <div className={styles.vitalSign}>
                        <strong>Blood Pressure:</strong> {selectedReport.blood_pressure}
                      </div>
                    )}
                    {selectedReport.respiratory_rate && (
                      <div className={styles.vitalSign}>
                        <strong>Respiratory Rate:</strong> {selectedReport.respiratory_rate}
                      </div>
                    )}
                    {selectedReport.weight && (
                      <div className={styles.vitalSign}>
                        <strong>Weight:</strong> {selectedReport.weight}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedReport.prescription && (
                <div className={styles.section}>
                  <h4>Prescription</h4>
                  <div className={styles.prescriptionList}>
                    {parsePrescription(selectedReport.prescription).map((med: any, index: number) => (
                      <div key={index} className={styles.medicationItem}>
                        <div className={styles.medName}>{med.name}</div>
                        <div className={styles.medDetails}>
                          <span><strong>Dosage:</strong> {med.dosage}</span>
                          <span><strong>Quantity:</strong> {med.quantity}</span>
                          <span><strong>Instructions:</strong> {med.instructions}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(selectedReport.personal_history || selectedReport.family_history) && (
                <div className={styles.section}>
                  <h4>Patient History</h4>
                  {selectedReport.personal_history && (
                    <div className={styles.infoItem}>
                      <strong>Personal History:</strong>
                      <p>{selectedReport.personal_history}</p>
                    </div>
                  )}
                  {selectedReport.family_history && (
                    <div className={styles.infoItem}>
                      <strong>Family History:</strong>
                      <p>{selectedReport.family_history}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Edit Medical Report #{editingReport.record_id}</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Initial Diagnosis:</label>
                <textarea
                  value={editingReport.in_diagnosis || ''}
                  onChange={(e) => setEditingReport(prev => ({ ...prev, in_diagnosis: e.target.value }))}
                  className={styles.textarea}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Final Diagnosis:</label>
                <textarea
                  value={editingReport.out_diagnosis || ''}
                  onChange={(e) => setEditingReport(prev => ({ ...prev, out_diagnosis: e.target.value }))}
                  className={styles.textarea}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Treatment Process:</label>
                <textarea
                  value={editingReport.treatment_process || ''}
                  onChange={(e) => setEditingReport(prev => ({ ...prev, treatment_process: e.target.value }))}
                  className={styles.textarea}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Doctor's Notes:</label>
                <textarea
                  value={editingReport.doctor_notes || ''}
                  onChange={(e) => setEditingReport(prev => ({ ...prev, doctor_notes: e.target.value }))}
                  className={styles.textarea}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Discharge Date:</label>
                  <input
                    type="date"
                    value={editingReport.out_day ? editingReport.out_day.split('T')[0] : ''}
                    onChange={(e) => setEditingReport(prev => ({ ...prev, out_day: e.target.value }))}
                    className={styles.input}
                  />
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.saveButton}
                onClick={handleUpdateReport}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalReportsManagement;
