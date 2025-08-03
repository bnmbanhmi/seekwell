// pages/Dashboard.tsx
import React from 'react';

import { Routes, Route } from 'react-router-dom';

import {UserRole} from '../types/UserType'; // Adjust the import path as necessary

import BaseDashboard from '../components/layout/BaseDashboard';
import DoctorDashboard from '../components/dashboards/DoctorDashboard';
import PatientDashboard from '../components/dashboards/PatientDashboard';
import CadreDashboard from '../components/dashboards/OfficialDashboard';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import UserManagement from '../components/admin/UserManagement';
import ReportsAnalytics from '../components/admin/ReportsAnalytics';
import AISkinAnalysisPage from './AISkinAnalysisPage';
import AnalysisHistory from '../components/patients/AnalysisHistory';

type Props = {
  role: UserRole;
};

/**
 * Dashboard component renders the appropriate dashboard layout
 * based on the user's role. It supports roles such as 'doctor', 'patient',
 * 'staff', and 'admin'.
 */
const Dashboard: React.FC<Props> = ({ role }) => {
  const renderDashboard = () => {
    const dashboardMap: Record<Props['role'], React.ReactNode> = {
      DOCTOR: <DoctorDashboard />,
      PATIENT: <PatientDashboard />,
      OFFICIAL: <CadreDashboard />,
      ADMIN: <AdminDashboard />,
    };

    if (!dashboardMap[role]) {
      console.warn(`Unsupported role encountered: ${role}`);
      return null;
    }

    return dashboardMap[role];
  };

  return (
    <BaseDashboard role={role}>
      <Routes>
        <Route path="/" element={renderDashboard()} />
        
        {/* Admin Routes */}
        <Route path="users" element={<UserManagement />} />
        <Route path="reports" element={<ReportsAnalytics />} />

        {/* Patient Routes */}
        <Route path="ai-analysis" element={<AISkinAnalysisPage />} />
        <Route path="analysis-history" element={<AnalysisHistory />} />

        {/* Official Routes */}
        {/* <Route path="patient-monitoring" element={<PatientMonitoring />} /> */}
        
        {/* Doctor Routes */}
        {/* <Route path="urgent-cases" element={<UrgentCases />} /> */}

      </Routes>
    </BaseDashboard>
  );
};

export default Dashboard;
