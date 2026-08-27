import { NextResponse } from "next/server";
import db from "@/lib/db";
import {
  comparePassword,
  createSession,
  createPasswordResetToken,
} from "@/lib/auth";
import { sendMail } from "@/lib/mailer";

const MAX_ATTEMPTS = 3;

// US02 - Login de usuário
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);

  if (!user) {
    return NextResponse.json(
      { error: "E-mail ou senha incorretos." },
      { status: 401 }
    );
  }

  const valid = await comparePassword(password, user.password_hash);

  if (!valid) {
    const attempts = user.failed_login_attempts + 1;
    db.prepare(`UPDATE users SET failed_login_attempts = ? WHERE id = ?`).run(
      attempts,
      user.id
    );

    // Cenário 3 (BDD US02): errar a senha mais de 3 vezes -> sugerir troca
    // de senha e enviar e-mail de redefinição automaticamente.
    if (attempts >= MAX_ATTEMPTS) {
      const token = createPasswordResetToken(user.id);
      const origin = request.headers.get("origin") || "";
      const link = `${origin}/redefinir-senha?token=${token}`;
      const mailResult = await sendMail({
        to: user.email,
        subject: "Redefinição de senha - TaskControl",
        text: `Detectamos várias tentativas de login sem sucesso na sua conta. Redefina sua senha pelo link:\n${link}`,
        link,
      });

      return NextResponse.json(
        {
          error: "E-mail ou senha incorretos.",
          lockout: true,
          message:
            "Você errou a senha várias vezes. Enviamos um link de redefinição de senha para o seu e-mail.",
          devLink: mailResult.simulated ? link : null,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "E-mail ou senha incorretos." },
      { status: 401 }
    );
  }

  db.prepare(`UPDATE users SET failed_login_attempts = 0 WHERE id = ?`).run(user.id);
  await createSession(user.id);

  // Cenário 4 (BDD US02): primeiro acesso -> boas-vindas + mini tutorial (US03)
  const isFirstLogin = user.tutorial_seen === 0;

  return NextResponse.json({
    message: "Login realizado com sucesso!",
    isFirstLogin,
    user: {
      id: user.id,
      email: user.email,
      emailVerified: !!user.email_verified,
    },
  });
}
