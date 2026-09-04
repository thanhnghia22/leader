import React from 'react';
import './Button.css';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="btn-spinner"></span>}
      {!loading && Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : 18} className="btn-icon" />}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : 18} className="btn-icon" />}
    </button>
  );
}

export default Button;
