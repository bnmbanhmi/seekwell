// components/dashboardLayout/Sidebar.tsx
import React from 'react';
// import Link from 'next/link';
import { Link } from 'react-router-dom'; // Correct import

import { UserRole } from '../../types/UserType'; // Adjust the import path as necessary

import './Sidebar.css'; // Assuming you have a CSS file for styles

type Props = {
  role: UserRole;
};

const sidebarItems: Record<Props['role'], { label: string; path: string }[]> = {
  PATIENT: [
    { label: 'Bảng điều khiển', path: '/dashboard' },
    { label: 'AI Skin Analysis', path: '/dashboard/ai-analysis' },
    { label: 'Tư vấn khẩn cấp', path: '/dashboard/appointments/high-risk' },
    { label: 'Đặt lịch khám', path: '/dashboard/appointments/book' },
    { label: 'Lịch khám của tôi', path: '/dashboard/appointments' },
    { label: 'Đơn thuốc', path: '/dashboard/prescriptions' },
    { label: 'Lịch sử khám bệnh', path: '/dashboard/records' },
  ],
  DOCTOR: [
    { label: 'Bảng điều khiển', path: '/dashboard' },
    { label: 'AI Skin Analysis', path: '/dashboard/ai-analysis' },
    { label: 'Tư vấn khẩn cấp', path: '/dashboard/appointments/high-risk' },
    { label: 'Lịch trình của tôi', path: '/dashboard/schedule' },
    { label: 'Danh sách bệnh nhân', path: '/dashboard/patients' },
    { label: 'Hồ sơ bệnh án', path: '/dashboard/records' },
    { label: 'Tạo hồ sơ mới', path: '/dashboard/create_records' },
  ],
  LOCAL_CADRE: [
    { label: 'Bảng điều khiển', path: '/dashboard' },
    { label: 'AI Skin Analysis', path: '/dashboard/ai-analysis' },
    { label: 'Tư vấn khẩn cấp', path: '/dashboard/appointments/high-risk' },
    { label: 'Sắp xếp lịch hẹn', path: '/dashboard/appointments/schedule' },
    { label: 'Đăng ký / Thanh toán', path: '/dashboard/checkin' },
    { label: 'Đăng ký bệnh nhân', path: '/dashboard/patients' },
    { label: 'Tin nhắn', path: '/dashboard/messages' },
  ],
  ADMIN: [
    { label: 'Bảng điều khiển', path: '/dashboard' },
    { label: 'AI Skin Analysis', path: '/dashboard/ai-analysis' },
    { label: 'Quản lý người dùng', path: '/dashboard/users' },
    { label: 'Cài đặt lịch trình', path: '/dashboard/schedule-settings' },
    { label: 'Báo cáo & Phân tích', path: '/dashboard/reports' },
    { label: 'Nhật ký hệ thống', path: '/dashboard/logs' },
  ],
};

const Sidebar: React.FC<Props> = ({ role }) => {
  const items = sidebarItems[role];

  return (
    <nav className="nav-container">
      <img
        src="/logo.png"
        alt="Logo phòng khám"
        className="nav-logo"
      />
      <h2 className="nav-title">Điều hướng</h2>

      <hr className="nav-divider" />

      <ul className="nav-list">
        {items.map((item) => (
          <li key={item.label}>
            <Link to={item.path} className="nav-link">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Sidebar;