import api from './api';
import { USE_REAL_API } from './authService';
import { initLocalStorage } from './mockData';
import { calculateOvertimeHours, calculateOvertimePay } from '../utils/timeUtils';

initLocalStorage();

function getMockOvertime() {
  const data = localStorage.getItem('mock_overtime');
  return data ? JSON.parse(data) : [];
}

function saveMockOvertime(records) {
  localStorage.setItem('mock_overtime', JSON.stringify(records));
}

export const overtimeService = {
  /**
   * Lấy danh sách tăng ca theo tháng / năm / nhân viên
   */
  async getOvertime(params = {}) {
    if (USE_REAL_API) {
      const res = await api.get('/timesheets/overtime', { params });
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 150));
    let records = getMockOvertime();

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
      return {
        ...record,
        employeeCode: emp ? emp.code : 'N/A',
        employeeName: emp ? emp.name : 'Nhân viên không xác định',
        position: emp ? emp.position : ''
      };
    });
  },

  /**
   * Thêm phiếu tăng ca
   */
  async createOvertime(data) {
    if (USE_REAL_API) {
      const res = await api.post('/timesheets/overtime', data);
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 200));
    const records = getMockOvertime();
    const hours = data.hours || calculateOvertimeHours(data.startTime, data.endTime);
    const hourlyRate = Number(data.hourlyRate) || 50000;
    const amount = data.amount || calculateOvertimePay(hours, hourlyRate);

    const newRecord = {
      ...data,
      id: Date.now(),
      employeeId: Number(data.employeeId),
      hours: Number(hours),
      hourlyRate,
      amount
    };

    records.unshift(newRecord);
    saveMockOvertime(records);
    return newRecord;
  },

  /**
   * Cập nhật phiếu tăng ca
   */
  async updateOvertime(id, data) {
    if (USE_REAL_API) {
      const res = await api.put(`/timesheets/overtime/${id}`, data);
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 200));
    const records = getMockOvertime();
    const index = records.findIndex((r) => String(r.id) === String(id));
    if (index === -1) throw new Error('Không tìm thấy bản ghi tăng ca');

    const hours = data.hours || calculateOvertimeHours(data.startTime, data.endTime);
    const hourlyRate = Number(data.hourlyRate) || records[index].hourlyRate;
    const amount = calculateOvertimePay(hours, hourlyRate);

    records[index] = {
      ...records[index],
      ...data,
      employeeId: Number(data.employeeId) || records[index].employeeId,
      hours: Number(hours),
      hourlyRate,
      amount
    };

    saveMockOvertime(records);
    return records[index];
  },

  /**
   * Xóa phiếu tăng ca
   */
  async deleteOvertime(id) {
    if (USE_REAL_API) {
      const res = await api.delete(`/timesheets/overtime/${id}`);
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 150));
    const records = getMockOvertime();
    const filtered = records.filter((r) => String(r.id) !== String(id));
    saveMockOvertime(filtered);
    return { success: true, message: 'Đã xóa bản ghi tăng ca' };
  }
};

export default overtimeService;
