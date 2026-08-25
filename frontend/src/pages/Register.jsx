import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TextField } from '../components/TextField.jsx';
import { PasswordInput } from '../components/PasswordInput.jsx';
import { PasswordStrengthMeter, scorePasswordStrength } from '../components/PasswordStrengthMeter.jsx';
import { Button } from '../components/Button.jsx';
import { authApi } from '../api/authApi';
import { useToast } from '../context/ToastContext.jsx';
import { AuthVisual } from '../components/AuthVisual.jsx';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 60;

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successState, setSuccessState] = useState(null); // { email, devConfirmUrl }
  const [resendState, setResendState] = useState({ isLoading: false, secondsLeft: RESEND_COOLDOWN_SECONDS });

  const toast = useToast();
  const navigate = useNavigate();

  function updateField(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Nome e obrigatorio.';
    if (!form.email.trim()) errors.email = 'E-mail e obrigatorio.';
    else if (!EMAIL_REGEX.test(form.email.trim())) errors.email = 'Informe um e-mail valido.';

    const strength = scorePasswordStrength(form.password);
    if (!form.password) errors.password = 'Senha e obrigatoria.';
    else if (form.password.length < 8 || strength === 'weak') {
      errors.password = 'A senha precisa ter no minimo 8 caracteres, com letras e numeros.';
    }

    if (form.confirmPassword !== form.password) {
      errors.confirmPassword = 'As senhas nao coincidem.';
    }
    if (!acceptedTerms) errors.acceptedTerms = 'Voce precisa aceitar os termos de uso.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      const data = await authApi.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        acceptedTerms,
      });
      setSuccessState({ email: form.email.trim(), devConfirmUrl: data.devConfirmUrl });
      setResendState({ isLoading: false, secondsLeft: RESEND_COOLDOWN_SECONDS });
      startCooldown();
    } catch (err) {
      setFormError(err.payload?.error || err.message);
      if (err.payload?.fieldErrors) setFieldErrors(err.payload.fieldErrors);
    } finally {
      setIsLoading(false);
    }
  }

  function startCooldown() {
    const interval = setInterval(() => {
      setResendState((prev) => {
        if (prev.secondsLeft <= 1) {
          clearInterval(interval);
          return { ...prev, secondsLeft: 0 };
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);
  }

  async function handleResend() {
    setResendState((prev) => ({ ...prev, isLoading: true }));
    try {
      await authApi.resendConfirmation(successState.email);
      toast.success('E-mail de confirmacao reenviado.');
      setResendState({ isLoading: false, secondsLeft: RESEND_COOLDOWN_SECONDS });
      startCooldown();
    } catch (err) {
      toast.error(err.message);
      setResendState((prev) => ({ ...prev, isLoading: false }));
    }
  }

  if (successState) {
    return (
      <div className="auth-page">
        <AuthVisual headline="Sua conta esta a um passo. Confirme o e-mail e comece a organizar suas tarefas." />
        <div className="auth-card auth-card--modal">
          <h1 className="auth-card__title">Cadastro realizado com sucesso! 🎉</h1>
          <p className="auth-card__subtitle">
            Enviamos um e-mail de confirmacao para <strong>{successState.email}</strong> para validar sua
            conta.
          </p>

          {successState.devConfirmUrl ? (
            <p className="auth-card__hint">
              (Modo de teste local, sem SMTP configurado — link de confirmacao:{' '}
              <a href={successState.devConfirmUrl}>abrir link</a>)
            </p>
          ) : null}

          <div className="auth-card__actions auth-card__actions--column">
            <Button variant="primary" onClick={() => navigate('/login')}>
              Entendi
            </Button>
            <Button
              variant="ghost"
              isLoading={resendState.isLoading}
              disabled={resendState.secondsLeft > 0}
              onClick={handleResend}
            >
              {resendState.secondsLeft > 0
                ? `Reenviar e-mail em ${resendState.secondsLeft}s`
                : 'Reenviar e-mail de confirmacao'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <AuthVisual headline="Cada tarefa no lugar certo, com o time inteiro alinhado." />
      <div className="auth-card">
        <div className="auth-card__brand">TaskControl</div>
        <h1 className="auth-card__title">Criar sua conta</h1>

        {formError ? (
          <div className="alert alert--error" role="alert">
            <span>⚠️ {formError}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            id="name"
            label="Nome"
            value={form.name}
            onChange={updateField('name')}
            error={fieldErrors.name}
            autoComplete="name"
            placeholder="Seu nome completo"
          />
          <TextField
            id="email"
            label="E-mail"
            type="email"
            value={form.email}
            onChange={updateField('email')}
            error={fieldErrors.email}
            autoComplete="email"
            placeholder="voce@exemplo.com"
          />
          <PasswordInput
            id="password"
            label="Senha"
            value={form.password}
            onChange={updateField('password')}
            error={fieldErrors.password}
            autoComplete="new-password"
            placeholder="Crie uma senha"
          />
          <PasswordStrengthMeter password={form.password} />
          <PasswordInput
            id="confirmPassword"
            label="Confirmar senha"
            value={form.confirmPassword}
            onChange={updateField('confirmPassword')}
            error={fieldErrors.confirmPassword}
            autoComplete="new-password"
            placeholder="Repita a senha"
          />

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <span>Li e aceito os termos de uso e a politica de privacidade</span>
          </label>
          {fieldErrors.acceptedTerms ? <p className="field__error">{fieldErrors.acceptedTerms}</p> : null}

          <Button type="submit" variant="primary" isLoading={isLoading}>
            Criar minha conta
          </Button>
        </form>

        <p className="auth-card__footer">
          Ja tenho uma conta —{' '}
          <Link to="/login" className="auth-card__link auth-card__link--strong">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
