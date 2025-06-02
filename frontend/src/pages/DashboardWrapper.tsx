import React from 'react';
import Dashboard from './Dashboard';
import { UserRole } from '../types/UserType'; // Import UserRole type
import { access } from 'fs';

const DashboardWrapper = () => {
  const [role, setRole] = React.useState<string | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
    const storedAccessToken = localStorage.getItem('accessToken');
    setAccessToken(storedAccessToken);
  }, []); // Runs on mount

  if (!role) return <div>Loading role...</div>; // Prevent rendering with null role
  if (accessToken === null) {console.error('Access token is missing. Please log in again.');}

  return <Dashboard role={role as UserRole} />;
};

export default DashboardWrapper;