import React, { useState, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { Badge, CircularProgress, Box, Modal } from '@mui/material';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';
import styles from './DoctorSchedule.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

type Appointment = {
  patient_id: number;
  doctor_id: number;
  appointment_time: string;
  appointment_day: string;
  reason: string;
  appointment_id: number;
  patientName?: string;
};

const DoctorSchedule = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const availableTimes = ['08:30', '09:30', '10:30', '13:30', '14:30', '15:30', '16:30']; // Predefined times

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${BACKEND_URL}/appointments`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const today = new Date().toISOString().split('T')[0];
        const upcomingAppointments = response.data.filter(
          (appointment: Appointment) => appointment.appointment_day >= today
        );

        const appointmentsWithPatientNames = await Promise.all(
          upcomingAppointments.map(async (appointment: Appointment) => {
            try {
              const patientResponse = await axios.get(`${BACKEND_URL}/patients/${appointment.patient_id}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              return {
                ...appointment,
                patientName: patientResponse.data.full_name, // Add patientName to the appointment
              };
            } catch (err) {
              console.error(`Failed to fetch patient name for patient_id ${appointment.patient_id}:`, err);
              return {
                ...appointment,
                patientName: 'Unknown Patient', // Fallback if patient name cannot be fetched
              };
            }
          })
        );

        appointmentsWithPatientNames.sort((a, b) => {
          const dateA = new Date(`${a.appointment_day}T${a.appointment_time}`);
          const dateB = new Date(`${b.appointment_day}T${b.appointment_time}`);
          return dateA.getTime() - dateB.getTime();
        });

        setAppointments(appointmentsWithPatientNames);
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
        setError('Failed to load appointments.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setModalOpen(true);
  };

  const filteredAppointments = appointments.filter((appointment) =>
      dayjs(appointment.appointment_day).isSame(selectedDate, 'day')
    );
  

  const appointmentDates = appointments.map((appointment) => appointment.appointment_day);

  const CustomDay = (props: PickersDayProps) => {
    const { day, outsideCurrentMonth, ...other } = props;
    const dateString = day.format('YYYY-MM-DD');
    const hasAppointment = appointmentDates.includes(dateString);

    return (
      <Badge
        key={dateString}
        overlap="circular"
        badgeContent={hasAppointment ? <span className={styles.appointmentDot} /> : undefined}
      >
        <PickersDay day={day} outsideCurrentMonth={outsideCurrentMonth} {...other} />
      </Badge>
    );
  };

  const isAppointmentNow = (appointment: Appointment) => {
    const now = dayjs();
    const appointmentStart = dayjs(`${appointment.appointment_day}T${appointment.appointment_time}`);
    const oneHourBefore = appointmentStart.subtract(1, 'hour');
    const oneHourAfter = appointmentStart.add(1, 'hour');
    return now.isAfter(oneHourBefore) && now.isBefore(oneHourAfter);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className={styles.appointmentsContainer}>
        <h1 className={styles.appointmentsHeader}>Doctor's Schedule</h1>

        {loading ? (
          <div className={styles.loadingSpinner}>
            <CircularProgress />
            <p>Loading...</p>
          </div>
        ) : (
          <DateCalendar
            value={selectedDate}
            onChange={(newValue) => {
              if (newValue) setSelectedDate(newValue);
            }}
            views={['year', 'month', 'day']}
            slots={{ day: CustomDay }}
          />
        )}

        {!loading && filteredAppointments.length > 0 ? (
          <table className={styles.appointmentsTable}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Patient</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr
                  key={appointment.appointment_id}
                  onClick={() => handleAppointmentClick(appointment)}
                  className={
                    isAppointmentNow(appointment) ? styles.currentAppointmentRow : styles.clickableRow
                  }
                >
                  <td>{appointment.appointment_time}</td>
                  <td>{appointment.patientName}</td>
                  <td>{appointment.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading && <p className={styles.noAppointments}>No appointments on this day.</p>
        )}

        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <Box className={styles.appointmentModal}>
            <h2>Appointment Actions</h2>
            {selectedAppointment && (
                <>
                  <p><strong>Doctor:</strong> {selectedAppointment.patientName}</p>
                  <p><strong>Date:</strong> {selectedAppointment.appointment_day}</p>
                  <p><strong>Time:</strong> {selectedAppointment.appointment_time}</p>

                  {error && (
                  <Box mt={2} color="error.main">
                    <p style={{ color: 'red', margin: 0 }}>{error}</p>
                  </Box>
                  )}
                </>
            )}
          </Box>
        </Modal>
      </div>
    </LocalizationProvider>
  );
};

export default DoctorSchedule;