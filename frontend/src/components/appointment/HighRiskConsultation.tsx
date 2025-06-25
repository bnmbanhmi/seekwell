import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AIAnalysisResult, RiskAssessment } from '../../types/AIAnalysisTypes';
import './highRiskConsultation.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface Doctor {
  doctor_id: number;
  doctor_name: string;
  major: string;
  hospital_id: number;
}

interface ConsultationFormData {
  date: string;
  time: string;
  doctorId: number | null;
  reason: string;
  urgencyLevel: 'URGENT' | 'HIGH' | 'MEDIUM';
  aiAssessmentId?: string;
}

interface HighRiskConsultationProps {
  aiAnalysisResult?: AIAnalysisResult;
  patientId?: number;
  onBookingComplete?: (success: boolean) => void;
}

const HighRiskConsultation: React.FC<HighRiskConsultationProps> = ({
  aiAnalysisResult: propAnalysisResult,
  patientId: propPatientId,
  onBookingComplete
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from navigation state or props
  const stateData = location.state as {
    aiAnalysisResult?: AIAnalysisResult;
    patientId?: number;
    autoFill?: boolean;
  } | null;
  
  const aiAnalysisResult = stateData?.aiAnalysisResult || propAnalysisResult;
  const patientId = stateData?.patientId || propPatientId;
  const autoFill = stateData?.autoFill || false;
  const [formData, setFormData] = useState<ConsultationFormData>({
    date: '',
    time: '',
    doctorId: null,
    reason: '',
    urgencyLevel: 'HIGH'
  });
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);

  // Auto-populate form based on AI analysis
  useEffect(() => {
    if (aiAnalysisResult) {
      const urgencyLevel = determineUrgencyLevel(aiAnalysisResult.risk_assessment);
      const reason = generateConsultationReason(aiAnalysisResult);
      
      setFormData(prev => ({
        ...prev,
        urgencyLevel,
        reason,
        aiAssessmentId: aiAnalysisResult.timestamp || new Date().toISOString()
      }));
    }
  }, [aiAnalysisResult]);

  // Load doctors on component mount
  useEffect(() => {
    fetchSpecialistDoctors();
  }, []);

  const determineUrgencyLevel = (riskAssessment: RiskAssessment): 'URGENT' | 'HIGH' | 'MEDIUM' => {
    if (riskAssessment.needs_urgent_attention || riskAssessment.risk_level === 'URGENT') {
      return 'URGENT';
    }
    if (riskAssessment.risk_level === 'HIGH') {
      return 'HIGH';
    }
    return 'MEDIUM';
  };

  const generateConsultationReason = (analysisResult: AIAnalysisResult): string => {
    const { risk_assessment, analysis, top_prediction, recommendations } = analysisResult;
    
    let reason = `AI Analysis - High Risk Skin Lesion Detected\n\n`;
    reason += `Predicted Condition: ${top_prediction?.label || analysis.predicted_class}\n`;
    reason += `Confidence Level: ${(top_prediction?.confidence || 0) * 100}%\n`;
    reason += `Risk Level: ${risk_assessment.risk_level}\n`;
    reason += `Body Region: ${analysis.body_region || 'Not specified'}\n\n`;
    
    if (risk_assessment.needs_urgent_attention) {
      reason += `⚠️ URGENT ATTENTION REQUIRED\n\n`;
    }
    
    if (recommendations.length > 0) {
      reason += `AI Recommendations:\n`;
      recommendations.forEach((rec, index) => {
        reason += `${index + 1}. ${rec}\n`;
      });
    }
    
    return reason;
  };

  const fetchSpecialistDoctors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/doctors`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      // Filter for specialists (dermatologists, general practitioners, etc.)
      const specialists = response.data.filter((doctor: Doctor) => 
        doctor.major.toLowerCase().includes('dermatolog') ||
        doctor.major.toLowerCase().includes('general') ||
        doctor.major.toLowerCase().includes('family')
      );
      
      setDoctors(specialists.length > 0 ? specialists : response.data);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      setError('Không thể tải danh sách bác sĩ chuyên khoa.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrioritySlots = async () => {
    if (!formData.date) {
      setError('Vui lòng chọn ngày khám.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${BACKEND_URL}/appointments/available`, {
        params: { day: formData.date },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      // Prioritize slots based on urgency level
      let prioritizedSlots = response.data;
      
      if (formData.urgencyLevel === 'URGENT') {
        // For urgent cases, show all available slots including emergency slots
        prioritizedSlots = response.data.map((slot: any) => ({
          ...slot,
          isEmergency: true
        }));
      } else if (formData.urgencyLevel === 'HIGH') {
        // For high priority, prioritize morning slots
        prioritizedSlots = response.data.sort((a: any, b: any) => {
          const timeA = new Date(`1970-01-01T${a.datetime.split('T')[1]}`);
          const timeB = new Date(`1970-01-01T${b.datetime.split('T')[1]}`);
          return timeA.getTime() - timeB.getTime();
        });
      }

      setAvailableSlots(prioritizedSlots);
      setStep(2);
    } catch (err) {
      console.error('Failed to fetch available slots:', err);
      setError('Không thể tải lịch trống ưu tiên.');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: any, doctorId: number) => {
    const [date, time] = slot.datetime.split('T');
    setFormData(prev => ({
      ...prev,
      date,
      time: time.slice(0, 5),
      doctorId
    }));
    setStep(3);
  };

  const handleBooking = async () => {
    if (!formData.doctorId || !formData.date || !formData.time) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const userId = localStorage.getItem('user_id');
      
      const payload = {
        patient_id: patientId || parseInt(userId || '0'),
        doctor_id: formData.doctorId,
        appointment_day: formData.date,
        appointment_time: formData.time,
        reason: formData.reason,
        priority: formData.urgencyLevel,
        ai_assessment_reference: formData.aiAssessmentId
      };

      await axios.post(`${BACKEND_URL}/appointments/book`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setSuccess('Đặt lịch khám khẩn cấp thành công! Bạn sẽ nhận được xác nhận trong thời gian sớm nhất.');
      
      if (onBookingComplete) {
        onBookingComplete(true);
      }
      
      // Reset form after successful booking
      setTimeout(() => {
        setStep(1);
        setFormData({
          date: '',
          time: '',
          doctorId: null,
          reason: '',
          urgencyLevel: 'HIGH'
        });
        setSuccess('');
      }, 3000);

    } catch (err: any) {
      console.error('Failed to book appointment:', err);
      const errorMessage = err.response?.data?.detail || 'Không thể đặt lịch khám. Vui lòng thử lại.';
      setError(errorMessage);
      
      if (onBookingComplete) {
        onBookingComplete(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadgeClass = (urgency: string) => {
    switch (urgency) {
      case 'URGENT': return 'priority-urgent';
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      default: return 'priority-medium';
    }
  };

  const getPriorityText = (urgency: string) => {
    switch (urgency) {
      case 'URGENT': return 'Khẩn cấp - Cần khám ngay';
      case 'HIGH': return 'Ưu tiên cao - Khám trong 1-2 ngày';
      case 'MEDIUM': return 'Ưu tiên trung bình - Khám trong tuần';
      default: return 'Ưu tiên trung bình';
    }
  };

  return (
    <div className="high-risk-consultation">
      <div className="consultation-header">
        <h2>Đặt lịch khám chuyên khoa</h2>
        <div className={`priority-badge ${getPriorityBadgeClass(formData.urgencyLevel)}`}>
          {getPriorityText(formData.urgencyLevel)}
        </div>
      </div>

      {/* Auto-fill notification from AI analysis */}
      {autoFill && aiAnalysisResult && (
        <div className="ai-redirect-notice">
          <div className="notice-icon">🤖</div>
          <div className="notice-content">
            <h4>Tự động chuyển từ phân tích AI</h4>
            <p>Hệ thống AI đã phát hiện ca có mức độ rủi ro cao. Thông tin đã được điền sẵn dựa trên kết quả phân tích.</p>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Step 1: Review AI Assessment & Select Date */}
      {step === 1 && (
        <div className="step-container">
          <h3>Bước 1: Xác nhận đánh giá AI và chọn ngày</h3>
          
          {aiAnalysisResult && (
            <div className="ai-assessment-summary">
              <h4>Kết quả đánh giá AI:</h4>
              <div className="assessment-details">
                <div className="detail-row">
                  <span className="label">Tình trạng phát hiện:</span>
                  <span className="value">{aiAnalysisResult.top_prediction?.label}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Độ tin cậy:</span>
                  <span className="value">{((aiAnalysisResult.top_prediction?.confidence || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="detail-row">
                  <span className="label">Mức độ rủi ro:</span>
                  <span className={`value risk-${aiAnalysisResult.risk_assessment.risk_level.toLowerCase()}`}>
                    {aiAnalysisResult.risk_assessment.risk_level}
                  </span>
                </div>
                {aiAnalysisResult.risk_assessment.needs_urgent_attention && (
                  <div className="urgent-notice">
                    ⚠️ Cần được chú ý khẩn cấp
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="consultation-date">Ngày mong muốn khám:</label>
            <input
              id="consultation-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              max={new Date(Date.now() + (formData.urgencyLevel === 'URGENT' ? 3 : 14) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="form-input"
              required
            />
            <small className="help-text">
              {formData.urgencyLevel === 'URGENT' && 'Chỉ hiển thị 3 ngày tới cho ca khẩn cấp'}
              {formData.urgencyLevel === 'HIGH' && 'Khuyến nghị khám trong vòng 1-2 ngày'}
              {formData.urgencyLevel === 'MEDIUM' && 'Khuyến nghị khám trong tuần'}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="consultation-reason">Chi tiết cần khám:</label>
            <textarea
              id="consultation-reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="form-textarea"
              rows={8}
              placeholder="Mô tả chi tiết về tình trạng cần khám..."
            />
          </div>

          <button 
            onClick={fetchPrioritySlots} 
            disabled={loading || !formData.date}
            className="btn-primary"
          >
            {loading ? 'Đang tìm lịch ưu tiên...' : 'Tìm lịch khám ưu tiên'}
          </button>
        </div>
      )}

      {/* Step 2: Select Time Slot & Doctor */}
      {step === 2 && (
        <div className="step-container">
          <h3>Bước 2: Chọn giờ khám và bác sĩ</h3>
          
          <div className="selected-date">
            <strong>Ngày đã chọn:</strong> {new Date(formData.date).toLocaleDateString('vi-VN')}
          </div>

          {availableSlots.length === 0 ? (
            <div className="no-slots">
              <p>Không có lịch trống cho ngày này.</p>
              <button onClick={() => setStep(1)} className="btn-secondary">
                ← Chọn ngày khác
              </button>
            </div>
          ) : (
            <div className="slots-grid">
              {availableSlots.map((slot) => (
                <div key={slot.datetime} className="time-slot-card">
                  <div className="slot-time">
                    {slot.datetime.split('T')[1].slice(0, 5)}
                    {slot.isEmergency && <span className="emergency-badge">Khẩn cấp</span>}
                  </div>
                  <div className="available-doctors">
                    <h5>Bác sĩ khả dụng:</h5>
                    {slot.available_doctors.map((doctor: any) => (
                      <button
                        key={doctor.doctor_id}
                        className="doctor-slot-btn"
                        onClick={() => handleSlotSelect(slot, doctor.doctor_id)}
                      >
                        <div className="doctor-name">BS. {doctor.doctor_name}</div>
                        <div className="doctor-specialty">
                          {doctors.find(d => d.doctor_id === doctor.doctor_id)?.major || 'Chuyên khoa'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => setStep(1)} className="btn-secondary">
            ← Quay lại chọn ngày
          </button>
        </div>
      )}

      {/* Step 3: Confirm Booking */}
      {step === 3 && (
        <div className="step-container">
          <h3>Bước 3: Xác nhận đặt lịch</h3>
          
          <div className="booking-summary">
            <h4>Thông tin đặt lịch:</h4>
            <div className="summary-details">
              <div className="detail-row">
                <span className="label">Ngày khám:</span>
                <span className="value">{new Date(formData.date).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="detail-row">
                <span className="label">Giờ khám:</span>
                <span className="value">{formData.time}</span>
              </div>
              <div className="detail-row">
                <span className="label">Bác sĩ:</span>
                <span className="value">
                  BS. {doctors.find(d => d.doctor_id === formData.doctorId)?.doctor_name}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Chuyên khoa:</span>
                <span className="value">
                  {doctors.find(d => d.doctor_id === formData.doctorId)?.major}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Mức độ ưu tiên:</span>
                <span className={`value ${getPriorityBadgeClass(formData.urgencyLevel)}`}>
                  {getPriorityText(formData.urgencyLevel)}
                </span>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            {autoFill && (
              <button 
                onClick={() => navigate('/dashboard/ai-analysis')} 
                className="btn-secondary"
              >
                ← Quay lại AI Analysis
              </button>
            )}
            <button onClick={() => setStep(2)} className="btn-secondary">
              ← Thay đổi lịch
            </button>
            <button 
              onClick={handleBooking} 
              disabled={loading}
              className="btn-primary btn-confirm"
            >
              {loading ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HighRiskConsultation;
