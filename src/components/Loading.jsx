import React from 'react';
import './Loading.css';

export function Loading({ text = 'Đang tải...', fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className="loading-spinner-circle"></div>
        <p className="loading-text">{text}</p>
      </div>
    );
  }

  return (
    <div className="loading-inline">
      <div className="loading-spinner-circle"></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
}

export default Loading;
