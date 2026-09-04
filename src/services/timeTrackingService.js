import api from './api';
import { USE_REAL_API } from './authService';
import { initLocalStorage } from './mockData';
import {
  calculateLateMinutes,
  calculateEarlyMinutes,
  getAttendanceStatusType,
  calculateShortageDeduction
} from '../utils/timeUtils';

initLocalStorage();

function getMockLateEarly() {
  const data = localStorage.getItem('mock_late_early');
  return data ? JSON.parse(data) : [];
}

function saveMockLateEarly(records) {
  localStorage.setItem('mock_late_early', JSON.stringify(records));
}

export const timeTrackingService = {
  /**
   * Lấy danh sách ghi nhận đi trễ / về sớm
   */
  async getLateEarly(params = {}) {
    if (USE_REAL_API) {
      const res = await api.get('/timesheets/late-early', { params });
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 150));
    let records = getMockLateEarly();

    // Lọc theo tháng & năm
    if (params.month && params.year) {
      const prefix = `${params.year}-${String(params.month).padStart(2, '0')}`;
      records = records.filter((item) => item.date.startsWith(prefix));
    }

    // Lọc theo nhân viên
    if (params.employeeId) {
      records = records.filter((item) => String(item.employeeId) === String(params.employeeId));
    }

    // Nối thêm thông tin nhân viên
    const empData = localStorage.getItem('mock_employees');
    const employees = empData ? JSON.parse(empData) : [];

    return records.map((record) => {
      const emp = employees.find((e) => String(e.id) === String(record.employeeId));
      const statusType = getAttendanceStatusType(record.lateMinutes, record.earlyMinutes);
      const estimatedDeduction = emp
        ? calculateShortageDeduction(record.totalShortageMinutes, emp.dailySalary)
        : 0;

      return {
        ...record,
        employeeCode: emp ? emp.code : 'N/A',
        employeeName: emp ? emp.name : 'Nhân viên không xác định',
        position: emp ? emp.position : '',
        dailySalary: emp ? emp.dailySalary : 0,
        statusType,
        estimatedDeduction
      };
    });
  },

  /**
   * Thêm ghi nhận đi trễ / về sớm
   */
  async createLateEarly(data) {
    if (USE_REAL_API) {
      const res = await api.post('/timesheets/late-early', data);
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 200));
    const records = getMockLateEarly();

    const standardIn = data.standardIn || '08:00';
    const standardOut = data.standardOut || '17:00';
    const lateMinutes = calculateLateMinutes(standardIn, data.actualIn);
    const earlyMinutes = calculateEarlyMinutes(standardOut, data.actualOut);
    const totalShortageMinutes = lateMinutes + earlyMinutes;

    const newRecord = {
      ...data,
      id: Date.now(),
      employeeId: Number(data.employeeId),
      standardIn,
      standardOut,
      lateMinutes,
      earlyMinutes,
      totalShortageMinutes
    };

    records.unshift(newRecord);
    saveMockLateEarly(records);
    return newRecord;
  },

  /**
   * Cập nhật ghi nhận đi trễ / về sớm
   */
  async updateLateEarly(id, data) {
    if (USE_REAL_API) {
      const res = await api.put(`/timesheets/late-early/${id}`, data);
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 200));
    const records = getMockLateEarly();
    const index = records.findIndex((r) => String(r.id) === String(id));
    if (index === -1) throw new Error('Không tìm thấy bản ghi');

    const standardIn = data.standardIn || records[index].standardIn || '08:00';
    const standardOut = data.standardOut || records[index].standardOut || '17:00';
    const lateMinutes = calculateLateMinutes(standardIn, data.actualIn);
    const earlyMinutes = calculateEarlyMinutes(standardOut, data.actualOut);
    const totalShortageMinutes = lateMinutes + earlyMinutes;

    records[index] = {
      ...records[index],
      ...data,
      employeeId: Number(data.employeeId) || records[index].employeeId,
      standardIn,
      standardOut,
      lateMinutes,
      earlyMinutes,
      totalShortageMinutes
    };

    saveMockLateEarly(records);
    return records[index];
  },

  /**
   * Xóa bản ghi đi trễ / về sớm
   */
  async deleteLateEarly(id) {
    if (USE_REAL_API) {
      const res = await api.delete(`/timesheets/late-early/${id}`);
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 150));
    const records = getMockLateEarly();
    const filtered = records.filter((r) => String(r.id) !== String(id));
    saveMockLateEarly(filtered);
    return { success: true, message: 'Đã xóa bản ghi thành công' };
  }
};

export default timeTrackingService;
