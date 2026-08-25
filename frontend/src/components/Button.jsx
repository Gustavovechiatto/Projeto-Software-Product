import React from 'react';

export function Button({ children, isLoading, disabled, variant = 'primary', type = 'button', ...rest }) {
  return (
    <button
      type={type}
      className={`btn btn--${variant}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? <span className="btn__spinner" aria-hidden="true" /> : null}
      <span className={isLoading ? 'btn__label--loading' : ''}>{children}</span>
    </button>
  );
}
