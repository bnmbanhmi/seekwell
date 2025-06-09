import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from './ScheduleSettings.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
}

interface DaySettings {
  dayOfWeek: string;
  isEnabled: boolean;
  timeSlots: TimeSlot[];
}

interface Doctor {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
}

interface ClinicSettings {
  appointmentDuration: number; // in minutes
  bufferTime: number; // buffer between appointments in minutes
  advanceBookingDays: number; // how many days in advance can appointments be booked
  maxAppointmentsPerDay: number;
  allowWeekendAppointments: boolean;
  holidayDates: string[]; // array of holiday dates in YYYY-MM-DD format
}

const ScheduleSettings: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<DaySettings[]>([]);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>({
    appointmentDuration: 30,
    bufferTime: 5,
    advanceBookingDays: 30,
    maxAppointmentsPerDay: 20,
    allowWeekendAppointments: false,
    holidayDates: []
  });
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  useEffect(() => {
    fetchDoctors();
    loadClinicSettings();
    initializeWeeklySchedule();
  }, []);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BACKEND_URL}/users/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const doctorUsers = response.data.filter((user: any) => user.role === 'DOCTOR');
      setDoctors(doctorUsers);
      
      if (doctorUsers.length > 0) {
        setSelectedDoctor(doctorUsers[0].user_id);
      }
    } catch (err: any) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const loadClinicSettings = () => {
    // In a real application, this would load from the backend
    // For now, we'll use localStorage or default values
    const savedSettings = localStorage.getItem('clinicSettings');
    if (savedSettings) {
      setClinicSettings(JSON.parse(savedSettings));
    }
  };

  const initializeWeeklySchedule = () => {
    const defaultSchedule: DaySettings[] = daysOfWeek.map(day => ({
      dayOfWeek: day,
      isEnabled: !['Saturday', 'Sunday'].includes(day),
      timeSlots: [
        {
          id: `${day}-morning`,
          startTime: '09:00',
          endTime: '12:00',
          isEnabled: true
        },
        {
          id: `${day}-afternoon`,
          startTime: '14:00',
          endTime: '17:00',
          isEnabled: true
        }
      ]
    }));
    
    setWeeklySchedule(defaultSchedule);
  };

  const updateDayEnabled = (dayIndex: number, enabled: boolean) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[dayIndex].isEnabled = enabled;
    setWeeklySchedule(newSchedule);
  };

  const updateTimeSlot = (dayIndex: number, slotIndex: number, updates: Partial<TimeSlot>) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[dayIndex].timeSlots[slotIndex] = {
      ...newSchedule[dayIndex].timeSlots[slotIndex],
      ...updates
    };
    setWeeklySchedule(newSchedule);
  };

  const addTimeSlot = (dayIndex: number) => {
    const newSchedule = [...weeklySchedule];
    const newSlot: TimeSlot = {
      id: `${newSchedule[dayIndex].dayOfWeek}-${Date.now()}`,
      startTime: '09:00',
      endTime: '10:00',
      isEnabled: true
    };
    newSchedule[dayIndex].timeSlots.push(newSlot);
    setWeeklySchedule(newSchedule);
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[dayIndex].timeSlots.splice(slotIndex, 1);
    setWeeklySchedule(newSchedule);
  };

  const updateClinicSettings = (updates: Partial<ClinicSettings>) => {
    setClinicSettings(prev => ({ ...prev, ...updates }));
  };

  const addHoliday = () => {
    if (newHolidayDate && !clinicSettings.holidayDates.includes(newHolidayDate)) {
      updateClinicSettings({
        holidayDates: [...clinicSettings.holidayDates, newHolidayDate].sort()
      });
      setNewHolidayDate('');
      toast.success('Holiday date added');
    }
  };

  const removeHoliday = (dateToRemove: string) => {
    updateClinicSettings({
      holidayDates: clinicSettings.holidayDates.filter(date => date !== dateToRemove)
    });
    toast.success('Holiday date removed');
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // In a real application, this would save to the backend
      // For now, we'll save to localStorage
      localStorage.setItem('clinicSettings', JSON.stringify(clinicSettings));
      localStorage.setItem('weeklySchedule', JSON.stringify(weeklySchedule));
      
      // If we have backend endpoints, we would save there:
      // const token = localStorage.getItem('accessToken');
      // await axios.post(`${BACKEND_URL}/admin/schedule-settings`, {
      //   doctorId: selectedDoctor,
      //   weeklySchedule,
      //   clinicSettings
      // }, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      
      toast.success('Settings saved successfully!');
    } catch (err: any) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      initializeWeeklySchedule();
      setClinicSettings({
        appointmentDuration: 30,
        bufferTime: 5,
        advanceBookingDays: 30,
        maxAppointmentsPerDay: 20,
        allowWeekendAppointments: false,
        holidayDates: []
      });
      toast.success('Settings reset to default values');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading schedule settings...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Schedule Settings</h2>
        <div className={styles.headerActions}>
          <button onClick={resetToDefault} className={styles.resetButton}>
            Reset to Default
          </button>
          <button 
            onClick={saveSettings} 
            disabled={saving}
            className={styles.saveButton}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* Doctor Selection */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Doctor Schedule Configuration</h3>
        <div className={styles.doctorSelection}>
          <label htmlFor="doctor-select">Select Doctor:</label>
          <select
            id="doctor-select"
            value={selectedDoctor || ''}
            onChange={(e) => setSelectedDoctor(Number(e.target.value))}
            className={styles.doctorSelect}
          >
            <option value="">Select a doctor...</option>
            {doctors.map(doctor => (
              <option key={doctor.user_id} value={doctor.user_id}>
                {doctor.full_name} ({doctor.username})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Weekly Schedule</h3>
        <div className={styles.weeklySchedule}>
          {weeklySchedule.map((day, dayIndex) => (
            <div key={day.dayOfWeek} className={styles.dayCard}>
              <div className={styles.dayHeader}>
                <div className={styles.dayTitle}>
                  <input
                    type="checkbox"
                    checked={day.isEnabled}
                    onChange={(e) => updateDayEnabled(dayIndex, e.target.checked)}
                    className={styles.dayCheckbox}
                  />
                  <span className={day.isEnabled ? styles.dayEnabled : styles.dayDisabled}>
                    {day.dayOfWeek}
                  </span>
                </div>
                {day.isEnabled && (
                  <button
                    onClick={() => addTimeSlot(dayIndex)}
                    className={styles.addSlotButton}
                  >
                    + Add Slot
                  </button>
                )}
              </div>
              
              {day.isEnabled && (
                <div className={styles.timeSlots}>
                  {day.timeSlots.map((slot, slotIndex) => (
                    <div key={slot.id} className={styles.timeSlot}>
                      <input
                        type="checkbox"
                        checked={slot.isEnabled}
                        onChange={(e) => updateTimeSlot(dayIndex, slotIndex, { isEnabled: e.target.checked })}
                        className={styles.slotCheckbox}
                      />
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateTimeSlot(dayIndex, slotIndex, { startTime: e.target.value })}
                        className={styles.timeInput}
                        disabled={!slot.isEnabled}
                      />
                      <span className={styles.timeSeparator}>to</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateTimeSlot(dayIndex, slotIndex, { endTime: e.target.value })}
                        className={styles.timeInput}
                        disabled={!slot.isEnabled}
                      />
                      <button
                        onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                        className={styles.removeSlotButton}
                        disabled={day.timeSlots.length <= 1}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Clinic Settings */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>General Clinic Settings</h3>
        <div className={styles.settingsGrid}>
          <div className={styles.settingItem}>
            <label htmlFor="appointment-duration">Appointment Duration (minutes):</label>
            <input
              id="appointment-duration"
              type="number"
              min="15"
              max="120"
              step="15"
              value={clinicSettings.appointmentDuration}
              onChange={(e) => updateClinicSettings({ appointmentDuration: Number(e.target.value) })}
              className={styles.settingInput}
            />
          </div>

          <div className={styles.settingItem}>
            <label htmlFor="buffer-time">Buffer Time Between Appointments (minutes):</label>
            <input
              id="buffer-time"
              type="number"
              min="0"
              max="30"
              step="5"
              value={clinicSettings.bufferTime}
              onChange={(e) => updateClinicSettings({ bufferTime: Number(e.target.value) })}
              className={styles.settingInput}
            />
          </div>

          <div className={styles.settingItem}>
            <label htmlFor="advance-booking">Advance Booking Days:</label>
            <input
              id="advance-booking"
              type="number"
              min="1"
              max="365"
              value={clinicSettings.advanceBookingDays}
              onChange={(e) => updateClinicSettings({ advanceBookingDays: Number(e.target.value) })}
              className={styles.settingInput}
            />
          </div>

          <div className={styles.settingItem}>
            <label htmlFor="max-appointments">Max Appointments Per Day:</label>
            <input
              id="max-appointments"
              type="number"
              min="1"
              max="100"
              value={clinicSettings.maxAppointmentsPerDay}
              onChange={(e) => updateClinicSettings({ maxAppointmentsPerDay: Number(e.target.value) })}
              className={styles.settingInput}
            />
          </div>

          <div className={styles.settingItem}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={clinicSettings.allowWeekendAppointments}
                onChange={(e) => updateClinicSettings({ allowWeekendAppointments: e.target.checked })}
                className={styles.settingCheckbox}
              />
              Allow Weekend Appointments
            </label>
          </div>
        </div>
      </div>

      {/* Holiday Management */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Holiday Management</h3>
        <div className={styles.holidaySection}>
          <div className={styles.addHoliday}>
            <input
              type="date"
              value={newHolidayDate}
              onChange={(e) => setNewHolidayDate(e.target.value)}
              className={styles.holidayInput}
            />
            <button onClick={addHoliday} className={styles.addHolidayButton}>
              Add Holiday
            </button>
          </div>
          
          <div className={styles.holidayList}>
            {clinicSettings.holidayDates.length === 0 ? (
              <p className={styles.noHolidays}>No holidays configured</p>
            ) : (
              clinicSettings.holidayDates.map(date => (
                <div key={date} className={styles.holidayItem}>
                  <span className={styles.holidayDate}>
                    {new Date(date).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => removeHoliday(date)}
                    className={styles.removeHolidayButton}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSettings;
