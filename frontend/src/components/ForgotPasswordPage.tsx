import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './ForgotPasswordPage.module.css';
import LanguageSwitcher from './common/LanguageSwitcher';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

const ForgotPasswordPage: React.FC = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await axios.post(BACKEND_URL + '/password/forgot-password/', { email });
            setMessage(response.data.message);
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || t('forgotPassword.errors.sendFailed'));
            } else {
                setError(t('common.error'));
            }
            console.error("Forgot password error:", err);
        }
        setLoading(false);
    };

    return (
        <div className={styles.container}>
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
                <LanguageSwitcher variant="icon" size="small" />
            </div>
            <div className={styles.card}>
                <h2 className={styles.heading}>{t('forgotPassword.title')}</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <p className={styles.subHeading}>{t('forgotPassword.subtitle')}</p>

                    
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={styles.input}
                        placeholder={t('forgotPassword.email')}
                    />

                    {message && <p style={{ color: 'green', textAlign: 'center', margin: '0' }}>{message}</p>}
                    {error && <p style={{ color: 'red', textAlign: 'center', margin: '0' }}>{error}</p>}
                    <button type="submit" disabled={loading} className={styles.button} style={{ backgroundColor: '#007bff' }}>
                        {loading ? t('forgotPassword.sending') : t('forgotPassword.submit')}
                    </button>
                </form>
                <div style={{ marginTop: '16px' }}>
                    <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>{t('forgotPassword.backToLogin')}</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
