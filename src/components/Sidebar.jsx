import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users,
  CalendarCheck,
  CreditCard,
  LogOut,
  X,
  Clock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './Sidebar.css';

const navItems = [
  { path: '/attendance', label: 'Chấm công', icon: CalendarCheck },
  { path: '/employees', label: 'Nhân viên', icon: Users },
  { path: '/salary-advances', label: 'Ứng lương', icon: CreditCard },
];

export function Sidebar({ isCollapsed, isMobileOpen, onCloseMobile }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}

      <aside
        className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''} ${
          isMobileOpen ? 'sidebar-mobile-open' : ''
        }`}
      >
        <div className="sidebar-logo-area">
          <div className="logo-icon">
            <Clock size={24} />
          </div>
          {!isCollapsed && (
            <div className="logo-text">
              <h2>LEADER ATTENDANCE</h2>
              <span>Quản trị chấm công</span>
            </div>
          )}
          {isMobileOpen && (
            <button
              className="sidebar-mobile-close"
              onClick={onCloseMobile}
              aria-label="Đóng menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-label">{!isCollapsed && 'MENU CHÍNH'}</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
                onClick={onCloseMobile}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={20} className="nav-icon" />
                {!isCollapsed && <span className="nav-text">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="nav-link logout-link"
            onClick={handleLogout}
            title={isCollapsed ? 'Đăng xuất' : undefined}
          >
            <LogOut size={20} className="nav-icon" />
            {!isCollapsed && <span className="nav-text">Đăng xuất</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
