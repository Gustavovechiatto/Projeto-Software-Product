import React from 'react';

const ICONS = { success: '✅', error: '⚠️', info: 'ℹ️' };

export function Toast({ message, type = 'info', onClose }) {
  return (
    <div className={`toast toast--${type}`}>
      <span className="toast__icon">{ICONS[type] || ICONS.info}</span>
      <span className="toast__message">{message}</span>
      <button className="toast__close" onClick={onClose} aria-label="Fechar notificacao">
        ×
      </button>
    </div>
  );
}
