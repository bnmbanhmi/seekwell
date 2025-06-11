// SeekWell Skin Lesion Capture - Mobile-First Component
import React, { useState, useRef, useCallback } from 'react';
import styles from './SkinLesionCapture.module.css';

interface CaptureData {
  image: File | null;
  bodyRegion: string;
  symptoms: string[];
  notes: string;
  location: string;
}

interface SkinLesionCaptureProps {
  onCapture?: (data: CaptureData) => void;
  onClose?: () => void;
}

const SkinLesionCapture: React.FC<SkinLesionCaptureProps> = ({ onCapture, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [captureData, setCaptureData] = useState<CaptureData>({
    image: null,
    bodyRegion: '',
    symptoms: [],
    notes: '',
    location: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraMode, setCameraMode] = useState<'environment' | 'user'>('environment');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCamera, setIsCamera] = useState(false);

  const bodyRegions = [
    { id: 'head', label: 'Đầu & Cổ', icon: '🧑‍⚕️' },
    { id: 'chest', label: 'Ngực', icon: '🫁' },
    { id: 'back', label: 'Lưng', icon: '🔙' },
    { id: 'arms', label: 'Cánh tay', icon: '💪' },
    { id: 'hands', label: 'Bàn tay', icon: '✋' },
    { id: 'legs', label: 'Chân', icon: '🦵' },
    { id: 'feet', label: 'Bàn chân', icon: '🦶' },
    { id: 'other', label: 'Khác', icon: '📍' }
  ];

  const commonSymptoms = [
    { id: 'itching', label: 'Ngứa', severity: 'mild' },
    { id: 'pain', label: 'Đau', severity: 'moderate' },
    { id: 'burning', label: 'Bỏng rát', severity: 'mild' },
    { id: 'swelling', label: 'Sưng', severity: 'moderate' },
    { id: 'redness', label: 'Đỏ', severity: 'mild' },
    { id: 'bleeding', label: 'Chảy máu', severity: 'severe' },
    { id: 'discharge', label: 'Tiết dịch', severity: 'moderate' },
    { id: 'growth', label: 'Tăng kích thước', severity: 'severe' }
  ];

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: cameraMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Không thể truy cập camera. Vui lòng sử dụng chức năng tải ảnh từ thư viện.');
    }
  }, [cameraMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCamera(false);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `skin-lesion-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        setCaptureData(prev => ({ ...prev, image: file }));
        stopCamera();
        setCurrentStep(2);
      }
    }, 'image/jpeg', 0.9);
  }, [stopCamera]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setCaptureData(prev => ({ ...prev, image: file }));
      setCurrentStep(2);
    }
  };

  const toggleSymptom = (symptomId: string) => {
    setCaptureData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptomId)
        ? prev.symptoms.filter(id => id !== symptomId)
        : [...prev.symptoms, symptomId]
    }));
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (onCapture) {
      onCapture(captureData);
    }
    
    setIsProcessing(false);
  };

  const resetCapture = () => {
    setCaptureData({
      image: null,
      bodyRegion: '',
      symptoms: [],
      notes: '',
      location: ''
    });
    setCurrentStep(1);
    stopCamera();
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'mild': return styles.symptomMild;
      case 'moderate': return styles.symptomModerate;
      case 'severe': return styles.symptomSevere;
      default: return '';
    }
  };

  return (
    <div className={`${styles.container} safe-area-all`}>
      {/* Header */}
      <div className={styles.header}>
        <button 
          className={`${styles.backButton} touch-target`}
          onClick={onClose}
          aria-label="Quay lại"
        >
          ← Quay lại
        </button>
        <h1 className={styles.title}>Chụp ảnh tổn thương da</h1>
        <div className={styles.stepIndicator}>
          Bước {currentStep}/4
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className={styles.content}>
        {currentStep === 1 && (
          <div className={styles.step}>
            <div className={styles.stepHeader}>
              <h2 className={styles.stepTitle}>
                <span className={styles.stepIcon}>📸</span>
                Chụp hoặc chọn ảnh
              </h2>
              <p className={styles.stepDescription}>
                Chụp ảnh rõ nét vùng da có vấn đề hoặc chọn ảnh từ thư viện
              </p>
            </div>

            {!isCamera ? (
              <div className={styles.captureOptions}>
                <button
                  className={`${styles.captureButton} ${styles.cameraButton} touch-target`}
                  onClick={startCamera}
                >
                  <span className={styles.captureIcon}>📱</span>
                  <span className={styles.captureLabel}>Chụp ảnh ngay</span>
                  <span className={styles.captureDesc}>Sử dụng camera điện thoại</span>
                </button>

                <button
                  className={`${styles.captureButton} ${styles.galleryButton} touch-target`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className={styles.captureIcon}>🖼️</span>
                  <span className={styles.captureLabel}>Chọn từ thư viện</span>
                  <span className={styles.captureDesc}>Chọn ảnh đã có sẵn</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className={styles.hiddenInput}
                />
              </div>
            ) : (
              <div className={styles.cameraContainer}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={styles.cameraPreview}
                />
                
                <div className={styles.cameraControls}>
                  <button
                    className={`${styles.controlButton} ${styles.switchCamera} touch-target`}
                    onClick={() => {
                      stopCamera();
                      setCameraMode(mode => mode === 'environment' ? 'user' : 'environment');
                      setTimeout(startCamera, 100);
                    }}
                    aria-label="Đổi camera"
                  >
                    🔄
                  </button>

                  <button
                    className={`${styles.controlButton} ${styles.captureBtn} touch-target`}
                    onClick={capturePhoto}
                    aria-label="Chụp ảnh"
                  >
                    📸
                  </button>

                  <button
                    className={`${styles.controlButton} ${styles.cancelCamera} touch-target`}
                    onClick={stopCamera}
                    aria-label="Hủy"
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.cameraGuide}>
                  <div className={styles.focusFrame}></div>
                  <p className={styles.guideText}>
                    Đặt vùng da cần chụp trong khung này
                  </p>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className={styles.hiddenCanvas} />
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.step}>
            <div className={styles.stepHeader}>
              <h2 className={styles.stepTitle}>
                <span className={styles.stepIcon}>🗺️</span>
                Vị trí trên cơ thể
              </h2>
              <p className={styles.stepDescription}>
                Chọn vùng cơ thể nơi có tổn thương da
              </p>
            </div>

            {captureData.image && (
              <div className={styles.imagePreview}>
                <img 
                  src={URL.createObjectURL(captureData.image)} 
                  alt="Captured lesion"
                  className={styles.previewImage}
                />
              </div>
            )}

            <div className={styles.bodyRegionsGrid}>
              {bodyRegions.map(region => (
                <button
                  key={region.id}
                  className={`
                    ${styles.regionButton} 
                    ${captureData.bodyRegion === region.id ? styles.regionSelected : ''}
                    touch-target
                  `}
                  onClick={() => setCaptureData(prev => ({ ...prev, bodyRegion: region.id }))}
                >
                  <span className={styles.regionIcon}>{region.icon}</span>
                  <span className={styles.regionLabel}>{region.label}</span>
                </button>
              ))}
            </div>

            {captureData.bodyRegion === 'other' && (
              <div className={styles.customLocation}>
                <label className={styles.inputLabel}>Mô tả vị trí cụ thể:</label>
                <input
                  type="text"
                  className={`${styles.textInput} touch-target`}
                  value={captureData.location}
                  onChange={(e) => setCaptureData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ví dụ: Giữa lưng, gần vai trái..."
                />
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className={styles.step}>
            <div className={styles.stepHeader}>
              <h2 className={styles.stepTitle}>
                <span className={styles.stepIcon}>🩺</span>
                Triệu chứng
              </h2>
              <p className={styles.stepDescription}>
                Chọn các triệu chứng bạn đang gặp phải (có thể chọn nhiều)
              </p>
            </div>

            <div className={styles.symptomsGrid}>
              {commonSymptoms.map(symptom => (
                <button
                  key={symptom.id}
                  className={`
                    ${styles.symptomButton}
                    ${getSeverityClass(symptom.severity)}
                    ${captureData.symptoms.includes(symptom.id) ? styles.symptomSelected : ''}
                    touch-target
                  `}
                  onClick={() => toggleSymptom(symptom.id)}
                >
                  <span className={styles.symptomLabel}>{symptom.label}</span>
                  {captureData.symptoms.includes(symptom.id) && (
                    <span className={styles.checkmark}>✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className={styles.notesSection}>
              <label className={styles.inputLabel}>Ghi chú thêm (tùy chọn):</label>
              <textarea
                className={`${styles.textArea} touch-target`}
                rows={4}
                value={captureData.notes}
                onChange={(e) => setCaptureData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Mô tả thêm về tình trạng, thời gian xuất hiện, v.v..."
              />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className={styles.step}>
            {!isProcessing ? (
              <>
                <div className={styles.stepHeader}>
                  <h2 className={styles.stepTitle}>
                    <span className={styles.stepIcon}>✅</span>
                    Xác nhận thông tin
                  </h2>
                  <p className={styles.stepDescription}>
                    Kiểm tra lại thông tin trước khi gửi để phân tích
                  </p>
                </div>

                <div className={styles.summaryCard}>
                  {captureData.image && (
                    <div className={styles.summaryImage}>
                      <img 
                        src={URL.createObjectURL(captureData.image)} 
                        alt="Captured lesion"
                        className={styles.summaryPreview}
                      />
                    </div>
                  )}

                  <div className={styles.summaryDetails}>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Vị trí:</span>
                      <span className={styles.summaryValue}>
                        {bodyRegions.find(r => r.id === captureData.bodyRegion)?.label || 'Chưa chọn'}
                        {captureData.bodyRegion === 'other' && captureData.location && 
                          ` - ${captureData.location}`
                        }
                      </span>
                    </div>

                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Triệu chứng:</span>
                      <span className={styles.summaryValue}>
                        {captureData.symptoms.length > 0 
                          ? captureData.symptoms.map(id => 
                              commonSymptoms.find(s => s.id === id)?.label
                            ).join(', ')
                          : 'Không có triệu chứng'
                        }
                      </span>
                    </div>

                    {captureData.notes && (
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Ghi chú:</span>
                        <span className={styles.summaryValue}>{captureData.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.disclaimer}>
                  <p className={styles.disclaimerText}>
                    ⚠️ <strong>Lưu ý quan trọng:</strong> Kết quả phân tích AI chỉ mang tính chất tham khảo. 
                    Vui lòng tham khảo ý kiến bác sĩ chuyên khoa để có chẩn đoán chính xác.
                  </p>
                </div>
              </>
            ) : (
              <div className={styles.processingState}>
                <div className={styles.processingAnimation}>
                  <div className={styles.spinner}></div>
                  <div className={styles.processingSteps}>
                    <div className={styles.processingStep}>
                      <span className={styles.stepDot}></span>
                      Đang phân tích hình ảnh...
                    </div>
                    <div className={styles.processingStep}>
                      <span className={styles.stepDot}></span>
                      Nhận diện đặc điểm tổn thương...
                    </div>
                    <div className={styles.processingStep}>
                      <span className={styles.stepDot}></span>
                      Đánh giá mức độ rủi ro...
                    </div>
                    <div className={styles.processingStep}>
                      <span className={styles.stepDot}></span>
                      Tạo báo cáo kết quả...
                    </div>
                  </div>
                </div>
                <p className={styles.processingText}>
                  Đang sử dụng AI để phân tích ảnh của bạn...
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className={styles.navigation}>
        {currentStep > 1 && !isProcessing && (
          <button
            className={`${styles.navButton} ${styles.backBtn} touch-target`}
            onClick={() => setCurrentStep(step => step - 1)}
          >
            ← Quay lại
          </button>
        )}

        {currentStep < 4 ? (
          <button
            className={`${styles.navButton} ${styles.nextBtn} touch-target`}
            onClick={() => setCurrentStep(step => step + 1)}
            disabled={
              (currentStep === 1 && !captureData.image) ||
              (currentStep === 2 && !captureData.bodyRegion)
            }
          >
            Tiếp theo →
          </button>
        ) : !isProcessing ? (
          <button
            className={`${styles.navButton} ${styles.submitBtn} touch-target`}
            onClick={handleSubmit}
          >
            🚀 Phân tích ngay
          </button>
        ) : null}
      </div>

      {/* Reset Button */}
      {!isProcessing && (
        <button
          className={`${styles.resetButton} touch-target`}
          onClick={resetCapture}
        >
          🔄 Chụp lại
        </button>
      )}
    </div>
  );
};

export default SkinLesionCapture;
