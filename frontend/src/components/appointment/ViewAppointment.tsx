import React, { useState, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { Badge, CircularProgress, Modal, Box, Button, TextField } from '@mui/material';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi'; // Import Vietnamese locale
import axios from 'axios';
import './viewAppointment.css'; // Import the CSS file for styling

type Appointment = {
  patient_id: number;
  doctor_id: number;
  appointment_time: string;
  appointment_day: string;
  reason: string;
  appointment_id: number;
  doctorName?: string;
};

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

const ViewAppointment = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [showRescheduleFields, setShowRescheduleFields] = useState(false);


  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${BACKEND_URL}/appointments/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const today = new Date().toISOString().split('T')[0];
        const upcomingAppointments = response.data.filter(
          (appointment: Appointment) => appointment.appointment_day >= today
        );

        const appointmentsWithDoctorNames = await Promise.all(
          upcomingAppointments.map(async (appointment: Appointment) => {
            try {
              const doctorResponse = await axios.get(`${BACKEND_URL}/doctors/${appointment.doctor_id}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              return {
                ...appointment,
                doctorName: doctorResponse.data.doctor_name,
              };
            } catch (err) {
              console.error(`Failed to fetch doctor name for doctor_id ${appointment.doctor_id}:`, err);
              return {
                ...appointment,
                doctorName: 'Unknown Doctor',
              };
            }
          })
        );

        appointmentsWithDoctorNames.sort((a, b) => {
          const dateA = new Date(`${a.appointment_day}T${a.appointment_time}`);
          const dateB = new Date(`${b.appointment_day}T${b.appointment_time}`);
          return dateA.getTime() - dateB.getTime();
        });

        setAppointments(appointmentsWithDoctorNames);
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

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${BACKEND_URL}/appointments/${selectedAppointment.appointment_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAppointments((prev) =>
        prev.filter((appointment) => appointment.appointment_id !== selectedAppointment.appointment_id)
      );
      setModalOpen(false);
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      setError('Failed to cancel appointment.');
    }
  };

  const handleRescheduleAppointment = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(
        `${BACKEND_URL}/appointments/${selectedAppointment.appointment_id}`,
        {
          appointment_day: rescheduleDate,
          appointment_time: rescheduleTime,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.appointment_id === selectedAppointment.appointment_id
            ? { ...appointment, appointment_day: rescheduleDate, appointment_time: rescheduleTime }
            : appointment
        )
      );
      setModalOpen(false);
    } catch (err) {
      console.error('Failed to reschedule appointment:', err);
      setError('Failed to reschedule appointment.');
    }
  };

  const handleToggleReschedule = () => {
    setShowRescheduleFields((prev) => !prev);
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
        badgeContent={hasAppointment ? <span className="appointment-dot" /> : undefined}
      >
        <PickersDay day={day} outsideCurrentMonth={outsideCurrentMonth} {...other} />
      </Badge>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <div className="appointments-container">
        <h1 className="appointments-header">Upcoming Appointments</h1>

        {loading ? (
          <div className="loading-spinner">
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
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Doctor</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr
                  key={appointment.appointment_id}
                  onClick={() => handleAppointmentClick(appointment)}
                  className="clickable-row"
                >
                  <td>{appointment.appointment_time}</td>
                  <td>{appointment.doctorName}</td>
                  <td>{appointment.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading && <p>No appointments on this day.</p>
        )}

        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <Box className="appointment-modal">
            <h2>Appointment Actions</h2>
            {selectedAppointment && (
              <>
                <p><strong>Doctor:</strong> {selectedAppointment.doctorName}</p>
                <p><strong>Date:</strong> {selectedAppointment.appointment_day}</p>
                <p><strong>Time:</strong> {selectedAppointment.appointment_time}</p>

                <Box display="flex" alignItems="center" gap={2} mt={2}>
                  <Button variant="contained" color="error" onClick={handleCancelAppointment}>
                    Cancel Appointment
                  </Button>

                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleToggleReschedule}
                    sx={{ mt: 2 }}
                  >
                    {showRescheduleFields ? "Hide Reschedule" : "Reschedule"}
                  </Button>
                </Box>
                
                {showRescheduleFields && (
                  <div className="reschedule-section">
                    <TextField
                      label="New Date"
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      label="New Time"
                      type="time"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleRescheduleAppointment}
                    >
                      Confirm Reschedule
                    </Button>
                  </div>
                )}
              </>
            )}
          </Box>
        </Modal>

      </div>
    </LocalizationProvider>
  );
};

export default ViewAppointment;