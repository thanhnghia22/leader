import React, { forwardRef } from 'react';
import './Input.css';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    endIcon: EndIcon,
    onEndIconClick,
    id,
    required = false,
    className = '',
    ...props
  },
  ref
) {
  const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <div className={`form-group ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label} {required && <span className="required-star">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {Icon && <Icon className="input-icon-start" size={18} />}
        <input
          id={inputId}
          ref={ref}
          className={`form-input ${Icon ? 'with-start-icon' : ''} ${EndIcon ? 'with-end-icon' : ''}`}
          {...props}
        />
        {EndIcon && (
          <button
            type="button"
            className="input-icon-end-btn"
            onClick={onEndIconClick}
            tabIndex={-1}
          >
            <EndIcon size={18} />
          </button>
        )}
      </div>
      {error && <span className="form-error-msg">{error}</span>}
      {!error && helperText && <span className="form-helper-msg">{helperText}</span>}
    </div>
  );
});

export default Input;
