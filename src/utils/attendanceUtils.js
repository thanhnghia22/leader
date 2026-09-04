/**
 * Tiện ích hỗ trợ tính toán logic chấm công
 */

/**
 * Lấy số lượng ngày trong tháng của một năm cụ thể
 * @param {number} year - Năm (ví dụ: 2026)
 * @param {number} month - Tháng 1-12 (ví dụ: 9)
 * @returns {number} Số ngày trong tháng (28 - 31)
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Tạo danh sách ngày trong tháng
 * Trả về mảng các object ngày: [{ dayNumber: 1, dateString: "2026-09-01", dayOfWeek: "T3" }, ...]
 */
export function getDaysArrayForMonth(year, month) {
  const totalDays = getDaysInMonth(year, month);
  const days = [];
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month - 1, d);
    const dayOfWeek = dayNames[date.getDay()];
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dayNumber: d,
      dateString,
      dayOfWeek,
      isWeekend: date.getDay() === 0 // Chủ nhật
    });
  }

  return days;
}

/**
 * Tính số ngày đi làm dựa trên tổng ngày trong tháng và số ngày OFF
 * Công thức: Ngày đi làm = Tổng số ngày trong tháng - Số ngày OFF
 */
export function calculateWorkingDays(totalDaysInMonth, offDaysCount) {
  const working = totalDaysInMonth - (offDaysCount || 0);
  return Math.max(0, working);
}

/**
 * Tính tổng lương tháng
 * Công thức: Tổng lương = Ngày đi làm * Lương/ngày
 */
export function calculateTotalSalary(workingDays, dailySalary) {
  return (workingDays || 0) * (dailySalary || 0);
}

/**
 * Tính số tiền thực lĩnh còn lại sau khi trừ tiền ứng
 * Công thức: Còn lại = Tổng lương - Đã ứng
 */
export function calculateRemainingSalary(totalSalary, advanceAmount) {
  return Math.max(0, (totalSalary || 0) - (advanceAmount || 0));
}
