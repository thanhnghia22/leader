import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  User,
  Zap,
  TrendingUp
} from 'lucide-react';
import Table from '../components/Table';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';
import MonthPicker from '../components/MonthPicker';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import overtimeService from '../services/overtimeService';
import employeeService from '../services/employeeService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { calculateOvertimeHours, calculateOvertimePay } from '../utils/timeUtils';
import './Overtime.css';

export function Overtime() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });

  const [overtimes, setOvertimes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '21:00',
    hourlyRate: 50000,
    note: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Delete Confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { addToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [otList, empList] = await Promise.all([
        overtimeService.getOvertime({
          month: selectedDate.month,
          year: selectedDate.year,
          employeeId: selectedEmployeeFilter === 'all' ? undefined : selectedEmployeeFilter,
        }),
        employeeService.getEmployees(),
      ]);
      setOvertimes(otList);
      setEmployees(empList);
    } catch (error) {
      addToast('Lỗi khi tải dữ liệu tăng ca', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedEmployeeFilter]);

  // Tính số giờ và số tiền tự động trong modal form
  const calculatedHours = calculateOvertimeHours(formData.startTime, formData.endTime);
  const calculatedAmount = calculateOvertimePay(calculatedHours, formData.hourlyRate);

  const filteredOvertimes = overtimes.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.employeeName?.toLowerCase().includes(term) ||
      item.employeeCode?.toLowerCase().includes(term) ||
      item.note?.toLowerCase().includes(term)
    );
  });

  const totalHours = filteredOvertimes.reduce((sum, item) => sum + Number(item.hours || 0), 0);
  const totalAmount = filteredOvertimes.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      employeeId: employees[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '21:00',
      hourlyRate: 50000,
      note: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      employeeId: item.employeeId,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      hourlyRate: item.hourlyRate || 50000,
      note: item.note || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.employeeId) errors.employeeId = 'Vui lòng chọn nhân viên';
    if (!formData.date) errors.date = 'Vui lòng chọn ngày tăng ca';
    if (!formData.startTime) errors.startTime = 'Vui lòng chọn giờ bắt đầu';
    if (!formData.endTime) errors.endTime = 'Vui lòng chọn giờ kết thúc';
    if (calculatedHours <= 0) {
      errors.endTime = 'Giờ kết thúc phải lớn hơn giờ bắt đầu';
    }
    if (!formData.hourlyRate || Number(formData.hourlyRate) <= 0) {
      errors.hourlyRate = 'Mức tiền/giờ phải lớn hơn 0';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitLoading(true);
      const payload = {
        ...formData,
        hours: calculatedHours,
        amount: calculatedAmount,
      };

      if (editingItem) {
        await overtimeService.updateOvertime(editingItem.id, payload);
        addToast('Cập nhật phiếu tăng ca thành công!', 'success');
      } else {
        await overtimeService.createOvertime(payload);
        addToast('Thêm phiếu tăng ca mới thành công!', 'success');
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      addToast(error.message || 'Thao tác thất bại', 'danger');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenDelete = (item) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleteLoading(true);
      await overtimeService.deleteOvertime(itemToDelete.id);
      addToast('Đã xóa phiếu tăng ca thành công', 'success');
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      loadData();
    } catch (error) {
      addToast('Không thể xóa bản ghi', 'danger');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: '60px',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Nhân viên',
      dataIndex: 'employeeName',
      render: (name, row) => (
        <div>
          <strong>{name}</strong>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.employeeCode} - {row.position}</div>
        </div>
      ),
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      render: (date) => (
        <span className="ot-date-cell">
          <Calendar size={14} /> {formatDate(date)}
        </span>
      ),
    },
    {
      title: 'Bắt đầu',
      dataIndex: 'startTime',
      render: (time) => <span className="time-badge">{time}</span>,
    },
    {
      title: 'Kết thúc',
      dataIndex: 'endTime',
      render: (time) => <span className="time-badge">{time}</span>,
    },
    {
      title: 'Số giờ',
      dataIndex: 'hours',
      align: 'center',
      render: (hours) => (
        <strong className="text-warning font-bold">{hours} giờ</strong>
      ),
    },
    {
      title: 'Tiền / giờ',
      dataIndex: 'hourlyRate',
      align: 'right',
      render: (rate) => formatCurrency(rate),
    },
    {
      title: 'Tiền tăng ca',
      dataIndex: 'amount',
      align: 'right',
      render: (amt) => (
        <strong className="text-success font-bold" style={{ fontSize: '0.95rem' }}>
          {formatCurrency(amt)}
        </strong>
      ),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      render: (note) => <span className="ot-note">{note || '—'}</span>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'right',
      width: '110px',
      render: (_, row) => (
        <div className="table-actions">
          <button
            type="button"
            className="action-icon-btn edit"
            title="Sửa phiếu"
            onClick={() => handleOpenEdit(row)}
          >
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            className="action-icon-btn delete"
            title="Xóa phiếu"
            onClick={() => handleOpenDelete(row)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="overtime-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản Lý Tăng Ca (Overtime)</h1>
          <p className="page-subtitle">Ghi nhận và tính tiền làm thêm giờ ngoài giờ làm việc hành chính</p>
        </div>
        <div className="page-actions">
          <MonthPicker
            month={selectedDate.month}
            year={selectedDate.year}
            onChange={setSelectedDate}
          />
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Thêm tăng ca
          </Button>
        </div>
      </div>

      {/* Thẻ thống kê tăng ca */}
      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tổng giờ tăng ca</h3>
            <div className="stat-value text-warning">{totalHours} giờ</div>
            <span className="stat-note">Trong tháng {String(selectedDate.month).padStart(2, '0')}/{selectedDate.year}</span>
          </div>
          <div className="stat-card-icon icon-yellow">
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tổng tiền tăng ca</h3>
            <div className="stat-value text-success">{formatCurrency(totalAmount)}</div>
            <span className="stat-note">Cộng dồn vào bảng lương</span>
          </div>
          <div className="stat-card-icon icon-green">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Toolbar lọc và tìm kiếm */}
      <div className="overtime-toolbar">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm tên nhân viên, ghi chú..."
        />

        <div className="filter-group">
          <label className="filter-label">Nhân viên:</label>
          <select
            value={selectedEmployeeFilter}
            onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả nhân viên</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.code} - {emp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bảng danh sách */}
      <Table
        columns={columns}
        data={filteredOvertimes}
        loading={loading}
        emptyMessage="Không có bản ghi tăng ca nào trong tháng này"
      />

      {/* Modal Thêm / Sửa Tăng ca */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Chỉnh sửa bản ghi tăng ca' : 'Ghi nhận làm thêm giờ (Tăng ca)'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal} disabled={submitLoading}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitLoading}>
              Lưu phiếu tăng ca
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Nhân viên tăng ca <span className="required-star">*</span>
            </label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="form-input"
              required
            >
              <option value="">-- Chọn nhân viên --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.code} - {emp.name} ({emp.position})
                </option>
              ))}
            </select>
            {formErrors.employeeId && (
              <span className="form-error-msg">{formErrors.employeeId}</span>
            )}
          </div>

          <Input
            label="Ngày tăng ca"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            icon={Calendar}
            required
            error={formErrors.date}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Giờ bắt đầu"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              icon={Clock}
              required
              error={formErrors.startTime}
            />

            <Input
              label="Giờ kết thúc"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              icon={Clock}
              required
              error={formErrors.endTime}
            />
          </div>

          <Input
            label="Mức tiền tăng ca / giờ (VNĐ)"
            type="number"
            placeholder="50000"
            value={formData.hourlyRate}
            onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
            icon={DollarSign}
            required
            error={formErrors.hourlyRate}
          />

          {/* Hộp tự động tính toán */}
          <div className="ot-calc-preview">
            <div className="calc-row">
              <span>Tổng số giờ tăng ca:</span>
              <strong className="text-warning">{calculatedHours} giờ</strong>
            </div>
            <div className="calc-row">
              <span>Thành tiền tăng ca:</span>
              <strong className="text-success" style={{ fontSize: '1.1rem' }}>
                {formatCurrency(calculatedAmount)}
              </strong>
            </div>
            <div className="calc-formula">
              Công thức: {calculatedHours} giờ × {formatCurrency(formData.hourlyRate, 'đ/giờ')} = {formatCurrency(calculatedAmount)}
            </div>
          </div>

          <Input
            label="Ghi chú công việc làm thêm"
            placeholder="Ví dụ: Bảo trì máy chủ, hoàn thành tiến độ dự án..."
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            icon={FileText}
          />
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Xóa phiếu tăng ca"
        message={`Bạn có chắc muốn xóa bản ghi tăng ca ${itemToDelete?.hours} giờ (${formatCurrency(itemToDelete?.amount)}) của nhân viên ${itemToDelete?.employeeName}?`}
      />
    </div>
  );
}

export default Overtime;
