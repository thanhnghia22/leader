import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../layouts/MainLayout';

// Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Employees from '../pages/Employees';
import EmployeeDetail from '../pages/EmployeeDetail';
import Attendance from '../pages/Attendance';
import SalaryAdvances from '../pages/SalaryAdvances';
import Salary from '../pages/Salary';
import Reports from '../pages/Reports';
import Overtime from '../pages/Overtime';
import LateEarly from '../pages/LateEarly';

export function AppRoutes() {
  return (
    <Routes>
      {/* Route Công khai */}
      <Route path="/login" element={<Login />} />

      {/* Routes Nội bộ bảo vệ bởi ProtectedRoute */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/attendance" replace />} />
        <Route path="dashboard" element={<Navigate to="/attendance" replace />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="timesheets/late-early" element={<Navigate to="/attendance" replace />} />
        <Route path="timesheets/overtime" element={<Navigate to="/attendance" replace />} />
        <Route path="salary-advances" element={<SalaryAdvances />} />
        <Route path="salary" element={<Navigate to="/attendance" replace />} />
        <Route path="reports" element={<Navigate to="/attendance" replace />} />
      </Route>

      {/* Fallback điều hướng các đường dẫn không tồn tại */}
      <Route path="*" element={<Navigate to="/attendance" replace />} />
    </Routes>
  );
}

export default AppRoutes;
