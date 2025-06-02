import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css'; // Assuming you have a CSS file for styling

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

const Profile: React.FC = () => {
    const [userData, setUserData] = useState({
        fullname: '',
        username: '',
        mail: '',
        phone: '',
        address: '',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await axios.get(`${BACKEND_URL}/users/users/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setUserData(response.data);
            } catch (err) {
                if (axios.isAxiosError(err) && err.response) {
                    if (err.response.status === 401) {
                        setError('Authentication failed.');
                    } else {
                        setError(`Failed to fetch user data: ${err.response.data.detail || err.message}`);
                    }
                } else {
                    setError('An unexpected error occurred while fetching the user data.');
                }
                console.error("Error fetching user data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const displayValue = (value: string) => value && value.trim() !== '' ? value : '—';

    if (loading) {
        return <div className="profile-container">Loading...</div>;
    }

    if (error) {
        return <div className="profile-container">{error}</div>;
    }

    return (
        <div className="profile-container">
            <h1 className="profile-title">User Profile</h1>
            <div className="profile-details">
                <p><strong>Name:</strong> {displayValue(userData.fullname)}</p>
                <p><strong>Username:</strong> {displayValue(userData.username)}</p>
                <p><strong>Email:</strong> {displayValue(userData.mail)}</p>
                <p><strong>Phone:</strong> {displayValue(userData.phone)}</p>
                <p><strong>Address:</strong> {displayValue(userData.address)}</p>
            </div>
        </div>
    );
};

export default Profile;