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
    { label: 'Analysis History', path: '/dashboard/analysis-history' },
    { label: 'Profile', path: '/dashboard/profile' },
  ],
  DOCTOR: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Urgent Cases', path: '/dashboard/urgent-cases' },
    { label: 'Profile', path: '/dashboard/profile' },
  ],
  OFFICIAL: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Patient Monitoring', path: '/dashboard/patient-monitoring' },
    { label: 'Urgent Cases', path: '/dashboard/urgent-cases' },
    { label: 'Profile', path: '/dashboard/profile' },
  ],
  ADMIN: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'User Management', path: '/dashboard/users' },
    { label: 'Analytics', path: '/dashboard/reports' },
    { label: 'Profile', path: '/dashboard/profile' },
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