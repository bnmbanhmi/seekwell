// components/dashboardLayout/Sidebar.tsx
import React from 'react';
// import Link from 'next/link';
import { Link } from 'react-router-dom'; // Correct import

import { UserRole } from '../../types/UserType'; // Adjust the import path as necessary

type Props = {
  role: UserRole;
};

const sidebarItems: Record<Props['role'], { label: string; path: string }[]> = {
  PATIENT: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Book Appointment', path: '/appointments/book' },
    { label: 'My Appointments', path: '/appointments' },
    { label: 'Prescriptions', path: '/prescriptions' },
    { label: 'Medical History', path: '/records' },
  ],
  DOCTOR: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'My Schedule', path: '/schedule' },
    { label: 'Patient List', path: '/patients' },
    { label: 'Medical Records', path: '/records' },
  ],
  CLINIC_STAFF: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Schedule Appointment', path: '/appointments/schedule' },
    { label: 'Check-in / Check-out', path: '/checkin' },
    { label: 'Billing & Invoices', path: '/billing' },
    { label: 'Patient Registry', path: '/patients' },
    { label: 'Messages', path: '/messages' },
  ],
  ADMIN: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'User Management', path: '/users' },
    { label: 'Schedule Settings', path: '/schedule/settings' },
    { label: 'Reports & Analytics', path: '/reports' },
    { label: 'System Logs', path: '/logs' },
    { label: 'Billing Overview', path: '/billing/overview' },
  ],
};

const Sidebar: React.FC<Props> = ({ role }) => {
  const items = sidebarItems[role];

  return (
    <nav className="nav-container">
      <h2 className="nav-title">Navigation</h2>
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