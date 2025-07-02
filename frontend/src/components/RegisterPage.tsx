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
            setError('Please fill in all required information.');
            setLoading(false);
            return;
        }

        if (!passwordValidation.isValid) {
            setError('Password does not meet security requirements.');
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
                toast.success(t('Registration successful! You can now log in.'));
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
                    setError(detail || 'Registration failed. Please check your information.');
                }
            } else {
                setError('Registration failed. Please check your internet connection and try again.');
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
            setError('Please fill in all personal information');
            return;
        }
        if (currentStep === 2 && (!mail || !password)) {
            setError('Please fill in all account information');
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
                    <p className={styles.progressText}>Step {currentStep} of 3</p>
                </div>

                <div className={styles.stepContainer}>
                    {currentStep === 1 && (
                        <div className={styles.step}>
                            <h2 className={styles.stepTitle}>
                                <span className={styles.stepIcon}>👤</span>
                                Personal Information
                            </h2>
                            <p className={styles.stepDescription}>Tell us about yourself</p>

                            <div className={styles.formGroup}>
                                <label htmlFor="fullname" className={styles.label}>Full Name *</label>
                                <input
                                    type="text"
                                    id="fullname"
                                    value={fullname}
                                    onChange={(e) => setFullname(e.target.value)}
                                    required
                                    className={`${styles.input} touch-target`}
                                    placeholder="John Doe"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="username" className={styles.label}>Username *</label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className={`${styles.input} touch-target`}
                                    placeholder="yourusername"
                                />
                                <p className={styles.inputHint}>Username will be used to log into the application</p>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className={styles.step}>
                            <h2 className={styles.stepTitle}>
                                <span className={styles.stepIcon}>🔐</span>
                                Account & Security
                            </h2>
                            <p className={styles.stepDescription}>Set up your email and secure password</p>

                            <div className={styles.formGroup}>
                                <label htmlFor="mail" className={styles.label}>Email *</label>
                                <input
                                    type="email"
                                    id="mail"
                                    value={mail}
                                    onChange={(e) => setMail(e.target.value)}
                                    required
                                    className={`${styles.input} touch-target`}
                                    placeholder="name@email.com"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="password" className={styles.label}>Password *</label>
                                <div className={styles.passwordInput}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className={`${styles.input} touch-target`}
                                        placeholder="Enter a strong password"
                                    />
                                    <button
                                        type="button"
                                        className={`${styles.passwordToggle} touch-target`}
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                
                                {/* Password Strength Indicator */}
                                {password && (
                                    <div className={styles.passwordStrength}>
                                        <div className={styles.strengthChecks}>
                                            <div className={`${styles.strengthCheck} ${passwordValidation.minLength ? styles.valid : ''}`}>
                                                {passwordValidation.minLength ? '✓' : '○'} At least 8 characters
                                            </div>
                                            <div className={`${styles.strengthCheck} ${passwordValidation.hasUpper ? styles.valid : ''}`}>
                                                {passwordValidation.hasUpper ? '✓' : '○'} Has uppercase letter
                                            </div>
                                            <div className={`${styles.strengthCheck} ${passwordValidation.hasLower ? styles.valid : ''}`}>
                                                {passwordValidation.hasLower ? '✓' : '○'} Has lowercase letter
                                            </div>
                                            <div className={`${styles.strengthCheck} ${passwordValidation.hasNumber ? styles.valid : ''}`}>
                                                {passwordValidation.hasNumber ? '✓' : '○'} Has number
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
                                Confirm Information
                            </h2>
                            <p className={styles.stepDescription}>Review your information before registration</p>

                            <div className={styles.summaryCard}>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryLabel}>Full Name:</span>
                                    <span className={styles.summaryValue}>{fullname}</span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryLabel}>Username:</span>
                                    <span className={styles.summaryValue}>{username}</span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryLabel}>Email:</span>
                                    <span className={styles.summaryValue}>{mail}</span>
                                </div>
                            </div>

                            <div className={styles.termsSection}>
                                <div className={styles.termsText}>
                                    <p>By registering, you agree to:</p>
                                    <ul>
                                        <li><button type="button" className={styles.termsLink}>Terms of Service</button></li>
                                        <li><button type="button" className={styles.termsLink}>Privacy Policy</button></li>
                                        <li><button type="button" className={styles.termsLink}>Medical Data Regulations</button></li>
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
                                ← Back
                            </button>
                        )}

                        {currentStep < 3 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className={`${styles.button} ${styles.buttonPrimary} touch-target`}
                            >
                                Next →
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
                                        Registering...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
                {/* Demo Account Section */}
                <div className={styles.demoSection}>
                    <h3 className={styles.demoTitle}>🚀 Try SeekWell Instantly</h3>
                    <p className={styles.demoDescription}>
                        Don't want to create an account right now? Use our demo patient account:
                    </p>
                    <div className={styles.demoCredentials}>
                        <div className={styles.credentialItem}>
                            <span className={styles.credentialLabel}>📧 Email:</span>
                            <span className={styles.credentialValue}>patient1@seekwell.health</span>
                        </div>
                        <div className={styles.credentialItem}>
                            <span className={styles.credentialLabel}>🔑 Password:</span>
                            <span className={styles.credentialValue}>PatientDemo2025</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className={styles.demoButton}
                    >
                        Go to Login with Demo Account
                    </button>
                    <p className={styles.demoNote}>
                        💡 This demo account lets you explore all SeekWell features including AI skin analysis
                    </p>
                </div>

                <div className={styles.footerDivider}></div>

                <p className={styles.footerText}>
                    Already have an account?{' '}
                    <button
                        type="button"
                        onClick={handleLogin}
                        className={styles.linkButton}
                    >
                        Sign in now
                    </button>
                </p>
                
                <div className={styles.securityInfo}>
                    <p className={styles.securityText}>
                        🔒 Your information is protected with SSL encryption
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;