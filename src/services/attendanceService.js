import api from './api';
import { USE_REAL_API } from './authService';
import { initLocalStorage } from './mockData';
import { STANDARD_SHIFT_HOURS } from '../utils/timeUtils';

initLocalStorage();

function getMockAttendanceData() {
  const data = localStorage.getItem('mock_off_days');
  return data ? JSON.parse(data) : [];
}

function saveMockAttendanceData(data) {
  localStorage.setItem('mock_off_days', JSON.stringify(data));
}

export const attendanceService = {
  /**
   * Lấy danh sách chấm công trong tháng/năm
   * Bao gồm các ngày OFF và các ngày làm giờ lẻ (partial)
   */
  async getAttendance(month, year) {
    if (USE_REAL_API) {
      const res = await api.get('/attendance', { params: { month, year } });
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 150));
    const allRecords = getMockAttendanceData();
    const monthStr = String(month).padStart(2, '0');
    const prefix = `${year}-${monthStr}`;

    return allRecords.filter((item) => item.date.startsWith(prefix));
  },

  /**
   * Lưu hoặc cập nhật chấm công của 1 ngày
   * @param {number|string} employeeId
   * @param {string} date - "YYYY-MM-DD"
   * @param {object} payload - { status: 'full'|'partial'|'off', workHours, startTime, endTime, note }
   */
  async saveDayAttendance(employeeId, date, payload) {
    if (USE_REAL_API) {
      const res = await api.post('/attendance/day', { employeeId, date, ...payload });
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 100));
    const allRecords = getMockAttendanceData();
    const filtered = allRecords.filter(
      (item) => !(String(item.employeeId) === String(employeeId) && item.date === date)
    );

    const status = payload.status || 'full';

    if (status === 'off') {
      // Báo nghỉ (OFF)
      const newOff = {
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        employeeId: Number(employeeId),
        date,
        status: 'off',
        reason: payload.note || payload.reason || 'Nghỉ theo yêu cầu',
        workHours: 0
      };
      filtered.push(newOff);
      saveMockAttendanceData(filtered);
      return newOff;
    } else if (status === 'partial') {
      // Làm giờ lẻ (ví dụ 4 tiếng do về sớm)
      const workHours = Number(payload.workHours) || 4;
      const newPartial = {
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        employeeId: Number(employeeId),
        date,
        status: 'partial',
        workHours,
        startTime: payload.startTime || '05:00',
        endTime: payload.endTime || '09:00',
        note: payload.note || `Làm ${workHours} tiếng`
      };
      filtered.push(newPartial);
      saveMockAttendanceData(filtered);
      return newPartial;
    } else {
      // Làm đủ ca tiêu chuẩn -> Xóa khỏi bản ghi để trở về mặc định ✓
      saveMockAttendanceData(filtered);
      return null;
    }
  },

  /**
   * Đặt nhanh thành OFF
   */
  async addOff(employeeId, date, reason = 'Nghỉ theo yêu cầu') {
    return this.saveDayAttendance(employeeId, date, {
      status: 'off',
      note: reason
    });
  },

  /**
   * Đặt nhanh thành Đi làm đủ ca
   */
  async removeOff(offIdOrData) {
    if (typeof offIdOrData === 'object') {
      return this.saveDayAttendance(offIdOrData.employeeId, offIdOrData.date, {
        status: 'full'
      });
    }

    const allRecords = getMockAttendanceData();
    const target = allRecords.find((item) => String(item.id) === String(offIdOrData));
    if (target) {
      return this.saveDayAttendance(target.employeeId, target.date, {
        status: 'full'
      });
    }
    return { success: true };
  }
};

export default attendanceService;
