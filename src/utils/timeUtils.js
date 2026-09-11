/**
 * Tiện ích tính toán giờ làm và công chuẩn của Leader
 * Quy tắc:
 * - Ca làm việc tiêu chuẩn mặc định: 5 tiếng (ví dụ: 5h đến 10h)
 * - Nếu về sớm (ví dụ 9h): tính làm 4 tiếng
 * - Tổng kết công: [Số ngày làm] và [Số giờ lẻ] (ví dụ: 2 ngày 4 tiếng)
 */

export const CHEF_SHIFT_HOURS = 8;     // Ca Chef chuẩn: 8 tiếng (02:00 - 10:00)
export const SERVICE_SHIFT_HOURS = 5;  // Ca Phục vụ chuẩn: 5 tiếng (05:00 - 10:00)
export const STANDARD_SHIFT_HOURS = 5; // Tương thích ngược

/**
 * Lấy số giờ ca chuẩn theo chức vụ: Chef = 8h (02:00 - 10:00), Phục vụ = 5h (05:00 - 10:00)
 */
export function getStandardShiftHours(position = '') {
  if (!position) return SERVICE_SHIFT_HOURS;
  const p = String(position).toLowerCase().trim();
  if (p.includes('chef') || p.includes('bếp') || p.includes('nấu')) {
    return CHEF_SHIFT_HOURS;
  }
  return SERVICE_SHIFT_HOURS;
}

/**
 * Lấy khung giờ ca chuẩn gợi ý theo chức vụ
 */
export function getDefaultShiftTimes(position = '') {
  const isChef = getStandardShiftHours(position) === CHEF_SHIFT_HOURS;
  if (isChef) {
    return { startTime: '02:00', endTime: '10:00', hours: CHEF_SHIFT_HOURS, label: 'Chef (Ca 8 tiếng: 02:00 - 10:00)' };
  }
  return { startTime: '05:00', endTime: '10:00', hours: SERVICE_SHIFT_HOURS, label: 'Phục vụ (Ca 5 tiếng: 05:00 - 10:00)' };
}

/**
 * Tính số ngày làm tròn ca và số giờ lẻ dựa trên tổng số giờ làm việc
 * Ví dụ:
 * - Chef (8h): 20 giờ -> 2 ngày 4 tiếng (20 / 8 = 2 dư 4)
 * - Chef (8h): 24 giờ -> 3 ngày 0 tiếng (24 / 8 = 3 dư 0)
 * - Phục vụ (5h): 14 giờ -> 2 ngày 4 tiếng (14 / 5 = 2 dư 4)
 */
export function calculateWorkSummaryFromHours(totalHours = 0, standardHours = 5) {
  const std = Number(standardHours) || 5;
  const fullDays = Math.floor(totalHours / std);
  const extraHours = Math.round((totalHours % std) * 10) / 10;
  return { fullDays, extraHours };
}

/**
 * Chuyển đổi chuỗi "HH:mm" thành số phút
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Tính số giờ làm thực tế giữa giờ vào và giờ ra
 * Ví dụ: 05:00 đến 09:00 -> 4 giờ
 */
export function calculateShiftHours(startTime = '05:00', endTime = '10:00') {
  if (!startTime || !endTime) return STANDARD_SHIFT_HOURS;
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  let diffMinutes = endMin - startMin;
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60;
  }
  return Math.round((diffMinutes / 60) * 10) / 10;
}

/**
 * Định dạng hiển thị tổng ngày làm và giờ lẻ
 * Ví dụ: 2 ngày, 4 tiếng -> "2 ngày 4 tiếng"
 */
export function formatWorkDaysAndHours(days = 0, hours = 0) {
  if (days === 0 && hours === 0) return '0 ngày';
  if (days > 0 && hours === 0) return `${days} ngày`;
  if (days === 0 && hours > 0) return `${hours} tiếng`;
  return `${days} ngày ${hours} tiếng`;
}

/**
 * Tính tổng lương dựa trên ngày làm tròn công và số giờ lẻ
 * Công thức:
 * Lương = (Ngày làm × Lương/ngày) + (Số giờ lẻ × (Lương/ngày ÷ Ca tiêu chuẩn))
 */
export function calculateSalaryWithExtraHours(fullDays, extraHours, dailySalary, standardHours = STANDARD_SHIFT_HOURS) {
  const hourlySalary = (Number(dailySalary) || 0) / standardHours;
  const salaryFromDays = (Number(fullDays) || 0) * (Number(dailySalary) || 0);
  const salaryFromHours = (Number(extraHours) || 0) * hourlySalary;
  return Math.round(salaryFromDays + salaryFromHours);
}

/**
 * Tính số giờ tăng ca từ giờ bắt đầu và kết thúc
 * Ví dụ: 18:00 đến 21:00 -> 3 giờ
 */
export function calculateOvertimeHours(startTime = '18:00', endTime = '21:00') {
  if (!startTime || !endTime) return 0;
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const diffMinutes = Math.max(0, endMin - startMin);
  return Math.round((diffMinutes / 60) * 10) / 10;
}

/**
 * Tính số tiền tăng ca = Số giờ × Đơn giá/giờ
 */
export function calculateOvertimePay(hours = 0, hourlyRate = 50000) {
  return Math.round((Number(hours) || 0) * (Number(hourlyRate) || 0));
}

// Hàm tương thích ngược (nếu còn component cũ tham chiếu)
export function calculateLateMinutes(standardIn = '08:00', actualIn = '08:00') {
  const std = timeToMinutes(standardIn);
  const act = timeToMinutes(actualIn);
  return Math.max(0, act - std);
}

export function calculateEarlyMinutes(standardOut = '17:00', actualOut = '17:00') {
  const std = timeToMinutes(standardOut);
  const act = timeToMinutes(actualOut);
  return Math.max(0, std - act);
}

export function formatMinutesToHours(minutes = 0) {
  if (!minutes || minutes <= 0) return '0p';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}p`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}p`;
}

export function calculateShortageDeduction(minutes = 0, dailySalary = 0, workHoursPerDay = 8) {
  if (!minutes || minutes <= 0 || !dailySalary) return 0;
  const ratePerMinute = dailySalary / (workHoursPerDay * 60);
  return Math.round(minutes * ratePerMinute);
}

export function getAttendanceStatusType(lateMin = 0, earlyMin = 0) {
  if (lateMin > 0 && earlyMin > 0) return 'both';
  if (lateMin > 0) return 'late';
  if (earlyMin > 0) return 'early';
  return 'ontime';
}
