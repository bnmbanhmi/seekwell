import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import styles from './RegisterPageMobile.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

// Placeholder translation function
const t = (key: string, params?: object) => {
    if (params) {
        let message = key;
        for (const [paramKey, value] of Object.entries(params)) {
            message = message.replace(`{{${paramKey}}}`, String(value));
        }
        return message;
    }
    return key;
};

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [mail, setMail] = useState('');
    const [password, setPassword] = useState('');
    const [fullname, setFullname] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const navigate = useNavigate();

    const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
        if (event) {
            event.preventDefault();
        }
        setError('');
        setLoading(true);

        // Validate all required fields
        if (!fullname || !username || !mail || !password) {
            setError('Vui lòng điền đầy đủ tất cả thông tin bắt buộc.');
            setLoading(false);
            return;
        }

        if (!passwordValidation.isValid) {
            setError('Mật khẩu không đáp ứng yêu cầu bảo mật.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(BACKEND_URL + '/auth/register/', {
                username,
                email: mail,
                password,
                full_name: fullname,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.status === 201 || response.status === 200) {
                toast.success(t('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.'));
                setTimeout(() => {
                    navigate('/login');
                }, 1000);
            }
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                const detail = err.response.data.detail;

                if (Array.isArray(detail)) {
                    // Join all error messages into a single string
                    setError(detail.map((e: any) => e.msg).join(' | '));
                } else {
                    setError(detail || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
                }
            } else {
                setError('Đăng ký thất bại. Vui lòng kiểm tra kết nối mạng và thử lại.');
            }
            console.error("Register error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const nextStep = () => {
        if (currentStep === 1 && (!fullname || !username)) {
            setError('Vui lòng điền đầy đủ thông tin cá nhân');
            return;
        }
        if (currentStep === 2 && (!mail || !password)) {
            setError('Vui lòng điền đầy đủ thông tin tài khoản');
            return;
        }
        setError('');
        setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        setError('');
        setCurrentStep(currentStep - 1);
    };

    const validatePassword = (password: string) => {
        const minLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        
        return {
            minLength,
            hasUpper,
            hasLower,
            hasNumber,
            isValid: minLength && hasUpper && hasLower && hasNumber
        };
    };

    const passwordValidation = validatePassword(password);

    return (
        <div className={`${styles.container} safe-area-all`}>
            {/* SeekWell Branding Header */}
            <div className={styles.header}>
                <div className={styles.brandSection}>
                    <div className={styles.logoContainer}>
                        <div className={styles.logo}>🔍</div>
                        <div className={styles.logoText}>
                            <h1 className={styles.brandName}>SeekWell</h1>
                            <p className={styles.brandTagline}>AI-Powered Health Companion</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Registration Card */}
            <div className={styles.card}>
                {/* Progress Indicator */}
                <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                        <div 
                            className={styles.progressFill} 
                            style={{ width: `${(currentStep / 3) * 100}%` }}
                        ></div>
                    </div>
                    <p className={styles.progressText}>Bước {currentStep} của 3</p>
                </div>

                <div className={styles.stepContainer}>
                    {currentStep === 1 && (
                        <div className={styles.step}>
                            <h2 className={styles.stepTitle}>
                                <span className={styles.stepIcon}>👤</span>
                                Thông tin cá nhân
                            </h2>
                            <p className={styles.stepDescription}>Hãy cho chúng tôi biết về bạn</p>

                            <div className={styles.formGroup}>
                                <label htmlFor="fullname" className={styles.label}>Họ và tên *</label>
                                <input
                                    type="text"
                                    id="fullname"
                                    value={fullname}
                                    onChange={(e) => setFullname(e.target.value)}
                                    required
                                    className={`${styles.input} touch-target`}
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="username" className={styles.label}>Tên đăng nhập *</label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className={`${styles.input} touch-target`}
                                    placeholder="tenchophepnguoidung"
                                />
                                <p className={styles.inputHint}>Tên đăng nhập sẽ dùng để đăng nhập vào ứng dụng</p>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className={styles.step}>
                            <h2 className={styles.stepTitle}>
                                <span className={styles.stepIcon}>🔐</span>
                                Tài khoản & Bảo mật
                            </h2>
                            <p className={styles.stepDescription}>Thiết lập email và mật khẩu an toàn</p>

                            <div className={styles.formGroup}>
                                <label htmlFor="mail" className={styles.label}>Email *</label>
                                <input
                                    type="email"
                                    id="mail"
                                    value={mail}
                                    onChange={(e) => setMail(e.target.value)}
                                    required
                                    className={`${styles.input} touch-target`}
                                    placeholder="ten@email.com"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="password" className={styles.label}>Mật khẩu *</label>
                                <div className={styles.passwordInput}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className={`${styles.input} touch-target`}
                                        placeholder="Nhập mật khẩu mạnh"
                                    />
                                    <button
                                        type="button"
                                        className={`${styles.passwordToggle} touch-target`}
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                
                                {/* Password Strength Indicator */}
                                {password && (
                                    <div className={styles.passwordStrength}>
                                        <div className={styles.strengthChecks}>
                                            <div className={`${styles.strengthCheck} ${passwordValidation.minLength ? styles.valid : ''}`}>
                                                {passwordValidation.minLength ? '✓' : '○'} Ít nhất 8 ký tự
                                            </div>
                                            <div className={`${styles.strengthCheck} ${passwordValidation.hasUpper ? styles.valid : ''}`}>
                                                {passwordValidation.hasUpper ? '✓' : '○'} Có chữ hoa
                                            </div>
                                            <div className={`${styles.strengthCheck} ${passwordValidation.hasLower ? styles.valid : ''}`}>
                                                {passwordValidation.hasLower ? '✓' : '○'} Có chữ thường
                                            </div>
                                            <div className={`${styles.strengthCheck} ${passwordValidation.hasNumber ? styles.valid : ''}`}>
                                                {passwordValidation.hasNumber ? '✓' : '○'} Có số
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className={styles.step}>
                            <h2 className={styles.stepTitle}>
                                <span className={styles.stepIcon}>✨</span>
                                Xác nhận thông tin
                            </h2>
                            <p className={styles.stepDescription}>Kiểm tra lại thông tin trước khi đăng ký</p>

                            <div className={styles.summaryCard}>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryLabel}>Họ và tên:</span>
                                    <span className={styles.summaryValue}>{fullname}</span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryLabel}>Tên đăng nhập:</span>
                                    <span className={styles.summaryValue}>{username}</span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryLabel}>Email:</span>
                                    <span className={styles.summaryValue}>{mail}</span>
                                </div>
                            </div>

                            <div className={styles.termsSection}>
                                <div className={styles.termsText}>
                                    <p>Bằng cách đăng ký, bạn đồng ý với:</p>
                                    <ul>
                                        <li><button type="button" className={styles.termsLink}>Điều khoản sử dụng</button></li>
                                        <li><button type="button" className={styles.termsLink}>Chính sách bảo mật</button></li>
                                        <li><button type="button" className={styles.termsLink}>Quy định về dữ liệu y tế</button></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className={styles.errorMessage}>
                            <span className={styles.errorIcon}>⚠️</span>
                            {error}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className={styles.buttonGroup}>
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={prevStep}
                                className={`${styles.button} ${styles.buttonSecondary} touch-target`}
                            >
                                ← Quay lại
                            </button>
                        )}

                        {currentStep < 3 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className={`${styles.button} ${styles.buttonPrimary} touch-target`}
                            >
                                Tiếp theo →
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={async (e) => {
                                    e.preventDefault();
                                    await handleSubmit(e as any);
                                }}
                                disabled={loading || !passwordValidation.isValid}
                                className={`${styles.button} ${styles.buttonSuccess} touch-target`}
                            >
                                {loading ? (
                                    <>
                                        <span className={styles.spinner}></span>
                                        Đang đăng ký...
                                    </>
                                ) : (
                                    'Tạo tài khoản'
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
                <p className={styles.footerText}>
                    Đã có tài khoản?{' '}
                    <button
                        type="button"
                        onClick={handleLogin}
                        className={styles.linkButton}
                    >
                        Đăng nhập ngay
                    </button>
                </p>
                
                <div className={styles.securityInfo}>
                    <p className={styles.securityText}>
                        🔒 Thông tin của bạn được bảo vệ bằng mã hóa SSL
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;