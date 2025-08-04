import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './MobileNavigation.module.css';

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles?: string[];
  featured?: boolean;
}

interface MobileNavigationProps {
  userRole: 'PATIENT' | 'DOCTOR' | 'OFFICIAL' | 'ADMIN';
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: '',
        path: '/dashboard',
        roles: ['PATIENT', 'DOCTOR', 'OFFICIAL', 'ADMIN']
      }
    ];

    const roleSpecificItems: Record<string, NavigationItem[]> = {
      PATIENT: [
        {
          id: 'skin-capture',
          label: 'Skin Check',
          icon: '',
          path: '/dashboard/skin-capture',
          featured: true
        },
        {
          id: 'assessments',
          label: 'History',
          icon: '',
          path: '/dashboard/skin-assessments'
        },
        {
          id: 'appointments',
          label: 'Appointments',
          icon: '',
          path: '/dashboard/appointments'
        },
        {
          id: 'chat',
          label: 'AI Chat',
          icon: '',
          path: '/dashboard/chat'
        }
      ],
      DOCTOR: [
        {
          id: 'patients',
          label: 'Patients',
          icon: '',
          path: '/dashboard/patients'
        },
        {
          id: 'consultations',
          label: 'Reviews',
          icon: '',
          path: '/dashboard/consultations'
        },
        {
          id: 'appointments',
          label: 'Schedule',
          icon: '',
          path: '/dashboard/appointments'
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: '',
          path: '/dashboard/reports'
        }
      ],
      OFFICIAL: [
        {
          id: 'reviews',
          label: 'Reviews',
          icon: '',
          path: '/dashboard/reviews'
        },
        {
          id: 'patients',
          label: 'Patients',
          icon: '',
          path: '/dashboard/patients'
        },
        {
          id: 'escalations',
          label: 'Escalate',
          icon: '',
          path: '/dashboard/escalations'
        },
        {
          id: 'community',
          label: 'Community',
          icon: '',
          path: '/dashboard/community'
        }
      ],
      ADMIN: [
        {
          id: 'users',
          label: 'Users',
          icon: '',
          path: '/dashboard/users'
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: '',
          path: '/dashboard/analytics'
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: '',
          path: '/dashboard/settings'
        }
      ]
    };

    return [...baseItems, ...roleSpecificItems[userRole]];
  };

  const navigationItems = getNavigationItems();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavigation = (path: string, item: any) => {
    // Add haptic feedback simulation
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // For skin capture, show coming soon for now
    if (item.id === 'skin-capture') {
      alert('🚀 Skin Lesion Capture coming in Phase 4!\n\nThis will include:\n• Camera integration\n• AI analysis\n• Body region selection\n• Risk assessment');
      return;
    }
    
    navigate(path);
  };

  return (
    <nav className={`${styles.mobileNav} safe-area-bottom`}>
      {navigationItems.map((item) => (
        <button
          key={item.id}
          className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''} ${item.featured ? styles.featured : ''} touch-target haptic-light`}
          onClick={() => handleNavigation(item.path, item)}
          aria-label={item.label}
        >
          <span className={styles.navLabel}>
            {item.label}
          </span>
          {item.featured && (
            <div className={styles.featuredIndicator}></div>
          )}
        </button>
      ))}
    </nav>
  );
};

export default MobileNavigation;
