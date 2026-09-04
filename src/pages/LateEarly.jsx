import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  AlertTriangle,
  FileText,
  User,
  AlertCircle,
  CheckCircle2,
  Hourglass
} from 'lucide-react';
import Table from '../components/Table';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import SearchBar from '../components/SearchBar';
import MonthPicker from '../components/MonthPicker';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import timeTrackingService from '../services/timeTrackingService';
import employeeService from '../services/employeeService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import {
  calculateLateMinutes,
  calculateEarlyMinutes,
  formatMinutesToHours,
  calculateShortageDeduction,
  getAttendanceStatusType
} from '../utils/timeUtils';
import './LateEarly.css';

export function LateEarly() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });

  const [records, setRecords] = useState([]);
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
    standardIn: '08:00',
    actualIn: '08:30',
    standardOut: '17:00',
    actualOut: '17:00',
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
      const [list, empList] = await Promise.all([
        timeTrackingService.getLateEarly({
          month: selectedDate.month,
          year: selectedDate.year,
          employeeId: selectedEmployeeFilter === 'all' ? undefined : selectedEmployeeFilter,
        }),
        employeeService.getEmployees(),
      ]);
      setRecords(list);
      setEmployees(empList);
    } catch (error) {
      addToast('Lỗi khi tải dữ liệu đi trễ / về sớm', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedEmployeeFilter]);

  // Tính toán thời gian thực tế trong form Modal
  const previewLateMinutes = calculateLateMinutes(formData.standardIn, formData.actualIn);
  const previewEarlyMinutes = calculateEarlyMinutes(formData.standardOut, formData.actualOut);
  const previewTotalShortage = previewLateMinutes + previewEarlyMinutes;

  const filteredRecords = records.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.employeeName?.toLowerCase().includes(term) ||
      item.employeeCode?.toLowerCase().includes(term) ||
      item.note?.toLowerCase().includes(term)
    );
  });

  // Tổng hợp thống kê
  const totalLateMinutes = filteredRecords.reduce((s, i) => s + Number(i.lateMinutes || 0), 0);
  const totalEarlyMinutes = filteredRecords.reduce((s, i) => s + Number(i.earlyMinutes || 0), 0);
  const totalShortageMinutes = totalLateMinutes + totalEarlyMinutes;
  const totalEstimatedDeduction = filteredRecords.reduce(
    (s, i) => s + Number(i.estimatedDeduction || 0),
    0
  );

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      employeeId: employees[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      standardIn: '08:00',
      actualIn: '08:30',
      standardOut: '17:00',
      actualOut: '17:00',
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
      standardIn: item.standardIn || '08:00',
      actualIn: item.actualIn || '08:00',
      standardOut: item.standardOut || '17:00',
      actualOut: item.actualOut || '17:00',
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
    if (!formData.date) errors.date = 'Vui lòng chọn ngày';
    if (!formData.actualIn) errors.actualIn = 'Vui lòng chọn giờ vào thực tế';
    if (!formData.actualOut) errors.actualOut = 'Vui lòng chọn giờ ra thực tế';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitLoading(true);
      if (editingItem) {
        await timeTrackingService.updateLateEarly(editingItem.id, formData);
        addToast('Cập nhật thông tin thành công!', 'success');
      } else {
        await timeTrackingService.createLateEarly(formData);
        addToast('Ghi nhận thời gian thành công!', 'success');
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
      await timeTrackingService.deleteLateEarly(itemToDelete.id);
      addToast('Đã xóa bản ghi thành công', 'success');
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      loadData();
    } catch (error) {
      addToast('Không thể xóa bản ghi', 'danger');
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderStatusBadge = (statusType) => {
    switch (statusType) {
      case 'both':
        return <Badge variant="danger" dot>Trễ + Về sớm</Badge>;
      case 'late':
        return <Badge variant="warning" dot>Đi trễ</Badge>;
      case 'early':
        return <Badge variant="warning" dot>Về sớm</Badge>;
      default:
        return <Badge variant="success" dot>Đúng giờ</Badge>;
    }
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: '55px',
      render: (_, __, idx) => idx + 1,
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
        <span className="le-date-cell">
          <Calendar size={14} /> {formatDate(date)}
        </span>
      ),
    },
    {
      title: 'Vào chuẩn',
      dataIndex: 'standardIn',
      render: (t) => <span className="time-badge">{t}</span>,
    },
    {
      title: 'Vào thực tế',
      dataIndex: 'actualIn',
      render: (t, row) => (
        <span className={`time-badge ${row.lateMinutes > 0 ? 'text-danger font-bold' : ''}`}>
          {t}
        </span>
      ),
    },
    {
      title: 'Đi trễ',
      dataIndex: 'lateMinutes',
      align: 'center',
      render: (mins) =>
        mins > 0 ? (
          <strong className="text-warning">{mins} phút</strong>
        ) : (
          <span className="text-muted">0</span>
        ),
    },
    {
      title: 'Ra chuẩn',
      dataIndex: 'standardOut',
      render: (t) => <span className="time-badge">{t}</span>,
    },
    {
      title: 'Ra thực tế',
      dataIndex: 'actualOut',
      render: (t, row) => (
        <span className={`time-badge ${row.earlyMinutes > 0 ? 'text-danger font-bold' : ''}`}>
          {t}
        </span>
      ),
    },
    {
      title: 'Về sớm',
      dataIndex: 'earlyMinutes',
      align: 'center',
      render: (mins) =>
        mins > 0 ? (
          <strong className="text-warning">{mins} phút</strong>
        ) : (
          <span className="text-muted">0</span>
        ),
    },
    {
      title: 'Tổng thiếu',
      dataIndex: 'totalShortageMinutes',
      align: 'center',
      render: (total) => (
        <div>
          <strong className={total > 0 ? 'text-danger font-bold' : 'text-success'}>
            {total} phút
          </strong>
          {total > 0 && (
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {formatMinutesToHours(total)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'statusType',
      render: (type) => renderStatusBadge(type),
    },
    {
      title: 'Trừ lương ước tính',
      dataIndex: 'estimatedDeduction',
      align: 'right',
      render: (amt) => (
        <span className={amt > 0 ? 'text-danger font-semibold' : 'text-muted'}>
          {amt > 0 ? `-${formatCurrency(amt)}` : '0 đ'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'right',
      width: '95px',
      render: (_, row) => (
        <div className="table-actions">
          <button
            type="button"
            className="action-icon-btn edit"
            title="Sửa"
            onClick={() => handleOpenEdit(row)}
          >
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            className="action-icon-btn delete"
            title="Xóa"
            onClick={() => handleOpenDelete(row)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="late-early-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản Lý Đi Trễ & Về Sớm</h1>
          <p className="page-subtitle">Theo dõi thời gian vắng mặt, thiếu hụt giờ công và mức khấu trừ lương</p>
        </div>
        <div className="page-actions">
          <MonthPicker
            month={selectedDate.month}
            year={selectedDate.year}
            onChange={setSelectedDate}
          />
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Ghi nhận giờ làm
          </Button>
        </div>
      </div>

      {/* 4 Thẻ thống kê thời gian thiếu & mức phạt */}
      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tổng phút đi trễ</h3>
            <div className="stat-value text-warning">{totalLateMinutes} phút</div>
            <span className="stat-note">{formatMinutesToHours(totalLateMinutes)}</span>
          </div>
          <div className="stat-card-icon icon-yellow">
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tổng phút về sớm</h3>
            <div className="stat-value text-warning">{totalEarlyMinutes} phút</div>
            <span className="stat-note">{formatMinutesToHours(totalEarlyMinutes)}</span>
          </div>
          <div className="stat-card-icon icon-yellow">
            <Hourglass size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tổng thời gian thiếu</h3>
            <div className="stat-value text-danger">{totalShortageMinutes} phút</div>
            <span className="stat-note">Quy đổi: <strong>{formatMinutesToHours(totalShortageMinutes)}</strong></span>
          </div>
          <div className="stat-card-icon icon-red">
            <AlertCircle size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tổng trừ lương dự tính</h3>
            <div className="stat-value text-danger">-{formatCurrency(totalEstimatedDeduction)}</div>
            <span className="stat-note">Dựa trên chuẩn 8h/ngày</span>
          </div>
          <div className="stat-card-icon icon-red">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Toolbar lọc và tìm kiếm */}
      <div className="late-early-toolbar">
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
        data={filteredRecords}
        loading={loading}
        emptyMessage="Không có bản ghi đi trễ hoặc về sớm nào trong tháng này"
      />

      {/* Modal Ghi nhận */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Chỉnh sửa thông tin giờ vào / ra' : 'Ghi nhận Đi trễ / Về sớm'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal} disabled={submitLoading}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitLoading}>
              Lưu bản ghi
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Nhân viên <span className="required-star">*</span>
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
            label="Ngày làm việc"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            icon={Calendar}
            required
            error={formErrors.date}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Giờ vào quy định"
              type="time"
              value={formData.standardIn}
              onChange={(e) => setFormData({ ...formData, standardIn: e.target.value })}
            />
            <Input
              label="Giờ vào thực tế"
              type="time"
              value={formData.actualIn}
              onChange={(e) => setFormData({ ...formData, actualIn: e.target.value })}
              required
              error={formErrors.actualIn}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Giờ ra quy định"
              type="time"
              value={formData.standardOut}
              onChange={(e) => setFormData({ ...formData, standardOut: e.target.value })}
            />
            <Input
              label="Giờ ra thực tế"
              type="time"
              value={formData.actualOut}
              onChange={(e) => setFormData({ ...formData, actualOut: e.target.value })}
              required
              error={formErrors.actualOut}
            />
          </div>

          {/* Hộp xem trước số phút thiếu */}
          <div className="shortage-calc-preview">
            <div className="calc-row">
              <span>Số phút đi trễ:</span>
              <strong className={previewLateMinutes > 0 ? 'text-warning' : 'text-success'}>
                {previewLateMinutes} phút
              </strong>
            </div>
            <div className="calc-row">
              <span>Số phút về sớm:</span>
              <strong className={previewEarlyMinutes > 0 ? 'text-warning' : 'text-success'}>
                {previewEarlyMinutes} phút
              </strong>
            </div>
            <div className="calc-row" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: 6 }}>
              <span>Tổng thời gian thiếu hụt:</span>
              <strong className={previewTotalShortage > 0 ? 'text-danger' : 'text-success'} style={{ fontSize: '1.05rem' }}>
                {previewTotalShortage} phút ({formatMinutesToHours(previewTotalShortage)})
              </strong>
            </div>
          </div>

          <Input
            label="Lý do / Ghi chú"
            placeholder="Ví dụ: Tắc đường, xe hỏng, việc gia đình..."
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
        title="Xóa bản ghi"
        message={`Bạn có chắc muốn xóa bản ghi thời gian của nhân viên ${itemToDelete?.employeeName}?`}
      />
    </div>
  );
}

export default LateEarly;
