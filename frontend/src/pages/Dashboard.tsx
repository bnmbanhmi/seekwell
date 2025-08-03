// pages/Dashboard.tsx
import React from 'react';

import { Routes, Route } from 'react-router-dom';

import {UserRole} from '../types/UserType'; // Adjust the import path as necessary

import BaseDashboard from '../components/layout/BaseDashboard';
import DoctorDashboard from '../components/dashboards/DoctorDashboard';
import PatientDashboard from '../components/dashboards/PatientDashboard';
import StaffDashboard from '../components/dashboards/StaffDashboard';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import UserManagement from '../components/admin/UserManagement';
import ReportsAnalytics from '../components/admin/ReportsAnalytics';
import AISkinAnalysisPage from './AISkinAnalysisPage';
import MedicalHistory from '../components/medical/MedicalHistory'; // Keep for patient's history view

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
      LOCAL_CADRE: <StaffDashboard />,
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
        <Route path="analysis-history" element={<MedicalHistory />} />

        {/* Cadre Routes (to be refactored) */}
        {/* <Route path="patient-monitoring" element={<PatientMonitoring />} /> */}
        
        {/* Doctor Routes (to be refactored) */}
        {/* <Route path="urgent-cases" element={<UrgentCases />} /> */}

      </Routes>
    </BaseDashboard>
  );
};

export default Dashboard;
