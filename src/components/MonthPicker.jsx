import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import './MonthPicker.css';

export function MonthPicker({
  month,
  year,
  onChange,
  className = ''
}) {
  const handlePrev = () => {
    if (month === 1) {
      onChange({ month: 12, year: year - 1 });
    } else {
      onChange({ month: month - 1, year });
    }
  };

  const handleNext = () => {
    if (month === 12) {
      onChange({ month: 1, year: year + 1 });
    } else {
      onChange({ month: month + 1, year });
    }
  };

  const formattedMonth = String(month).padStart(2, '0');

  return (
    <div className={`month-picker-container ${className}`}>
      <button
        type="button"
        className="month-picker-btn"
        onClick={handlePrev}
        title="Tháng trước"
        aria-label="Tháng trước"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="month-picker-display">
        <Calendar size={18} className="month-picker-icon" />
        <span className="month-picker-text">
          Tháng {formattedMonth} / {year}
        </span>
      </div>

      <button
        type="button"
        className="month-picker-btn"
        onClick={handleNext}
        title="Tháng sau"
        aria-label="Tháng sau"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

export default MonthPicker;
