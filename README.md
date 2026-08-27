# TaskControl

Sistema gerenciador de atividades para estudantes e profissionais, construído
com **Next.js (App Router)** e **SQLite**, a partir do documento de
planejamento do Grupo Jesus (User Stories US01–US08, BDD e Definition of
Ready/Done).

Este README é o tutorial oficial do projeto: como ele funciona e como
colocá-lo para rodar.

---

## Funcionalidade 1 — Tutorial guiado dentro do app (US03)

A primeira funcionalidade do sistema é o **próprio tutorial**, exibido
automaticamente para o usuário. No primeiro login, o TaskControl pergunta:

> "Olá! Gostaria de um mini-tutorial rápido para aprender a usar as
> principais funcionalidades?"

- Se o usuário aceitar, ele vê dois passos rápidos: **(1) como criar uma
  atividade** (título, descrição, prioridade e período) e **(2) como
  visualizar, editar e excluir** atividades já cadastradas.
- Se recusar, vai direto para a lista de atividades — pode pular a qualquer
  momento.
- O tutorial pode ser reaberto manualmente clicando em **"? Ajuda"** no topo
  da tela de atividades.

Depois desse tutorial, as demais funcionalidades do sistema são:

2. Cadastro de usuário (US01)
3. Login de usuário (US02)
4. Cadastro de atividades (US04)
5. Listagem de atividades (US05)
6. Marcar atividade como concluída (US06)
7. Editar atividade (US07)
8. Excluir atividade (US08)

O **cadastro e o login** (itens 2 e 3) receberam atenção especial de
implementação e design, por serem a porta de entrada do sistema — telas
dedicadas, feedback claro de erros, medidor de força de senha, confirmação de
e-mail e recuperação de senha.

---

## Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18.18 ou superior (recomendado 20+)
- npm (instalado junto com o Node.js)

### Passo a passo

```bash
# 1. Entre na pasta do projeto
cd taskcontrol-next

# 2. Instale as dependências
npm install

# 3. Rode em modo desenvolvimento
npm run dev
```

Acesse **http://localhost:3000** no navegador. Pronto — o TaskControl já
está funcionando. Você será redirecionado automaticamente para a tela de
login (ou cadastro).

Para gerar uma build de produção:

```bash
npm run build
npm start
```

Não é necessário instalar ou configurar nenhum banco de dados separadamente:
o SQLite é criado automaticamente na primeira execução, em
`data/taskcontrol.db` (o arquivo é ignorado pelo Git).

### E-mails (confirmação de cadastro / redefinição de senha)

O sistema **não exige um servidor de e-mail para funcionar**. Por padrão,
ele roda em **modo desenvolvimento**: qualquer "e-mail" que precisaria ser
enviado (confirmação de cadastro, redefinição de senha) é:

1. Salvo no banco de dados e listado em **http://localhost:3000/dev/outbox**;
2. Impresso no terminal onde o `npm run dev` está rodando;
3. Mostrado diretamente na tela, dentro do próprio pop-up (com um link
   clicável), para que você consiga testar o fluxo completo sem precisar de
   uma caixa de entrada de verdade.

