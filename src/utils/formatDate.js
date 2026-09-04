/**
 * Định dạng Date object hoặc chuỗi ngày thành "DD/MM/YYYY"
 */
export function formatDate(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Định dạng tháng "MM/YYYY" hoặc "Tháng MM/YYYY"
 */
export function formatMonthYear(dateInput, withPrefix = true) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return withPrefix ? `Tháng ${month}/${year}` : `${month}/${year}`;
}

/**
 * Trả về chuỗi ISO YYYY-MM-DD
 */
export function toISODateString(dateInput) {
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
