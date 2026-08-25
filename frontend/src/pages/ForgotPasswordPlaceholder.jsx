import React from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPlaceholder() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">TaskControl</div>
        <h1 className="auth-card__title">Recuperar senha</h1>
        <p className="auth-card__subtitle">
          Esta tela ainda nao foi implementada nesta entrega — o foco atual e Login e Cadastro. O endpoint
          de backend <code>/api/auth/forgot-password</code> ja esta pronto para quando ela for construida.
        </p>
        <Link to="/login" className="auth-card__link auth-card__link--strong">
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
