import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { UserRole } from '../../types/UserType';
import styles from './UserManagement.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface User {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
}

interface CreateUserForm {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
}

interface EditUserForm {
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'ALL'>('ALL');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: UserRole.PATIENT
  });
  
  const [editForm, setEditForm] = useState<EditUserForm>({
    username: '',
    email: '',
    full_name: '',
    role: UserRole.PATIENT
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BACKEND_URL}/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching users:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(`Failed to load users: ${err.response.data.detail || err.message}`);
      } else {
        setError('An unexpected error occurred while fetching users.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${BACKEND_URL}/users/`, createForm, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      toast.success('User created successfully!');
      setShowCreateModal(false);
      setCreateForm({
        username: '',
        email: '',
        full_name: '',
        password: '',
        role: UserRole.PATIENT
      });
      fetchUsers(); // Refresh the user list
    } catch (err: any) {
      console.error('Error creating user:', err);
      if (axios.isAxiosError(err) && err.response) {
        toast.error(`Failed to create user: ${err.response.data.detail || err.message}`);
      } else {
        toast.error('An unexpected error occurred while creating the user.');
      }
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`${BACKEND_URL}/users/${userToEdit.user_id}`, editForm, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      toast.success('User updated successfully!');
      setShowEditModal(false);
      setUserToEdit(null);
      fetchUsers(); // Refresh the user list
    } catch (err: any) {
      console.error('Error updating user:', err);
      if (axios.isAxiosError(err) && err.response) {
        toast.error(`Failed to update user: ${err.response.data.detail || err.message}`);
      } else {
        toast.error('An unexpected error occurred while updating the user.');
      }
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!window.confirm(`Are you sure you want to delete the user "${username}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${BACKEND_URL}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      toast.success('User deleted successfully!');
      fetchUsers(); // Refresh the user list
    } catch (err: any) {
      console.error('Error deleting user:', err);
      if (axios.isAxiosError(err) && err.response) {
        toast.error(`Failed to delete user: ${err.response.data.detail || err.message}`);
      } else {
        toast.error('An unexpected error occurred while deleting the user.');
      }
    }
  };

  const openEditModal = (user: User) => {
    setUserToEdit(user);
    setEditForm({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    });
    setShowEditModal(true);
  };

  // Filter users based on search term and selected role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'ALL' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return styles.roleAdmin;
      case UserRole.DOCTOR: return styles.roleDoctor;
      case UserRole.OFFICIAL: return styles.roleStaff; // Using 'roleStaff' style for 'OFFICIAL'
      case UserRole.PATIENT: return styles.rolePatient;
      default: return styles.roleDefault;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải danh sách người dùng...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Quản lý người dùng</h2>
        <button 
          className={styles.createButton}
          onClick={() => setShowCreateModal(true)}
        >
          Tạo người dùng mới
        </button>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* Search and Filter Controls */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Tìm kiếm người dùng theo tên đăng nhập, email hoặc họ tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterContainer}>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole | 'ALL')}
            className={styles.roleFilter}
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="PATIENT">Bệnh nhân</option>
            <option value="DOCTOR">Bác sĩ</option>
            <option value="LOCAL_CADRE">Cán bộ y tế địa phương</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã ID</th>
              <th>Tên đăng nhập</th>
              <th>Email</th>
              <th>Họ và tên</th>
              <th>Vai trò</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.user_id} className={styles.tableRow}>
                  <td>{user.user_id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.full_name}</td>
                  <td>
                    <span className={`${styles.roleBadge} ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.editButton}
                        onClick={() => openEditModal(user)}
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteUser(user.user_id, user.username)}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className={styles.noData}>
                  Không tìm thấy người dùng nào phù hợp với tiêu chí.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Tạo người dùng mới</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateUser} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="create-username">Tên đăng nhập:</label>
                <input
                  id="create-username"
                  type="text"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({...createForm, username: e.target.value})}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="create-email">Email:</label>
                <input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="create-fullname">Họ và tên:</label>
                <input
                  id="create-fullname"
                  type="text"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({...createForm, full_name: e.target.value})}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="create-password">Mật khẩu:</label>
                <input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="create-role">Vai trò:</label>
                <select
                  id="create-role"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({...createForm, role: e.target.value as UserRole})}
                  className={styles.select}
                >
                  <option value="PATIENT">Bệnh nhân</option>
                  <option value="DOCTOR">Bác sĩ</option>
                  <option value="LOCAL_CADRE">Cán bộ y tế địa phương</option>
                  <option value="ADMIN">Quản trị viên</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowCreateModal(false)} className={styles.cancelButton}>
                  Hủy
                </button>
                <button type="submit" className={styles.submitButton}>
                  Tạo người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && userToEdit && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Chỉnh sửa người dùng: {userToEdit.username}</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditUser} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="edit-username">Tên đăng nhập:</label>
                <input
                  id="edit-username"
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="edit-email">Email:</label>
                <input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="edit-fullname">Họ và tên:</label>
                <input
                  id="edit-fullname"
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="edit-role">Vai trò:</label>
                <select
                  id="edit-role"
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value as UserRole})}
                  className={styles.select}
                >
                  <option value="PATIENT">Bệnh nhân</option>
                  <option value="DOCTOR">Bác sĩ</option>
                  <option value="LOCAL_CADRE">Cán bộ y tế địa phương</option>
                  <option value="ADMIN">Quản trị viên</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowEditModal(false)} className={styles.cancelButton}>
                  Hủy
                </button>
                <button type="submit" className={styles.submitButton}>
                  Cập nhật người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
