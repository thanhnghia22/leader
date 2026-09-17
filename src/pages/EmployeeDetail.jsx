import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Briefcase,
  DollarSign,
  Calendar,
  CreditCard,
  UserCheck,
  UserX,
  Clock,
  FileDown,
  Zap,
  Hourglass,
  AlertTriangle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import MonthPicker from '../components/MonthPicker';
import Badge from '../components/Badge';
import Loading from '../components/Loading';
import Table from '../components/Table';
import employeeService from '../services/employeeService';
import attendanceService from '../services/attendanceService';
import salaryService from '../services/salaryService';
import overtimeService from '../services/overtimeService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { exportEmployeePayslipToPdf } from '../utils/exportPdf';
import {
  getDaysInMonth
} from '../utils/attendanceUtils';
import {
  calculateShiftHours,
  formatWorkDaysAndHours,
  STANDARD_SHIFT_HOURS,
  CHEF_SHIFT_HOURS,
  getStandardShiftHours,
  getDefaultShiftTimes,
  calculateWorkSummaryFromHours
} from '../utils/timeUtils';
import './EmployeeDetail.css';

export function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [advanceHistory, setAdvanceHistory] = useState([]);
  const [overtimeHistory, setOvertimeHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'overtime', 'advances'

  const [stats, setStats] = useState({
    fullDays: 0,
    extraHours: 0,
    workingDays: 0,
    offDays: 0,
    overtimeCount: 0,
    totalOvertimeHours: 0,
    totalOvertimeAmount: 0,
    basicSalary: 0,
    totalIncome: 0,
    advancedAmount: 0,
    remainingSalary: 0,
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // 1. Thông tin nhân viên
        const emp = await employeeService.getEmployeeById(id);
        setEmployee(emp);

        // 2. Tải song song: chấm công, ứng lương, tăng ca
        const [monthAttendance, advances, overtimes] = await Promise.all([
          attendanceService.getAttendance(selectedDate.month, selectedDate.year),
          salaryService.getAdvances({
            month: selectedDate.month,
            year: selectedDate.year,
            employeeId: id,
          }),
          overtimeService.getOvertime({
            month: selectedDate.month,
            year: selectedDate.year,
            employeeId: id,
          }),
        ]);

        const empRecords = monthAttendance.filter((o) => String(o.employeeId) === String(id));
        setAttendanceHistory(empRecords);
        setAdvanceHistory(advances);
        setOvertimeHistory(overtimes);

        // 3. Tính toán các chỉ số theo ca chuẩn chức vụ
        const stdHours = getStandardShiftHours(emp.position);
        const totalDays = getDaysInMonth(selectedDate.year, selectedDate.month);
        let offCount = 0;
        let totalWorkedHours = 0;

        for (let d = 1; d <= totalDays; d++) {
          const dateStr = `${selectedDate.year}-${String(selectedDate.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const rec = empRecords.find((r) => r.date === dateStr);
          if (rec && (rec.status === 'off' || (!rec.status && rec.reason))) {
            offCount++;
          } else if (rec && rec.status === 'partial') {
            totalWorkedHours += Number(rec.workHours) || 0;
          } else {
            totalWorkedHours += stdHours;
          }
        }

        const { fullDays, extraHours } = calculateWorkSummaryFromHours(totalWorkedHours, stdHours);

        // Lương cơ bản = Ngày làm * Lương ngày + Giờ lẻ * (Lương ngày / stdHours)
        const hourlyRate = (Number(emp.dailySalary) || 0) / stdHours;
        const basicSalary = Math.round(fullDays * (Number(emp.dailySalary) || 0) + extraHours * hourlyRate);

        // Tăng ca
        const otHours = overtimes.reduce((s, i) => s + Number(i.hours || 0), 0);
        const otAmount = overtimes.reduce((s, i) => s + Number(i.amount || 0), 0);

        // Tổng lương & Thực lĩnh (Lương - Tạm ứng)
        const totalInc = basicSalary;
        const totalAdv = advances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
        const remaining = Math.max(0, totalInc - totalAdv);

        setStats({
          fullDays,
          extraHours,
          workingDays: fullDays,
          offDays: offCount,
          overtimeCount: overtimes.length,
          totalOvertimeHours: otHours,
          totalOvertimeAmount: otAmount,
          basicSalary,
          totalIncome: totalInc,
          advancedAmount: totalAdv,
          remainingSalary: remaining,
        });
      } catch (error) {
        console.error('Lỗi khi tải chi tiết nhân viên:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, selectedDate]);

  if (loading && !employee) {
    return <Loading text="Đang tải hồ sơ nhân viên..." />;
  }

  if (!employee) {
    return (
      <div className="empty-state">
        <p>Không tìm thấy thông tin nhân viên này.</p>
        <Button onClick={() => navigate('/employees')}>Quay lại danh sách</Button>
      </div>
    );
  }

  // Cột bảng OFF
  const offColumns = [
    {
      title: 'Ngày nghỉ',
      dataIndex: 'date',
      render: (date) => (
        <span className="font-semibold text-danger">
          <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
          {formatDate(date)}
        </span>
      ),
    },
    {
      title: 'Lý do nghỉ',
      dataIndex: 'reason',
      render: (reason) => <span>{reason || 'Nghỉ có phép'}</span>,
    },
  ];

  // Cột bảng Chấm công (OFF & Giờ lẻ)
  const attendanceColumns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      render: (date) => (
        <span className="font-semibold">
          <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
          {formatDate(date)}
        </span>
      ),
    },
    {
      title: 'Phân loại',
      key: 'status',
      render: (_, row) =>
        row.status === 'off' || (!row.status && row.reason) ? (
          <Badge variant="danger">OFF Nghỉ</Badge>
        ) : (
          <Badge variant="warning">Làm giờ lẻ ({row.workHours}h)</Badge>
        ),
    },
    {
      title: 'Thời gian làm việc',
      key: 'hours',
      render: (_, row) =>
        row.status === 'partial' ? (
          <span className="time-badge">
            {row.startTime || getDefaultShiftTimes(employee?.position).startTime} -{' '}
            {row.endTime || getDefaultShiftTimes(employee?.position).endTime} ({row.workHours} tiếng)
          </span>
        ) : (
          <span className="text-muted">Nghỉ cả ngày</span>
        ),
    },
    {
      title: 'Ghi chú / Lý do',
      key: 'note',
      render: (_, row) => <span>{row.note || row.reason || '—'}</span>,
    },
  ];

  // Cột bảng Tăng ca
  const overtimeColumns = [
    {
      title: 'Ngày tăng ca',
      dataIndex: 'date',
      render: (date) => (
        <span>
          <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
          {formatDate(date)}
        </span>
      ),
    },
    {
      title: 'Khung giờ',
      key: 'time',
      render: (_, row) => (
        <span className="time-badge">{row.startTime} - {row.endTime}</span>
      ),
    },
    {
      title: 'Số giờ',
      dataIndex: 'hours',
      align: 'center',
      render: (h) => <strong className="text-warning">{h} giờ</strong>,
    },
    {
      title: 'Tiền / giờ',
      dataIndex: 'hourlyRate',
      align: 'right',
      render: (r) => formatCurrency(r),
    },
    {
      title: 'Tiền tăng ca',
      dataIndex: 'amount',
      align: 'right',
      render: (amt) => <strong className="text-success">+{formatCurrency(amt)}</strong>,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      render: (n) => <span>{n || '—'}</span>,
    },
  ];

  // Cột bảng Ứng lương
  const advanceColumns = [
    {
      title: 'Ngày ứng',
      dataIndex: 'date',
      render: (date) => (
        <span>
          <Clock size={14} style={{ display: 'inline', marginRight: 4 }} />
          {formatDate(date)}
        </span>
      ),
    },
    {
      title: 'Số tiền ứng',
      dataIndex: 'amount',
      render: (amount) => <strong className="text-warning">{formatCurrency(amount)}</strong>,
    },
    {
      title: 'Ghi chú / Mục đích',
      dataIndex: 'note',
      render: (note) => <span>{note || 'Không có ghi chú'}</span>,
    },
  ];

  return (
    <div className="employee-detail-page">
      {/* Nút quay lại & Tiêu đề */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            className="back-circle-btn"
            onClick={() => navigate('/employees')}
            title="Quay lại danh sách nhân viên"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{employee.name}</h1>
            <p className="page-subtitle">Hồ sơ chi tiết và lịch sử làm việc tháng</p>
          </div>
        </div>

        <div className="page-actions">
          <MonthPicker
            month={selectedDate.month}
            year={selectedDate.year}
            onChange={setSelectedDate}
          />
          <Button
            variant="primary"
            icon={FileDown}
            onClick={() =>
              exportEmployeePayslipToPdf(
                employee,
                stats,
                attendanceHistory,
                advanceHistory,
                selectedDate.month,
                selectedDate.year
              )
            }
          >
            Xuất Phiếu Lương PDF
          </Button>
        </div>
      </div>

      {/* Thông tin hồ sơ tóm tắt */}
      <div className="profile-banner">
        <div className="profile-avatar">{employee.name.charAt(0)}</div>
        <div className="profile-meta">
          <div className="profile-name-row">
            <h2>{employee.name}</h2>
            <span className="emp-code-badge">{employee.code}</span>
            <Badge variant={employee.status === 'active' ? 'success' : 'neutral'} dot>
              {employee.status === 'active' ? 'Đang làm việc' : 'Đã nghỉ'}
            </Badge>
          </div>
          <div className="profile-details-grid">
            {employee.phone ? (
              <div className="profile-info-item">
                <Phone size={16} />
                <span>{employee.phone}</span>
              </div>
            ) : null}
            <div className="profile-info-item">
              <Briefcase size={16} />
              <span>
                <strong>{employee.position}</strong> (Ca chuẩn: {getStandardShiftHours(employee.position)} tiếng)
              </span>
            </div>
            <div className="profile-info-item">
              <DollarSign size={16} />
              <span>
                Lương ngày: <strong>{formatCurrency(employee.dailySalary)}</strong> ({formatCurrency(Math.round(employee.dailySalary / getStandardShiftHours(employee.position)))}/giờ)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 NHÓM THỐNG KÊ CHI TIẾT */}
      <div className="stats-section-group">
        {/* Nhóm 1: Chấm công & Giờ làm */}
        <div className="stat-group-box">
          <h4 className="group-title">
            <UserCheck size={18} /> 1. Chấm công & Giờ làm
          </h4>
          <div className="group-content">
            <div className="stat-line">
              <span>Ngày làm đủ ca:</span>
              <strong className="text-success">{stats.fullDays} ngày</strong>
            </div>
            <div className="stat-line">
              <span>Số giờ lẻ (về sớm):</span>
              <strong className={stats.extraHours > 0 ? 'text-warning' : 'text-muted'}>
                {stats.extraHours} tiếng
              </strong>
            </div>
            <div className="stat-line">
              <span>Ngày nghỉ (OFF):</span>
              <strong className={stats.offDays > 0 ? 'text-danger' : 'text-muted'}>
                {stats.offDays} ngày
              </strong>
            </div>
            <div className="stat-line highlight-line">
              <span>Tổng công tháng:</span>
              <strong className="text-primary font-bold">
                {formatWorkDaysAndHours(stats.fullDays, stats.extraHours)}
              </strong>
            </div>
          </div>
        </div>

        {/* Nhóm 2: Tăng ca */}
        <div className="stat-group-box">
          <h4 className="group-title">
            <Zap size={18} /> 2. Tăng ca
          </h4>
          <div className="group-content">
            <div className="stat-line">
              <span>Số lần tăng ca:</span>
              <strong>{stats.overtimeCount} ca</strong>
            </div>
            <div className="stat-line">
              <span>Tổng giờ tăng ca:</span>
              <strong className="text-warning">{stats.totalOvertimeHours} giờ</strong>
            </div>
            <div className="stat-line highlight-line">
              <span>Tiền tăng ca:</span>
              <strong className="text-success">+{formatCurrency(stats.totalOvertimeAmount)}</strong>
            </div>
          </div>
        </div>

        {/* Nhóm 3: Tạm ứng lương */}
        <div className="stat-group-box">
          <h4 className="group-title">
            <CreditCard size={18} /> 3. Tạm ứng lương
          </h4>
          <div className="group-content">
            <div className="stat-line">
              <span>Số lần tạm ứng:</span>
              <strong>{advanceHistory.length} lần</strong>
            </div>
            <div className="stat-line">
              <span>Đã tạm ứng:</span>
              <strong className="text-warning">-{formatCurrency(stats.advancedAmount)}</strong>
            </div>
            <div className="stat-line highlight-line">
              <span>Tình trạng giải ngân:</span>
              <span className="text-muted">Đã thanh toán</span>
            </div>
          </div>
        </div>

        {/* Nhóm 4: Lương & Thực lĩnh */}
        <div className="stat-group-box highlight-salary-box">
          <h4 className="group-title">
            <DollarSign size={18} /> 4. Lương & Quyết toán
          </h4>
          <div className="group-content">
            <div className="stat-line">
              <span>Tổng lương tháng:</span>
              <strong>{formatCurrency(stats.basicSalary)}</strong>
            </div>
            <div className="stat-line">
              <span>Trừ tạm ứng:</span>
              <strong className="text-warning">-{formatCurrency(stats.advancedAmount)}</strong>
            </div>
            <div className="stat-line highlight-line-total">
              <span>Lương thực lĩnh:</span>
              <strong className="text-primary" style={{ fontSize: '1.15rem' }}>
                {formatCurrency(stats.remainingSalary)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs chuyển đổi các bảng lịch sử */}
      <div className="history-tabs-container">
        <div className="history-tabs-nav">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            Lịch sử Nghỉ & Giờ lẻ ({attendanceHistory.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'overtime' ? 'active' : ''}`}
            onClick={() => setActiveTab('overtime')}
          >
            Lịch sử Tăng ca ({overtimeHistory.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'advances' ? 'active' : ''}`}
            onClick={() => setActiveTab('advances')}
          >
            Phiếu Tạm ứng ({advanceHistory.length})
          </button>
        </div>

        <div className="history-tab-content">
          {activeTab === 'attendance' && (
            <Table
              columns={attendanceColumns}
              data={attendanceHistory}
              emptyMessage="Nhân viên làm đủ mọi ca trong tháng này (Đi làm đầy đủ)"
            />
          )}

          {activeTab === 'overtime' && (
            <Table
              columns={overtimeColumns}
              data={overtimeHistory}
              emptyMessage="Không có bản ghi tăng ca nào trong tháng này"
            />
          )}

          {activeTab === 'advances' && (
            <Table
              columns={advanceColumns}
              data={advanceHistory}
              emptyMessage="Không có khoản tạm ứng nào trong tháng này"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeDetail;
