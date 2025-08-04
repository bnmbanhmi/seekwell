import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './Profile.module.css'; // Import CSS module

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

// Define all possible fields for user profile
interface UserProfileForm {
    full_name: string;
    username: string;
    email: string;
    phone: string;
    phone_number?: string;
    address: string;
    password?: string;
    date_of_birth?: string;
    gender?: string;
    ethnic_group?: string;
    health_insurance_card_no?: string;
    identification_id?: string;
    job?: string;
    class_role?: string;
    // Doctor fields
    doctor_name?: string;
    major?: string;
    hospital_id?: number | string;
    // Patient fields
    patient_id?: number;
}

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState<UserProfileForm>({
        full_name: '',
        username: '',
        email: '',
        phone: '',
        address: '',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<UserProfileForm>({ ...userData });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const role = localStorage.getItem('role');
                
                let endpoint = `${BACKEND_URL}/users/me`;
                
                // For patients, we might want to use a different approach
                // but /users/me should work for all roles based on backend logic
                
                const response = await axios.get(endpoint, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                const data = response.data;
                console.log("Raw user data fetched:", data);
                
                // Transform data based on structure
                let userData: UserProfileForm;
                
                if (role === 'PATIENT' && data.user) {
                    // Patient data has nested user structure
                    userData = {
                        full_name: data.user.full_name || '',
                        username: data.user.username || '',
                        email: data.user.email || '',
                        phone: data.phone_number || '',
                        phone_number: data.phone_number || '',
                        address: data.address || '',
                        date_of_birth: data.date_of_birth || '',
                        gender: data.gender || '',
                        identification_id: data.identification_id || '',
                        health_insurance_card_no: data.health_insurance_card_no || '',
                        // Include patient_id for updates
                        ...(data.patient_id && { patient_id: data.patient_id })
                    };
                } else {
                    // Other users have direct structure
                    userData = {
                        full_name: data.full_name || '',
                        username: data.username || '',
                        email: data.email || '',
                        phone: data.phone_number || data.phone || '',
                        phone_number: data.phone_number || data.phone || '',
                        address: data.address || '',
                        date_of_birth: data.date_of_birth || '',
                        gender: data.gender || '',
                        // Doctor fields
                        doctor_name: data.doctor_name || '',
                        major: data.major || '',
                        hospital_id: data.hospital_id || '',
                        // Other possible fields
                        ethnic_group: data.ethnic_group || '',
                        identification_id: data.identification_id || '',
                        job: data.job || '',
                        class_role: data.class_role || ''
                    };
                }
                
                setUserData(userData);
                console.log("Transformed user data:", userData);
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

    useEffect(() => {
        setFormData({ ...userData });
    }, [userData]);

    const displayValue = (value: string) => value && value.trim() !== '' ? value : '—';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleEdit = () => {
        setEditMode(true);
        setError('');
    };

    const handleCancel = () => {
        setEditMode(false);
        setFormData({ ...userData });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('accessToken');
            const role = localStorage.getItem('role');
            
            // Prepare payload: merge phone and phone_number, remove empty fields
            const payload: { [key: string]: any } = { ...formData };
            if (payload.phone && !payload.phone_number) payload.phone_number = payload.phone;
            delete payload.phone;
            if (!payload.password) delete payload.password;
            Object.keys(payload).forEach((k) => { if (payload[k] === '' || payload[k] === undefined) delete payload[k]; });
            
            // For patients, use patient-specific update endpoint
            if (role === 'PATIENT' && 'patient_id' in userData) {
                const patientId = (userData as any).patient_id;
                await axios.put(`${BACKEND_URL}/patients/${patientId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                // For other roles, use general user update endpoint
                // Only send fields that UserUpdate schema accepts
                const userUpdateFields = ['username', 'email', 'full_name'];
                const filteredPayload = Object.keys(payload)
                    .filter(key => userUpdateFields.includes(key))
                    .reduce((obj: any, key) => {
                        obj[key] = payload[key];
                        return obj;
                    }, {});
                    
                await axios.put(`${BACKEND_URL}/users/me`, filteredPayload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            
            setUserData((prev) => ({ ...prev, ...payload }));
            toast.success('Profile updated successfully!');
            setEditMode(false);
        } catch (err) {
            let msg = 'An unexpected error occurred while updating the profile.';
            if (axios.isAxiosError(err) && err.response) {
                msg = err.response.data.detail || err.message;
            }
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // Helper to safely display possibly undefined values
    const safeDisplay = (value: string | undefined) => (value && value.trim() !== '' ? value : '—');

    // Helper to render fields dynamically
    const renderProfileDetails = () => {
        if ('doctor_id' in userData) {
            // Doctor
            const doctorData = userData as any;
            return (
                <>
                    <p><strong>Name:</strong> {safeDisplay(doctorData.doctor_name || doctorData.full_name)}</p>
                    <p><strong>Username:</strong> {safeDisplay(doctorData.username)}</p>
                    <p><strong>Email:</strong> {safeDisplay(doctorData.email)}</p>
                    <p><strong>Specialty:</strong> {safeDisplay(doctorData.major)}</p>
                    <p><strong>Hospital ID:</strong> {safeDisplay(doctorData.hospital_id?.toString())}</p>
                </>
            );
        } else if ('patient_id' in userData) {
            // Patient
            const patientData = userData as any;
            return (
                <>
                    <p><strong>Name:</strong> {safeDisplay(patientData.full_name)}</p>
                    <p><strong>Username:</strong> {safeDisplay(patientData.username)}</p>
                    <p><strong>Email:</strong> {safeDisplay(patientData.email)}</p>
                    <p><strong>Phone Number:</strong> {safeDisplay(patientData.phone_number)}</p>
                    <p><strong>Address:</strong> {safeDisplay(patientData.address)}</p>
                    <p><strong>Date of Birth:</strong> {safeDisplay(patientData.date_of_birth)}</p>
                    <p><strong>Gender:</strong> {safeDisplay(patientData.gender)}</p>
                    <p><strong>Ethnic Group:</strong> {safeDisplay(patientData.ethnic_group)}</p>
                    <p><strong>Health Insurance Card:</strong> {safeDisplay(patientData.health_insurance_card_no)}</p>
                    <p><strong>ID Number:</strong> {safeDisplay(patientData.identification_id)}</p>
                    <p><strong>Occupation:</strong> {safeDisplay(patientData.job)}</p>
                    <p><strong>Patient Class:</strong> {safeDisplay(patientData.class_role)}</p>
                </>
            );
        } else {
            // Generic user
            return (
                <>
                    <p><strong>Name:</strong> {safeDisplay(userData.full_name)}</p>
                    <p><strong>Username:</strong> {safeDisplay(userData.username)}</p>
                    <p><strong>Email:</strong> {safeDisplay(userData.email)}</p>
                    <p><strong>Phone Number:</strong> {safeDisplay(userData.phone)}</p>
                    <p><strong>Address:</strong> {safeDisplay(userData.address)}</p>
                </>
            );
        }
    };

    const renderEditForm = () => {
        if ('doctor_id' in userData) {
            // Doctor edit form
            return (
                <form className={styles['profile-form']} onSubmit={handleSubmit}>
                    <label className={styles['profile-label']}>
                        Name:
                        <input name="doctor_name" value={formData.doctor_name || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Username:
                        <input name="username" value={formData.username || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Email:
                        <input name="email" value={formData.email || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Specialty:
                        <input name="major" value={formData.major || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Hospital ID:
                        <input name="hospital_id" value={formData.hospital_id || ''} onChange={handleChange} className={styles['profile-input']} type="number" disabled />
                    </label>
                    <label className={styles['profile-label']}>
                        New Password:
                        <input name="password" type="password" value={formData.password || ''} onChange={handleChange} autoComplete="new-password" className={styles['profile-input']} />
                    </label>
                    <div className={styles['profile-form-actions']}>
                        <button type="submit" disabled={loading} className={styles['profile-button']}>Save</button>
                        <button type="button" onClick={handleCancel} disabled={loading} className={styles['profile-button-cancel']}>Cancel</button>
                    </div>
                </form>
            );
        } else if ('patient_id' in userData) {
            // Patient edit form
            return (
                <form className={styles['profile-form']} onSubmit={handleSubmit}>
                    <label className={styles['profile-label']}>
                        Name:
                        <input name="full_name" value={formData.full_name} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Username:
                        <input name="username" value={formData.username || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Email:
                        <input name="email" value={formData.email || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Phone Number:
                        <input name="phone" value={formData.phone || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Address:
                        <input name="address" value={formData.address || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Date of Birth:
                        <input name="date_of_birth" value={formData.date_of_birth || ''} onChange={handleChange} type="date" className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Gender:
                        <select name="gender" value={formData.gender || ''} onChange={handleChange} className={styles['profile-input']}>
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </label>
                    <label className={styles['profile-label']}>
                        Ethnicity:
                        <input name="ethnic_group" value={formData.ethnic_group || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Health Insurance Card No:
                        <input name="health_insurance_card_no" value={formData.health_insurance_card_no || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        ID Card Number:
                        <input name="identification_id" value={formData.identification_id || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Occupation:
                        <input name="job" value={formData.job || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Patient Category:
                        <select name="class_role" value={formData.class_role || ''} onChange={handleChange} className={styles['profile-input']}>
                            <option value="">Select</option>
                            <option value="Assisted">Assisted</option>
                            <option value="Normal">Normal</option>
                            <option value="Free">Free</option>
                            <option value="Other">Other</option>
                        </select>
                    </label>
                    <label className={styles['profile-label']}>
                        New Password:
                        <input name="password" type="password" value={formData.password || ''} onChange={handleChange} autoComplete="new-password" className={styles['profile-input']} />
                    </label>
                    <div className={styles['profile-form-actions']}>
                        <button type="submit" disabled={loading} className={styles['profile-button']}>Save</button>
                        <button type="button" onClick={handleCancel} disabled={loading} className={styles['profile-button-cancel']}>Cancel</button>
                    </div>
                </form>
            );
        } else {
            // Generic user edit form
            return (
                <form className={styles['profile-form']} onSubmit={handleSubmit}>
                    <label className={styles['profile-label']}>
                        Name:
                        <input name="full_name" value={formData.full_name} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Username:
                        <input name="username" value={formData.username || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Email:
                        <input name="email" value={formData.email || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Phone Number:
                        <input name="phone" value={formData.phone || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Address:
                        <input name="address" value={formData.address || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        New Password:
                        <input name="password" type="password" value={formData.password || ''} onChange={handleChange} autoComplete="new-password" className={styles['profile-input']} />
                    </label>
                    <div className={styles['profile-form-actions']}>
                        <button type="submit" disabled={loading} className={styles['profile-button']}>Save</button>
                        <button type="button" onClick={handleCancel} disabled={loading} className={styles['profile-button-cancel']}>Cancel</button>
                    </div>
                </form>
            );
        }
    };

    if (loading) {
        return <div className={styles['profile-container']}>Loading...</div>;
    }

    if (error) {
        return <div className={styles['profile-container']}>{error}</div>;
    }

    return (
        <div className={styles['profile-container']}>
            <h1 className={styles['profile-title']}>User Profile</h1>
            {error && <div className={styles['profile-error']}>{error}</div>}
            {editMode ? (
                renderEditForm()
            ) : (
                <div className={styles['profile-details']}>
                    {renderProfileDetails()}
                    <button onClick={handleEdit} className={styles['profile-button']}>Edit Profile</button>
                </div>
            )}
        </div>
    );
};

export default Profile;