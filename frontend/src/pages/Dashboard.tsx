import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserRole } from '../types/UserType';

import BaseDashboard from '../components/layout/BaseDashboard';
import DoctorDashboard from '../components/dashboards/DoctorDashboard';
import PatientDashboard from '../components/dashboards/PatientDashboard';
import StaffDashboard from '../components/dashboards/StaffDashboard';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import BookAppointment from '../components/appointment/BookAppointment';

type Props = {
  role: UserRole;
};

const Dashboard: React.FC<Props> = ({ role }) => {
  const renderInitialDashboard = () => {
    const dashboardMap: Record<Props['role'], React.ReactNode> = {
      DOCTOR: <DoctorDashboard />,
      PATIENT: <PatientDashboard />,
      CLINIC_STAFF: <StaffDashboard />,
      ADMIN: <AdminDashboard />,
    };

    if (!dashboardMap[role]) {
      console.warn(`Unsupported role encountered: ${role}`);
      return null;
    }

    return dashboardMap[role];
  };

  return (
    <Routes>
      {/* Wrap all routes inside BaseDashboard */}
      <Route
        path="/"
        element={<BaseDashboard role={role}>{renderInitialDashboard()}</BaseDashboard>}
      >
        {/* Nested routes */}
        <Route 
          path="/appointments/book" 
          element={<BaseDashboard role={role}><BookAppointment /></BaseDashboard>} 
      />
        {/* Add more nested routes as needed */}
      </Route>

      {/* Redirect unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default Dashboard;