Se quiser enviar e-mails reais, copie `.env.example` para `.env.local` e
preencha as variáveis `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e
`SMTP_FROM` com os dados do seu provedor (Gmail, Outlook, Mailtrap etc.).
Quando essas variáveis existem, o TaskControl passa a enviar e-mails reais
automaticamente — nenhuma outra mudança de código é necessária.

---

## Tecnologias

| Camada         | Tecnologia                                             |
| -------------- | -------------------------------------------------------|
| Framework      | Next.js 16 (App Router, Route Handlers, JavaScript)     |
| Banco de dados | SQLite via `better-sqlite3`                             |
| Autenticação   | Sessão por cookie `httpOnly` + senha com hash `bcrypt`   |
| E-mail         | `nodemailer` (opcional) com modo simulado embutido       |
| Estilo         | Tailwind CSS 4                                          |

Todo o sistema roda em um único processo Next.js: as páginas (frontend) e a
API (backend) estão no mesmo projeto, o que dispensa configurar CORS ou subir
dois servidores separados.

---

## Estrutura do projeto

```
taskcontrol-next/
├── data/                     # banco SQLite (criado automaticamente)
├── src/
│   ├── app/
│   │   ├── login/            # US02 - Login
│   │   ├── cadastro/         # US01 - Cadastro
│   │   ├── confirmar-email/  # US01 - confirmação por link
│   │   ├── esqueci-senha/    # recuperação de senha
│   │   ├── redefinir-senha/  # redefinição de senha
│   │   ├── atividades/       # US03-US08 - painel principal (protegido)
│   │   ├── dev/outbox/       # caixa de saída simulada (modo dev)
│   │   └── api/
│   │       ├── auth/         # register, login, logout, confirm, tutorial...
│   │       └── activities/   # CRUD de atividades
│   ├── components/           # UI: formulários, modais, tutorial, lista
│   ├── context/               # Toast (notificações)
│   └── lib/                   # db.js, auth.js, mailer.js, apiClient.js
├── .env.example
└── package.json
```

---

## Como cada história de usuário foi implementada

| US   | Funcionalidade                  | Onde                                                        |
| ---- | -------------------------------- | ------------------------------------------------------------ |
| US01 | Cadastrar novo usuário            | `/cadastro` + `/api/auth/register` + `/confirmar-email`      |
| US02 | Login de usuário                  | `/login` + `/api/auth/login`                                  |
| US03 | Tutoria do programa                | `TutorialOverlay.jsx`, disparado em `/atividades`             |
| US04 | Cadastro de atividade              | Modal "Nova atividade" + `POST /api/activities`               |
| US05 | Listar atividades                  | `/atividades` + `GET /api/activities`                         |
| US06 | Marcar atividade como concluída    | Checkbox na lista + `PATCH /api/activities/:id`                |
| US07 | Editar atividade                   | Modal "Editar atividade" + `PATCH /api/activities/:id`         |
| US08 | Excluir atividades                 | Confirmação + `DELETE /api/activities/:id`                     |

Regras de negócio específicas do documento também foram implementadas:

- **Senha segura**: mínimo de 8 caracteres, com letras e números.
- **Confirmação de cadastro por e-mail**: conta só é usável após clicar no
  link enviado; é possível reenviar a confirmação (com limite de 1 por
  minuto).
- **Bloqueio após 3 senhas erradas**: ao errar a senha 3 vezes seguidas, o
  sistema sugere a redefinição de senha e envia automaticamente um link por
  e-mail.
- **Primeiro login**: dispara o convite ao tutorial (US03).
- **Título e descrição obrigatórios** ao cadastrar/editar atividades.
- **Confirmação antes de excluir** uma atividade, com pop-up de sucesso após
  a exclusão.

---

## Contas de teste

Não existem contas pré-cadastradas — o cadastro é livre. Para testar
rapidamente:

1. Acesse `/cadastro` e crie uma conta com qualquer e-mail (ex.:
   `teste@exemplo.com`) e uma senha com 8+ caracteres, letras e números.
2. No pop-up de confirmação, use o link "modo desenvolvimento" exibido na
   tela (ou copie o link em `/dev/outbox`) para confirmar o e-mail.
3. Faça login em `/login` — no primeiro acesso o tutorial será exibido.

---

## Fora do escopo (conforme documento de planejamento)

Por decisão do time no planejamento original, os itens abaixo **não** fazem
parte deste sistema: integração com calendários externos, sistema de
notificações avançado e suporte a múltiplos usuários corporativos/equipes
(o sistema é multiusuário no sentido de cadastro/login individual, mas cada
usuário só vê suas próprias atividades).
