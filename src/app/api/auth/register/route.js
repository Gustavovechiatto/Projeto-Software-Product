import { NextResponse } from "next/server";
import db from "@/lib/db";
import {
  hashPassword,
  isValidEmail,
  isStrongPassword,
  createEmailVerificationToken,
} from "@/lib/auth";
import { sendMail } from "@/lib/mailer";

// US01 - Cadastrar novo usuário
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const confirmPassword = String(body.confirmPassword || "");

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Informe um e-mail acadêmico ou pessoal válido." },
      { status: 400 }
    );
  }
  if (!isStrongPassword(password)) {
    return NextResponse.json(
      {
        error:
          "A senha precisa ter pelo menos 8 caracteres, incluindo letras e números.",
      },
      { status: 400 }
    );
  }
  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "As senhas não coincidem." },
      { status: 400 }
    );
  }

  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
  if (existing) {
    return NextResponse.json(
      { error: "Já existe uma conta cadastrada com esse e-mail." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const result = db
    .prepare(`INSERT INTO users (email, password_hash) VALUES (?, ?)`)
    .run(email, passwordHash);

  const token = createEmailVerificationToken(result.lastInsertRowid);
  const origin = request.headers.get("origin") || "";
  const link = `${origin}/confirmar-email?token=${token}`;

  const mailResult = await sendMail({
    to: email,
    subject: "Confirme seu cadastro no TaskControl",
    text: `Olá! Confirme seu cadastro no TaskControl clicando no link abaixo:\n${link}\n\nSe você não fez esse cadastro, ignore este e-mail.`,
    link,
  });

  return NextResponse.json({
    message:
      "Cadastro realizado! Enviamos um e-mail de confirmação para validar sua conta.",
    email,
    // Sem SMTP configurado, o e-mail é simulado (ver /dev/outbox). Devolvemos o
    // link aqui só nesse modo, para que o cadastro seja testável de ponta a
    // ponta sem depender de um servidor de e-mail real.
    devLink: mailResult.simulated ? link : null,
  });
}
