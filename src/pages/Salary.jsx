import React, { useState, useEffect } from 'react';
import {
  Banknote,
  TrendingUp,
  CreditCard,
  Printer,
  FileDown,
  Search,
  CheckCircle,
  CalendarCheck
} from 'lucide-react';
import Table from '../components/Table';
import Button from '../components/Button';
import SearchBar from '../components/SearchBar';
import MonthPicker from '../components/MonthPicker';
import Loading from '../components/Loading';
import salaryService from '../services/salaryService';
import { formatCurrency } from '../utils/formatCurrency';
import { exportSalaryToPdf } from '../utils/exportPdf';
import './Salary.css';

export function Salary() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });

  const [salaryData, setSalaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadSalaryData = async () => {
    try {
      setLoading(true);
      const data = await salaryService.getSalary(selectedDate.month, selectedDate.year);
      setSalaryData(data);
    } catch (error) {
      console.error('Lỗi khi tải bảng lương:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalaryData();
  }, [selectedDate]);

  const filteredData = salaryData.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.employeeName?.toLowerCase().includes(term) ||
      item.employeeCode?.toLowerCase().includes(term) ||
      item.position?.toLowerCase().includes(term)
    );
  });

  // Tính tổng hợp toàn công ty trong tháng
  const totalSummary = filteredData.reduce(
    (acc, cur) => {
      acc.fullDays += Number(cur.fullDays ?? cur.workingDays ?? 0);
      acc.extraHours += Number(cur.extraHours || 0);
      acc.offDays += Number(cur.offDays || 0);
      acc.basicSalary += Number(cur.basicSalary || cur.totalSalary || 0);
      acc.advancedAmount += Number(cur.advancedAmount || 0);
      acc.remainingSalary += Number(cur.remainingSalary || 0);
      return acc;
    },
    {
      fullDays: 0,
      extraHours: 0,
      offDays: 0,
      basicSalary: 0,
      advancedAmount: 0,
      remainingSalary: 0
    }
  );

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    {
      title: 'Mã NV',
      dataIndex: 'employeeCode',
      width: '90px',
      render: (code) => <span className="emp-code-badge">{code}</span>,
    },
    {
      title: 'Họ tên',
      dataIndex: 'employeeName',
      render: (name, row) => (
        <div>
          <strong>{name}</strong>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.position}</div>
        </div>
      ),
    },
    {
      title: 'Ngày làm',
      dataIndex: 'fullDays',
      align: 'center',
      render: (days, row) => (
        <strong className="text-success">{days ?? row.workingDays} ngày</strong>
      ),
    },
    {
      title: 'Giờ lẻ',
      dataIndex: 'extraHours',
      align: 'center',
      render: (hours) =>
        hours > 0 ? (
          <strong className="text-warning font-semibold">{hours} tiếng</strong>
        ) : (
          <span className="text-muted">0</span>
        ),
    },
    {
      title: 'OFF',
      dataIndex: 'offDays',
      align: 'center',
      render: (days) => (
        <span className={days > 0 ? 'text-danger font-semibold' : 'text-muted'}>
          {days}
        </span>
      ),
    },
    {
      title: 'Lương/ngày',
      dataIndex: 'dailySalary',
      align: 'right',
      render: (val) => formatCurrency(val),
    },
    {
      title: 'Tổng lương',
      dataIndex: 'basicSalary',
      align: 'right',
      render: (val, row) => (
        <strong className="text-dark font-bold">{formatCurrency(val || row.totalSalary)}</strong>
      ),
    },
    {
      title: 'Đã ứng (-)',
      dataIndex: 'advancedAmount',
      align: 'right',
      render: (val) => (
        <span className={val > 0 ? 'text-warning font-semibold' : 'text-muted'}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: 'Thực lĩnh',
      dataIndex: 'remainingSalary',
      align: 'right',
      render: (val) => (
        <strong className="text-primary font-bold" style={{ fontSize: '0.95rem' }}>
          {formatCurrency(val)}
        </strong>
      ),
    },
  ];

  return (
    <div className="salary-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bảng Lương Nhân Viên</h1>
          <p className="page-subtitle">
            Tổng lương = (Ngày làm × Lương/ngày) + (Giờ lẻ × Lương giờ). Thực lĩnh = Tổng lương - Đã ứng
          </p>
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
            onClick={() => exportSalaryToPdf(filteredData, selectedDate.month, selectedDate.year, totalSummary)}
          >
            Xuất PDF
          </Button>
          <Button variant="outline" icon={Printer} onClick={handlePrint}>
            In ấn
          </Button>
        </div>
      </div>

      {/* 4 Thẻ thống kê tài chính */}
      <div className="card-grid-salary">
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tổng công thực tế</h3>
            <div className="stat-value text-success">
              {totalSummary.fullDays} ngày {totalSummary.extraHours > 0 ? `+ ${totalSummary.extraHours}h` : ''}
            </div>
            <span className="stat-note">Ngày làm tròn ca & Giờ lẻ</span>
          </div>
          <div className="stat-card-icon icon-green">
            <CalendarCheck size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tổng quỹ lương</h3>
            <div className="stat-value">{formatCurrency(totalSummary.basicSalary)}</div>
            <span className="stat-note">Lương ngày & Lương giờ lẻ</span>
          </div>
          <div className="stat-card-icon icon-blue">
            <Banknote size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Đã tạm ứng (-)</h3>
            <div className="stat-value text-warning">{formatCurrency(totalSummary.advancedAmount)}</div>
            <span className="stat-note">Đã giải ngân trong tháng</span>
          </div>
          <div className="stat-card-icon icon-yellow">
            <CreditCard size={22} />
          </div>
        </div>

        <div className="stat-card highlight-card">
          <div className="stat-card-info">
            <h3>Thực lĩnh còn lại</h3>
            <div className="stat-value text-success">{formatCurrency(totalSummary.remainingSalary)}</div>
            <span className="stat-note">Quyết toán chi trả</span>
          </div>
          <div className="stat-card-icon icon-green">
            <CheckCircle size={22} />
          </div>
        </div>
      </div>

      {/* Toolbar tìm kiếm */}
      <div className="salary-toolbar">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm kiếm mã NV, họ tên, chức vụ..."
        />
        <div className="salary-count-info">
          Hiển thị <strong>{filteredData.length}</strong> nhân viên
        </div>
      </div>

      {/* Bảng lương */}
      <Table
        columns={columns}
        data={filteredData}
        loading={loading}
        emptyMessage="Chưa có dữ liệu bảng lương cho tháng này"
      />
    </div>
  );
}

export default Salary;
