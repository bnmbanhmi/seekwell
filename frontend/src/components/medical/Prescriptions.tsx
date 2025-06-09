import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Prescriptions.module.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface Prescription {
  id: string;
  date: string;
  doctor: string;
  medications: Medication[];
  notes?: string;
  status: 'active' | 'completed' | 'discontinued';
}

interface MedicalReport {
  record_id: number;
  patient_id: number;
  doctor_id: number;
  in_day: string;
  out_day: string | null;
  diagnosis: string;
  prescription: string | null;
  test_results: string | null;
  vital_signs: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const Prescriptions: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'discontinued'>('all');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/medical_reports/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Transform medical reports to prescriptions
      const transformedPrescriptions = transformMedicalReportsToPrescriptions(response.data);
      setPrescriptions(transformedPrescriptions);
      
      if (transformedPrescriptions.length > 0) {
        setSelectedPrescription(transformedPrescriptions[0]);
      }
    } catch (err: any) {
      console.error('Error fetching prescriptions:', err);
      setError(err.response?.data?.detail || 'Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const transformMedicalReportsToPrescriptions = (reports: MedicalReport[]): Prescription[] => {
    return reports
      .filter(report => report.prescription && report.prescription.trim() !== '')
      .map(report => {
        let medications: Medication[] = [];
        let notes = '';
        let status: 'active' | 'completed' | 'discontinued' = 'active';

        try {
          // Try to parse prescription as JSON
          const prescriptionData = JSON.parse(report.prescription!);
          if (prescriptionData.medications && Array.isArray(prescriptionData.medications)) {
            medications = prescriptionData.medications;
            notes = prescriptionData.notes || '';
            status = prescriptionData.status || 'active';
          }
        } catch {
          // If not JSON, treat as plain text and try to extract medications
          const prescriptionText = report.prescription!;
          medications = extractMedicationsFromText(prescriptionText);
          notes = prescriptionText;
        }

        // Determine status based on dates if not explicitly set
        if (status === 'active' && report.out_day) {
          const outDate = new Date(report.out_day);
          const now = new Date();
          if (outDate < now) {
            status = 'completed';
          }
        }

        return {
          id: report.record_id.toString(),
          date: report.in_day,
          doctor: `Doctor ID: ${report.doctor_id}`, // You might want to fetch doctor names
          medications,
          notes,
          status,
        };
      });
  };

  const extractMedicationsFromText = (text: string): Medication[] => {
    // Simple extraction logic for common prescription formats
    const lines = text.split('\n').filter(line => line.trim());
    const medications: Medication[] = [];

    for (const line of lines) {
      // Look for patterns like "Medicine Name - dosage - frequency"
      const medicationPattern = /(.+?)\s*-\s*(.+?)\s*-\s*(.+)/;
      const match = line.match(medicationPattern);
      
      if (match) {
        medications.push({
          name: match[1].trim(),
          dosage: match[2].trim(),
          frequency: match[3].trim(),
          duration: 'As prescribed',
        });
      } else if (line.trim() && !line.toLowerCase().includes('note')) {
        // Fallback: treat the whole line as medication name
        medications.push({
          name: line.trim(),
          dosage: 'As prescribed',
          frequency: 'As prescribed',
          duration: 'As prescribed',
        });
      }
    }

    return medications;
  };

  const filteredPrescriptions = prescriptions.filter(prescription => 
    filterStatus === 'all' || prescription.status === filterStatus
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return styles.statusActive;
      case 'completed':
        return styles.statusCompleted;
      case 'discontinued':
        return styles.statusDiscontinued;
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p>Đang tải đơn thuốc...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          <h3>Lỗi</h3>
          <p>{error}</p>
          <button onClick={fetchPrescriptions} className={styles.retryButton}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Đơn thuốc của tôi</h1>
        <div className={styles.filters}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="all">Tất cả đơn thuốc</option>
            <option value="active">Đang sử dụng</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="discontinued">Đã ngừng</option>
          </select>
        </div>
      </div>

      {filteredPrescriptions.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💊</div>
          <h3>Không tìm thấy đơn thuốc</h3>
          <p>
            {filterStatus === 'all' 
              ? "Bạn chưa có đơn thuốc nào."
              : `Không tìm thấy đơn thuốc ${filterStatus === 'active' ? 'đang sử dụng' : filterStatus === 'completed' ? 'đã hoàn thành' : 'đã ngừng'}.`
            }
          </p>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.prescriptionsList}>
            {filteredPrescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className={`${styles.prescriptionCard} ${
                  selectedPrescription?.id === prescription.id ? styles.selected : ''
                }`}
                onClick={() => setSelectedPrescription(prescription)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardDate}>
                    {new Date(prescription.date).toLocaleDateString('vi-VN')}
                  </div>
                  <span className={`${styles.statusBadge} ${getStatusBadgeClass(prescription.status)}`}>
                    {prescription.status === 'active' ? 'Đang sử dụng' : 
                     prescription.status === 'completed' ? 'Đã hoàn thành' : 'Đã ngừng'}
                  </span>
                </div>
                <div className={styles.cardContent}>
                  <p className={styles.doctorName}>{prescription.doctor}</p>
                  <p className={styles.medicationCount}>
                    {prescription.medications.length} loại thuốc
                  </p>
                </div>
              </div>
            ))}
          </div>

          {selectedPrescription && (
            <div className={styles.prescriptionDetails}>
              <div className={styles.detailsHeader}>
                <h2>Chi tiết đơn thuốc</h2>
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(selectedPrescription.status)}`}>
                  {selectedPrescription.status === 'active' ? 'Đang sử dụng' : 
                   selectedPrescription.status === 'completed' ? 'Đã hoàn thành' : 'Đã ngừng'}
                </span>
              </div>

              <div className={styles.prescriptionInfo}>
                <div className={styles.infoRow}>
                  <label>Ngày:</label>
                  <span>{new Date(selectedPrescription.date).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className={styles.infoRow}>
                  <label>Bác sĩ kê đơn:</label>
                  <span>{selectedPrescription.doctor}</span>
                </div>
              </div>

              <div className={styles.medicationsSection}>
                <h3>Thuốc</h3>
                {selectedPrescription.medications.length > 0 ? (
                  <div className={styles.medicationsList}>
                    {selectedPrescription.medications.map((medication, index) => (
                      <div key={index} className={styles.medicationItem}>
                        <div className={styles.medicationHeader}>
                          <h4>{medication.name}</h4>
                        </div>
                        <div className={styles.medicationDetails}>
                          <div className={styles.medicationInfo}>
                            <span className={styles.label}>Liều dùng:</span>
                            <span>{medication.dosage}</span>
                          </div>
                          <div className={styles.medicationInfo}>
                            <span className={styles.label}>Tần suất:</span>
                            <span>{medication.frequency}</span>
                          </div>
                          <div className={styles.medicationInfo}>
                            <span className={styles.label}>Thời gian:</span>
                            <span>{medication.duration}</span>
                          </div>
                          {medication.instructions && (
                            <div className={styles.medicationInfo}>
                              <span className={styles.label}>Hướng dẫn:</span>
                              <span>{medication.instructions}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noMedications}>Không có thuốc nào được liệt kê</p>
                )}
              </div>

              {selectedPrescription.notes && (
                <div className={styles.notesSection}>
                  <h3>Ghi chú thêm</h3>
                  <div className={styles.notesContent}>
                    {selectedPrescription.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
