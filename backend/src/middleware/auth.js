const { verifySessionToken } = require('../utils/tokens');

function requireAuth(req, res, next) {
  const token = req.cookies?.taskcontrol_session;

  if (!token) {
    return res.status(401).json({ error: 'Sessao nao encontrada. Faca login novamente.' });
  }

  try {
    const payload = verifySessionToken(token);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Sessao invalida ou expirada. Faca login novamente.' });
  }
}

module.exports = { requireAuth };
