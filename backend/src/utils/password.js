const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Classifica a forca da senha em 'weak' | 'medium' | 'strong'.
 * Usado tanto no backend (para bloquear senhas fracas) quanto espelhado
 * no frontend para o medidor visual.
 */
function scorePasswordStrength(password) {
  if (!password) return 'weak';

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

function isPasswordAcceptable(password) {
  // Regra minima do backend: pelo menos 8 caracteres, uma letra e um numero.
  // Senhas 'weak' (muito curtas ou triviais) sao rejeitadas no cadastro.
  if (!password || password.length < 8) return false;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return false;
  return scorePasswordStrength(password) !== 'weak';
}

module.exports = { hashPassword, verifyPassword, scorePasswordStrength, isPasswordAcceptable };
