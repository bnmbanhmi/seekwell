import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      {
        id: 'dashboard',
        label: t('mobileNav.dashboard'),
        icon: '',
        path: '/dashboard',
        roles: ['PATIENT', 'DOCTOR', 'OFFICIAL', 'ADMIN']
      }
    ];

    const roleSpecificItems: Record<string, NavigationItem[]> = {
      PATIENT: [
        {
          id: 'skin-capture',
          label: t('mobileNav.skinCheck'),
          icon: '',
          path: '/dashboard/skin-capture',
          featured: true
        },
        {
          id: 'assessments',
          label: t('mobileNav.history'),
          icon: '',
          path: '/dashboard/skin-assessments'
        },
        {
          id: 'appointments',
          label: t('mobileNav.appointments'),
          icon: '',
          path: '/dashboard/appointments'
        },
        {
          id: 'chat',
          label: t('mobileNav.aiChat'),
          icon: '',
          path: '/dashboard/chat'
        }
      ],
      DOCTOR: [
        {
          id: 'patients',
          label: t('mobileNav.patients'),
          icon: '',
          path: '/dashboard/patients'
        },
        {
          id: 'consultations',
          label: t('mobileNav.reviews'),
          icon: '',
          path: '/dashboard/consultations'
        },
        {
          id: 'appointments',
          label: t('mobileNav.schedule'),
          icon: '',
          path: '/dashboard/appointments'
        },
        {
          id: 'reports',
          label: t('mobileNav.reports'),
          icon: '',
          path: '/dashboard/reports'
        }
      ],
      OFFICIAL: [
        {
          id: 'reviews',
          label: t('mobileNav.reviews'),
          icon: '',
          path: '/dashboard/reviews'
        },
        {
          id: 'patients',
          label: t('mobileNav.patients'),
          icon: '',
          path: '/dashboard/patients'
        },
        {
          id: 'escalations',
          label: t('mobileNav.escalate'),
          icon: '',
          path: '/dashboard/escalations'
        },
        {
          id: 'community',
          label: t('mobileNav.community'),
          icon: '',
          path: '/dashboard/community'
        }
      ],
      ADMIN: [
        {
          id: 'users',
          label: t('mobileNav.users'),
          icon: '',
          path: '/dashboard/users'
        },
        {
          id: 'analytics',
          label: t('mobileNav.analytics'),
          icon: '',
          path: '/dashboard/analytics'
        },
        {
          id: 'settings',
          label: t('mobileNav.settings'),
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
      alert(t('mobileNav.skinCaptureComingSoon'));
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
