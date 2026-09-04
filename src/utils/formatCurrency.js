/**
 * Định dạng số thành định dạng tiền tệ VNĐ
 * Ví dụ: 15500000 -> "15.500.000 VNĐ"
 */
export function formatCurrency(amount, suffix = ' VNĐ') {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `0${suffix}`;
  }
  const formatted = new Intl.NumberFormat('vi-VN').format(Math.round(amount));
  return `${formatted}${suffix}`;
}

export default formatCurrency;
