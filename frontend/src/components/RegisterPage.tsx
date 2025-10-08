import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import styles from './RegisterPageMobile.module.css';
import LanguageSwitcher from './common/LanguageSwitcher';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

const RegisterPage: React.FC = () => {
    const { t } = useTranslation();
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
            setError(t('register.errors.allFieldsRequired'));
            setLoading(false);
            return;
        }

        if (!passwordValidation.isValid) {
            setError(t('register.errors.passwordRequirements'));
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
                toast.success(t('register.success'));
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
                    setError(detail || t('register.errors.registrationFailed'));
                }
            } else {
                setError(t('register.errors.networkError'));
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
            setError(t('register.errors.personalInfoRequired'));
            return;
        }
        if (currentStep === 2 && (!mail || !password)) {
            setError(t('register.errors.accountInfoRequired'));
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
            {/* Language Switcher */}
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
                <LanguageSwitcher variant="icon" size="small" />
            </div>
            
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
                    <p className={styles.progressText}>{t('register.progress.step', { current: currentStep, total: 3 })}</p>
                </div>

                <div className={styles.stepContainer}>
                    {currentStep === 1 && (
                        <div className={styles.step}>
                            <h2 className={styles.stepTitle}>
                                <span className={styles.stepIcon}>👤</span>
                                {t('register.steps.personal.title')}
                            </h2>
                            <p className={styles.stepDescription}>{t('register.steps.personal.subtitle')}</p>

                            <div className={styles.formGroup}>
                                <label htmlFor="fullname" className={styles.label}>{t('register.fullName')} *</label>
                                <input
                                    type="text"
                                    id="fullname"
                                    value={fullname}
                                    onChange={(e) => setFullname(e.target.value)}
                                    required
                                    className={`${styles.input} touch-target`}
                                    placeholder={t('register.placeholders.fullName')}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="username" className={styles.label}>{t('register.username')} *</label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className={`${styles.input} touch-target`}
                                    placeholder={t('register.placeholders.username')}
                                />
                                <p className={styles.inputHint}>{t('register.hints.username')}</p>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className={styles.step}>
                            <h2 className={styles.stepTitle}>
                                <span className={styles.stepIcon}>🔐</span>
                                {t('register.steps.account.title')}
                            </h2>
                            <p className={styles.stepDescription}>{t('register.steps.account.subtitle')}</p>

                            <div className={styles.formGroup}>
                                <label htmlFor="mail" className={styles.label}>{t('register.email')} *</label>
                                <input
                                    type="email"
                                    id="mail"
                                    value={mail}
                                    onChange={(e) => setMail(e.target.value)}
                                    required
                                    className={`${styles.input} touch-target`}
                                    placeholder={t('register.placeholders.email')}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="password" className={styles.label}>{t('register.password')} *</label>
                                <div className={styles.passwordInput}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className={`${styles.input} touch-target`}
                                        placeholder={t('register.placeholders.password')}
                                    />
                                    <button
                                        type="button"
                                        className={`${styles.passwordToggle} touch-target`}
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                
                                {/* Password Strength Indicator */}
                                {password && (
                                    <div className={styles.passwordStrength}>
                                        <div className={styles.strengthChecks}>
                                            <div className={`${styles.strengthCheck} ${passwordValidation.minLength ? styles.valid : ''}`}>
                                                {passwordValidation.minLength ? '✓' : '○'} {t('register.passwordChecks.length')}
                                            </div>
                                            <div className={`${styles.strengthCheck} ${passwordValidation.hasUpper ? styles.valid : ''}`}>
                                                {passwordValidation.hasUpper ? '✓' : '○'} {t('register.passwordChecks.uppercase')}
                                            </div>
                                            <div className={`${styles.strengthCheck} ${passwordValidation.hasLower ? styles.valid : ''}`}>
                                                {passwordValidation.hasLower ? '✓' : '○'} {t('register.passwordChecks.lowercase')}
                                            </div>
                                            <div className={`${styles.strengthCheck} ${passwordValidation.hasNumber ? styles.valid : ''}`}>
                                                {passwordValidation.hasNumber ? '✓' : '○'} {t('register.passwordChecks.number')}
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
                                {t('register.steps.confirm.title')}
                            </h2>
                            <p className={styles.stepDescription}>{t('register.steps.confirm.subtitle')}</p>

                            <div className={styles.summaryCard}>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryLabel}>{t('register.summary.fullName')}:</span>
                                    <span className={styles.summaryValue}>{fullname}</span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryLabel}>{t('register.summary.username')}:</span>
                                    <span className={styles.summaryValue}>{username}</span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryLabel}>{t('register.summary.email')}:</span>
                                    <span className={styles.summaryValue}>{mail}</span>
                                </div>
                            </div>

                            <div className={styles.termsSection}>
                                <div className={styles.termsText}>
                                    <p>{t('register.terms.agreement')}:</p>
                                    <ul>
                                        <li><button type="button" className={styles.termsLink}>{t('register.terms.service')}</button></li>
                                        <li><button type="button" className={styles.termsLink}>{t('register.terms.privacy')}</button></li>
                                        <li><button type="button" className={styles.termsLink}>{t('register.terms.medical')}</button></li>
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
                                {t('common.back')}
                            </button>
                        )}

                        {currentStep < 3 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className={`${styles.button} ${styles.buttonPrimary} touch-target`}
                            >
                                {t('common.next')}
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
                                        {t('register.creating')}
                                    </>
                                ) : (
                                    t('register.submit')
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
                    <h3 className={styles.demoTitle}>{t('register.demo.title')}</h3>
                    <p className={styles.demoDescription}>
                        {t('register.demo.description')}
                    </p>
                    <div className={styles.demoCredentials}>
                        <div className={styles.credentialItem}>
                            <span className={styles.credentialLabel}>{t('register.demo.email')}:</span>
                            <span className={styles.credentialValue}>patient1@seekwell.health</span>
                        </div>
                        <div className={styles.credentialItem}>
                            <span className={styles.credentialLabel}>{t('register.demo.password')}:</span>
                            <span className={styles.credentialValue}>PatientDemo2025</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className={styles.demoButton}
                    >
                        {t('register.demo.loginButton')}
                    </button>
                    <p className={styles.demoNote}>
                        {t('register.demo.note')}
                    </p>
                </div>

                <div className={styles.footerDivider}></div>

                <p className={styles.footerText}>
                    {t('register.hasAccount')}{' '}
                    <button
                        type="button"
                        onClick={handleLogin}
                        className={styles.linkButton}
                    >
                        {t('register.login')}
                    </button>
                </p>
                
                <div className={styles.securityInfo}>
                    <p className={styles.securityText}>
                        {t('register.security')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;