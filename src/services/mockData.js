/**
 * Mock Data ban đầu phục vụ phát triển giao diện trước khi kết nối Backend
 * Dữ liệu được lưu trữ tự động vào localStorage để các thao tác Thêm/Sửa/Xóa hoạt động tức thì.
 */

const INITIAL_EMPLOYEES = [
  {
    id: 1,
    code: 'NV001',
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    position: 'Chef',
    dailySalary: 400000,
    status: 'active',
    createdAt: '2026-01-15'
  },
  {
    id: 2,
    code: 'NV002',
    name: 'Trần Thị B',
    phone: '0912345678',
    position: 'Phục vụ (5h-10h)',
    dailySalary: 300000,
    status: 'active',
    createdAt: '2026-02-01'
  },
  {
    id: 3,
    code: 'NV003',
    name: 'Lê Văn C',
    phone: '0923456789',
    position: 'Chef',
    dailySalary: 450000,
    status: 'active',
    createdAt: '2026-02-10'
  },
  {
    id: 4,
    code: 'NV004',
    name: 'Phạm Minh D',
    phone: '0934567890',
    position: 'Phục vụ (6h-10h)',
    dailySalary: 320000,
    status: 'active',
    createdAt: '2026-03-01'
  },
  {
    id: 5,
    code: 'NV005',
    name: 'Hoàng Thị E',
    phone: '0945678901',
    position: 'Phục vụ (5h-10h)',
    dailySalary: 300000,
    status: 'active',
    createdAt: '2026-03-15'
  },
  {
    id: 6,
    code: 'NV006',
    name: 'Đặng Quốc F',
    phone: '0956789012',
    position: 'Chef',
    dailySalary: 380000,
    status: 'active',
    createdAt: '2026-04-01'
  }
];

// Chỉ lưu trữ ngày NGHỈ (OFF) và các ca làm việc có điều chỉnh giờ lẻ/tăng ca
const INITIAL_OFF_DAYS = [
  { id: 'off_1', employeeId: 1, date: '2026-09-03', status: 'off', reason: 'Nghỉ phép cá nhân' },
  { id: 'off_2', employeeId: 1, date: '2026-09-17', status: 'off', reason: 'Việc gia đình' },
  { id: 'off_3', employeeId: 2, date: '2026-09-04', status: 'off', reason: 'Nghỉ ốm' },
  { id: 'off_4', employeeId: 3, date: '2026-09-02', status: 'off', reason: 'Nghỉ phép' },
  { id: 'off_5', employeeId: 4, date: '2026-09-04', status: 'off', reason: 'Nghỉ bù' },
  // NV001 Chef (ca 7h): ngày 08 về sớm 1 tiếng (làm 6h), ngày 09 làm tăng ca 3h-11h (làm 8h)
  { id: 'partial_1', employeeId: 1, date: '2026-09-08', status: 'partial', workHours: 6, startTime: '04:00', endTime: '10:00', note: 'Về sớm 1 tiếng (làm 6h)' },
  { id: 'partial_2', employeeId: 1, date: '2026-09-09', status: 'partial', workHours: 8, startTime: '03:00', endTime: '11:00', note: 'Tăng ca 3h-11h (làm 8h bù giờ)' },
  // NV002 Phục vụ (ca 5h): ngày 10 về sớm 1 tiếng (làm 5h-9h = 4h)
  { id: 'partial_3', employeeId: 2, date: '2026-09-10', status: 'partial', workHours: 4, startTime: '05:00', endTime: '09:00', note: 'Làm 5h-9h (về sớm 9h)' }
];

const INITIAL_ADVANCES = [
  { id: 1, employeeId: 1, date: '2026-09-05', amount: 500000, note: 'Tạm ứng đợt 1' },
  { id: 2, employeeId: 1, date: '2026-09-15', amount: 300000, note: 'Tạm ứng xăng xe' },
  { id: 3, employeeId: 2, date: '2026-09-10', amount: 1500000, note: 'Tạm ứng sinh hoạt' },
  { id: 4, employeeId: 3, date: '2026-09-08', amount: 800000, note: 'Ứng tiền đóng học phí con' },
  { id: 5, employeeId: 4, date: '2026-09-12', amount: 2000000, note: 'Tạm ứng công tác' },
  { id: 6, employeeId: 5, date: '2026-09-14', amount: 1000000, note: 'Tạm ứng đợt 1' }
];

