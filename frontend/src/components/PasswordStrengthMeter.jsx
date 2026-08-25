import React from 'react';

export function scorePasswordStrength(password) {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}

const LABELS = { weak: 'Fraca', medium: 'Media', strong: 'Forte' };

export function PasswordStrengthMeter({ password }) {
  const strength = scorePasswordStrength(password);
  if (!strength) return null;

  return (
    <div className="strength-meter" aria-live="polite">
      <div className={`strength-meter__bar strength-meter__bar--${strength}`}>
        <span />
        <span />
        <span />
      </div>
      <span className={`strength-meter__label strength-meter__label--${strength}`}>
        Forca da senha: {LABELS[strength]}
      </span>
    </div>
  );
}
