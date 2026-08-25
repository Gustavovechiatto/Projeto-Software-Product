# TaskControl — Autenticacao (Login e Cadastro)

Implementacao real das telas de **Login** e **Cadastro** do TaskControl, com
backend Node/Express + PostgreSQL, senha com hash (bcrypt), sessao via JWT
em cookie httpOnly, confirmacao de conta por e-mail e recuperacao de senha
(endpoint pronto no backend).

> Esta entrega tem foco em **Login** e **Cadastro** funcionando de ponta a
> ponta. A tela de "Recuperar senha" no frontend e um placeholder — o
> endpoint `/api/auth/forgot-password` ja existe e funciona, faltando so a
> tela.

## Estrutura

```
taskcontrol/
  backend/     Express + PostgreSQL (API de autenticacao)
  frontend/    React + Vite (telas de Login e Cadastro)
```

## Pre-requisitos

- Node.js 18+ instalado
- PostgreSQL 13+ instalado e rodando (local ou em nuvem)

## 1. Configurar o banco de dados

Crie um banco vazio, por exemplo:

```bash
createdb taskcontrol
```

## 2. Backend

```bash
cd backend
cp .env.example .env
# edite o .env: DATABASE_URL, JWT_SECRET (gere um valor aleatorio forte)
npm install
npm run db:migrate   # cria as tabelas (users, auth_tokens)
npm run dev           # inicia em http://localhost:4000
```

Gerar um `JWT_SECRET` forte:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Sobre o envio de e-mails

Se as variaveis `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` nao forem
preenchidas no `.env`, o backend entra em **modo console**: o link de
confirmacao/recuperacao e impresso no terminal do backend em vez de
enviado por e-mail de verdade. Isso permite testar o fluxo completo sem
precisar de um servidor SMTP. As respostas da API de cadastro tambem
retornam esse link (`devConfirmUrl`) para facilitar o teste local — a
tela de Cadastro ja exibe esse link automaticamente quando presente.

Para enviar e-mails de verdade, preencha as variaveis `SMTP_*` com as
credenciais do seu provedor (ex: um servidor SMTP de teste como Mailtrap,
ou um provedor real).

## 3. Frontend

Em outro terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev   # inicia em http://localhost:5173
```

Abra `http://localhost:5173/login` ou `http://localhost:5173/cadastro`.

O Vite ja esta configurado (`vite.config.js`) para redirecionar chamadas
`/api/*` para `http://localhost:4000`, entao nao e preciso configurar CORS
manualmente durante o desenvolvimento.

## Como testar o fluxo completo

1. Acesse `/cadastro`, preencha nome, e-mail, senha (observe o medidor de
   forca) e confirme a senha. Marque o aceite dos termos.
2. Ao enviar, aparece o modal de sucesso. Como nenhum SMTP esta
   configurado por padrao, o link de confirmacao aparece diretamente na
   tela — clique nele para confirmar a conta (ou copie/cole a URL).
   O botao "Reenviar e-mail de confirmacao" fica desabilitado por 60s
   apos cada envio, como pedido na especificacao (US01).
3. Volte para `/login` e entre com o e-mail e senha cadastrados.
4. No **primeiro login**, aparece a tela de boas-vindas com a opcao de
   iniciar o mini tutorial ou pular.
5. Teste tambem os casos de erro:
   - Senha errada → mensagem "E-mail ou senha incorretos."
   - Mais de 3 tentativas erradas seguidas → mensagem sugerindo
     redefinicao de senha, com link para a tela de recuperacao (US02).
   - Tentar logar antes de confirmar o e-mail → bloqueado com aviso.
   - Campos vazios / e-mail invalido / senhas que nao coincidem →
     validacao inline, sem quebrar o layout.
6. Redimensione a janela (ou abra o DevTools em modo mobile) para ver o
   layout responsivo — o painel lateral escuro desaparece em telas
   estreitas e o formulario ocupa a largura total.

## O que foi implementado

**Backend (`backend/src`)**
- `server.js` — servidor Express, CORS, cookies, tratamento de erros.
- `routes/auth.routes.js` + `controllers/auth.controller.js` — endpoints:
  `POST /register`, `POST /resend-confirmation`, `POST /confirm-email`,
  `POST /login`, `POST /logout`, `GET /me`, `POST /forgot-password`,
  `POST /reset-password`.
- `utils/password.js` — hash com bcrypt (12 rounds) e classificacao de
  forca da senha (fraca/media/forte), nunca senha em texto puro.
- `utils/tokens.js` — JWT de sessao (cookie httpOnly) e tokens opacos
  (hash SHA-256) para confirmacao de conta e redefinicao de senha.
- `utils/email.js` — envio via SMTP com fallback para modo console em
  desenvolvimento.
- `schema.sql` / `migrate.js` — tabelas `users` e `auth_tokens`.
- Limite de tentativas de login (`MAX_LOGIN_ATTEMPTS`, padrao 3) e
  rate-limit por IP na rota de login.

**Frontend (`frontend/src`)**
- `pages/Login.jsx` — validacao, mensagens de erro, sugestao de reset
  apos varias tentativas, mensagem de boas-vindas + convite ao tutorial
  no primeiro login.
- `pages/Register.jsx` — validacao completa, medidor visual de forca da
  senha, modal de sucesso com reenvio de confirmacao (cooldown de 60s).
- `context/AuthContext.jsx` — sessao atual, login/logout.
- `context/ToastContext.jsx` + `components/Toast.jsx` — feedback visual
  sem usar `alert()` do navegador.
- `components/` — campos de texto e senha (com mostrar/ocultar), botao
  com estado de carregamento, medidor de forca, painel visual de
  assinatura (`AuthVisual`).
- `styles/index.css` — sistema de design proprio (cores, tipografia
  Fraunces + IBM Plex, cantos arredondados, sombras, microinteracoes,
  responsivo).

## Seguranca

- Senhas nunca sao armazenadas em texto puro (bcrypt, 12 rounds).
- Tokens de confirmacao/reset sao armazenados como hash (SHA-256) no
  banco, nunca em texto puro.
- Sessao via cookie `httpOnly`, `sameSite=lax` (e `secure` em producao).
- Validacao de todos os campos tambem no backend, nao so no frontend.
- Nenhuma credencial fica hardcoded no codigo — tudo vem de variaveis de
  ambiente (`.env`, nunca commitado — veja `.env.example`).
- As respostas de "esqueci minha senha" e "reenviar confirmacao" sao
  propositalmente genericas, para nao revelar quais e-mails existem no
  sistema.

## Variaveis de ambiente necessarias

| Arquivo | Variavel | Obrigatoria | Descricao |
|---|---|---|---|
| `backend/.env` | `DATABASE_URL` | Sim | Conexao com o PostgreSQL |
| `backend/.env` | `JWT_SECRET` | Sim | Chave para assinar os tokens de sessao |
| `backend/.env` | `FRONTEND_URL` | Sim | Usada nos links enviados por e-mail |
| `backend/.env` | `SMTP_*` | Nao | Se ausente, e-mails vao para o console |
| `frontend/.env` | `VITE_API_URL` | Nao | Padrao `/api` (usa o proxy do Vite) |
