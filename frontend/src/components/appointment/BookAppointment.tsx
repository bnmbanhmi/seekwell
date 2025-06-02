import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './bookAppointment.css'; // Assuming you have a CSS file for styling

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

const BookAppointment: React.FC = () => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    doctorId: '',
    reason: '',
  });
  const [doctors, setDoctors] = useState([]);
  type Slot = {
    id: string;
    date: string;
    time: string;
    doctorName: string;
    doctorId?: string;
  };
  
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [filters, setFilters] = useState({ service: '', dateFrom: '', dateTo: '', doctorId: '' });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch available doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/doctors`);
        setDoctors(response.data);
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
      const response = await axios.get(`${BACKEND_URL}/appointments/available`, {
        params: filters,
      });
      setSlots(response.data);
      setStep(2);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
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
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${BACKEND_URL}/appointments/book`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccess('Appointment booked successfully!');
      setFormData({ date: '', time: '', doctorId: '', reason: '' });
      setStep(4);
    } catch (err) {
      console.error('Failed to book appointment:', err);
      setError('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <label>Doctor (Optional)</label>
            <select
              name="doctorId"
              value={filters.doctorId}
              onChange={(e) => setFilters({ ...filters, doctorId: e.target.value })}
            >
              <option value="">Any</option>
              {doctors.map((doc: any) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
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
          {slots.length === 0 ? (
            <p>No slots available for the selected filters.</p>
          ) : (
            slots.map((slot: any) => (
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
              setFormData({ date: '', time: '', doctorId: '', reason: '' });
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