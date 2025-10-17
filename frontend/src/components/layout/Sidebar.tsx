// components/dashboardLayout/Sidebar.tsx
import React from 'react';
// import Link from 'next/link';
import { Link } from 'react-router-dom'; // Correct import
import { useTranslation } from 'react-i18next';
import Logo from '../common/Logo';
import { UserRole } from '../../types/UserType'; // Adjust the import path as necessary

import './Sidebar.css'; // Assuming you have a CSS file for styles

type Props = {
  role: UserRole;
};

const Sidebar: React.FC<Props> = ({ role }) => {
  const { t } = useTranslation();
  
  const sidebarItems: Record<Props['role'], { labelKey: string; path: string }[]> = {
    PATIENT: [
      { labelKey: 'sidebar.dashboard', path: '/dashboard' },
      { labelKey: 'sidebar.aiSkinAnalysis', path: '/ai-analysis' },
      { labelKey: 'sidebar.analysisHistory', path: '/dashboard/analysis-history' },
      { labelKey: 'sidebar.profile', path: '/dashboard/profile' },
    ],
    DOCTOR: [
      { labelKey: 'sidebar.dashboard', path: '/dashboard' },
      { labelKey: 'sidebar.urgentCases', path: '/dashboard/urgent-cases' },
      { labelKey: 'sidebar.profile', path: '/dashboard/profile' },
    ],
    OFFICIAL: [
      { labelKey: 'sidebar.dashboard', path: '/dashboard' },
      { labelKey: 'sidebar.patientMonitoring', path: '/dashboard/patient-monitoring' },
      { labelKey: 'sidebar.urgentCases', path: '/dashboard/urgent-cases' },
      { labelKey: 'sidebar.profile', path: '/dashboard/profile' },
    ],
    ADMIN: [
      { labelKey: 'sidebar.dashboard', path: '/dashboard' },
      { labelKey: 'sidebar.userManagement', path: '/dashboard/users' },
      { labelKey: 'sidebar.analytics', path: '/dashboard/reports' },
      { labelKey: 'sidebar.profile', path: '/dashboard/profile' },
    ],
  };

  const items = sidebarItems[role];

  return (
    <nav className="nav-container">
      <Logo
        className="nav-logo"
        alt="SeekWell Logo"
        height={40}
      />
      <h2 className="nav-title">{t('sidebar.title')}</h2>

      <hr className="nav-divider" />

      <ul className="nav-list">
        {items.map((item) => (
          <li key={item.labelKey}>
            <Link to={item.path} className="nav-link">
              {t(item.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Sidebar;