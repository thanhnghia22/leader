import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  CalendarCheck,
  CalendarX,
  DollarSign,
  CreditCard,
  CheckCircle,
  PieChart,
  Zap,
  Clock
} from 'lucide-react';
import Card from '../components/Card';
import MonthPicker from '../components/MonthPicker';
import Loading from '../components/Loading';
import employeeService from '../services/employeeService';
import salaryService from '../services/salaryService';
import { formatCurrency } from '../utils/formatCurrency';
import './Reports.css';

export function Reports() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });

  const [selectedEmpId, setSelectedEmpId] = useState('all');
  const [employees, setEmployees] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const [empList, salaries] = await Promise.all([
          employeeService.getEmployees(),
          salaryService.getSalary(selectedDate.month, selectedDate.year)
        ]);
        setEmployees(empList);
        setSalaryData(salaries);
      } catch (error) {
        console.error('Lỗi khi tải báo cáo:', error);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [selectedDate]);

  // Lọc theo nhân viên nếu chọn 1 nhân viên cụ thể
  const displayData = selectedEmpId === 'all'
    ? salaryData
    : salaryData.filter((item) => String(item.id) === String(selectedEmpId));

  // Thống kê 6 chỉ số chính
  const totalEmployees = selectedEmpId === 'all' ? employees.length : 1;
  const totalWorkingDays = displayData.reduce((sum, item) => sum + (item.fullDays ?? item.workingDays), 0);
  const totalExtraHours = displayData.reduce((sum, item) => sum + (item.extraHours || 0), 0);
  const totalOffDays = displayData.reduce((sum, item) => sum + item.offDays, 0);
  const totalSalary = displayData.reduce((sum, item) => sum + item.totalSalary, 0);
  const totalOvertime = displayData.reduce((sum, item) => sum + (item.overtimeAmount || 0), 0);
  const totalAdvances = displayData.reduce((sum, item) => sum + item.advancedAmount, 0);
  const totalRemaining = displayData.reduce((sum, item) => sum + item.remainingSalary, 0);

  // Tỷ lệ đi làm (%)
  const totalDayRecords = totalWorkingDays + totalOffDays;
  const attendanceRate = totalDayRecords > 0
    ? Math.round((totalWorkingDays / totalDayRecords) * 100)
    : 100;

  // Tỷ lệ ứng lương (%)
  const advanceRate = totalSalary > 0
    ? Math.round((totalAdvances / totalSalary) * 100)
    : 0;

  if (loading) {
    return <Loading text="Đang tổng hợp báo cáo và phân tích..." />;
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Báo Cáo Tổng Hợp</h1>
          <p className="page-subtitle">Phân tích chuyên sâu về ngày công, tỷ lệ vắng mặt và chi phí nhân sự</p>
        </div>

        <div className="page-actions">
          <MonthPicker
            month={selectedDate.month}
            year={selectedDate.year}
            onChange={setSelectedDate}
          />
        </div>
      </div>

      {/* Bộ lọc nhân viên */}
      <div className="report-filter-bar">
        <div className="filter-group">
          <label className="filter-label">Phạm vi báo cáo:</label>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="filter-select"
          >
            <option value="all">Toàn bộ nhân sự ({employees.length} nhân viên)</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.code} - {emp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 6 Cards Thống kê quan trọng */}
      <div className="report-stats-grid">
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tổng nhân viên</h3>
            <div className="stat-value">{totalEmployees}</div>
            <span className="stat-note">Trong phạm vi lọc</span>
          </div>
          <div className="stat-card-icon icon-blue">
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tổng ngày làm</h3>
            <div className="stat-value text-success">{totalWorkingDays}</div>
            <span className="stat-note">Ngày công thực tế</span>
          </div>
          <div className="stat-card-icon icon-green">
            <CalendarCheck size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tổng ngày OFF</h3>
            <div className="stat-value text-danger">{totalOffDays}</div>
            <span className="stat-note">Tổng lượt nghỉ phép</span>
          </div>
          <div className="stat-card-icon icon-red">
            <CalendarX size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tổng tiền lương</h3>
            <div className="stat-value">{formatCurrency(totalSalary)}</div>
            <span className="stat-note">Quỹ lương phát sinh</span>
          </div>
          <div className="stat-card-icon icon-blue">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tiền tăng ca (+)</h3>
            <div className="stat-value text-warning">+{formatCurrency(totalOvertime)}</div>
            <span className="stat-note">Cộng thêm ngoài giờ</span>
          </div>
          <div className="stat-card-icon icon-yellow">
            <Zap size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tổng số giờ lẻ</h3>
            <div className="stat-value text-warning">{totalExtraHours} tiếng</div>
            <span className="stat-note">Tích lũy từ các ca lẻ</span>
          </div>
          <div className="stat-card-icon icon-yellow">
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tổng tiền ứng</h3>
            <div className="stat-value text-warning">{formatCurrency(totalAdvances)}</div>
            <span className="stat-note">Đã chi tạm ứng ({advanceRate}%)</span>
          </div>
          <div className="stat-card-icon icon-yellow">
            <CreditCard size={22} />
          </div>
        </div>

        <div className="stat-card highlight-card">
          <div className="stat-card-info">
            <h3>Còn phải trả</h3>
            <div className="stat-value text-primary">{formatCurrency(totalRemaining)}</div>
            <span className="stat-note">Quyết toán thực nhận</span>
          </div>
          <div className="stat-card-icon icon-green">
            <CheckCircle size={22} />
          </div>
        </div>
      </div>

      {/* Biểu đồ & Phân bổ trực quan */}
      <div className="report-charts-grid">
        {/* Biểu đồ Tỷ lệ Đi làm vs Nghỉ (OFF) */}
        <Card title="Tỷ lệ Ngày làm việc & Nghỉ phép" subtitle="Đo lường độ chuyên cần của nhân sự">
          <div className="rate-container">
            <div className="rate-overview">
              <span className="rate-large">{attendanceRate}%</span>
              <span className="rate-desc">Tỷ lệ đi làm đạt chuẩn</span>
            </div>

            <div className="progress-bar-container">
              <div
                className="progress-fill fill-work"
                style={{ width: `${attendanceRate}%` }}
                title={`Đi làm: ${attendanceRate}%`}
              />
              <div
                className="progress-fill fill-off"
                style={{ width: `${100 - attendanceRate}%` }}
                title={`Nghỉ: ${100 - attendanceRate}%`}
              />
            </div>

            <div className="rate-legend">
              <div className="legend-entry">
                <span className="legend-color bg-success"></span>
                <span>Đi làm: <strong>{totalWorkingDays} ngày ({attendanceRate}%)</strong></span>
              </div>
              <div className="legend-entry">
                <span className="legend-color bg-danger"></span>
                <span>Nghỉ (OFF): <strong>{totalOffDays} ngày ({100 - attendanceRate}%)</strong></span>
              </div>
            </div>
          </div>
        </Card>

        {/* Biểu đồ Phân bổ Tài chính */}
        <Card title="Cơ cấu Chi trả Lương & Tạm ứng" subtitle="Tỷ trọng ngân sách đã ứng và thực chi">
          <div className="rate-container">
            <div className="rate-overview">
              <span className="rate-large text-warning">{advanceRate}%</span>
              <span className="rate-desc">Tỷ lệ tiền đã tạm ứng so với tổng lương</span>
            </div>

            <div className="progress-bar-container">
              <div
                className="progress-fill fill-advance"
                style={{ width: `${advanceRate}%` }}
                title={`Đã ứng: ${advanceRate}%`}
              />
              <div
                className="progress-fill fill-remaining"
                style={{ width: `${100 - advanceRate}%` }}
                title={`Còn lại: ${100 - advanceRate}%`}
              />
            </div>

            <div className="rate-legend">
              <div className="legend-entry">
                <span className="legend-color bg-warning"></span>
                <span>Đã ứng: <strong>{formatCurrency(totalAdvances)}</strong></span>
              </div>
              <div className="legend-entry">
                <span className="legend-color bg-primary"></span>
                <span>Còn phải trả: <strong>{formatCurrency(totalRemaining)}</strong></span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Reports;
