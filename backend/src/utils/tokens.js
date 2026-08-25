const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function signSessionToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function verifySessionToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Gera um token opaco (para links de confirmacao/reset enviados por e-mail)
 * e o hash correspondente (o que fica salvo no banco). Nunca guardamos o
 * token em texto puro no banco de dados.
 */
function generateOpaqueToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

function hashOpaqueToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

module.exports = {
  signSessionToken,
  verifySessionToken,
  generateOpaqueToken,
  hashOpaqueToken,
};
