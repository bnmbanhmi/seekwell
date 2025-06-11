import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import styles from './LoginPageMobile.module.css';
import { toast } from 'react-toastify';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

const LoginPage: React.FC = () => {
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

            const response = await axios.post(BACKEND_URL + '/auth/token', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            if (response.data.access_token) {
                localStorage.setItem('accessToken', response.data.access_token);
                localStorage.setItem('role', response.data.role);
                localStorage.setItem('user_id', response.data.user_id);
                
                toast.success('Welcome to SeekWell! 🎉');
                navigate('/dashboard');
            }
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                const status = err.response.status;
                if (status === 401 || status === 403) {
                    setError('Invalid credentials or unauthorized access');
                    toast.error('Login failed. Please check your credentials.');
                } else {
                    setError(`Login failed: ${err.response.data.detail || 'Server error'}`);
                }
            } else {
                setError('Login failed. An unexpected error occurred.');
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
                {/* SeekWell Branding */}
                <div className={styles.brandingSection}>
                    <h1 className={`${styles.appName} mobile-heading-responsive`}>SeekWell</h1>
                    <p className={`${styles.tagline} mobile-text-responsive`}>
                        AI-Powered Health Companion
                    </p>
                </div>

                <div className={styles.loginSection}>
                    <h2 className={`${styles.heading} mobile-text-xl`}>Welcome Back</h2>
                    <p className={`${styles.subHeading} mobile-text-sm`}>
                        Sign in to access your health dashboard
                    </p>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="username" className={`${styles.label} mobile-text-base`}>
                                Email
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className={`${styles.input} touch-target`}
                                placeholder="Enter your email"
                                autoComplete="email"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="password" className={`${styles.label} mobile-text-base`}>
                                Password
                            </label>
                            <div className={styles.passwordInputGroup}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className={`${styles.input} ${styles.passwordInput} touch-target`}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className={`${styles.passwordToggle} touch-target`}
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
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
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        <div className={styles.divider}>
                            <span className="mobile-text-sm">or</span>
                        </div>

                        <button
                            type="button"
                            onClick={handleRegister}
                            className={`${styles.button} ${styles.secondaryButton} mobile-button touch-target haptic-light`}
                        >
                            Create Account
                        </button>

                        <div className={styles.forgotPassword}>
                            <Link 
                                to="/forgot-password" 
                                className={`${styles.link} mobile-text-sm touch-target`}
                            >
                                Forgot Password?
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Quick Access for Demo */}
                <div className={styles.demoSection}>
                    <p className="mobile-text-xs" style={{ color: '#666', textAlign: 'center' }}>
                        Demo: Try patient@demo.com / password123
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
