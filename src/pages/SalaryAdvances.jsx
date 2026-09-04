import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  CreditCard,
  User,
  Calendar,
  DollarSign,
  FileText
} from 'lucide-react';
import Table from '../components/Table';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';
import MonthPicker from '../components/MonthPicker';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import salaryService from '../services/salaryService';
import employeeService from '../services/employeeService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import './SalaryAdvances.css';

export function SalaryAdvances() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });

  const [advances, setAdvances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    note: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Confirm Delete
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [advanceToDelete, setAdvanceToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { addToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [advList, empList] = await Promise.all([
        salaryService.getAdvances({
          month: selectedDate.month,
          year: selectedDate.year,
          employeeId: selectedEmployeeFilter === 'all' ? undefined : selectedEmployeeFilter,
        }),
        employeeService.getEmployees(),
      ]);
      setAdvances(advList);
      setEmployees(empList);
    } catch (error) {
      addToast('Lỗi khi tải dữ liệu tạm ứng lương', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedEmployeeFilter]);

  const filteredAdvances = advances.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.employeeName?.toLowerCase().includes(term) ||
      item.employeeCode?.toLowerCase().includes(term) ||
      item.note?.toLowerCase().includes(term)
    );
  });

  const totalFilteredAmount = filteredAdvances.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const handleOpenAdd = () => {
    setEditingAdvance(null);
    setFormData({
      employeeId: employees[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      note: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingAdvance(record);
    setFormData({
      employeeId: record.employeeId,
      date: record.date,
      amount: record.amount,
      note: record.note || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAdvance(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.employeeId) errors.employeeId = 'Vui lòng chọn nhân viên';
    if (!formData.date) errors.date = 'Vui lòng chọn ngày ứng lương';
    if (!formData.amount || Number(formData.amount) <= 0) {
      errors.amount = 'Số tiền ứng phải lớn hơn 0';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitLoading(true);
      if (editingAdvance) {
        await salaryService.updateAdvance(editingAdvance.id, formData);
        addToast('Cập nhật phiếu ứng lương thành công!', 'success');
      } else {
        await salaryService.createAdvance(formData);
        addToast('Thêm phiếu ứng lương thành công!', 'success');
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      addToast(error.message || 'Thao tác thất bại', 'danger');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenDelete = (record) => {
    setAdvanceToDelete(record);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!advanceToDelete) return;
    try {
      setDeleteLoading(true);
      await salaryService.deleteAdvance(advanceToDelete.id);
      addToast('Đã xóa phiếu ứng lương thành công', 'success');
      setDeleteConfirmOpen(false);
      setAdvanceToDelete(null);
      loadData();
    } catch (error) {
      addToast('Không thể xóa bản ghi ứng lương', 'danger');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      title: 'Mã NV',
      dataIndex: 'employeeCode',
      width: '100px',
      render: (code) => <span className="emp-code-badge">{code}</span>,
    },
    {
      title: 'Nhân viên',
      dataIndex: 'employeeName',
      render: (name) => <strong>{name}</strong>,
    },
    {
      title: 'Ngày ứng',
      dataIndex: 'date',
      render: (date) => (
        <span className="advance-date-cell">
          <Calendar size={14} /> {formatDate(date)}
        </span>
      ),
    },
    {
      title: 'Số tiền ứng',
      dataIndex: 'amount',
      render: (amount) => (
        <strong className="text-warning font-semibold">
          {formatCurrency(amount)}
        </strong>
      ),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      render: (note) => <span className="advance-note">{note || '—'}</span>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'right',
      width: '120px',
      render: (_, row) => (
        <div className="table-actions">
          <button
            type="button"
            className="action-icon-btn edit"
            title="Chỉnh sửa phiếu"
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
    <div className="salary-advances-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản Lý Ứng Lương</h1>
          <p className="page-subtitle">Theo dõi và duyệt các phiếu tạm ứng lương theo tháng</p>
        </div>
        <div className="page-actions">
          <MonthPicker
            month={selectedDate.month}
            year={selectedDate.year}
            onChange={setSelectedDate}
          />
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleOpenAdd}
          >
            Thêm ứng lương
          </Button>
        </div>
      </div>

      {/* Toolbar và Thống kê tổng tiền */}
      <div className="advances-toolbar">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm tên nhân viên, ghi chú..."
        />

        <div className="advances-filters">
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

          <div className="advances-total-badge">
            <span>Tổng ứng tháng này: </span>
            <strong>{formatCurrency(totalFilteredAmount)}</strong>
          </div>
        </div>
      </div>

      {/* Bảng danh sách ứng lương */}
      <Table
        columns={columns}
        data={filteredAdvances}
        loading={loading}
        emptyMessage="Không có phiếu tạm ứng lương nào trong tháng này"
      />

      {/* Modal Thêm / Sửa ứng lương */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingAdvance ? 'Chỉnh sửa phiếu ứng lương' : 'Tạo phiếu ứng lương mới'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal} disabled={submitLoading}>
              Hủy bỏ
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitLoading}>
              Lưu phiếu ứng
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Nhân viên nhận tiền <span className="required-star">*</span>
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
            label="Ngày ứng"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            icon={Calendar}
            required
            error={formErrors.date}
          />

          <Input
            label="Số tiền ứng (VNĐ)"
            type="number"
            placeholder="Ví dụ: 500000"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            icon={DollarSign}
            required
            error={formErrors.amount}
          />

          <Input
            label="Ghi chú / Lý do ứng"
            placeholder="Ví dụ: Tạm ứng sinh hoạt đợt 1..."
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            icon={FileText}
          />
        </form>
      </Modal>

      {/* Dialog xác nhận xóa */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Xóa phiếu ứng lương"
        message={`Bạn có chắc chắn muốn xóa phiếu ứng lương ${formatCurrency(
          advanceToDelete?.amount
        )} của nhân viên ${advanceToDelete?.employeeName}?`}
      />
    </div>
  );
}

export default SalaryAdvances;
