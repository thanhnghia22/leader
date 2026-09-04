import React from 'react';
import './Badge.css';

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = ''
}) {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`}>
      {dot && <span className="badge-dot"></span>}
      {children}
    </span>
  );
}

export default Badge;
