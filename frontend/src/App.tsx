import React, {useEffect, useState} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage'; // Import DashboardPage
import ForgotPasswordPage from './components/ForgotPasswordPage'; // Import ForgotPasswordPage
import ResetPasswordPage from './components/ResetPasswordPage'; // Import ResetPasswordPage
import RegisterPage from './components/RegisterPage';
import DashboardWrapper from './pages/DashboardWrapper'; // Import DashboardWrapper
import ChatbotWidget from './components/Chatbot/ChatbotWidget'; // Import ChatbotWidget

import Profile from './pages/Profile'; 

import { UserRole } from './types/UserType'; // Import UserRole type

import { ToastContainer } from 'react-toastify';

// A simple HOC for protected routes
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('accessToken');
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

// Component to handle chatbot display logic
const ChatbotContainer: React.FC = () => {
  const location = useLocation();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status and user role
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('role') as UserRole;
    
    setIsAuthenticated(!!token);
    setUserRole(role || null);
  }, [location]);

  // Don't show chatbot on dashboard pages (they have their own chat functionality)
  const isDashboardPage = location.pathname.startsWith('/dashboard');
  
  if (isDashboardPage) {
    return null;
  }

  return (
    <ChatbotWidget
      userRole={userRole}
      isAuthenticated={isAuthenticated}
      position="fixed"
    />
  );
};

function App() {
  useEffect(() => {
    fetch(`${BACKEND_URL}/`)
      .then(res => res.json())
      .then(data => console.log('Backend says:', data.message, 'at', BACKEND_URL))
      .catch(err => console.error('Backend connection failed:', err));
  }, []);

  return (
    <Router>
      <div className="App">
        <ToastContainer position="bottom-left" autoClose={3000} hideProgressBar={false} newestOnTop />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} /> 
          {/* <Route path="/testdashboard" element={<DashboardWrapper />} /> */}
          <Route 
            path="/dashboard/*" 
            element={
                <ProtectedRoute>
                  <>
                    <DashboardWrapper />
                  </>
                </ProtectedRoute>
            }
          />
          {/* Redirect root to login or dashboard based on auth state */}
          <Route 
            path="/" 
            element={localStorage.getItem('accessToken') ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
          />
          {/* You can add a 404 page here if needed */}
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
        </Routes>
        
        {/* Add Chatbot Widget */}
        <ChatbotContainer />
      </div>
    </Router>
  );
}

export default App;
