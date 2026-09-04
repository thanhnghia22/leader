import React from 'react';
import { Menu, LogOut, User, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './Header.css';

export function Header({ onToggleSidebar, isSidebarCollapsed }) {
  const { user, logout } = useAuth();

  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' };
  const formattedToday = today.toLocaleDateString('vi-VN', options);

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
          title="Thu gọn / Mở rộng thanh điều hướng"
        >
          <Menu size={20} />
        </button>
        <div className="header-date">
          <span className="date-badge">Hôm nay: {formattedToday}</span>
        </div>
      </div>

      <div className="header-right">
        <div className="user-profile">
          <div className="user-avatar">
            <User size={18} />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Leader'}</span>
            <span className="user-role">Quản lý</span>
          </div>
        </div>

        <button
          type="button"
          className="header-logout-btn"
          onClick={logout}
          title="Đăng xuất"
          aria-label="Đăng xuất"
        >
          <LogOut size={18} />
          <span className="logout-text">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
