import { formatCurrency } from './formatCurrency';
import { formatDate } from './formatDate';
import { getStandardShiftHours, calculateWorkSummaryFromHours } from './timeUtils';

/**
 * Mở cửa sổ in chuyên dụng để lưu thành PDF sắc nét,
 * hỗ trợ 100% tiếng Việt có dấu chuẩn Unicode và định dạng văn bản A4.
 */
function openPrintWindow(htmlContent, title = 'Xuat_Bao_Cao_PDF', orientation = 'portrait') {
  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) {
    alert('Trình duyệt đang chặn cửa sổ pop-up. Vui lòng cho phép mở pop-up để xuất PDF.');
    return;
  }

  const isLandscape = orientation === 'landscape';

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page {
            size: A4 ${isLandscape ? 'landscape' : 'portrait'};
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Times New Roman', 'DejaVu Sans', serif;
            color: #000;
            background: #fff;
            padding: 10px;
            font-size: 13px;
            line-height: 1.4;
          }
          .header-table {
            width: 100%;
            margin-bottom: 20px;
            border: none;
          }
          .header-table td {
            border: none;
            vertical-align: top;
          }
          .company-name {
            font-weight: bold;
            font-size: 13px;
            text-transform: uppercase;
          }
          .motto {
            font-weight: bold;
            text-align: right;
            font-size: 13px;
          }
          .sub-motto {
            font-style: italic;
            font-size: 12px;
            text-align: right;
          }
          .report-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 15px 0 5px;
          }
          .report-subtitle {
            text-align: center;
            font-style: italic;
            margin-bottom: 20px;
            font-size: 12px;
          }
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          table.data-table th, table.data-table td {
            border: 1px solid #333;
            padding: 6px 8px;
            font-size: 12px;
          }
          table.data-table th {
            background-color: #f2f2f2;
            text-align: center;
            font-weight: bold;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          .total-row {
            background-color: #f9f9f9;
            font-weight: bold;
          }
          .signature-section {
            margin-top: 35px;
            width: 100%;
            page-break-inside: avoid;
          }
          .signature-table {
            width: 100%;
            border: none;
          }
          .signature-table td {
            border: none;
            text-align: center;
            vertical-align: top;
            width: 33.33%;
            padding-bottom: 80px;
          }
          .sign-role {
            font-weight: bold;
            font-size: 13px;
          }
          .sign-note {
            font-style: italic;
            font-size: 11px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 50%;">
              <div class="company-name">HỆ THỐNG QUẢN LÝ CHẤM CÔNG LEADER</div>
              <div>Bộ phận: Quản lý Nhân sự & Tiền lương</div>
            </td>
            <td style="width: 50%;">
              <div class="motto">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div class="sub-motto">Độc lập - Tự do - Hạnh phúc</div>
              <div class="sub-motto" style="margin-top: 4px;">Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</div>
            </td>
          </tr>
        </table>

        ${htmlContent}

        <div class="signature-section">
          <table class="signature-table">
            <tr>
              <td>
                <div class="sign-role">Người Lập Biểu</div>
                <div class="sign-note">(Ký, ghi rõ họ tên)</div>
              </td>
              <td>
                <div class="sign-role">Kế Toán Trưởng</div>
                <div class="sign-note">(Ký, ghi rõ họ tên)</div>
              </td>
              <td>
                <div class="sign-role">Quản Lý / Leader Duyệt</div>
                <div class="sign-note">(Ký, đóng dấu nếu có)</div>
              </td>
            </tr>
          </table>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(fullHtml);
  printWindow.document.close();
}

/**
 * 1. Xuất Bảng Lương sang PDF
 */
export function exportSalaryToPdf(salaryData, month, year, summary) {
  const monthStr = String(month).padStart(2, '0');
  const title = `BANG_LUONG_THANG_${monthStr}_${year}`;

  const rowsHtml = salaryData
    .map(
      (item, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td class="text-center font-bold">${item.employeeCode}</td>
        <td class="text-left font-bold">${item.employeeName}</td>
        <td class="text-left">${item.position}</td>
        <td class="text-center font-bold">${item.fullDays ?? item.workingDays}</td>
        <td class="text-center">${(item.extraHours || 0) > 0 ? `${item.extraHours}h` : '0'}</td>
        <td class="text-center">${item.offDays}</td>
        <td class="text-right">${formatCurrency(item.dailySalary, '')}</td>
        <td class="text-right font-bold">${formatCurrency(item.basicSalary, '')}</td>
        <td class="text-right">${item.advancedAmount > 0 ? '-' + formatCurrency(item.advancedAmount, '') : '0'}</td>
        <td class="text-right font-bold" style="color: #000;">${formatCurrency(item.remainingSalary, '')}</td>
      </tr>
    `
    )
    .join('');

  const totalFullDays = salaryData.reduce((s, i) => s + (i.fullDays ?? i.workingDays), 0);
  const totalExtraHours = salaryData.reduce((s, i) => s + (i.extraHours || 0), 0);
  const totalOffDays = salaryData.reduce((s, i) => s + i.offDays, 0);

  const html = `
    <div class="report-title">BẢNG THANH TOÁN TIỀN LƯƠNG NHÂN VIÊN</div>
    <div class="report-subtitle">Kỳ lương: Tháng ${monthStr} năm ${year} (Lương = Ngày làm × Lương/ngày + Giờ lẻ × Lương/giờ. Thực lĩnh = Tổng lương - Đã tạm ứng)</div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 30px;">STT</th>
          <th style="width: 60px;">Mã NV</th>
          <th>Họ và Tên</th>
          <th>Chức vụ</th>
          <th style="width: 50px;">Ngày làm</th>
          <th style="width: 50px;">Giờ lẻ</th>
          <th style="width: 45px;">OFF</th>
          <th style="width: 85px;">Lương/Ngày</th>
          <th style="width: 100px;">Tổng Lương</th>
          <th style="width: 90px;">Tạm Ứng (-)</th>
          <th style="width: 105px;">Thực Nhận</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr class="total-row">
          <td colspan="4" class="text-center">TỔNG CỘNG</td>
          <td class="text-center">${totalFullDays}</td>
          <td class="text-center">${totalExtraHours > 0 ? `${totalExtraHours}h` : '0'}</td>
          <td class="text-center">${totalOffDays}</td>
          <td></td>
          <td class="text-right font-bold">${formatCurrency(summary.basicSalary || summary.totalSalary, '')}</td>
          <td class="text-right">-${formatCurrency(summary.advancedAmount || 0, '')}</td>
          <td class="text-right font-bold">${formatCurrency(summary.remainingSalary, '')}</td>
        </tr>
      </tbody>
    </table>
  `;

  openPrintWindow(html, title, 'landscape');
}

/**
 * 2. Xuất Bảng Chấm Công sang PDF (Kèm Ngày làm, Giờ lẻ, OFF và Tạm ứng)
 */
export function exportAttendanceToPdf(employees, attendanceRecords, advances = [], daysInMonth, month, year) {
  const monthStr = String(month).padStart(2, '0');
  const title = `BANG_CHAM_CONG_THANG_${monthStr}_${year}`;

  const headerDaysHtml = daysInMonth
    .map(
      (d) => `<th style="width: 20px; font-size: 9px; padding: 4px 1px;">${d.dayNumber}</th>`
    )
    .join('');

  let grandTotalFullDays = 0;
  let grandTotalExtraHours = 0;
  let grandTotalOff = 0;
  let grandTotalAdvance = 0;

  const rowsHtml = employees
    .map((emp, idx) => {
      const stdHours = getStandardShiftHours(emp.position);

      // Lọc các bản ghi của NV trong tháng
      const empRecords = attendanceRecords.filter((r) => String(r.employeeId) === String(emp.id));
      let offCount = 0;
      let totalWorkedHours = 0;

      daysInMonth.forEach((day) => {
        const rec = empRecords.find((r) => r.date === day.dateString);
        if (rec && (rec.status === 'off' || (!rec.status && rec.reason))) {
          offCount++;
        } else if (rec && rec.status === 'partial') {
          totalWorkedHours += Number(rec.workHours) || 0;
        } else {
          totalWorkedHours += stdHours;
        }
      });

      const { fullDays, extraHours } = calculateWorkSummaryFromHours(totalWorkedHours, stdHours);

      // Tiền tạm ứng trong tháng
      const empAdvances = advances.filter(
        (a) => String(a.employeeId) === String(emp.id) && a.date.startsWith(`${year}-${monthStr}`)
      );
      const advanceAmount = empAdvances.reduce((sum, a) => sum + Number(a.amount || 0), 0);

      grandTotalFullDays += fullDays;
      grandTotalExtraHours += extraHours;
      grandTotalOff += offCount;
      grandTotalAdvance += advanceAmount;

      // Render từng ô ngày
      const cellsHtml = daysInMonth
        .map((d) => {
          const rec = empRecords.find((r) => r.date === d.dateString);
          if (rec && (rec.status === 'off' || (!rec.status && rec.reason))) {
            return `<td class="text-center" style="font-size: 9px; padding: 2px; background-color: #ffe4e6; font-weight: bold; color: #b91c1c;">OFF</td>`;
          }
          if (rec && rec.status === 'partial') {
            return `<td class="text-center" style="font-size: 9px; padding: 2px; background-color: #fef3c7; color: #b45309; font-weight: bold;" title="Làm ${rec.workHours}h">${rec.workHours}h</td>`;
          }
          return `<td class="text-center" style="font-size: 9px; padding: 2px; color: #15803d; font-weight: bold;">✓</td>`;
        })
        .join('');

      return `
        <tr>
          <td class="text-center" style="font-size: 10px;">${idx + 1}</td>
          <td class="text-center font-bold" style="font-size: 10px;">${emp.code}</td>
          <td class="text-left font-bold" style="font-size: 10px; white-space: nowrap;">${emp.name}</td>
          <td class="text-center" style="font-size: 10px;">${emp.position || 'Phục vụ'}</td>
          ${cellsHtml}
          <td class="text-center font-bold" style="font-size: 10px; background-color: #f0fdf4; color: #15803d;">${fullDays}</td>
          <td class="text-center font-bold" style="font-size: 10px; color: ${extraHours > 0 ? '#b45309' : '#64748b'};">${extraHours > 0 ? `${extraHours}h` : '0'}</td>
          <td class="text-center font-bold" style="font-size: 10px; color: ${offCount > 0 ? '#b91c1c' : '#64748b'};">${offCount}</td>
          <td class="text-right font-bold" style="font-size: 10px; color: ${advanceAmount > 0 ? '#b45309' : '#64748b'};">${formatCurrency(advanceAmount, '')}</td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <div class="report-title">BẢNG TỔNG HỢP CHẤM CÔNG & TẠM ỨNG LƯƠNG</div>
    <div class="report-subtitle">Kỳ công: Tháng ${monthStr} / ${year} (Ca chuẩn: Chef = 7h, Phục vụ = 5h. Ký hiệu: ✓ = Đủ ca chuẩn, [X]h = Số giờ thực tế, OFF = Nghỉ)</div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 25px;">STT</th>
          <th style="width: 50px;">Mã NV</th>
          <th style="width: 110px;">Họ và Tên</th>
          <th style="width: 65px;">Chức vụ</th>
          ${headerDaysHtml}
          <th style="width: 50px;">Ngày làm</th>
          <th style="width: 45px;">Giờ lẻ</th>
          <th style="width: 35px;">OFF</th>
          <th style="width: 85px;">Tạm Ứng (VNĐ)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr class="total-row" style="font-size: 10px;">
          <td colspan="4" class="text-center">TỔNG CỘNG</td>
          <td colspan="${daysInMonth.length}"></td>
          <td class="text-center font-bold">${grandTotalFullDays}</td>
          <td class="text-center font-bold">${grandTotalExtraHours > 0 ? `${grandTotalExtraHours}h` : '0'}</td>
          <td class="text-center font-bold">${grandTotalOff}</td>
          <td class="text-right font-bold" style="color: #b45309;">${formatCurrency(grandTotalAdvance, '')}</td>
        </tr>
      </tbody>
    </table>
  `;

  openPrintWindow(html, title, 'landscape');
}

/**
 * 3. Xuất Phiếu Lương Cá Nhân sang PDF (Payslip)
 */
export function exportEmployeePayslipToPdf(employee, stats, offHistory, advanceHistory, month, year) {
  const monthStr = String(month).padStart(2, '0');
  const title = `PHIEU_LUONG_${employee.code}_T${monthStr}_${year}`;
  const stdHours = getStandardShiftHours(employee.position);

  const html = `
    <div class="report-title">PHIẾU LƯƠNG NHÂN VIÊN</div>
    <div class="report-subtitle">Kỳ tính lương: Tháng ${monthStr} năm ${year} (Ca chuẩn: ${stdHours} tiếng)</div>

    <table style="width: 100%; margin-bottom: 18px; border-collapse: collapse;">
      <tr>
        <td style="padding: 6px; width: 50%;"><strong>Họ và tên:</strong> ${employee.name}</td>
        <td style="padding: 6px; width: 50%;"><strong>Mã nhân viên:</strong> ${employee.code}</td>
      </tr>
      <tr>
        <td style="padding: 6px;"><strong>Chức vụ:</strong> ${employee.position}</td>
        <td style="padding: 6px;"><strong>Số điện thoại:</strong> ${employee.phone}</td>
      </tr>
      <tr>
        <td style="padding: 6px;"><strong>Mức lương ngày:</strong> ${formatCurrency(employee.dailySalary)}</td>
        <td style="padding: 6px;"><strong>Trạng thái:</strong> ${employee.status === 'active' ? 'Đang làm việc' : 'Đã nghỉ'}</td>
      </tr>
    </table>

    <table class="data-table">
      <thead>
        <tr>
          <th>Khoản mục chi tiết</th>
          <th style="width: 140px;">Số lượng / Định mức</th>
          <th style="width: 160px;">Thành tiền (VNĐ)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Số ngày làm đủ ca tiêu chuẩn (${stdHours}h/ca)</td>
          <td class="text-center font-bold">${stats.fullDays ?? stats.workingDays} ngày</td>
          <td class="text-right">${formatCurrency((stats.fullDays ?? stats.workingDays) * employee.dailySalary)}</td>
        </tr>
        <tr>
          <td>Số giờ làm việc lẻ / về sớm</td>
          <td class="text-center font-bold">${stats.extraHours || 0} tiếng</td>
          <td class="text-right">${formatCurrency(Math.round((stats.extraHours || 0) * (employee.dailySalary / stdHours)))}</td>
        </tr>
        <tr style="background-color: #f0fdf4;">
          <td><strong>Tổng lương cơ bản (Ngày làm + Giờ lẻ)</strong></td>
          <td class="text-center"><strong>${stats.fullDays ?? stats.workingDays} ngày ${stats.extraHours || 0}h</strong></td>
          <td class="text-right font-bold">${formatCurrency(stats.basicSalary || stats.totalSalary)}</td>
        </tr>
        <tr>
          <td>Số ngày nghỉ phép trong tháng (OFF)</td>
          <td class="text-center">${stats.offDays} ngày</td>
          <td class="text-right">0 VNĐ</td>
        </tr>
        <tr>
          <td style="color: #b45309;">Khoản tiền đã tạm ứng trong tháng</td>
          <td class="text-center">${advanceHistory.length} đợt ứng</td>
          <td class="text-right" style="color: #b45309;">-${formatCurrency(stats.advancedAmount)}</td>
        </tr>
        <tr class="total-row" style="font-size: 14px;">
          <td class="font-bold">LƯƠNG THỰC LĨNH CUỐI KỲ</td>
          <td></td>
          <td class="text-right font-bold" style="font-size: 15px;">${formatCurrency(stats.remainingSalary)}</td>
        </tr>
      </tbody>
    </table>
  `;

  openPrintWindow(html, title, 'portrait');
}
