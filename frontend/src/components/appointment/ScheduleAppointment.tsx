import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './scheduleAppointment.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

type Patient = {
  patient_id: number;
  full_name: string;
  date_of_birth?: string;
  phone?: string;
  email?: string;
};

type Doctor = {
  doctor_id: number;
  doctor_name: string;
  major: string;
  hospital_id: number;
};

type FormData = {
  patientId: number | null;
  doctorId: number | null;
  date: string;
  time: string;
  reason: string;
};

const ScheduleAppointment: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormData>({
    patientId: null,
    doctorId: null,
    date: '',
    time: '',
    reason: '',
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

  // Fetch patients and doctors on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        // Fetch patients
        const patientsResponse = await axios.get(`${BACKEND_URL}/patients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPatients(patientsResponse.data);
        setFilteredPatients(patientsResponse.data);

        // Fetch doctors
        const doctorsResponse = await axios.get(`${BACKEND_URL}/doctors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDoctors(doctorsResponse.data);
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
        setError('Failed to load patients and doctors.');
      }
    };

    fetchData();
  }, []);

  // Filter patients based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter(patient =>
        patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.phone && patient.phone.includes(searchTerm)) ||
        (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchTerm, patients]);

  // Fetch available slots when patient, doctor, and date are selected
  const fetchAvailableSlots = async () => {
    if (!formData.date) {
      setError('Please select a date first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${BACKEND_URL}/appointments/available`, {
        params: { day: formData.date },
      });

      let slots = response.data;

      // Filter by selected doctor if specified
      if (formData.doctorId) {
        slots = slots.filter((slot: any) =>
          slot.available_doctors.some((doc: any) => doc.doctor_id === formData.doctorId)
        );
      }

      setAvailableSlots(slots);
      setStep(3);
    } catch (err) {
      console.error('Failed to fetch available slots:', err);
      setError('Failed to fetch available time slots.');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setFormData({ ...formData, patientId: patient.patient_id });
    setStep(2);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'doctorId' || name === 'patientId' ? 
      (value === '' ? null : parseInt(value)) : value });
  };

  const handleSlotSelect = (slot: any, doctorId: number) => {
    const [date, time] = slot.datetime.split('T');
    setFormData({
      ...formData,
      date,
      time: time.slice(0, 5),
      doctorId,
    });
    setStep(4);
  };

  const handleSubmit = async () => {
    if (!formData.patientId || !formData.doctorId || !formData.date || !formData.time || !formData.reason) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      const payload = {
        patient_id: formData.patientId,
        doctor_id: formData.doctorId,
        appointment_day: formData.date,
        appointment_time: formData.time,
        reason: formData.reason,
      };

      await axios.post(`${BACKEND_URL}/appointments/book`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess('Appointment scheduled successfully!');
      toast.success('Appointment scheduled successfully!');
      
      // Reset form
      setFormData({
        patientId: null,
        doctorId: null,
        date: '',
        time: '',
        reason: '',
      });
      setStep(1);
      setSearchTerm('');
    } catch (err) {
      console.error('Failed to schedule appointment:', err);
      setError('Failed to schedule appointment. Please try again.');
      toast.error('Failed to schedule appointment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="schedule-appointment">
      <h1>Schedule Appointment</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Step 1: Select Patient */}
      {step === 1 && (
        <div className="step-container">
          <h2>Step 1: Select Patient</h2>
          
          <div className="search-section">
            <input
              type="text"
              placeholder="Search patients by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="patients-grid">
            {filteredPatients.length === 0 ? (
              <p>No patients found.</p>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient.patient_id}
                  className="patient-card"
                  onClick={() => handlePatientSelect(patient)}
                >
                  <h3>{patient.full_name}</h3>
                  <p>ID: {patient.patient_id}</p>
                  {patient.phone && <p>Phone: {patient.phone}</p>}
                  {patient.email && <p>Email: {patient.email}</p>}
                  {patient.date_of_birth && <p>DOB: {patient.date_of_birth}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Step 2: Select Doctor and Date */}
      {step === 2 && (
        <div className="step-container">
          <h2>Step 2: Select Doctor and Date</h2>
          
          <div className="selected-patient-info">
            <h3>Selected Patient:</h3>
            <p>{patients.find(p => p.patient_id === formData.patientId)?.full_name}</p>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label>Doctor (Optional - leave blank for any available doctor)</label>
              <select
                name="doctorId"
                value={formData.doctorId || ''}
                onChange={handleFormChange}
              >
                <option value="">Any Doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.doctor_id} value={doctor.doctor_id}>
                    {doctor.doctor_name} - {doctor.major}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleFormChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-buttons">
              <button onClick={fetchAvailableSlots} disabled={loading || !formData.date}>
                {loading ? 'Loading...' : 'Find Available Slots'}
              </button>
              <button onClick={() => setStep(1)} className="back-button">
                ← Back to Patient Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Select Time Slot */}
      {step === 3 && (
        <div className="step-container">
          <h2>Step 3: Select Time Slot</h2>
          
          <div className="appointment-info">
            <p><strong>Patient:</strong> {patients.find(p => p.patient_id === formData.patientId)?.full_name}</p>
            <p><strong>Date:</strong> {formData.date}</p>
            {formData.doctorId && (
              <p><strong>Preferred Doctor:</strong> {doctors.find(d => d.doctor_id === formData.doctorId)?.doctor_name}</p>
            )}
          </div>

          {availableSlots.length === 0 ? (
            <div className="no-slots">
              <p>No available slots for the selected date and doctor.</p>
              <button onClick={() => setStep(2)} className="back-button">
                ← Try Different Date/Doctor
              </button>
            </div>
          ) : (
            <div className="slots-section">
              {availableSlots.map((slot) => (
                <div key={slot.datetime} className="time-slot">
                  <h4>{slot.datetime.split('T')[1].slice(0, 5)}</h4>
                  <div className="available-doctors">
                    {slot.available_doctors
                      .filter((doc: any) => !formData.doctorId || doc.doctor_id === formData.doctorId)
                      .map((doctor: any) => (
                        <button
                          key={doctor.doctor_id}
                          className="doctor-slot-button"
                          onClick={() => handleSlotSelect(slot, doctor.doctor_id)}
                        >
                          Dr. {doctor.doctor_name}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
              
              <button onClick={() => setStep(2)} className="back-button">
                ← Back to Date Selection
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Confirm Appointment */}
      {step === 4 && (
        <div className="step-container">
          <h2>Step 4: Confirm Appointment</h2>
          
          <div className="confirmation-details">
            <p><strong>Patient:</strong> {patients.find(p => p.patient_id === formData.patientId)?.full_name}</p>
            <p><strong>Doctor:</strong> {doctors.find(d => d.doctor_id === formData.doctorId)?.doctor_name}</p>
            <p><strong>Date:</strong> {formData.date}</p>
            <p><strong>Time:</strong> {formData.time}</p>
          </div>

          <div className="form-group">
            <label>Reason for Visit *</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleFormChange}
              placeholder="Enter the reason for this appointment..."
              required
            />
          </div>

          <div className="form-buttons">
            <button 
              onClick={handleSubmit} 
              disabled={loading || !formData.reason}
              className="confirm-button"
            >
              {loading ? 'Scheduling...' : 'Confirm Appointment'}
            </button>
            <button onClick={() => setStep(3)} className="back-button">
              ← Back to Time Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleAppointment;
