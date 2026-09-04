import React, { useState, useEffect, useMemo } from 'react';
import {
  Check,
  X,
  Search,
  Calendar,
  Info,
  RefreshCw,
  FileDown,
  Clock,
  Edit3,
  UserCheck,
  UserX,
  CreditCard
} from 'lucide-react';
import MonthPicker from '../components/MonthPicker';
import SearchBar from '../components/SearchBar';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Loading from '../components/Loading';
import { useToast } from '../components/Toast';
import employeeService from '../services/employeeService';
import attendanceService from '../services/attendanceService';
import salaryService from '../services/salaryService';
import { exportAttendanceToPdf } from '../utils/exportPdf';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import {
  getDaysArrayForMonth,
  getDaysInMonth,
} from '../utils/attendanceUtils';
import {
  calculateShiftHours,
  formatWorkDaysAndHours,
  STANDARD_SHIFT_HOURS,
  CHEF_SHIFT_HOURS,
  SERVICE_SHIFT_HOURS,
  getStandardShiftHours,
  getDefaultShiftTimes,
  calculateWorkSummaryFromHours
} from '../utils/timeUtils';
import './Attendance.css';

export function Attendance() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });

  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Note & Status State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null); // { employee, day, record }
  const [cellForm, setCellForm] = useState({
    status: 'full', // 'full' | 'partial' | 'off'
    workHours: 5,
    startTime: '05:00',
    endTime: '10:00',
    note: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);

  const { addToast } = useToast();

  // Danh sách ngày trong tháng
  const daysInMonth = useMemo(() => {
    return getDaysArrayForMonth(selectedDate.year, selectedDate.month);
  }, [selectedDate.month, selectedDate.year]);

  const totalDays = useMemo(() => {
    return getDaysInMonth(selectedDate.year, selectedDate.month);
  }, [selectedDate.month, selectedDate.year]);

  // Tải dữ liệu nhân viên, chấm công và tạm ứng
  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const [empList, attList, advList] = await Promise.all([
        employeeService.getEmployees(),
        attendanceService.getAttendance(selectedDate.month, selectedDate.year),
        salaryService.getAdvances({ month: selectedDate.month, year: selectedDate.year }),
      ]);
      setEmployees(empList);
      setAttendanceRecords(attList);
      setAdvances(advList);
    } catch (error) {
      addToast('Không thể tải dữ liệu chấm công', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  // Lọc tìm kiếm nhân viên
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const term = searchTerm.toLowerCase().trim();
    return employees.filter(
      (e) => e.name.toLowerCase().includes(term) || e.code.toLowerCase().includes(term)
    );
  }, [employees, searchTerm]);

  /**
   * Lấy bản ghi chấm công của nhân viên tại ngày cụ thể
   */
  const getRecordForDay = (employeeId, dateString) => {
    return attendanceRecords.find(
      (record) => String(record.employeeId) === String(employeeId) && record.date === dateString
    );
  };

  /**
   * Mở modal ghi chú và cập nhật trạng thái khi click ô
   */
  const handleCellClick = (employee, day) => {
    const record = getRecordForDay(employee.id, day.dateString);
    setSelectedCell({ employee, day, record });

    const stdHours = getStandardShiftHours(employee.position);
    const defaultTimes = getDefaultShiftTimes(employee.position);

    if (record) {
      if (record.status === 'off' || (!record.status && record.reason)) {
        setCellForm({
          status: 'off',
          workHours: 0,
          startTime: defaultTimes.startTime,
          endTime: defaultTimes.endTime,
          note: record.reason || record.note || '',
        });
      } else if (record.status === 'partial') {
        setCellForm({
          status: 'partial',
          workHours: record.workHours !== undefined ? record.workHours : (stdHours - 1),
          startTime: record.startTime || defaultTimes.startTime,
          endTime: record.endTime || defaultTimes.endTime,
          note: record.note || '',
        });
      } else {
        setCellForm({
          status: 'full',
          workHours: stdHours,
          startTime: defaultTimes.startTime,
          endTime: defaultTimes.endTime,
          note: record.note || '',
        });
      }
    } else {
      // Mac dinh lam du ca chuan
      setCellForm({
        status: 'full',
        workHours: stdHours,
        startTime: defaultTimes.startTime,
        endTime: defaultTimes.endTime,
        note: '',
      });
    }
    setEditModalOpen(true);
  };

  /**
   * Xử lý khi thay đổi giờ bắt đầu / kết thúc ở ca lẻ
   */
  const handleTimeChange = (startTime, endTime) => {
    const hours = calculateShiftHours(startTime, endTime);
    setCellForm((prev) => ({
      ...prev,
      startTime,
      endTime,
      workHours: hours,
      note: prev.note || `Làm ${startTime}-${endTime} (về sớm ${endTime.replace(':', 'h')})`,
    }));
  };

  /**
   * Lưu thông tin chấm công từ Modal
   */
  const handleSaveCell = async (overrideForm = null) => {
    if (!selectedCell) return;
    const formToSave = overrideForm || cellForm;

    try {
      setSaveLoading(true);
      await attendanceService.saveDayAttendance(
        selectedCell.employee.id,
        selectedCell.day.dateString,
        formToSave
      );

      // Cập nhật state local
      const updatedList = await attendanceService.getAttendance(
        selectedDate.month,
        selectedDate.year
      );
      setAttendanceRecords(updatedList);

      addToast(`Đã lưu chấm công ngày ${selectedCell.day.dayNumber}/${selectedDate.month}`, 'success');
      setEditModalOpen(false);
      setSelectedCell(null);
    } catch (error) {
      addToast('Lưu thông tin thất bại', 'danger');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="attendance-page">
      {/* Thanh tiêu đề và điều hướng */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Bảng Chấm Công & Giờ Làm</h1>
          <p className="page-subtitle">
            Ghi nhận ngày làm đủ ca (Chef 7h / Phục vụ 5h), ca lẻ giờ (về sớm / tăng ca) và ngày nghỉ (OFF)
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
            onClick={() =>
              exportAttendanceToPdf(
                filteredEmployees,
                attendanceRecords,
                advances,
                daysInMonth,
                selectedDate.month,
                selectedDate.year
              )
            }
          >
            Xuất PDF Chấm Công
          </Button>
        </div>
      </div>

      {/* Thanh công cụ tìm kiếm và chú thích */}
      <div className="attendance-toolbar">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm nhân viên..."
          className="attendance-search"
        />

        <div className="attendance-legend">
          <div className="legend-item">
            <span className="legend-badge badge-work">✓</span>
            <span>Đủ ca (Chef 7h / Phục vụ 5h)</span>
          </div>
          <div className="legend-item">
            <span className="legend-badge badge-partial">6h / 8h</span>
            <span>Giờ lẻ / Về sớm / Tăng ca</span>
          </div>
          <div className="legend-item">
            <span className="legend-badge badge-off">OFF</span>
            <span>Nghỉ phép</span>
          </div>
          <div className="legend-item">
            <span className="legend-tag-total">
              Tháng có: <strong>{totalDays} ngày</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Khu vực Bảng Ma Trận Chấm Công cuộn ngang */}
      {loading ? (
        <Loading text="Đang tải dữ liệu chấm công tháng..." />
      ) : (
        <div className="attendance-matrix-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th className="sticky-col col-code">Mã NV</th>
                <th className="sticky-col col-name">Họ tên</th>

                {/* Các ngày 01, 02, ..., 31 */}
                {daysInMonth.map((day) => (
                  <th
                    key={day.dateString}
                    className={`day-header ${day.isWeekend ? 'weekend' : ''}`}
                    title={`${day.dayOfWeek}, ngày ${day.dayNumber}`}
                  >
                    <div className="day-header-number">
                      {String(day.dayNumber).padStart(2, '0')}
                    </div>
                    <div className="day-header-dow">{day.dayOfWeek}</div>
                  </th>
                ))}

                {/* Các cột tổng kết bên phải: Ngày làm, Giờ lẻ, OFF, Tạm ứng */}
                <th className="summary-col col-work" title="Số ngày làm quy đổi đủ ca chuẩn (Chef 7h / Phục vụ 5h)">
                  Ngày làm
                </th>
                <th className="summary-col col-extra-hours" title="Tổng số giờ lẻ (dư sau quy đổi ngày làm)">
                  Giờ lẻ
                </th>
                <th className="summary-col col-off" title="Số ngày nghỉ trong tháng">
                  OFF
                </th>
                <th className="summary-col col-advance" title="Tổng tiền đã tạm ứng trong tháng">
                  Tạm ứng
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth.length + 6} className="empty-attendance-cell">
                    Không tìm thấy nhân viên nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const stdHours = getStandardShiftHours(emp.position);
                  const isChef = stdHours === CHEF_SHIFT_HOURS;

                  // Tinh tong so gio lam viec thuc te trong thang
                  let offCount = 0;
                  let totalWorkedHours = 0;

                  daysInMonth.forEach((day) => {
                    const rec = getRecordForDay(emp.id, day.dateString);
                    if (rec && (rec.status === 'off' || (!rec.status && rec.reason))) {
                      offCount++;
                    } else if (rec && rec.status === 'partial') {
                      totalWorkedHours += Number(rec.workHours) || 0;
                    } else {
                      // Lam du ca chuan cua chuc vu
                      totalWorkedHours += stdHours;
                    }
                  });

                  const { fullDays, extraHours } = calculateWorkSummaryFromHours(totalWorkedHours, stdHours);

                  // Tổng tạm ứng trong tháng của NV này
                  const empAdvances = advances.filter(
                    (a) =>
                      String(a.employeeId) === String(emp.id) &&
                      a.date.startsWith(
                        `${selectedDate.year}-${String(selectedDate.month).padStart(2, '0')}`
                      )
                  );
                  const totalAdvanceAmount = empAdvances.reduce(
                    (sum, a) => sum + Number(a.amount || 0),
                    0
                  );

                  return (
                    <tr key={emp.id} className="attendance-row">
                      <td className="sticky-col col-code">
                        <span className="code-text">{emp.code}</span>
                      </td>
                      <td className="sticky-col col-name" title={`${emp.name} (${emp.position})`}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span className="name-text">{emp.name}</span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: isChef ? '#c2410c' : '#0369a1',
                              backgroundColor: isChef ? '#ffedd5' : '#e0f2fe',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              width: 'fit-content'
                            }}
                          >
                            {isChef ? 'Chef (7h)' : 'Phục vụ (5h)'}
                          </span>
                        </div>
                      </td>

                      {/* Các ô chấm công theo ngày */}
                      {daysInMonth.map((day) => {
                        const rec = getRecordForDay(emp.id, day.dateString);
                        const isOff = rec && (rec.status === 'off' || (!rec.status && rec.reason));
                        const isPartial = rec && rec.status === 'partial';

                        let tooltipText = `${emp.name} (${emp.position}) - Ngày ${day.dayNumber}/${selectedDate.month}: Làm đủ ca ${stdHours}h`;
                        if (isOff) {
                          tooltipText = `${emp.name} - Ngày ${day.dayNumber}/${selectedDate.month}: OFF (${rec.reason || rec.note || 'Nghỉ phép'})`;
                        } else if (isPartial) {
                          tooltipText = `${emp.name} - Ngày ${day.dayNumber}/${selectedDate.month}: Làm ${rec.workHours} tiếng (${rec.startTime || '04:00'} - ${rec.endTime || '11:00'}). ${rec.note || ''}`;
                        }

                        return (
                          <td
                            key={day.dateString}
                            className={`attendance-cell ${
                              isOff ? 'cell-off' : isPartial ? 'cell-partial' : 'cell-work'
                            } ${day.isWeekend ? 'cell-weekend' : ''}`}
                            onClick={() => handleCellClick(emp, day)}
                            title={tooltipText}
                          >
                            {isOff ? (
                              <span className="status-off">OFF</span>
                            ) : isPartial ? (
                              <span className="status-partial">{rec.workHours}h</span>
                            ) : (
                              <span className="status-work">✓</span>
                            )}
                          </td>
                        );
                      })}

                      {/* 1. Tổng ngày làm tròn */}
                      <td className="summary-col col-work">
                        <strong className="text-success">{fullDays} ngày</strong>
                      </td>
                      {/* 2. Số giờ lẻ */}
                      <td className="summary-col col-extra-hours">
                        {extraHours > 0 ? (
                          <strong className="text-warning font-semibold">
                            {extraHours} tiếng
                          </strong>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                      {/* 3. OFF */}
                      <td className="summary-col col-off">
                        <strong className={offCount > 0 ? 'text-danger' : 'text-muted'}>
                          {offCount}
                        </strong>
                      </td>
                      {/* 4. Tạm ứng */}
                      <td className="summary-col col-advance">
                        {totalAdvanceAmount > 0 ? (
                          <strong className="text-warning">
                            {formatCurrency(totalAdvanceAmount, 'đ')}
                          </strong>
                        ) : (
                          <span className="text-muted">0đ</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Chấm công & Ghi chú Đi trễ / Về sớm */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={
          selectedCell?.employee ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Chấm công: {selectedCell.employee.name} ({selectedCell.employee.code})</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: getStandardShiftHours(selectedCell.employee.position) === 7 ? '#c2410c' : '#0369a1',
                  backgroundColor: getStandardShiftHours(selectedCell.employee.position) === 7 ? '#ffedd5' : '#e0f2fe',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}
              >
                {getStandardShiftHours(selectedCell.employee.position) === 7 ? '👨‍🍳 Chef (Ca 7h)' : '🛎️ Phục vụ (Ca 5h)'}
              </span>
            </div>
          ) : 'Chấm công'
        }
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditModalOpen(false)}
              disabled={saveLoading}
            >
              Đóng
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSaveCell()}
              loading={saveLoading}
            >
              Lưu chấm công
            </Button>
          </>
        }
      >
        <div className="attendance-modal-content">
          <div className="modal-date-heading">
            <Calendar size={18} className="text-primary" />
            <span>
              Ngày {selectedCell?.day?.dayNumber} tháng {selectedDate.month} năm {selectedDate.year} ({selectedCell?.day?.dayOfWeek})
            </span>
          </div>

          {/* 3 Nút chọn trạng thái ca làm việc */}
          <div className="status-selector-grid-three">
            <button
              type="button"
              className={`status-choice-btn btn-work-choice ${
                cellForm.status === 'full' ? 'selected' : ''
              }`}
              onClick={() => {
                const std = getStandardShiftHours(selectedCell?.employee?.position);
                const times = getDefaultShiftTimes(selectedCell?.employee?.position);
                setCellForm({
                  ...cellForm,
                  status: 'full',
                  workHours: std,
                  startTime: times.startTime,
                  endTime: times.endTime,
                });
              }}
            >
              <UserCheck size={20} />
              <div>
                <strong>✓ Làm đủ ca {getStandardShiftHours(selectedCell?.employee?.position)} tiếng</strong>
                <span>Tính 1 ca chuẩn ({getStandardShiftHours(selectedCell?.employee?.position)}h)</span>
              </div>
            </button>

            <button
              type="button"
              className={`status-choice-btn btn-partial-choice ${
                cellForm.status === 'partial' ? 'selected' : ''
              }`}
              onClick={() => {
                const std = getStandardShiftHours(selectedCell?.employee?.position);
                const times = getDefaultShiftTimes(selectedCell?.employee?.position);
                setCellForm({
                  ...cellForm,
                  status: 'partial',
                  workHours: cellForm.workHours || (std - 1),
                  startTime: cellForm.startTime || times.startTime,
                  endTime: cellForm.endTime || times.endTime,
                  note: cellForm.note || '',
                });
              }}
            >
              <Clock size={20} />
              <div>
                <strong>⏰ Giờ lẻ / Về sớm / Tăng ca</strong>
                <span>Nhập số giờ làm thực tế</span>
              </div>
            </button>

            <button
              type="button"
              className={`status-choice-btn btn-off-choice ${
                cellForm.status === 'off' ? 'selected' : ''
              }`}
              onClick={() =>
                setCellForm({
                  ...cellForm,
                  status: 'off',
                  workHours: 0,
                  note: cellForm.note || 'Nghỉ theo yêu cầu',
                })
              }
            >
              <UserX size={20} />
              <div>
                <strong>✕ OFF Nghỉ</strong>
                <span>Báo nghỉ ngày này</span>
              </div>
            </button>
          </div>

          {/* Nội dung tương ứng theo lựa chọn */}
          {cellForm.status === 'full' && (
            <div className="full-shift-box">
              <div className="info-notice">
                <Info size={16} className="text-success" />
                <span>
                  Làm đủ ca chuẩn {getStandardShiftHours(selectedCell?.employee?.position)} tiếng ({getDefaultShiftTimes(selectedCell?.employee?.position).startTime} - {getDefaultShiftTimes(selectedCell?.employee?.position).endTime}).
                </span>
              </div>
              <Input
                label="Ghi chú thêm (nếu có)"
                placeholder="Nhập ghi chú nếu cần..."
                value={cellForm.note}
                onChange={(e) => setCellForm({ ...cellForm, note: e.target.value })}
              />
            </div>
          )}

          {cellForm.status === 'partial' && (
            <div className="partial-shift-box">
              <div className="info-notice">
                <Clock size={16} className="text-warning" />
                <span>
                  {getStandardShiftHours(selectedCell?.employee?.position) === 7
                    ? 'Chef ca 7h: Ví dụ về sớm 1 tiếng tính 6 tiếng; tăng ca 3h-11h tính 8 tiếng (hệ thống tự động bù trừ vào tổng công).'
                    : 'Phục vụ ca 5h: Ví dụ làm từ 5h đến 9h (về sớm 9h) tính 4 tiếng.'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Input
                  label="Giờ bắt đầu làm"
                  type="time"
                  value={cellForm.startTime || getDefaultShiftTimes(selectedCell?.employee?.position).startTime}
                  onChange={(e) => handleTimeChange(e.target.value, cellForm.endTime || getDefaultShiftTimes(selectedCell?.employee?.position).endTime)}
                />
                <Input
                  label="Giờ về / kết thúc"
                  type="time"
                  value={cellForm.endTime || getDefaultShiftTimes(selectedCell?.employee?.position).endTime}
                  onChange={(e) => handleTimeChange(cellForm.startTime || getDefaultShiftTimes(selectedCell?.employee?.position).startTime, e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', marginTop: '6px' }}>
                <Input
                  label="Số giờ làm thực tế (tiếng)"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={cellForm.workHours || ''}
                  onChange={(e) =>
                    setCellForm({ ...cellForm, workHours: Number(e.target.value) || 0 })
                  }
                  helperText={`Số giờ này được cộng dồn vào tổng giờ làm của tháng và quy đổi theo ca chuẩn (${getStandardShiftHours(selectedCell?.employee?.position)}h/ca)`}
                />
              </div>

              <Input
                label="Ghi chú (Ví dụ: Về sớm 1h, Tăng ca 3h-11h...)"
                placeholder="Ví dụ: Về sớm 1h, làm thêm giờ..."
                value={cellForm.note}
                onChange={(e) => setCellForm({ ...cellForm, note: e.target.value })}
              />
            </div>
          )}

          {cellForm.status === 'off' && (
            <div className="off-note-box">
              <Input
                label="Lý do nghỉ phép"
                placeholder="Ví dụ: Nghỉ phép cá nhân, việc gia đình, nghỉ ốm..."
                value={cellForm.note}
                onChange={(e) => setCellForm({ ...cellForm, note: e.target.value })}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default Attendance;
