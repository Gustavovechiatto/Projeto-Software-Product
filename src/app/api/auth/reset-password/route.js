import { NextResponse } from "next/server";
import db from "@/lib/db";
import { consumeToken, hashPassword, isStrongPassword } from "@/lib/auth";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const token = String(body.token || "");
  const password = String(body.password || "");
  const confirmPassword = String(body.confirmPassword || "");

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

  const result = consumeToken(token, "password_reset");
  if (!result.ok) {
    const messages = {
      invalid: "Link de redefinição inválido.",
      used: "Este link já foi utilizado.",
      expired: "Este link expirou. Solicite uma nova redefinição de senha.",
    };
    return NextResponse.json(
      { error: messages[result.reason] || "Não foi possível redefinir a senha." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);
  db.prepare(
    `UPDATE users SET password_hash = ?, failed_login_attempts = 0 WHERE id = ?`
  ).run(passwordHash, result.userId);

  return NextResponse.json({ message: "Senha redefinida com sucesso! Faça login." });
}
