import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loading from '../components/Loading';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading fullScreen text="Đang kiểm tra quyền truy cập..." />;
  }

  if (!isAuthenticated) {
    // Điều hướng về /login nếu chưa đăng nhập và lưu lại trang đang truy cập
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
