import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './LoginPageMobile.module.css';
import { toast } from 'react-toastify';
import { API_CONFIG } from '../config/api';

const LoginPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'vi' ? 'en' : 'vi';
        i18n.changeLanguage(newLang);
        localStorage.setItem('preferredLanguage', newLang);
    };

    const handleDemoLogin = async () => {
        setError('');
        setLoading(true);

        try {
            const formData = new URLSearchParams();
            formData.append('username', '0903456781'); // Phone number of patient1
            formData.append('password', '123456');

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
            console.error("Demo login error:", err);
            setError(t('login.errors.serverError'));
            toast.error(t('login.errors.serverError'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        if (!phoneNumber) {
            setError(t('login.errors.phoneRequired'));
            setLoading(false);
            return;
        }
        if (!password) {
            setError(t('login.errors.passwordRequired'));
            setLoading(false);
            return;
        }

        try {
            const loginFormData = new URLSearchParams();
            loginFormData.append('username', phoneNumber);
            loginFormData.append('password', password);

            try {
                const loginResponse = await axios.post(API_CONFIG.BACKEND_URL + '/auth/token', loginFormData, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });

                if (loginResponse.data.access_token) {
                    localStorage.setItem('accessToken', loginResponse.data.access_token);
                    localStorage.setItem('role', loginResponse.data.role);
                    localStorage.setItem('user_id', loginResponse.data.user_id);
                    
                    toast.success(t('login.success'));
                    navigate('/dashboard');
                }
            } catch (loginErr: any) {
                if (axios.isAxiosError(loginErr) && loginErr.response?.status === 401) {
                    if (!fullName) {
                        setError(t('login.errors.fullNameRequired'));
                        setLoading(false);
                        return;
                    }

                    const registerData = {
                        username: phoneNumber,
                        email: `${phoneNumber}@seekwell.temp`,
                        full_name: fullName,
                        password: password,
                        role: 'PATIENT'
                    };

                    const registerResponse = await axios.post(
                        API_CONFIG.BACKEND_URL + '/auth/register/',
                        registerData,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        }
                    );

                    if (registerResponse.status === 200) {
                        const autoLoginFormData = new URLSearchParams();
                        autoLoginFormData.append('username', phoneNumber);
                        autoLoginFormData.append('password', password);

                        const autoLoginResponse = await axios.post(
                            API_CONFIG.BACKEND_URL + '/auth/token',
                            autoLoginFormData,
                            {
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                            }
                        );

                        if (autoLoginResponse.data.access_token) {
                            localStorage.setItem('accessToken', autoLoginResponse.data.access_token);
                            localStorage.setItem('role', autoLoginResponse.data.role);
                            localStorage.setItem('user_id', autoLoginResponse.data.user_id);
                            
                            toast.success(t('login.success'));
                            navigate('/dashboard');
                        }
                    }
                } else {
                    throw loginErr;
                }
            }
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                const status = err.response.status;
                if (status === 401 || status === 403) {
                    setError(t('login.errors.invalidCredentials'));
                    toast.error(t('login.errors.invalidCredentials'));
                } else if (status === 400) {
                    const detail = err.response.data.detail;
                    if (detail.includes('already registered') || detail.includes('Username already')) {
                        setError(t('login.errors.invalidCredentials'));
                        toast.error(t('login.errors.invalidCredentials'));
                    } else {
                        setError(`${t('common.error')}: ${detail}`);
                    }
                } else {
                    setError(t('login.errors.serverError'));
                }
            } else {
                setError(t('login.errors.serverError'));
            }
            console.error("Login/Register error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${styles.container} mobile-container safe-area-top`}>
            <div className={styles.card}>
                <button
                    onClick={toggleLanguage}
                    className={styles.languageSwitcher}
                    type="button"
                >
                    {t('login.languageSwitcher')}
                </button>
                
                <div className={styles.brandingSection}>
                    <h1 className={`${styles.appName} mobile-heading-responsive`}>{t('appName')}</h1>
                    <p className={`${styles.tagline} mobile-text-responsive`}>
                        {t('tagline')}
                    </p>
                </div>

                <div className={styles.loginSection}>
                    <h2 className={`${styles.heading} mobile-text-xl`}>{t('login.title')}</h2>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <input
                                type="text"
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className={`${styles.input} touch-target`}
                                placeholder={t('login.fullNamePlaceholder')}
                                autoComplete="name"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <input
                                type="tel"
                                id="phoneNumber"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                                className={`${styles.input} touch-target`}
                                placeholder={t('login.phoneNumberPlaceholder')}
                                autoComplete="tel"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <input
                                type="text"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className={`${styles.input} touch-target`}
                                placeholder={t('login.passwordPlaceholder')}
                                autoComplete="current-password"
                            />
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

                        <button
                            type="button"
                            onClick={handleDemoLogin}
                            disabled={loading}
                            className={`${styles.button} ${styles.secondaryButton} mobile-button touch-target haptic-light`}
                        >
                            {t('login.tryDemo')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
