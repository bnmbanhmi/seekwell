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
    { label: 'Prescriptions', path: '/dashboard/prescriptions' },
    { label: 'Medical History', path: '/dashboard/records' },
  ],
  DOCTOR: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'AI Skin Analysis', path: '/dashboard/ai-analysis' },
    { label: 'Urgent Consultation', path: '/dashboard/appointments/high-risk' },
    { label: 'Community Health', path: '/dashboard/community-health' },
    { label: 'Analytics', path: '/dashboard/analytics' },
    { label: 'My Schedule', path: '/dashboard/schedule' },
    { label: 'Patient List', path: '/dashboard/patients' },
    { label: 'Medical Records', path: '/dashboard/records' },
    { label: 'Create New Record', path: '/dashboard/create_records' },
    { label: 'Health Records', path: '/dashboard/community-emr' },
  ],
  LOCAL_CADRE: [
    { label: 'Bridge Dashboard', path: '/dashboard' },
    { label: 'Bridge AI to Care', path: '/dashboard/ai-analysis' },
    { label: 'Cultural Guidance', path: '/dashboard/cultural-guidance' },
    { label: 'Doctor-Community Bridge', path: '/dashboard/doctor-bridge' },
    { label: 'First Mile Coordination', path: '/dashboard/care-coordination' },
    { label: 'Community Health', path: '/dashboard/community-health' },
    { label: 'Mobile Interface', path: '/dashboard/mobile-chw' },
    { label: 'Analytics', path: '/dashboard/analytics' },
    { label: 'Community Members', path: '/dashboard/patients' },
  ],
  ADMIN: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'AI Skin Analysis', path: '/dashboard/ai-analysis' },
    { label: 'Analytics', path: '/dashboard/analytics' },
    { label: 'Phase 3 Integration', path: '/dashboard/phase3-integration' },
    { label: 'User Management', path: '/dashboard/users' },
    { label: 'Schedule Settings', path: '/dashboard/schedule-settings' },
    { label: 'Reports & Analytics', path: '/dashboard/reports' },
    { label: 'System Logs', path: '/dashboard/logs' },
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