import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './LoginPageMobile.module.css';
import { toast } from 'react-toastify';
import { API_CONFIG } from '../config/api';
import LanguageSwitcher from './common/LanguageSwitcher';

const LoginPage: React.FC = () => {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await axios.post(API_CONFIG.BACKEND_URL + '/auth/token', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            if (response.data.access_token) {
                localStorage.setItem('accessToken', response.data.access_token);
                localStorage.setItem('role', response.data.role);
                localStorage.setItem('user_id', response.data.user_id);
                
                toast.success(t('login.success'));
                navigate('/dashboard');
            }
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                const status = err.response.status;
                if (status === 401 || status === 403) {
                    setError(t('login.errors.invalidCredentials'));
                    toast.error(t('login.errors.invalidCredentials'));
                } else {
                    setError(`${t('common.error')}: ${err.response.data.detail || t('login.errors.serverError')}`);
                }
            } else {
                setError(t('login.errors.serverError'));
            }
            console.error("Login error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = () => {
        navigate('/register');
    };

    return (
        <div className={`${styles.container} mobile-container safe-area-top`}>
            <div className={styles.card}>
                {/* Language Switcher */}
                <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                    <LanguageSwitcher variant="icon" size="small" />
                </div>
                
                {/* SeekWell Branding */}
                <div className={styles.brandingSection}>
                    <h1 className={`${styles.appName} mobile-heading-responsive`}>{t('appName')}</h1>
                    <p className={`${styles.tagline} mobile-text-responsive`}>
                        {t('tagline')}
                    </p>
                </div>

                <div className={styles.loginSection}>
                    <h2 className={`${styles.heading} mobile-text-xl`}>{t('login.title')}</h2>
                    <p className={`${styles.subHeading} mobile-text-sm`}>
                        {t('login.subtitle')}
                    </p>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="username" className={`${styles.label} mobile-text-base`}>
                                {t('login.username')}
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className={`${styles.input} touch-target`}
                                placeholder={t('login.username')}
                                autoComplete="email"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="password" className={`${styles.label} mobile-text-base`}>
                                {t('login.password')}
                            </label>
                            <div className={styles.passwordInputGroup}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className={`${styles.input} ${styles.passwordInput} touch-target`}
                                    placeholder={t('login.password')}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className={`${styles.passwordToggle} touch-target`}
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                                >
                                    {showPassword ? t('login.hidePassword').split(' ')[0] : t('login.showPassword').split(' ')[0]}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className={`${styles.errorText} mobile-text-sm`}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`${styles.button} ${styles.primaryButton} mobile-button touch-target haptic-medium`}
                        >
                            {loading ? (
                                <>
                                    <span className={styles.spinner}></span>
                                    {t('common.loading')}
                                </>
                            ) : (
                                t('login.submit')
                            )}
                        </button>

                        <div className={styles.divider}>
                            <span className="mobile-text-sm">{t('common.or') || 'or'}</span>
                        </div>

                        <button
                            type="button"
                            onClick={handleRegister}
                            className={`${styles.button} ${styles.secondaryButton} mobile-button touch-target haptic-light`}
                        >
                            {t('login.register')}
                        </button>

                        <div className={styles.forgotPassword}>
                            <Link 
                                to="/forgot-password" 
                                className={`${styles.link} mobile-text-sm touch-target`}
                            >
                                {t('login.forgotPassword')}
                            </Link>
                        </div>

                        {/* Demo Account Section */}
                        <div className={styles.demoSection}>
                            <h3 className="mobile-text-lg" style={{ margin: '0 0 12px 0', color: '#374151', fontWeight: '600' }}>
                                🚀 Try SeekWell Instantly
                            </h3>
                            <p className="mobile-text-sm" style={{ margin: '0 0 16px 0', color: '#64748b' }}>
                                Use our demo patient account to explore SeekWell's features:
                            </p>
                            
                            <div style={{
                                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                border: '2px solid #22c55e',
                                borderRadius: '12px',
                                padding: '16px',
                                marginBottom: '16px'
                            }}>
                                <div style={{ textAlign: 'left', marginBottom: '12px' }}>
                                    <strong style={{ color: '#16a34a', fontSize: '0.875rem' }}>Email:</strong>
                                    <div style={{
                                        fontFamily: 'monospace',
                                        background: 'rgba(255,255,255,0.8)',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        border: '1px solid #d1d5db',
                                        marginTop: '4px',
                                        fontSize: '0.875rem'
                                    }}>
                                        patient1@seekwell.health
                                    </div>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <strong style={{ color: '#16a34a', fontSize: '0.875rem' }}>Password:</strong>
                                    <div style={{
                                        fontFamily: 'monospace',
                                        background: 'rgba(255,255,255,0.8)',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        border: '1px solid #d1d5db',
                                        marginTop: '4px',
                                        fontSize: '0.875rem'
                                    }}>
                                        PatientDemo2025
                                    </div>
                                </div>
                            </div>
                            
                            <button
                                type="button"
                                onClick={() => {
                                    setUsername('patient1@seekwell.health');
                                    setPassword('PatientDemo2025');
                                }}
                                className={`${styles.button} ${styles.secondaryButton} mobile-button touch-target haptic-light`}
                                style={{ fontSize: '0.875rem' }}
                            >
                                Fill Demo Credentials
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
