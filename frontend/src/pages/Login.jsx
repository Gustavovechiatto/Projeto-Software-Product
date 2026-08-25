import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TextField } from '../components/TextField.jsx';
import { PasswordInput } from '../components/PasswordInput.jsx';
import { Button } from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { AuthVisual } from '../components/AuthVisual.jsx';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [suggestReset, setSuggestReset] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  function validate() {
    const errors = {};
    if (!email.trim()) errors.email = 'E-mail e obrigatorio.';
    else if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Informe um e-mail valido.';
    if (!password) errors.password = 'Senha e obrigatoria.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSuggestReset(false);

    if (!validate()) return;

    setIsLoading(true);
    try {
      const data = await login({ email: email.trim(), password });
      if (data.isFirstLogin) {
        setShowTutorialPrompt(true);
      } else {
        toast.success('Login realizado com sucesso.');
        navigate('/dashboard');
      }
    } catch (err) {
      setFormError(err.payload?.error || err.message);
      setSuggestReset(!!err.payload?.suggestReset);
      if (err.payload?.emailNotConfirmed) {
        toast.info('Confirme seu e-mail antes de entrar.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (showTutorialPrompt) {
    return (
      <div className="auth-page">
        <AuthVisual headline="Organize, priorize e acompanhe cada tarefa do time em um so lugar." />
        <div className="auth-card auth-card--modal">
          <h1 className="auth-card__title">Bem-vindo ao TaskControl! 👋</h1>
          <p className="auth-card__subtitle">Quer fazer um mini tutorial para conhecer o sistema?</p>
          <div className="auth-card__actions">
            <Button variant="primary" onClick={() => navigate('/dashboard?tutorial=1')}>
              Comecar tutorial
            </Button>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Pular
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <AuthVisual headline="Organize, priorize e acompanhe cada tarefa do time em um so lugar." />
      <div className="auth-card">
        <div className="auth-card__brand">TaskControl</div>
        <h1 className="auth-card__title">Bem-vindo de volta!</h1>

        {formError ? (
          <div className="alert alert--error" role="alert">
            <span>⚠️ {formError}</span>
            {suggestReset ? (
              <Link to="/recuperar-senha" className="alert__action">
                Redefinir senha
              </Link>
            ) : null}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            id="email"
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            autoComplete="email"
            placeholder="voce@exemplo.com"
          />
          <PasswordInput
            id="password"
            label="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            autoComplete="current-password"
            placeholder="Sua senha"
          />

          <div className="auth-card__row">
            <Link to="/recuperar-senha" className="auth-card__link">
              Esqueci minha senha
            </Link>
          </div>

          <Button type="submit" variant="primary" isLoading={isLoading}>
            Entrar
          </Button>
        </form>

        <p className="auth-card__footer">
          Ainda nao tenho uma conta —{' '}
          <Link to="/cadastro" className="auth-card__link auth-card__link--strong">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
