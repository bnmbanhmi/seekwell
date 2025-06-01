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
    <nav className="p-6 space-y-4">
      <h2 className="text-lg font-semibold text-blue-700 mb-4">Navigation</h2>
      <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.label}>
            <Link
              to={item.path}
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition font-medium"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Sidebar;