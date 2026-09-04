import React from 'react';
import { Search, X } from 'lucide-react';
import './SearchBar.css';

export function SearchBar({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  onClear,
  className = ''
}) {
  return (
    <div className={`search-bar-wrapper ${className}`}>
      <Search size={18} className="search-bar-icon" />
      <input
        type="text"
        className="search-bar-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="search-bar-clear-btn"
          onClick={() => {
            if (onClear) onClear();
            else onChange('');
          }}
          aria-label="Xóa tìm kiếm"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
