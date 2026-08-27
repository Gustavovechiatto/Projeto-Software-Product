import { NextResponse } from "next/server";
import db from "@/lib/db";
import { consumeToken } from "@/lib/auth";

// US01 - confirmação de e-mail via link
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const token = String(body.token || "");

  if (!token) {
    return NextResponse.json({ error: "Token ausente." }, { status: 400 });
  }

  const result = consumeToken(token, "email_verify");
  if (!result.ok) {
    const messages = {
      invalid: "Link de confirmação inválido.",
      used: "Este link já foi utilizado.",
      expired: "Este link expirou. Solicite um novo reenvio de confirmação.",
    };
    return NextResponse.json(
      { error: messages[result.reason] || "Não foi possível confirmar o e-mail." },
      { status: 400 }
    );
  }

  db.prepare(`UPDATE users SET email_verified = 1 WHERE id = ?`).run(result.userId);
  const user = db.prepare(`SELECT email FROM users WHERE id = ?`).get(result.userId);

  return NextResponse.json({
    message: "E-mail confirmado com sucesso! Você já pode fazer login.",
    email: user?.email,
  });
}
