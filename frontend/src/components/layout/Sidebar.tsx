// components/dashboardLayout/Sidebar.tsx
import React from 'react';
// import Link from 'next/link';
import { Link } from 'react-router-dom'; // Correct import

import { UserRole } from '../../types/UserType'; // Adjust the import path as necessary

import './Sidebar.css'; // Assuming you have a CSS file for styles

type Props = {
  role: UserRole;
};

const sidebarItems: Record<Props['role'], { label: string; path: string }[]> = {
  PATIENT: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Book Appointment', path: '/dashboard/appointments/book' },
    { label: 'My Appointments', path: '/dashboard/appointments' },
    { label: 'Prescriptions', path: '/dashboard/prescriptions' },
    { label: 'Medical History', path: '/dashboard/records' },
  ],
  DOCTOR: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'My Schedule', path: '/dashboard/schedule' },
    { label: 'Patient List', path: '/dashboard/patients' },
    { label: 'Medical Records', path: '/dashboard/records' },
    { label: 'Create Records', path: '/dashboard/create_records' },
  ],
  CLINIC_STAFF: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Schedule Appointment', path: '/dashboard/appointments/schedule' },
    { label: 'Check-in / Check-out', path: '/dashboard/checkin' },
    { label: 'Billing & Invoices', path: '/dashboard/billing' },
    { label: 'Patient Registry', path: '/dashboard/patients' },
    { label: 'Messages', path: '/dashboard/messages' },
  ],
  ADMIN: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'User Management', path: '/dashboard/users' },
    { label: 'Schedule Settings', path: '/dashboard/schedule/settings' },
    { label: 'Reports & Analytics', path: '/dashboard/reports' },
    { label: 'System Logs', path: '/dashboard/logs' },
    { label: 'Billing Overview', path: '/dashboard/billing/overview' },
  ],
};

const Sidebar: React.FC<Props> = ({ role }) => {
  const items = sidebarItems[role];

  return (
    <nav className="nav-container">
      <img
        src="/logo.png"
        alt="Clinic Logo"
        className="nav-logo"
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