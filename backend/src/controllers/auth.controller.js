const { pool } = require('../db');
const { hashPassword, verifyPassword, isPasswordAcceptable } = require('../utils/password');
const { signSessionToken, generateOpaqueToken, hashOpaqueToken } = require('../utils/tokens');
const { sendMail, isConsoleMode } = require('../utils/email');
const { isValidEmail, isNonEmptyString } = require('../utils/validators');

const MAX_LOGIN_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS) || 3;
const CONFIRMATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30min

const SESSION_COOKIE = 'taskcontrol_session';
const isProd = process.env.NODE_ENV === 'production';

function cookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: maxAgeMs,
  };
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailConfirmed: user.email_confirmed,
    isFirstLogin: user.is_first_login,
  };
}

async function sendConfirmationEmail(user) {
  const { rawToken, tokenHash } = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + CONFIRMATION_TOKEN_TTL_MS);

  await pool.query(
    `INSERT INTO auth_tokens (user_id, token_hash, purpose, expires_at)
     VALUES ($1, $2, 'email_confirmation', $3)`,
    [user.id, tokenHash, expiresAt]
  );

  const confirmUrl = `${process.env.FRONTEND_URL}/confirmar-conta?token=${rawToken}`;

  const result = await sendMail({
    to: user.email,
    subject: 'Confirme sua conta no TaskControl',
    text: `Ola, ${user.name}!\n\nConfirme sua conta clicando no link abaixo:\n${confirmUrl}\n\nEste link expira em 24 horas.`,
    html: `<p>Ola, ${user.name}!</p><p>Confirme sua conta clicando no link abaixo:</p><p><a href="${confirmUrl}">${confirmUrl}</a></p><p>Este link expira em 24 horas.</p>`,
  });

  return { confirmUrl, ...result };
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password, confirmPassword, acceptedTerms } = req.body;

    const errors = {};
    if (!isNonEmptyString(name)) errors.name = 'Nome e obrigatorio.';
    if (!isNonEmptyString(email)) errors.email = 'E-mail e obrigatorio.';
    else if (!isValidEmail(email)) errors.email = 'Informe um e-mail valido.';
    if (!isNonEmptyString(password)) errors.password = 'Senha e obrigatoria.';
    else if (!isPasswordAcceptable(password)) {
      errors.password = 'A senha precisa ter no minimo 8 caracteres, incluindo letras e numeros.';
    }
    if (password !== confirmPassword) errors.confirmPassword = 'As senhas nao coincidem.';
    if (!acceptedTerms) errors.acceptedTerms = 'Voce precisa aceitar os termos de uso.';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Dados invalidos.', fieldErrors: errors });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'Ja existe uma conta com este e-mail.',
        fieldErrors: { email: 'Ja existe uma conta com este e-mail.' },
      });
    }

    const passwordHash = await hashPassword(password);

    const insertResult = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), normalizedEmail, passwordHash]
    );
    const user = insertResult.rows[0];

    const emailResult = await sendConfirmationEmail(user);

    return res.status(201).json({
      message: 'Cadastro realizado com sucesso! Enviamos um e-mail de confirmacao para validar sua conta.',
      user: publicUser(user),
      // Exposto apenas para facilitar testes locais quando nao ha SMTP configurado.
      devConfirmUrl: isConsoleMode() ? emailResult.confirmUrl : undefined,
    });
  } catch (err) {
    return next(err);
  }
}

// POST /api/auth/resend-confirmation
async function resendConfirmation(req, res, next) {
  try {
    const { email } = req.body;
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Informe um e-mail valido.' });
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    const user = rows[0];

    // Resposta generica para nao revelar se o e-mail existe ou nao.
    const genericResponse = {
      message: 'Se a conta existir e ainda nao estiver confirmada, reenviamos o e-mail de confirmacao.',
    };

    if (!user || user.email_confirmed) {
      return res.status(200).json(genericResponse);
    }

    const emailResult = await sendConfirmationEmail(user);
    return res.status(200).json({
      ...genericResponse,
      devConfirmUrl: isConsoleMode() ? emailResult.confirmUrl : undefined,
    });
  } catch (err) {
    return next(err);
  }
}

