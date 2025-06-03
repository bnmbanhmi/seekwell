import React from 'react';
import ChatbotWidget from '../Chatbot/ChatbotWidget';

const PatientDashboard = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2 className="text-2xl font-semibold mb-4">Welcome, Patient</h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        {/* Left Column - Patient Info & Appointments */}
        <div>
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Today's Appointments</h3>
            <p style={{ color: '#666' }}>You have no appointments scheduled for today.</p>
            {/* TODO: Replace with dynamic appointment data */}
          </div>
          
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
          }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button style={{
                padding: '10px 15px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}>
                Book New Appointment
              </button>
              <button style={{
                padding: '10px 15px',
                background: '#48bb78',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}>
                View Medical History
              </button>
              <button style={{
                padding: '10px 15px',
                background: '#ed8936',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}>
                View Prescriptions
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - AI Health Assistant */}
        <div>
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            height: '600px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>🤖 Your Personal Health Assistant</h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '15px', 
              fontSize: '14px' 
            }}>
              Chat with our AI assistant for personalized health guidance, appointment help, and medical questions.
            </p>
            <div style={{ flex: 1 }}>
              <ChatbotWidget
                userRole="PATIENT"
                isAuthenticated={true}
                position="inline"
                placeholder="Ask about your health, symptoms, or appointments..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Additional sections can be added here */}
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
      }}>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>Recent Activity</h3>
        <p style={{ color: '#666' }}>No recent activity to display.</p>
        {/* TODO: Replace with dynamic activity data */}
      </div>
    </div>
  );
};

export default PatientDashboard;
