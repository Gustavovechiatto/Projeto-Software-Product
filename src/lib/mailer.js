import db from "@/lib/db";

/**
 * Sends an e-mail (or simulates one).
 *
 * If SMTP_HOST/SMTP_USER/SMTP_PASS are set in the environment, a real e-mail
 * is sent through nodemailer. Otherwise TaskControl runs in "dev mail" mode:
 * the message is written to the `outbox` table (visible at /dev/outbox) and
 * printed to the server console, so registration/login/password reset work
 * end-to-end with zero external setup.
 */
export async function sendMail({ to, subject, text, link }) {
  const body = text || "";

  db.prepare(
    `INSERT INTO outbox (to_email, subject, body, link) VALUES (?, ?, ?, ?)`
  ).run(to, subject, body, link || null);

  const smtpConfigured =
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (smtpConfigured) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        text: body,
      });
      return { simulated: false };
    } catch (err) {
      console.error("[mailer] Falha ao enviar e-mail real, usando modo simulado:", err.message);
    }
  }

  // Dev-mode fallback: log to console so it's easy to follow during a demo.
  console.log("\n===== E-MAIL SIMULADO (TaskControl) =====");
  console.log("Para:", to);
  console.log("Assunto:", subject);
  console.log(body);
  if (link) console.log("Link:", link);
  console.log("==========================================\n");

  return { simulated: true };
}