// POST /api/auth/confirm-email
async function confirmEmail(req, res, next) {
  try {
    const { token } = req.body;
    if (!isNonEmptyString(token)) {
      return res.status(400).json({ error: 'Token invalido.' });
    }

    const tokenHash = hashOpaqueToken(token);
    const { rows } = await pool.query(
      `SELECT * FROM auth_tokens
       WHERE token_hash = $1 AND purpose = 'email_confirmation'`,
      [tokenHash]
    );
    const tokenRow = rows[0];

    if (!tokenRow) {
      return res.status(400).json({ error: 'Link de confirmacao invalido.' });
    }
    if (tokenRow.used_at) {
      return res.status(400).json({ error: 'Este link de confirmacao ja foi utilizado.' });
    }
    if (new Date(tokenRow.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Este link de confirmacao expirou. Solicite um novo.' });
    }

    await pool.query('UPDATE users SET email_confirmed = TRUE, updated_at = NOW() WHERE id = $1', [
      tokenRow.user_id,
    ]);
    await pool.query('UPDATE auth_tokens SET used_at = NOW() WHERE id = $1', [tokenRow.id]);

    return res.status(200).json({ message: 'Conta confirmada! Seja bem-vindo ao TaskControl.' });
  } catch (err) {
    return next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!isNonEmptyString(email) || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Informe um e-mail valido.' });
    }
    if (!isNonEmptyString(password)) {
      return res.status(400).json({ error: 'Senha e obrigatoria.' });
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    const user = rows[0];

    // Mensagem generica em ambos os casos (e-mail inexistente ou senha errada)
    // para nao revelar quais e-mails estao cadastrados.
    const invalidCredentials = () =>
      res.status(401).json({
        error: 'E-mail ou senha incorretos.',
        suggestReset: false,
      });

    if (!user) {
      return invalidCredentials();
    }

    const passwordOk = await verifyPassword(password, user.password_hash);

    if (!passwordOk) {
      const newFailedCount = user.failed_login_count + 1;
      await pool.query('UPDATE users SET failed_login_count = $1, updated_at = NOW() WHERE id = $2', [
        newFailedCount,
        user.id,
      ]);

      if (newFailedCount > MAX_LOGIN_ATTEMPTS) {
        return res.status(401).json({
          error: 'Voce tentou fazer login varias vezes. Deseja redefinir sua senha?',
          suggestReset: true,
        });
      }
      return invalidCredentials();
    }

    if (!user.email_confirmed) {
      return res.status(403).json({
        error: 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.',
        emailNotConfirmed: true,
      });
    }

    const isFirstLogin = user.is_first_login;

    await pool.query(
      'UPDATE users SET failed_login_count = 0, is_first_login = FALSE, updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    const token = signSessionToken(user);
    res.cookie(SESSION_COOKIE, token, cookieOptions(7 * 24 * 60 * 60 * 1000));

    return res.status(200).json({
      message: isFirstLogin ? 'Bem-vindo ao TaskControl!' : 'Login realizado com sucesso.',
      isFirstLogin,
      user: publicUser({ ...user, is_first_login: isFirstLogin }),
    });
  } catch (err) {
    return next(err);
  }
}

// POST /api/auth/logout
async function logout(req, res) {
  res.clearCookie(SESSION_COOKIE, cookieOptions(0));
  return res.status(200).json({ message: 'Logout realizado com sucesso.' });
}

// GET /api/auth/me
async function me(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Usuario nao encontrado.' });
    }
    return res.status(200).json({ user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const genericResponse = {
      message:
        'Se existir uma conta associada a este e-mail, enviaremos as instrucoes para redefinir sua senha.',
    };

    if (!isValidEmail(email)) {
      return res.status(200).json(genericResponse);
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    const user = rows[0];

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const { rawToken, tokenHash } = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await pool.query(
      `INSERT INTO auth_tokens (user_id, token_hash, purpose, expires_at)
       VALUES ($1, $2, 'password_reset', $3)`,
      [user.id, tokenHash, expiresAt]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/redefinir-senha?token=${rawToken}`;

    const emailResult = await sendMail({
      to: user.email,
      subject: 'Redefinicao de senha - TaskControl',
      text: `Ola, ${user.name}!\n\nClique no link abaixo para redefinir sua senha (valido por 30 minutos):\n${resetUrl}`,
      html: `<p>Ola, ${user.name}!</p><p>Clique no link abaixo para redefinir sua senha (valido por 30 minutos):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });

    return res.status(200).json({
      ...genericResponse,
      devResetUrl: isConsoleMode() ? emailResult.confirmUrl || resetUrl : undefined,
    });
  } catch (err) {
    return next(err);
  }
}

// POST /api/auth/reset-password
async function resetPassword(req, res, next) {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!isNonEmptyString(token)) {
      return res.status(400).json({ error: 'Token invalido.' });
    }
    if (!isPasswordAcceptable(password)) {
      return res
        .status(400)
        .json({ error: 'A senha precisa ter no minimo 8 caracteres, incluindo letras e numeros.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'As senhas nao coincidem.' });
    }

    const tokenHash = hashOpaqueToken(token);
    const { rows } = await pool.query(
      `SELECT * FROM auth_tokens WHERE token_hash = $1 AND purpose = 'password_reset'`,
      [tokenHash]
    );
    const tokenRow = rows[0];

    if (!tokenRow) {
      return res.status(400).json({ error: 'Link de redefinicao invalido.' });
    }
    if (tokenRow.used_at) {
      return res.status(400).json({ error: 'Este link ja foi utilizado.' });
    }
    if (new Date(tokenRow.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Este link expirou. Solicite uma nova redefinicao.' });
    }

    const passwordHash = await hashPassword(password);
    await pool.query(
      'UPDATE users SET password_hash = $1, failed_login_count = 0, updated_at = NOW() WHERE id = $2',
      [passwordHash, tokenRow.user_id]
    );
    await pool.query('UPDATE auth_tokens SET used_at = NOW() WHERE id = $1', [tokenRow.id]);

    return res.status(200).json({ message: 'Senha redefinida com sucesso. Faca login com a nova senha.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  register,
  resendConfirmation,
  confirmEmail,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
};
