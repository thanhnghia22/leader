import api from './api';
import { USE_REAL_API } from './authService';
import { initLocalStorage } from './mockData';
import { getDaysInMonth, calculateWorkingDays, calculateTotalSalary, calculateRemainingSalary } from '../utils/attendanceUtils';
import { getStandardShiftHours, calculateWorkSummaryFromHours } from '../utils/timeUtils';

initLocalStorage();

function getMockAdvances() {
  const data = localStorage.getItem('mock_advances');
  return data ? JSON.parse(data) : [];
}

function saveMockAdvances(advances) {
  localStorage.setItem('mock_advances', JSON.stringify(advances));
}

export const salaryService = {
  /**
   * Lấy danh sách phiếu ứng lương
   */
  async getAdvances(params = {}) {
    if (USE_REAL_API) {
      const res = await api.get('/salary/advances', { params });
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 150));
    let advances = getMockAdvances();

    // Lọc theo tháng/năm
    if (params.month && params.year) {
      const prefix = `${params.year}-${String(params.month).padStart(2, '0')}`;
      advances = advances.filter((item) => item.date.startsWith(prefix));
    }

    // Lọc theo nhân viên
    if (params.employeeId) {
      advances = advances.filter((item) => String(item.employeeId) === String(params.employeeId));
    }

    // Nối thêm thông tin nhân viên (Mã NV, Họ tên)
    const empData = localStorage.getItem('mock_employees');
    const employees = empData ? JSON.parse(empData) : [];

    return advances.map((adv) => {
      const emp = employees.find((e) => String(e.id) === String(adv.employeeId));
      return {
        ...adv,
        employeeCode: emp ? emp.code : 'N/A',
        employeeName: emp ? emp.name : 'Nhân viên không xác định'
      };
    });
  },

  /**
   * Thêm phiếu ứng lương
   */
  async createAdvance(data) {
    if (USE_REAL_API) {
      const res = await api.post('/salary/advances', data);
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 200));
    const advances = getMockAdvances();
    const newAdvance = {
      ...data,
      id: Date.now(),
      amount: Number(data.amount) || 0,
      employeeId: Number(data.employeeId)
    };
    advances.unshift(newAdvance);
    saveMockAdvances(advances);
    return newAdvance;
  },

  /**
   * Cập nhật phiếu ứng lương
   */
  async updateAdvance(id, data) {
    if (USE_REAL_API) {
      const res = await api.put(`/salary/advances/${id}`, data);
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 200));
    const advances = getMockAdvances();
    const index = advances.findIndex((a) => String(a.id) === String(id));
    if (index === -1) throw new Error('Không tìm thấy bản ghi ứng lương');

    advances[index] = {
      ...advances[index],
      ...data,
      amount: Number(data.amount) || advances[index].amount,
      employeeId: Number(data.employeeId) || advances[index].employeeId
    };
    saveMockAdvances(advances);
    return advances[index];
  },

  /**
   * Xóa phiếu ứng lương
   */
  async deleteAdvance(id) {
    if (USE_REAL_API) {
      const res = await api.delete(`/salary/advances/${id}`);
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 150));
    const advances = getMockAdvances();
    const filtered = advances.filter((a) => String(a.id) !== String(id));
    saveMockAdvances(filtered);
    return { success: true, message: 'Đã xóa bản ghi ứng lương' };
  },

  /**
   * Lấy dữ liệu Bảng lương theo tháng
   * Cột hiển thị: Mã NV, Họ tên, Làm, OFF, Lương/ngày, Tổng lương, Đã ứng, Còn lại
   */
  async getSalary(month, year) {
    if (USE_REAL_API) {
      const res = await api.get('/salary', { params: { month, year } });
      return res.data;
    }

    await new Promise((r) => setTimeout(r, 200));
    const empData = localStorage.getItem('mock_employees');
    const offData = localStorage.getItem('mock_off_days');
    const advData = localStorage.getItem('mock_advances');
    const otData = localStorage.getItem('mock_overtime');
    const leData = localStorage.getItem('mock_late_early');

    const employees = empData ? JSON.parse(empData) : [];
    const offDays = offData ? JSON.parse(offData) : [];
    const advances = advData ? JSON.parse(advData) : [];
    const overtimes = otData ? JSON.parse(otData) : [];
    const lateEarly = leData ? JSON.parse(leData) : [];

    const totalDaysInMonth = getDaysInMonth(year, month);
    const prefix = `${year}-${String(month).padStart(2, '0')}`;

    return employees.map((emp) => {
      const empRecords = offDays.filter(
        (item) => String(item.employeeId) === String(emp.id) && item.date.startsWith(prefix)
      );

      // 1. Phân loại ngày công theo ca chuẩn chức vụ
      const stdHours = getStandardShiftHours(emp.position);
      let offCount = 0;
      let totalWorkedHours = 0;

      for (let d = 1; d <= totalDaysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const rec = empRecords.find((r) => r.date === dateStr);
        if (rec && (rec.status === 'off' || (!rec.status && rec.reason))) {
          offCount++;
        } else if (rec && rec.status === 'partial') {
          totalWorkedHours += Number(rec.workHours) || 0;
        } else {
          totalWorkedHours += stdHours;
        }
      }

      const { fullDays, extraHours } = calculateWorkSummaryFromHours(totalWorkedHours, stdHours);

      // Lương cơ bản = (Số ngày làm × Lương/ngày) + (Số giờ lẻ × (Lương/ngày / stdHours))
      const hourlyRate = (Number(emp.dailySalary) || 0) / stdHours;
      const basicSalary = Math.round(
        fullDays * (Number(emp.dailySalary) || 0) + extraHours * hourlyRate
      );

      // 2. Tổng lương & Thực lĩnh (Không cộng tăng ca vào bảng lương)
      const totalIncome = basicSalary;

      // 3. Tạm ứng & Thực lĩnh
      const empAdvances = advances.filter(
        (item) => String(item.employeeId) === String(emp.id) && item.date.startsWith(prefix)
      );
      const advancedAmount = empAdvances.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const remainingSalary = Math.max(0, totalIncome - advancedAmount);

      return {
        id: emp.id,
        employeeCode: emp.code,
        employeeName: emp.name,
        position: emp.position,
        dailySalary: emp.dailySalary,
        fullDays,
        extraHours,
        workingDays: fullDays, // Tương thích ngược
        offDays: offCount,
        basicSalary,
        overtimeHours: 0,
        overtimeAmount: 0,
        deductionAmount: 0,
        totalIncome,
        totalSalary: totalIncome, // Tương thích ngược
        advancedAmount,
        remainingSalary
      };
    });
  }
};

export default salaryService;
