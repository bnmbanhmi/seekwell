import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Badge,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Warning,
  Person,
  LocalHospital,
  Schedule,
  Visibility,
} from '@mui/icons-material';
import axios from 'axios';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface HighRiskAlert {
  image_id: number;
  patient_id: number;
  patient_name: string;
  patient_phone?: string;
  ai_prediction: string;
  confidence_score: number;
  upload_timestamp: string;
  body_region?: string;
  status: 'pending' | 'reviewed' | 'consulted';
  risk_level: 'HIGH' | 'URGENT';
}

interface CommunityStats {
  totalPatients: number;
  totalPendingReviews: number;
  urgentCases: number;
  consultationsNeeded: number;
  completedReviews?: number;
  aiAnalysesToday?: number;
}

interface PatientDetails {
  patient_id: number;
  name: string;
  phone?: string;
  age?: number;
  gender?: string;
  recent_analyses: any[];
}

const CadreDashboard: React.FC = () => {
  const [highRiskAlerts, setHighRiskAlerts] = useState<HighRiskAlert[]>([]);
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [appointmentDialog, setAppointmentDialog] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch high-risk alerts that need cadre review
      const alertsResponse = await axios.get(`${BACKEND_URL}/skin-lesions/pending-reviews`, { headers });
      
      // Fetch community health statistics
      const statsResponse = await axios.get(`${BACKEND_URL}/community/stats`, { headers });

      setHighRiskAlerts(alertsResponse.data || []);
      setCommunityStats(statsResponse.data || {
        totalPatients: 0,
        totalPendingReviews: 0,
        urgentCases: 0,
        consultationsNeeded: 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewPatient = async (alert: HighRiskAlert) => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Get patient details
      const patientResponse = await axios.get(`${BACKEND_URL}/patients/${alert.patient_id}`, { headers });
      
      setSelectedPatient(patientResponse.data);
      setReviewDialog(true);
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  const handleBookAppointment = () => {
    setReviewDialog(false);
    setAppointmentDialog(true);
  };

  const handleMarkReviewed = async (imageId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(`${BACKEND_URL}/cadre/review/${imageId}`, {
        action: 'reviewed',
        notes: 'Reviewed by local cadre - consultation recommended'
      }, { headers });

      // Reload data
      loadDashboardData();
    } catch (error) {
      console.error('Error marking as reviewed:', error);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Local Cadre Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Monitor high-risk patients and coordinate medical consultations
      </Typography>

      {/* Community Health Statistics */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Person color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{communityStats?.totalPatients || 0}</Typography>
                  <Typography color="text.secondary">Total Patients</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Badge badgeContent={communityStats?.totalPendingReviews || 0} color="error">
                  <Warning color="warning" sx={{ mr: 2 }} />
                </Badge>
                <Box>
                  <Typography variant="h4">{communityStats?.totalPendingReviews || 0}</Typography>
                  <Typography color="text.secondary">Pending Reviews</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Warning color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{communityStats?.urgentCases || 0}</Typography>
                  <Typography color="text.secondary">High Risk Cases</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <LocalHospital color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{communityStats?.consultationsNeeded || 0}</Typography>
                  <Typography color="text.secondary">Need Consultation</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* High-Risk Alerts Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🚨 High-Risk Patient Alerts
          </Typography>
          
          {highRiskAlerts.length === 0 ? (
            <Alert severity="info">
              No high-risk alerts at this time. All patients are being monitored.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Patient</strong></TableCell>
                    <TableCell><strong>Risk Level</strong></TableCell>
                    <TableCell><strong>AI Prediction</strong></TableCell>
                    <TableCell><strong>Confidence</strong></TableCell>
                    <TableCell><strong>Body Region</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {highRiskAlerts.map((alert) => (
                    <TableRow key={alert.image_id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {alert.patient_name}
                          </Typography>
                          {alert.patient_phone && (
                            <Typography variant="caption" color="text.secondary">
                              📞 {alert.patient_phone}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={alert.risk_level} 
                          color={getRiskColor(alert.risk_level)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {alert.ai_prediction}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {(alert.confidence_score * 100).toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {alert.body_region || 'Not specified'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(alert.upload_timestamp).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={alert.status} 
                          color={alert.status === 'pending' ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => handleReviewPatient(alert)}
                          >
                            Review
                          </Button>
                          {alert.status === 'pending' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="warning"
                              startIcon={<Schedule />}
                              onClick={() => handleMarkReviewed(alert.image_id)}
                            >
                              Mark Reviewed
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Patient Review Dialog */}
      <Dialog 
        open={reviewDialog} 
        onClose={() => setReviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Patient Review: {selectedPatient?.name}
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2">Patient Information:</Typography>
                  <Typography>Name: {selectedPatient.name}</Typography>
                  <Typography>Phone: {selectedPatient.phone || 'Not provided'}</Typography>
                  <Typography>Age: {selectedPatient.age || 'Not provided'}</Typography>
                  <Typography>Gender: {selectedPatient.gender || 'Not provided'}</Typography>
                </Box>
                <Box>
                  <Divider sx={{ my: 2 }} />
                  <Alert severity="warning">
                    <strong>Recommended Action:</strong> This patient has received a high-risk AI analysis result. 
                    Please coordinate urgent medical consultation with a qualified doctor.
                  </Alert>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<LocalHospital />}
            onClick={handleBookAppointment}
          >
            Book Doctor Consultation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Appointment Booking Dialog */}
      <Dialog 
        open={appointmentDialog} 
        onClose={() => setAppointmentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Book Urgent Consultation
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 2 }}>
            Redirecting to appointment booking system for urgent medical consultation...
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppointmentDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              setAppointmentDialog(false);
              // Navigate to high-risk consultation booking
              window.location.href = '/dashboard/appointments/high-risk';
            }}
          >
            Continue to Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CadreDashboard;
