const express = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Protecao extra contra forca bruta em nivel de rede, alem do contador
// de tentativas por usuario que ja existe no controller.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
});

router.post('/register', ctrl.register);
router.post('/resend-confirmation', ctrl.resendConfirmation);
router.post('/confirm-email', ctrl.confirmEmail);
router.post('/login', loginLimiter, ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', requireAuth, ctrl.me);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);

module.exports = router;
