import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  CreditCard,
  Calendar,
  ArrowRight,
  Clock,
  TrendingUp,
  Banknote,
  Zap,
  CalendarCheck,
  CheckCircle
} from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Loading from '../components/Loading';
import employeeService from '../services/employeeService';
import attendanceService from '../services/attendanceService';
import salaryService from '../services/salaryService';
import overtimeService from '../services/overtimeService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import './Dashboard.css';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    workingToday: 0,
    offToday: 0,
    totalWorkingDays: 0,
    totalExtraHours: 0,
    totalOffDays: 0,
    totalOvertimeHours: 0,
    totalOvertimeAmount: 0,
    totalBasicSalary: 0,
    totalAdvances: 0,
    totalIncome: 0,
    totalRemaining: 0,
  });
  const [offTodayList, setOffTodayList] = useState([]);
  const [recentAdvances, setRecentAdvances] = useState([]);
  const [recentOvertimes, setRecentOvertimes] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const todayStr = today.toISOString().split('T')[0];

        // 1. Dữ liệu nhân viên, chấm công, ứng lương, tăng ca
        const [employees, monthOffs, advances, salaryData, overtimes] =
          await Promise.all([
            employeeService.getEmployees(),
            attendanceService.getAttendance(month, year),
            salaryService.getAdvances({ month, year }),
            salaryService.getSalary(month, year),
            overtimeService.getOvertime({ month, year }),
          ]);

        const todayOffs = monthOffs.filter((o) => o.date === todayStr && (o.status === 'off' || (!o.status && o.reason)));

        // Tổng hợp tăng ca
        const otHours = overtimes.reduce((s, i) => s + Number(i.hours || 0), 0);
        const otAmount = overtimes.reduce((s, i) => s + Number(i.amount || 0), 0);

        // Tổng hợp lương & ngày công
        const basicSal = salaryData.reduce((s, i) => s + Number(i.basicSalary || 0), 0);
        const advAmount = advances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
        const totIncome = salaryData.reduce((s, i) => s + Number(i.totalIncome || 0), 0);
        const remSal = salaryData.reduce((s, i) => s + Number(i.remainingSalary || 0), 0);
        const workDays = salaryData.reduce((s, i) => s + Number(i.fullDays ?? i.workingDays ?? 0), 0);
        const extraHours = salaryData.reduce((s, i) => s + Number(i.extraHours || 0), 0);
        const offDays = monthOffs.filter((o) => o.status === 'off' || (!o.status && o.reason)).length;

        // Ghép danh sách chi tiết nhân viên OFF hôm nay
        const offListWithInfo = todayOffs.map((o) => {
          const emp = employees.find((e) => String(e.id) === String(o.employeeId));
          return {
            ...o,
            employeeName: emp ? emp.name : 'Nhân viên',
            employeeCode: emp ? emp.code : 'N/A',
            position: emp ? emp.position : 'N/A',
          };
        });

        const activeEmployeesCount = employees.filter((e) => e.status === 'active').length;
        const offCount = todayOffs.length;
        const workingCount = Math.max(0, activeEmployeesCount - offCount);

        setStats({
          totalEmployees: employees.length,
          workingToday: workingCount,
          offToday: offCount,
          totalWorkingDays: workDays,
          totalExtraHours: extraHours,
          totalOffDays: offDays,
          totalOvertimeHours: otHours,
          totalOvertimeAmount: otAmount,
          totalBasicSalary: basicSal,
          totalAdvances: advAmount,
          totalIncome: totIncome,
          totalRemaining: remSal,
        });

        setOffTodayList(offListWithInfo);
        setRecentAdvances(advances.slice(0, 4));
        setRecentOvertimes(overtimes.slice(0, 4));
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return <Loading text="Đang tổng hợp dữ liệu Dashboard..." />;
  }

  return (
    <div className="dashboard-container">
      {/* Header trang */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tổng quan Hệ thống Leader</h1>
          <p className="page-subtitle">
            Theo dõi chuyên cần, số ngày làm tròn ca, số giờ lẻ và tạm ứng lương
          </p>
        </div>
        <div className="page-actions">
          <Link to="/attendance" className="btn btn-outline btn-md">
            <Calendar size={18} />
            <span>Chấm công</span>
          </Link>
          <Link to="/salary-advances" className="btn btn-primary btn-md">
            <CreditCard size={18} />
            <span>Ứng lương</span>
          </Link>
        </div>
      </div>

      {/* 4 Thẻ thống kê cơ bản */}
      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tổng nhân viên</h3>
            <div className="stat-value">{stats.totalEmployees}</div>
            <span className="stat-note">Tổng ngày làm: <strong>{stats.totalWorkingDays} ngày</strong></span>
          </div>
          <div className="stat-card-icon icon-blue">
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Đang đi làm hôm nay</h3>
            <div className="stat-value text-success">{stats.workingToday}</div>
            <span className="stat-note">Có mặt làm việc</span>
          </div>
          <div className="stat-card-icon icon-green">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>OFF hôm nay</h3>
            <div className="stat-value text-danger">{stats.offToday}</div>
            <span className="stat-note">Tổng lượt OFF tháng: <strong>{stats.totalOffDays}</strong></span>
          </div>
          <div className="stat-card-icon icon-red">
            <UserX size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tổng tiền đã ứng</h3>
            <div className="stat-value text-warning">{formatCurrency(stats.totalAdvances)}</div>
            <span className="stat-note">Đã trừ vào lương</span>
          </div>
          <div className="stat-card-icon icon-yellow">
            <CreditCard size={24} />
          </div>
        </div>
      </div>

      {/* 4 Thẻ thống kê TĂNG CA & GIỜ LẺ */}
      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tổng giờ lẻ trong tháng</h3>
            <div className="stat-value text-warning">{stats.totalExtraHours} tiếng</div>
            <span className="stat-note">Tích lũy từ các ca lẻ / về sớm</span>
          </div>
          <div className="stat-card-icon icon-yellow">
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tổng giờ tăng ca</h3>
            <div className="stat-value text-warning">{stats.totalOvertimeHours} giờ</div>
            <span className="stat-note">Làm thêm ngoài giờ</span>
          </div>
          <div className="stat-card-icon icon-yellow">
            <Zap size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tiền tăng ca (+)</h3>
            <div className="stat-value text-success">+{formatCurrency(stats.totalOvertimeAmount)}</div>
            <span className="stat-note">Cộng thêm vào lương</span>
          </div>
          <div className="stat-card-icon icon-green">
            <Zap size={24} />
          </div>
        </div>

        <div className="stat-card highlight-card">
          <div className="stat-card-info">
            <h3>Lương thực lĩnh</h3>
            <div className="stat-value text-primary">{formatCurrency(stats.totalRemaining)}</div>
            <span className="stat-note">Sau khi trừ tạm ứng</span>
          </div>
          <div className="stat-card-icon icon-green">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Thống kê Tài chính Tổng hợp */}
      <div className="financial-banner">
        <div className="financial-item">
          <div className="financial-icon">
            <Banknote size={22} />
          </div>
          <div>
            <span className="financial-label">Lương cơ bản</span>
            <span className="financial-value">{formatCurrency(stats.totalBasicSalary)}</span>
          </div>
        </div>

        <div className="financial-divider" />
        <div className="financial-item">
          <div className="financial-icon text-warning">
            <CreditCard size={22} />
          </div>
          <div>
            <span className="financial-label">Đã tạm ứng (-)</span>
            <span className="financial-value text-warning">-{formatCurrency(stats.totalAdvances)}</span>
          </div>
        </div>
        <div className="financial-divider" />
        <div className="financial-item">
          <div className="financial-icon text-success">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="financial-label">Tổng tiền còn phải trả</span>
            <span className="financial-value text-success">{formatCurrency(stats.totalRemaining)}</span>
          </div>
        </div>
      </div>

      {/* Khu vực chi tiết: OFF hôm nay & Tăng ca & Ứng lương */}
      <div className="dashboard-grid">
        {/* Danh sách OFF hôm nay */}
        <Card
          title="Nhân viên OFF hôm nay"
          subtitle={`Có ${offTodayList.length} nhân viên báo nghỉ`}
          extra={
            <Link to="/attendance" className="card-header-link">
              Bảng chấm công <ArrowRight size={14} />
            </Link>
          }
        >
          {offTodayList.length === 0 ? (
            <div className="empty-dashboard-box">
              <UserCheck size={32} className="text-success" />
              <p>Hôm nay tất cả nhân viên đều đi làm đầy đủ!</p>
            </div>
          ) : (
            <div className="off-today-list">
              {offTodayList.map((item) => (
                <div key={item.id} className="off-today-item">
                  <div className="off-avatar">
                    <UserX size={18} />
                  </div>
                  <div className="off-details">
                    <div className="off-name">{item.employeeName}</div>
                    <div className="off-meta">
                      <span>{item.employeeCode}</span> • <span>{item.position}</span>
                    </div>
                  </div>
                  <div className="off-reason">
                    <Badge variant="danger">{item.reason || 'Nghỉ có phép'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Hoạt động tăng ca gần đây */}
        <Card
          title="Tăng ca mới nhất"
          subtitle="Ghi nhận làm thêm giờ gần đây"
          extra={
            <Link to="/timesheets/overtime" className="card-header-link">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          }
        >
          {recentOvertimes.length === 0 ? (
            <div className="empty-dashboard-box">
              <Zap size={32} className="text-muted" />
              <p>Chưa có bản ghi tăng ca nào trong tháng này.</p>
            </div>
          ) : (
            <div className="recent-advances-list">
              {recentOvertimes.map((ot) => (
                <div key={ot.id} className="advance-row-item">
                  <div className="advance-row-info">
                    <span className="advance-row-name">{ot.employeeName}</span>
                    <span className="advance-row-date">
                      <Calendar size={12} /> {formatDate(ot.date)} ({ot.startTime} - {ot.endTime})
                    </span>
                  </div>
                  <div className="advance-row-amount">
                    <span className="text-warning font-bold">+{formatCurrency(ot.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