// Dữ liệu mẫu Tăng ca (Overtime)
const INITIAL_OVERTIME = [
  {
    id: 1,
    employeeId: 1,
    date: '2026-09-05',
    startTime: '18:00',
    endTime: '21:00',
    hours: 3,
    hourlyRate: 50000,
    amount: 150000,
    note: 'Tăng ca bảo trì hệ thống máy chủ'
  },
  {
    id: 2,
    employeeId: 1,
    date: '2026-09-12',
    startTime: '17:30',
    endTime: '20:30',
    hours: 3,
    hourlyRate: 50000,
    amount: 150000,
    note: 'Hỗ trợ kiểm kê thiết bị kỹ thuật'
  },
  {
    id: 3,
    employeeId: 3,
    date: '2026-09-06',
    startTime: '18:00',
    endTime: '22:00',
    hours: 4,
    hourlyRate: 55000,
    amount: 220000,
    note: 'Sửa chữa đột xuất đường dây'
  },
  {
    id: 4,
    employeeId: 4,
    date: '2026-09-10',
    startTime: '17:00',
    endTime: '20:00',
    hours: 3,
    hourlyRate: 60000,
    amount: 180000,
    note: 'Kiểm kê xuất hàng đợt 2'
  }
];

// Dữ liệu mẫu Đi trễ & Về sớm
const INITIAL_LATE_EARLY = [
  {
    id: 1,
    employeeId: 1,
    date: '2026-09-02',
    standardIn: '08:00',
    actualIn: '08:30',
    lateMinutes: 30,
    standardOut: '17:00',
    actualOut: '16:00',
    earlyMinutes: 60,
    totalShortageMinutes: 90,
    note: 'Xe hỏng và xin về sớm đưa con đi khám'
  },
  {
    id: 2,
    employeeId: 2,
    date: '2026-09-03',
    standardIn: '08:00',
    actualIn: '08:20',
    lateMinutes: 20,
    standardOut: '17:00',
    actualOut: '17:00',
    earlyMinutes: 0,
    totalShortageMinutes: 20,
    note: 'Tắc đường ngã tư sở'
  },
  {
    id: 3,
    employeeId: 3,
    date: '2026-09-08',
    standardIn: '08:00',
    actualIn: '08:00',
    lateMinutes: 0,
    standardOut: '17:00',
    actualOut: '16:30',
    earlyMinutes: 30,
    totalShortageMinutes: 30,
    note: 'Xin phép về sớm đi khám răng'
  },
  {
    id: 4,
    employeeId: 6,
    date: '2026-09-09',
    standardIn: '08:00',
    actualIn: '08:45',
    lateMinutes: 45,
    standardOut: '17:00',
    actualOut: '17:00',
    earlyMinutes: 0,
    totalShortageMinutes: 45,
    note: 'Mưa to ngập đường cục bộ'
  }
];

export function initLocalStorage() {
  const existingEmp = localStorage.getItem('mock_employees');
  if (!existingEmp) {
    localStorage.setItem('mock_employees', JSON.stringify(INITIAL_EMPLOYEES));
  } else {
    try {
      const emps = JSON.parse(existingEmp);
      // Chuẩn hóa chức vụ: Chef, Phục vụ (5h-10h) hoặc Phục vụ (6h-10h)
      const normalized = emps.map((emp) => {
        const p = String(emp.position || '').toLowerCase();
        let pos = 'Phục vụ (5h-10h)';
        if (p.includes('chef') || p.includes('bếp') || p.includes('trưởng') || p.includes('kỹ thuật') || p.includes('vận hành')) {
          pos = 'Chef';
        } else if (p.includes('6h') || p.includes('4h')) {
          pos = 'Phục vụ (6h-10h)';
        }
        return { ...emp, position: pos };
      });
      localStorage.setItem('mock_employees', JSON.stringify(normalized));
    } catch (e) {
      localStorage.setItem('mock_employees', JSON.stringify(INITIAL_EMPLOYEES));
    }
  }
  if (!localStorage.getItem('mock_off_days')) {
    localStorage.setItem('mock_off_days', JSON.stringify(INITIAL_OFF_DAYS));
  } else {
    try {
      const currentOff = JSON.parse(localStorage.getItem('mock_off_days'));
      const hasPartial = currentOff.some((item) => item.status === 'partial');
      if (!hasPartial) {
        // Bổ sung các bản ghi làm giờ lẻ mẫu nếu chưa có
        const merged = [...currentOff, ...INITIAL_OFF_DAYS.filter((item) => item.status === 'partial')];
        localStorage.setItem('mock_off_days', JSON.stringify(merged));
      }
    } catch (e) {
      localStorage.setItem('mock_off_days', JSON.stringify(INITIAL_OFF_DAYS));
    }
  }
  if (!localStorage.getItem('mock_advances')) {
    localStorage.setItem('mock_advances', JSON.stringify(INITIAL_ADVANCES));
  }
  if (!localStorage.getItem('mock_overtime')) {
    localStorage.setItem('mock_overtime', JSON.stringify(INITIAL_OVERTIME));
  }
}
