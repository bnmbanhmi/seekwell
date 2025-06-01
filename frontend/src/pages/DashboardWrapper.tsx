import React from 'react';
import Dashboard from './Dashboard';
import { UserRole } from '../types/UserType'; // Import UserRole type

const DashboardWrapper = () => {
  const [role, setRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
  }, []); // Runs on mount

  if (!role) return <div>Loading...</div>; // Prevent rendering with null role

  return <Dashboard role={role as UserRole} />;
};

export default DashboardWrapper;
