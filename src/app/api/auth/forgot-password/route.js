import { NextResponse } from "next/server";
import db from "@/lib/db";
import { createPasswordResetToken, isValidEmail } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();

  if (!isValidEmail(email)) {
    return NextResponse.json({
      message: "Se esse e-mail estiver cadastrado, enviaremos um link de redefinição.",
    });
  }

  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
  if (!user) {
    return NextResponse.json({
      message: "Se esse e-mail estiver cadastrado, enviaremos um link de redefinição.",
    });
  }

  const token = createPasswordResetToken(user.id);
  const origin = request.headers.get("origin") || "";
  const link = `${origin}/redefinir-senha?token=${token}`;

  const mailResult = await sendMail({
    to: user.email,
    subject: "Redefinição de senha - TaskControl",
    text: `Recebemos uma solicitação para redefinir sua senha. Use o link abaixo:\n${link}\n\nSe não foi você, ignore este e-mail.`,
    link,
  });

  return NextResponse.json({
    message: "Se esse e-mail estiver cadastrado, enviaremos um link de redefinição.",
    devLink: mailResult.simulated ? link : null,
  });
}
