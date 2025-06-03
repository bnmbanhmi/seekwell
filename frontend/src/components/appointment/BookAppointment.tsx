import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './bookAppointment.css'; // Assuming you have a CSS file for styling

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

const BookAppointment: React.FC = () => {
  type FormData = {
    date: string;
    time: string;
    doctorId: number | null;
    reason: string
  };
  const [formData, setFormData] = useState<FormData>({
    date: '',
    time: '',
    doctorId: null,
    reason: '',
  });
  type Doctor = {
  doctor_id: number;
  doctor_name: string;
  major: string;
  hospital_id: number;
};
const [doctors, setDoctors] = useState<Doctor[]>([]);
  type Slot = {
    id: string;
    date: string;
    time: string;
    doctorName: string;
    doctorId: number;
  };
  type Filters = {
  service: string;
  dateFrom: string;
  dateTo: string;
  doctorId: number | null;
};
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [filters, setFilters] = useState<Filters>({ service: '', dateFrom: '', dateTo: '', doctorId: null });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterByDoctor, setFilterByDoctor] = useState(false);

  // Fetch available doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/doctors`);
        setDoctors(response.data);
        console.log("Fetch doctors ok")
        console.log(response.data)
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
        setError('Could not fetch doctors.');
      }
    };

    fetchDoctors();
  }, []);

  // Fetch available slots based on filters
  const fetchAvailableSlots = async () => {
    setLoading(true);
    setError('');

    try {
      const dateFromString = new Date(filters.dateFrom).toISOString().split('T')[0]; // 'YYYY-MM-DD'
      const dateToString = new Date(filters.dateTo).toISOString().split('T')[0]; // 'YYYY-MM-DD'

      const response = await axios.get(`${BACKEND_URL}/appointments/available-range`, {
        params: {
          start_date: dateFromString,
          end_date: dateToString,
        },
      });

      console.log(response.data); // Inspect the response

      const slots: Slot[] = response.data.flatMap((slot: any) => {
        const [date, time] = slot.datetime.split('T');
        return slot.available_doctors.map((doctor: any) => ({
          id: `${slot.datetime}_${doctor.doctor_id}`, // Unique ID per doctor per slot
          date,
          time: time.slice(0, 5), // 'HH:mm'
          doctorName: doctor.doctor_name,
          doctorId: doctor.doctor_id,
        }));
      });

      setSlots(slots);
      setStep(2);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setError('Could not fetch available slots.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle appointment booking
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem("accessToken")
      const userIdStr = localStorage.getItem('user_id')
      const user_id = userIdStr ? Number(userIdStr) : null;  // convert string to number or null if not found
      const payload = {
        patient_id: user_id,
        appointment_day: formData.date,
        appointment_time: formData.time,
        doctor_id: formData.doctorId,
        reason: formData.reason,
      };
      console.log('Booking payload:', payload);
      const response = await axios.post(`${BACKEND_URL}/appointments/book`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccess('Appointment booked successfully!');
      setFormData({ date: '', time: '', doctorId: null, reason: '' }); //reset
      setStep(4);
    } catch (err) {
      console.error('Failed to book appointment:', err);
      setError('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSlot) {
      setFormData({
        date: selectedSlot.date,
        time: selectedSlot.time,
        doctorId: selectedSlot.doctorId, // or doctorId from selectedSlot if available
        reason: formData.reason, // keep existing reason
      });
    }
  }, [selectedSlot]);

  return (
    <div className="appointment-page">
      <h1>Book Your Appointment</h1>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      {/* Step 1: Filters */}
      {step === 1 && (
        <div className="filter-section">
          <div className="form-group">
            <label>Service Type</label>
            <select
              name="service"
              value={filters.service}
              onChange={(e) => setFilters({ ...filters, service: e.target.value })}
            >
              <option value="">Select Service</option>
              <option value="consultation">Consultation</option>
              <option value="checkup">Check-up</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date Range</label>
            <div className="date-range">
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Doctor that you prefer (Optional)</label>
            <select
              name="doctorId"
              value={filters.doctorId ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setFilters({
                  ...filters,
                  doctorId: value === '' ? null : parseInt(value, 10),
                });
              }}
            >
              <option key="any" value="">Any</option>
              {doctors.map((doc) => (
                <option key={doc.doctor_id} value={doc.doctor_id}>
                  {doc.doctor_name}
                </option>
              ))}
            </select>
          </div>

          <button onClick={fetchAvailableSlots} disabled={loading}>
            {loading ? 'Searching...' : 'Search Available Slots'}
          </button>
        </div>
      )}

      {/* Step 2: Available Slots */}
      {step === 2 && (
        <div className="slots-section">
          <h2>Available Time Slots</h2>

          {/* Checkbox to toggle filter by doctor */}
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={filterByDoctor}
                onChange={(e) => setFilterByDoctor(e.target.checked)}
                disabled={!filters.doctorId} // disable if no doctor selected
              />
              Show only slots that have your prefered doctor
            </label>
          </div>

          {slots.length === 0 ? (
            <p>No slots available for the selected filters.</p>
          ) : (
            // Filter slots based on filterByDoctor toggle
            slots
              .filter((slot) =>
                filterByDoctor && filters.doctorId
                  ? slot.doctorId === filters.doctorId
                  : true
              )
              .map((slot) => (
                <div
                  key={slot.id}
                  className="slot-card"
                  onClick={() => {
                    setSelectedSlot(slot);
                    setStep(3);
                  }}
                >
                  <p>
                    <strong>{slot.time}</strong> on {slot.date}
                  </p>
                  <p>Doctor: {slot.doctorName}</p>
                </div>
              ))
          )}
          <button onClick={() => setStep(1)}>← Back to Filters</button>
        </div>
      )}

      {/* Step 3: Confirm Appointment */}
      {step === 3 && selectedSlot && (
        <div className="confirmation-section">
          <h2>Confirm Your Appointment</h2>
          <p>
            <strong>Date:</strong> {selectedSlot.date}
          </p>
          <p>
            <strong>Time:</strong> {selectedSlot.time}
          </p>
          <p>
            <strong>Doctor:</strong> {selectedSlot.doctorName}
          </p>
          <div className="form-group">
            <label>Reason for Visit</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
            />
          </div>
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
          <button onClick={() => setStep(2)}>← Back to Slots</button>
        </div>
      )}

      {/* Step 4: Success Message */}
      {step === 4 && success && (
        <div className="success-message">
          <h2>✅ Appointment Booked!</h2>
          <p>{success}</p>
          <button
            onClick={() => {
              setStep(1);
              setSelectedSlot(null);
              setFormData({ date: '', time: '', doctorId: null, reason: '' });
              setSuccess('');
            }}
          >
            Book Another Appointment
          </button>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;