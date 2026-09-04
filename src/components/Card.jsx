import React from 'react';
import './Card.css';

export function Card({
  title,
  subtitle,
  extra,
  children,
  footer,
  className = '',
  bodyClassName = '',
  ...props
}) {
  return (
    <div className={`custom-card ${className}`} {...props}>
      {(title || extra) && (
        <div className="card-header">
          <div className="card-header-titles">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {extra && <div className="card-header-extra">{extra}</div>}
        </div>
      )}
      <div className={`card-body ${bodyClassName}`}>{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

export default Card;
