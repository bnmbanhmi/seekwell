import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import { toast } from 'react-toastify';

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

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await axios.post(BACKEND_URL + '/auth/token/', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            if (response.data.access_token) {
                localStorage.setItem('accessToken', response.data.access_token);
                localStorage.setItem('role', response.data.role); // Store the role in localStorage
                localStorage.setItem('user_id', response.data.user_id); 
                toast.success(t('Đăng nhập thành công!'));
                navigate('/dashboard');
            }
            console.log("url:", BACKEND_URL + '/auth/token/');
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                const status = err.response.status;
                if (status === 401 || status === 403) {
                    setError('Email hoặc mật khẩu không đúng, hoặc vai trò không được phép.');
                    toast.error(t('Đăng nhập thất bại, vui lòng kiểm tra lại thông tin đăng nhập.'));
                } else {
                    setError(`Đăng nhập thất bại: ${err.response.data.detail || 'Lỗi máy chủ'}`);
                }
            } else {
                setError('Đăng nhập thất bại. Đã xảy ra lỗi không mong muốn.');
            }
            console.error("Login error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = () => {
        // Navigate to RegisterPage.tsx (usually mapped to '/register' route)
        navigate('/register');
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2 className={styles.heading}>Đăng nhập hệ thống</h2>
                <p className={styles.subHeading}>Quản lý phòng khám chuyên nghiệp và hiệu quả</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="username" className={styles.label}>Email</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className={styles.input}
                            placeholder="Nhập Email"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.label}>Mật khẩu</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className={styles.input}
                            placeholder="Nhập mật khẩu"
                        />
                    </div>

                    {error && (
                        <p className={styles.errorText}>{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={styles.button}
                        style={{ backgroundColor: '#007bff'}}
                    >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>

                    <button
                        type="button"
                        onClick={handleRegister}
                        className={styles.button}
                        style={{ backgroundColor: '#6c757d'}}
                    >
                        Đăng ký tài khoản
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
