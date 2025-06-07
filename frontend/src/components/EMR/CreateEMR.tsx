import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CreateEMR.css'; // Assuming you have a CSS file for styling

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
}

const CreateEMR: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [formData, setFormData] = useState<FormData>({
    in_diagnosis: '',
    doctor_notes: '',
    prescription: [],
    reason_in: '',
    treatment_process: '',
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
      const appointmentsResponse = await axios.get(`${BACKEND_URL}/appointments/me`, {
        headers: {
        Authorization: `Bearer ${token}`,
        },
      });

      const appointments = appointmentsResponse.data;

      // Remove duplicate patient_ids from appointments
      const uniquePatientIds = Array.from(
        new Set<string>(appointments.map((appointment: any) => appointment.patient_id))
      ) as string[];

      const patientPromises = uniquePatientIds.map(async (patientId: string) => {
        const patientResponse = await axios.get(`${BACKEND_URL}/patients/${patientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        });
        return {
        id: patientId,
        name: patientResponse.data.full_name,
        };
      });

      const patientsList = await Promise.all(patientPromises);
      setPatients(patientsList);
      } catch (err) {
      console.error('Failed to fetch patients:', err);
      setError('Failed to load patients.');
      }
    };

    const fetchDoctorDetails = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${BACKEND_URL}/users/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDoctorId(response.data.user_id);
      } catch (err) {
        console.error('Failed to fetch doctor details:', err);
      }
    };

    fetchPatients();
    fetchDoctorDetails();
  }, []);

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
    try {
      const emrData = {
        patient_id: selectedPatientId,
        doctor_id: doctorId,
        in_diagnosis: formData.in_diagnosis,
        doctor_notes: formData.doctor_notes,
        prescription: JSON.stringify(formData.prescription),
        reason_in: formData.reason_in,
        treatment_process: formData.treatment_process,
      };

      const response = await axios.post(`${BACKEND_URL}/medical_reports`, emrData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      setSuccess('EMR saved successfully!');
      setFormData({
        in_diagnosis: '',
        doctor_notes: '',
        prescription: [],
        reason_in: '',
        treatment_process: '',
      });
      setStep(1); // Reset to the patient selection step
    } catch (err) {
      console.error('Error saving EMR:', err);
      setError('Failed to save EMR. Please try again.');
    }
  };

  return (
    <div className="create-emr-container">
      <h1 className="title">Create EMR</h1>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      {/* Step 1: Patient Selection */}
      {step === 1 && (
        <div className="patient-selection">
          <h2 className="subtitle">Select a Patient</h2>

          {patients.length === 0 && !error ? (
            <p className="loading">Loading...</p>
            ) : patients.length > 0 ? (
            <ul className="patient-list">
              {patients.map((patient) => (
                <li key={patient.id}>
                  <button
                    className="patient-button"
                    onClick={() => handlePatientSelect(patient.id)}
                  >
                    {patient.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-patients">No patients available.</p>
          )}
        </div>
      )}

      {/* Step 2: EMR Creation Form */}
      {step === 2 && (
        <div className="emr-form">
          <div className="form-group">
            <label htmlFor="reason_in">Reason for Admission:</label>
            <textarea
              id="reason_in"
              name="reason_in"
              value={formData.reason_in}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="doctor_notes">Consultation Notes:</label>
            <textarea
              id="doctor_notes"
              name="doctor_notes"
              value={formData.doctor_notes}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="in_diagnosis">Diagnosis:</label>
            <input
              type="text"
              id="in_diagnosis"
              name="in_diagnosis"
              value={formData.in_diagnosis}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="treatment_process">Treatment Process:</label>
            <textarea
              id="treatment_process"
              name="treatment_process"
              value={formData.treatment_process}
              onChange={handleChange}
              required
            />
          </div>
          <button onClick={() => setStep(3)}>Add Prescription</button>
        </div>
      )}

      {/* Step 3: Prescription Entry */}
      {step === 3 && (
        <div className="prescription-form">
          <h2>Prescription</h2>
          <div className="form-group">
            <label htmlFor="newMedication">Medication:</label>
            <input
              type="text"
              id="newMedication"
              value={newMedication}
              onChange={(e) => setNewMedication(e.target.value)}
            />
            <button onClick={handleAddMedication}>Add Medication</button>
          </div>
          <ul className="medication-list">
            {formData.prescription.map((med, index) => (
              <li key={index}>
                <strong>{med.name}</strong>
                <div>
                  <label>Dosage:</label>
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
                  />
                </div>
                <div>
                  <label>Quantity:</label>
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
                  />
                </div>
                <div>
                  <label>Instructions:</label>
                  <textarea
                    value={med.instructions}
                    onChange={(e) =>
                      setFormData((prev) => {
                        const updatedPrescription = [...prev.prescription];
                        updatedPrescription[index].instructions = e.target.value;
                        return { ...prev, prescription: updatedPrescription };
                      })
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
          <button onClick={() => setStep(4)}>Review EMR</button>
        </div>
      )}

      {/* Step 4: Review EMR */}
      {step === 4 && (
        <div className="review-emr">
          <h2>Review EMR</h2>
          <p>
            <strong>Consultation Notes:</strong> {formData.doctor_notes}
          </p>
          <p>
            <strong>Diagnosis:</strong> {formData.in_diagnosis}
          </p>
          <p>
            <strong>Treatment Process:</strong> {formData.treatment_process}
          </p>
          <h3>Prescription:</h3>
          <ul>
            {formData.prescription.map((med, index) => (
              <li key={index}>
                <strong>{med.name}</strong> - Dosage: {med.dosage}, Quantity: {med.quantity}, Instructions: {med.instructions}
              </li>
            ))}
          </ul>
          <button onClick={handleSaveEMR}>Save EMR</button>
          <button onClick={handleCancel}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default CreateEMR;