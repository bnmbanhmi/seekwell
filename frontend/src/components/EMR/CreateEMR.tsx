import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './CreateEMR.module.css'; // Updated for CSS Modules

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface Patient {
  id: string;
  name: string;
}

interface PrescriptionItem {
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
}

interface FormData {
  in_diagnosis: string;
  doctor_notes: string;
  prescription: PrescriptionItem[];
  reason_in: string;
  treatment_process: string;
  // Vital Signs
  pulse_rate: string;
  temperature: string;
  blood_pressure: string;
  respiratory_rate: string;
  weight: string;
  // Patient History
  personal_history: string;
  family_history: string;
}

const CreateEMR: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [formData, setFormData] = useState<FormData>({
    in_diagnosis: '',
    doctor_notes: '',
    prescription: [],
    reason_in: '',
    treatment_process: '',
    // Vital Signs
    pulse_rate: '',
    temperature: '',
    blood_pressure: '',
    respiratory_rate: '',
    weight: '',
    // Patient History
    personal_history: '',
    family_history: '',
  });
  const [doctorId, setDoctorId] = useState('');
  const [medications, setMedications] = useState<string[]>([]);
  const [newMedication, setNewMedication] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        // Fetch appointments for the current doctor
        const appointmentsResponse = await axios.get(`${BACKEND_URL}/appointments/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const appointments = appointmentsResponse.data;
        console.log('Fetched appointments:', appointments); // Debug log

        if (appointments.length === 0) {
          console.log('No appointments found for this doctor'); // Debug log
          setPatients([]);
          setFilteredPatients([]);
          return;
        }

        // Remove duplicate patient_ids from appointments
        const uniquePatientIds = Array.from(
          new Set<string>(appointments.map((appointment: any) => appointment.patient_id.toString()))
        ) as string[];

        console.log('Unique patient IDs from appointments:', uniquePatientIds); // Debug log

        // Fetch patient details for each unique patient_id
        const patientPromises = uniquePatientIds.map(async (patientId: string) => {
          try {
            const patientResponse = await axios.get(`${BACKEND_URL}/patients/${patientId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            console.log(`Fetched patient ${patientId}:`, patientResponse.data); // Debug log
            return {
              id: patientId,
              name: patientResponse.data.full_name,
            };
          } catch (err) {
            console.error(`Failed to fetch patient ${patientId}:`, err);
            return null;
          }
        });

        const patientsList = (await Promise.all(patientPromises)).filter(patient => patient !== null);
        console.log('Final patients list:', patientsList); // Debug log
        setPatients(patientsList);
        setFilteredPatients(patientsList);
      } catch (err) {
        console.error('Failed to fetch patients:', err);
        setError('Không thể tải danh sách bệnh nhân.');
      }
    };

    const fetchDoctorDetails = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${BACKEND_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // For doctors, use doctor_id (which is the same as user_id in the database)
        const id = response.data.doctor_id || response.data.user_id;
        setDoctorId(id);
      } catch (err) {
        console.error('Failed to fetch doctor details:', err);
      }
    };

    fetchPatients();
    fetchDoctorDetails();
  }, []);

  // Filter patients based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  console.log()

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    setStep(2); // Move to the EMR form step
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setFormData({
      in_diagnosis: '',
      doctor_notes: '',
      prescription: [],
      reason_in: '',
      treatment_process: '',
      // Vital Signs
      pulse_rate: '',
      temperature: '',
      blood_pressure: '',
      respiratory_rate: '',
      weight: '',
      // Patient History
      personal_history: '',
      family_history: '',
    });
    setError('');
    setSuccess('');
    setStep(1);
  };

  const handleAddMedication = () => {
    if (newMedication.trim()) {
      setFormData((prev) => ({
        ...prev,
        prescription: [...prev.prescription, { name: newMedication, dosage: '', quantity: '', instructions: '' }],
      }));
      setNewMedication('');
    }
  };

  const handleSaveEMR = async () => {
    setError('');
    setSuccess('');
    
    // Validation
    if (!selectedPatientId || !doctorId) {
      setError('Vui lòng chọn bệnh nhân và bác sĩ.');
      return;
    }
    
    if (!formData.in_diagnosis.trim() || !formData.reason_in.trim() || !formData.treatment_process.trim()) {
      setError('Chẩn đoán, lý do nhập viện và quá trình điều trị là bắt buộc.');
      return;
    }
    
    try {
      const emrData = {
        patient_id: parseInt(selectedPatientId),
        doctor_id: parseInt(doctorId),
        in_diagnosis: formData.in_diagnosis,
        doctor_notes: formData.doctor_notes,
        prescription: JSON.stringify(formData.prescription),
        reason_in: formData.reason_in,
        treatment_process: formData.treatment_process,
        // Vital Signs - only include if not empty
        ...(formData.pulse_rate && { pulse_rate: formData.pulse_rate }),
        ...(formData.temperature && { temperature: formData.temperature }),
        ...(formData.blood_pressure && { blood_pressure: formData.blood_pressure }),
        ...(formData.respiratory_rate && { respiratory_rate: formData.respiratory_rate }),
        ...(formData.weight && { weight: formData.weight }),
        // Patient History - only include if not empty
        ...(formData.personal_history && { personal_history: formData.personal_history }),
        ...(formData.family_history && { family_history: formData.family_history }),
      };

      console.log('Sending EMR data:', emrData); // Debug log

      const response = await axios.post(`${BACKEND_URL}/medical_reports/`, emrData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      setSuccess('Hồ sơ bệnh án đã được lưu thành công!');
      setFormData({
        in_diagnosis: '',
        doctor_notes: '',
        prescription: [],
        reason_in: '',
        treatment_process: '',
        // Vital Signs
        pulse_rate: '',
        temperature: '',
        blood_pressure: '',
        respiratory_rate: '',
        weight: '',
        // Patient History
        personal_history: '',
        family_history: '',
      });
      setStep(1); // Reset to the patient selection step
    } catch (err: any) {
      console.error('Error saving EMR:', err);
      
      // Enhanced error handling to show specific validation errors
      if (err.response?.status === 422) {
        const validationErrors = err.response.data?.detail;
        if (Array.isArray(validationErrors)) {
          const errorMessages = validationErrors.map((error: any) => 
            `${error.loc?.join('.')}: ${error.msg}`
          ).join(', ');
          setError(`Validation error: ${errorMessages}`);
        } else {
          setError('Lỗi xác thực: Vui lòng kiểm tra dữ liệu đầu vào.');
        }
      } else if (err.response?.status === 400) {
        setError(`Yêu cầu không hợp lệ: ${err.response.data?.detail || 'Dữ liệu không hợp lệ'}`);
      } else {
        setError('Không thể lưu hồ sơ bệnh án. Vui lòng thử lại.');
      }
    }
  };

  return (
    <div className={styles.createEmrContainer}>
      <h1 className={styles.title}>Tạo Hồ sơ Bệnh án</h1>
      {error && <p className={styles.errorMessage}>{error}</p>}
      {success && <p className={styles.successMessage}>{success}</p>}

      {/* Step 1: Patient Selection */}
      {step === 1 && (
        <div className={styles.patientSelection}>
          <h2 className={styles.subtitle}>Chọn Bệnh nhân</h2>

          {/* Search input */}
          <div className={styles.formGroup}>
            <label htmlFor="patientSearch" className={styles.label}>Tìm kiếm bệnh nhân:</label>
            <input
              type="text"
              id="patientSearch"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập tên bệnh nhân..."
              className={styles.input}
            />
          </div>

          {patients.length === 0 && !error ? (
            <p className={styles.loading}>Đang tải...</p>
          ) : filteredPatients.length > 0 ? (
            <>
              <p className={styles.patientCount}>
                Hiển thị {filteredPatients.length} / {patients.length} bệnh nhân
              </p>
              <ul className={styles.patientList}>
                {filteredPatients.map((patient) => (
                  <li key={patient.id}>
                    <button
                      className={styles.patientButton}
                      onClick={() => handlePatientSelect(patient.id)}
                    >
                      {patient.name}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : searchTerm ? (
            <p className={styles.noPatients}>Không tìm thấy bệnh nhân phù hợp với "{searchTerm}" trong danh sách cuộc hẹn của bạn.</p>
          ) : (
            <p className={styles.noPatients}>Bạn chưa có cuộc hẹn nào với bệnh nhân. Hãy tạo cuộc hẹn trước khi tạo hồ sơ bệnh án.</p>
          )}
        </div>
      )}

      {/* Step 2: EMR Creation Form */}
      {step === 2 && (
        <div className={styles.emrForm}>
          <div className={styles.formGroup}>
            <label htmlFor="reason_in" className={styles.label}>Lý do nhập viện:</label>
            <textarea
              id="reason_in"
              name="reason_in"
              value={formData.reason_in}
              onChange={handleChange}
              required
              className={styles.textarea}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="doctor_notes" className={styles.label}>Ghi chú tư vấn:</label>
            <textarea
              id="doctor_notes"
              name="doctor_notes"
              value={formData.doctor_notes}
              onChange={handleChange}
              required
              className={styles.textarea}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="in_diagnosis" className={styles.label}>Chẩn đoán:</label>
            <input
              type="text"
              id="in_diagnosis"
              name="in_diagnosis"
              value={formData.in_diagnosis}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          {/* Vital Signs Section */}
          <div className={styles.vitalSignsSection}>
            <h3 className={styles.sectionTitle}>Dấu hiệu sinh tồn</h3>
            <div className={styles.vitalSignsGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="pulse_rate" className={styles.label}>Nhịp tim (lần/phút):</label>
                <input
                  type="number"
                  id="pulse_rate"
                  name="pulse_rate"
                  value={formData.pulse_rate}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="ví dụ: 72"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="temperature" className={styles.label}>Nhiệt độ (°C):</label>
                <input
                  type="number"
                  step="0.1"
                  id="temperature"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="ví dụ: 36.5"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="blood_pressure" className={styles.label}>Huyết áp:</label>
                <input
                  type="text"
                  id="blood_pressure"
                  name="blood_pressure"
                  value={formData.blood_pressure}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="ví dụ: 120/80"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="respiratory_rate" className={styles.label}>Nhịp thở (lần/phút):</label>
                <input
                  type="number"
                  id="respiratory_rate"
                  name="respiratory_rate"
                  value={formData.respiratory_rate}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="ví dụ: 16"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="weight" className={styles.label}>Cân nặng (kg):</label>
                <input
                  type="number"
                  step="0.1"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="ví dụ: 70.5"
                />
              </div>
            </div>
          </div>

          {/* Patient History Section */}
          <div className={styles.historySection}>
            <h3 className={styles.sectionTitle}>Tiền sử Bệnh nhân</h3>
            <div className={styles.formGroup}>
              <label htmlFor="personal_history" className={styles.label}>Tiền sử cá nhân:</label>
              <textarea
                id="personal_history"
                name="personal_history"
                value={formData.personal_history}
                onChange={handleChange}
                className={styles.textarea}
                placeholder="Tiền sử bệnh lý cá nhân, dị ứng, thuốc đang sử dụng, v.v."
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="family_history" className={styles.label}>Tiền sử gia đình:</label>
              <textarea
                id="family_history"
                name="family_history"
                value={formData.family_history}
                onChange={handleChange}
                className={styles.textarea}
                placeholder="Tiền sử bệnh lý gia đình, các bệnh di truyền, v.v."
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="treatment_process" className={styles.label}>Quá trình điều trị:</label>
            <textarea
              id="treatment_process"
              name="treatment_process"
              value={formData.treatment_process}
              onChange={handleChange}
              required
              className={styles.textarea}
            />
          </div>
          <button className={styles.button} onClick={() => setStep(3)}>Thêm đơn thuốc</button>
        </div>
      )}

      {/* Step 3: Prescription Entry */}
      {step === 3 && (
        <div className={styles.prescriptionForm}>
          <h2>Đơn thuốc</h2>
          <div className={styles.formGroup}>
            <label htmlFor="newMedication" className={styles.label}>Thuốc:</label>
            <input
              type="text"
              id="newMedication"
              value={newMedication}
              onChange={(e) => setNewMedication(e.target.value)}
              className={styles.input}
            />
            <button className={styles.button} onClick={handleAddMedication}>Thêm thuốc</button>
          </div>
          <ul className={styles.medicationList}>
            {formData.prescription.map((med, index) => (
              <li key={index} className={styles.medicationListItem}>
                <strong>{med.name}</strong>
                <div>
                  <label className={styles.label}>Liều dùng:</label>
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) =>
                      setFormData((prev) => {
                        const updatedPrescription = [...prev.prescription];
                        updatedPrescription[index].dosage = e.target.value;
                        return { ...prev, prescription: updatedPrescription };
                      })
                    }
                    className={styles.input}
                  />
                </div>
                <div>
                  <label className={styles.label}>Số lượng:</label>
                  <input
                    type="number"
                    value={med.quantity}
                    onChange={(e) =>
                      setFormData((prev) => {
                        const updatedPrescription = [...prev.prescription];
                        updatedPrescription[index].quantity = e.target.value;
                        return { ...prev, prescription: updatedPrescription };
                      })
                    }
                    className={styles.input}
                  />
                </div>
                <div>
                  <label className={styles.label}>Hướng dẫn:</label>
                  <textarea
                    value={med.instructions}
                    onChange={(e) =>
                      setFormData((prev) => {
                        const updatedPrescription = [...prev.prescription];
                        updatedPrescription[index].instructions = e.target.value;
                        return { ...prev, prescription: updatedPrescription };
                      })
                    }
                    className={styles.textarea}
                  />
                </div>
              </li>
            ))}
          </ul>
          <button className={styles.button} onClick={() => setStep(4)}>Xem lại hồ sơ</button>
        </div>
      )}

      {/* Step 4: Review EMR */}
      {step === 4 && (
        <div className={styles.reviewEmr}>
          <h2>Xem lại Hồ sơ Bệnh án</h2>
          <p>
            <strong>Ghi chú tư vấn:</strong> {formData.doctor_notes}
          </p>
          <p>
            <strong>Chẩn đoán:</strong> {formData.in_diagnosis}
          </p>
          <p>
            <strong>Quá trình điều trị:</strong> {formData.treatment_process}
          </p>
          <h3>Đơn thuốc:</h3>
          <ul>
            {formData.prescription.map((med, index) => (
              <li key={index}>
                <strong>{med.name}</strong> - Liều dùng: {med.dosage}, Số lượng: {med.quantity}, Hướng dẫn: {med.instructions}
              </li>
            ))}
          </ul>
          <button className={styles.button} onClick={handleSaveEMR}>Lưu hồ sơ</button>
          <button className={styles.button} onClick={handleCancel}>Hủy</button>
        </div>
      )}
    </div>
  );
};

export default CreateEMR;