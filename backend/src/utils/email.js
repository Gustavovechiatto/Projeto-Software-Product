const nodemailer = require('nodemailer');

let transporter = null;
let usingConsoleMode = true;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    usingConsoleMode = false;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();

  if (!t) {
    // Modo console: nenhum SMTP configurado. Isso NAO simula sucesso falso -
    // o token real foi gerado e salvo no banco; apenas a entrega por e-mail
    // esta sendo impressa no terminal em vez de enviada de verdade.
    // eslint-disable-next-line no-console
    console.log('\n----- [email] Modo console (SMTP nao configurado) -----');
    console.log('Para:', to);
    console.log('Assunto:', subject);
    console.log(text || html);
    console.log('---------------------------------------------------------\n');
    return { delivered: false, mode: 'console' };
  }

  await t.sendMail({
    from: process.env.SMTP_FROM || 'TaskControl <no-reply@taskcontrol.app>',
    to,
    subject,
    html,
    text,
  });
  return { delivered: true, mode: 'smtp' };
}

function isConsoleMode() {
  return usingConsoleMode;
}

module.exports = { sendMail, isConsoleMode };
