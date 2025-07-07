// components/dashboardLayout/Sidebar.tsx
import React from 'react';
// import Link from 'next/link';
import { Link } from 'react-router-dom'; // Correct import
import Logo from '../common/Logo';
import { UserRole } from '../../types/UserType'; // Adjust the import path as necessary

import './Sidebar.css'; // Assuming you have a CSS file for styles

type Props = {
  role: UserRole;
};

const sidebarItems: Record<Props['role'], { label: string; path: string }[]> = {
  PATIENT: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'AI Skin Analysis', path: '/dashboard/ai-analysis' },
    { label: 'Urgent Consultation', path: '/dashboard/appointments/high-risk' },
    { label: 'Book Appointment', path: '/dashboard/appointments/book' },
    { label: 'My Appointments', path: '/dashboard/appointments' },
    { label: 'Medical History', path: '/dashboard/records' },
  ],
  DOCTOR: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'My Schedule', path: '/dashboard/schedule' },
    { label: 'Patient List', path: '/dashboard/patients' },
    { label: 'Medical Records', path: '/dashboard/records' },
    { label: 'Create Consultation', path: '/dashboard/create_records' },
  ],
  LOCAL_CADRE: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Patient Alerts', path: '/dashboard/ai-analysis' },
    { label: 'Manage Patients', path: '/dashboard/patients' },
    { label: 'High-Risk Cases', path: '/dashboard/appointments/high-risk' },
  ],
  ADMIN: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'User Management', path: '/dashboard/users' },
    { label: 'Reports & Analytics', path: '/dashboard/reports' },
    { label: 'System Logs', path: '/dashboard/logs' },
    { label: 'Schedule Settings', path: '/dashboard/schedule-settings' },
  ],
};

const Sidebar: React.FC<Props> = ({ role }) => {
  const items = sidebarItems[role];

  return (
    <nav className="nav-container">
      <Logo
        className="nav-logo"
        alt="SeekWell Logo"
        height={40}
      />
      <h2 className="nav-title">Navigation</h2>

      <hr className="nav-divider" />

      <ul className="nav-list">
        {items.map((item) => (
          <li key={item.label}>
            <Link to={item.path} className="nav-link">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Sidebar;