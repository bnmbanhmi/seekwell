import React, { useState, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs from 'dayjs';
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

  const filteredAppointments = appointments.filter((appointment) =>
    dayjs(appointment.appointment_day).isSame(selectedDate, 'day')
  );

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className="appointments-container">
            <h1 className="appointments-header">Upcoming Appointments</h1>
            <DateCalendar
            value={selectedDate}
            onChange={(newValue) => {
              if (newValue) setSelectedDate(newValue);
            }}
            views={['year', 'month', 'day']}
            />
            {filteredAppointments.length > 0 ? (
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
                    <tr key={appointment.appointment_id}>
                    <td>{appointment.appointment_time}</td>
                    <td>{appointment.doctorName}</td>
                    <td>{appointment.reason}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            ) : (
            <p>No appointments on this day.</p>
            )}
        </div>
        </LocalizationProvider>
  );
};
export default ViewAppointment;