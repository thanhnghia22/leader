import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  Phone,
  Briefcase,
  DollarSign,
  User,
  Hash
} from 'lucide-react';
import Table from '../components/Table';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import SearchBar from '../components/SearchBar';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import employeeService from '../services/employeeService';
import { formatCurrency } from '../utils/formatCurrency';
import './Employees.css';

export function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    phone: '',
    position: '',
    dailySalary: '',
    status: 'active',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Confirm Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { addToast } = useToast();
  const navigate = useNavigate();

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getEmployees({
        search: searchTerm,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setEmployees(data);
    } catch (error) {
      addToast('Không thể tải danh sách nhân viên', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [searchTerm, statusFilter]);

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      code: `NV${String(employees.length + 1).padStart(3, '0')}`,
      name: '',
      phone: '',
      position: 'Chef',
      dailySalary: 350000,
      status: 'active',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      code: emp.code,
      name: emp.name,
      phone: emp.phone,
      position: emp.position,
      dailySalary: emp.dailySalary,
      status: emp.status || 'active',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Vui lòng nhập họ và tên';
    if (!formData.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{9,11}$/.test(formData.phone.replace(/\s+/g, ''))) {
      errors.phone = 'Số điện thoại không hợp lệ (9 - 11 số)';
    }
    if (!formData.position.trim()) errors.position = 'Vui lòng nhập chức vụ';
    if (!formData.dailySalary || Number(formData.dailySalary) <= 0) {
      errors.dailySalary = 'Lương/ngày phải lớn hơn 0';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitLoading(true);
      if (editingEmployee) {
        await employeeService.updateEmployee(editingEmployee.id, formData);
        addToast('Cập nhật nhân viên thành công!', 'success');
      } else {
        await employeeService.createEmployee(formData);
        addToast('Thêm nhân viên mới thành công!', 'success');
      }
      handleCloseModal();
      loadEmployees();
    } catch (error) {
      addToast(error.message || 'Thao tác thất bại', 'danger');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenDelete = (emp) => {
    setEmployeeToDelete(emp);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      setDeleteLoading(true);
      await employeeService.deleteEmployee(employeeToDelete.id);
      addToast(`Đã xóa nhân viên ${employeeToDelete.name}`, 'success');
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
      loadEmployees();
    } catch (error) {
      addToast('Không thể xóa nhân viên', 'danger');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      title: 'Mã NV',
      dataIndex: 'code',
      width: '100px',
      render: (code) => <span className="emp-code-badge">{code}</span>,
    },
    {
      title: 'Họ tên',
      dataIndex: 'name',
      render: (name, row) => (
        <div className="emp-name-cell">
          <div className="emp-avatar-sm">{name.charAt(0)}</div>
          <div className="emp-name-text">
            <strong>{name}</strong>
          </div>
        </div>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      render: (phone) => <span>{phone}</span>,
    },
    {
      title: 'Chức vụ',
      dataIndex: 'position',
      render: (pos) => {
        const isChef = String(pos || '').toLowerCase().includes('chef');
        return isChef ? (
          <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', display: 'inline-block' }}>
            👨‍🍳 Chef (Ca 8h: 2h-10h)
          </span>
        ) : (
          <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', display: 'inline-block' }}>
            🛎️ Phục vụ (Ca 5h: 5h-10h)
          </span>
        );
      },
    },
    {
      title: 'Lương/ngày',
      dataIndex: 'dailySalary',
      render: (salary) => <strong>{formatCurrency(salary)}</strong>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status) => (
        <Badge variant={status === 'active' ? 'success' : 'neutral'} dot>
          {status === 'active' ? 'Đang làm' : 'Đã nghỉ'}
        </Badge>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'right',
      width: '160px',
      render: (_, row) => (
        <div className="table-actions">
          <button
            type="button"
            className="action-icon-btn view"
            title="Xem chi tiết"
            onClick={() => navigate(`/employees/${row.id}`)}
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            className="action-icon-btn edit"
            title="Sửa nhân viên"
            onClick={() => handleOpenEditModal(row)}
          >
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            className="action-icon-btn delete"
            title="Xóa nhân viên"
            onClick={() => handleOpenDelete(row)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="employees-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Nhân viên</h1>
          <p className="page-subtitle">Quản lý danh sách nhân sự, chức vụ và mức lương ngày</p>
        </div>
        <div className="page-actions">
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={handleOpenAddModal}
          >
            Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* Bộ lọc và Tìm kiếm */}
      <div className="filter-bar">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm tên, mã NV, SĐT, chức vụ..."
        />

        <div className="filter-group">
          <label className="filter-label">Trạng thái:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang làm việc</option>
            <option value="inactive">Đã nghỉ việc</option>
          </select>
        </div>
      </div>

      {/* Bảng nhân viên */}
      <Table
        columns={columns}
        data={employees}
        loading={loading}
        emptyMessage="Không tìm thấy nhân viên nào phù hợp"
      />

      {/* Modal Thêm/Sửa nhân viên */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingEmployee ? 'Chỉnh sửa thông tin nhân viên' : 'Thêm nhân viên mới'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal} disabled={submitLoading}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitLoading}>
              Lưu thông tin
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Mã nhân viên"
            placeholder="NV001"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            icon={Hash}
            required
            disabled={!!editingEmployee}
            error={formErrors.code}
          />

          <Input
            label="Họ và tên"
            placeholder="Ví dụ: Nguyễn Văn A"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            icon={User}
            required
            error={formErrors.name}
          />

          <Input
            label="Số điện thoại"
            placeholder="Ví dụ: 0901234567"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            icon={Phone}
            required
            error={formErrors.phone}
          />

          <div className="input-group-custom" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.875rem' }}>
              Chức vụ <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={formData.position || 'Chef'}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '8px',
                padding: '0 12px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                backgroundColor: '#fff'
              }}
            >
              <option value="Chef">👨‍🍳 Chef (Ca chuẩn 8 tiếng: 02:00 - 10:00)</option>
              <option value="Phục vụ">🛎️ Phục vụ (Ca chuẩn 5 tiếng: 05:00 - 10:00)</option>
            </select>
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
              {formData.position === 'Chef'
                ? '• Chef: ca chuẩn 8h/ngày (02:00 - 10:00). Lương giờ = Lương ngày / 8'
                : '• Phục vụ: ca chuẩn 5h/ngày (05:00 - 10:00). Lương giờ = Lương ngày / 5'}
            </span>
          </div>

          <Input
            label="Lương / ngày (VNĐ)"
            type="number"
            placeholder="Ví dụ: 300000"
            value={formData.dailySalary}
            onChange={(e) => setFormData({ ...formData, dailySalary: e.target.value })}
            icon={DollarSign}
            required
            error={formErrors.dailySalary}
          />
        </form>
      </Modal>

      {/* Dialog xác nhận xóa */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Xóa nhân viên"
        message={`Bạn có chắc chắn muốn xóa nhân viên "${employeeToDelete?.name}" (${employeeToDelete?.code}) khỏi hệ thống?`}
        confirmText="Xác nhận xóa"
      />
    </div>
  );
}

export default Employees;
