import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import './MainLayout.css';

export function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    // Nếu màn hình mobile/tablet nhỏ thì mở menu drawer
    if (window.innerWidth <= 900) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="main-viewport">
        <Header
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isCollapsed}
        />

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
