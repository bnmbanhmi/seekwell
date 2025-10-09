import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './common/LanguageSwitcher';

const ResetPasswordPage: React.FC = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [token, setToken] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const resetToken = searchParams.get('token');
        if (resetToken) {
            setToken(resetToken);
        } else {
            setError(t('resetPassword.errors.invalidToken'));
            // Optionally redirect or disable form
        }
    }, [searchParams, t]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (newPassword !== confirmPassword) {
            setError(t('resetPassword.errors.passwordMismatch'));
            return;
        }
        if (!token) {
            setError(t('resetPassword.errors.invalidToken'));
            return;
        }
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await axios.post('http://127.0.0.1:8000/password/reset-password', {
                token,
                new_password: newPassword,
            });
            setMessage(response.data.message + " " + t('resetPassword.canLoginNow'));
            // Optionally redirect to login after a delay
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || t('resetPassword.errors.resetFailed'));
            } else {
                setError(t('common.error'));
            }
            console.error("Reset password error:", err);
        }
        setLoading(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', boxSizing: 'border-box', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
                <LanguageSwitcher variant="icon" size="small" />
            </div>
            <h2>{t('resetPassword.title')}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '320px', gap: '12px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                {!token && error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                {token && (
                    <>
                        <div>
                            <label htmlFor="newPassword" style={{ marginBottom: '4px', display: 'block' }}>{t('resetPassword.newPassword')}:</label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" style={{ marginBottom: '4px', display: 'block' }}>{t('resetPassword.confirmPassword')}:</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                        </div>
                        {message && <p style={{ color: 'green', textAlign: 'center', margin: '0' }}>{message}</p>}
                        {error && !message && <p style={{ color: 'red', textAlign: 'center', margin: '0' }}>{error}</p>}
                        <button type="submit" disabled={loading || !token || !!message} style={{ padding: '10px 15px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px' }}>
                            {loading ? t('resetPassword.resetting') : t('resetPassword.submit')}
                        </button>
                    </>
                )}
            </form>
        </div>
    );
};

export default ResetPasswordPage;
