-- Schema de autenticacao do TaskControl
-- Execute este arquivo no banco definido em DATABASE_URL antes de iniciar o backend.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(150) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,
    email_confirmed      BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_count  INTEGER NOT NULL DEFAULT 0,
    is_first_login      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tokens de confirmacao de conta e de redefinicao de senha.
-- "purpose" diferencia os dois fluxos na mesma tabela.
CREATE TABLE IF NOT EXISTS auth_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    purpose     VARCHAR(30) NOT NULL CHECK (purpose IN ('email_confirmation', 'password_reset')),
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_purpose ON auth_tokens(user_id, purpose);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
