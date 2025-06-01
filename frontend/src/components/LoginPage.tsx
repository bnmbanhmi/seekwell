import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.heading}>Đăng nhập hệ thống</h2>
                <p style={styles.subHeading}>Quản lý phòng khám chuyên nghiệp và hiệu quả</p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label htmlFor="username" style={styles.label}>Email</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={styles.input}
                            placeholder="Nhập Email"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="password" style={styles.label}>Mật khẩu</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={styles.input}
                            placeholder="Nhập mật khẩu"
                        />
                    </div>

                    {error && (
                        <p style={styles.errorText}>{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ ...styles.button, backgroundColor: '#007bff' }}
                    >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>

                    <button
                        type="button"
                        onClick={handleRegister}
                        style={{ ...styles.button, backgroundColor: '#6c757d' }}
                    >
                        Đăng ký tài khoản
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(to right, #eef2f3, #8e9eab)',
        padding: '20px',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        padding: '32px',
        maxWidth: '400px',
        width: '100%',
        boxSizing: 'border-box',
    },
    heading: {
        textAlign: 'center',
        marginBottom: '12px',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333',
    },
    subHeading: {
        textAlign: 'center',
        marginBottom: '24px',
        color: '#666',
        fontSize: '14px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        marginBottom: '6px',
        fontWeight: 500,
        color: '#333',
    },
    input: {
        padding: '10px 12px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        fontSize: '14px',
        outlineColor: '#007bff',
    },
    button: {
        padding: '12px',
        color: '#fff',
        fontSize: '15px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    errorText: {
        color: 'red',
        fontSize: '14px',
        textAlign: 'center',
        marginTop: '-8px',
        marginBottom: '8px',
    },
};

export default LoginPage;
