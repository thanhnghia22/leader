import React from 'react';
import './Table.css';

export function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'Không có dữ liệu hiển thị',
  className = '',
  rowKey = 'id',
  onRowClick
}) {
  return (
    <div className={`table-container ${className}`}>
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                style={{ width: col.width, textAlign: col.align || 'left' }}
                className={col.headerClassName || ''}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="table-status-cell">
                <div className="table-loading-spinner"></div>
                <span>Đang tải dữ liệu...</span>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-status-cell">
                <p className="table-empty-text">{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            data.map((row, rIdx) => {
              const key = typeof rowKey === 'function' ? rowKey(row) : row[rowKey] || rIdx;
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={onRowClick ? 'clickable-row' : ''}
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={col.key || cIdx}
                      style={{ textAlign: col.align || 'left' }}
                      className={col.className || ''}
                    >
                      {col.render ? col.render(row[col.dataIndex], row, rIdx) : row[col.dataIndex]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
