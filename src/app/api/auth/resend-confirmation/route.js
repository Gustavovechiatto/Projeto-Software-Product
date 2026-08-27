import { NextResponse } from "next/server";
import db from "@/lib/db";
import { createEmailVerificationToken, parseSqliteDate } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";

const MIN_WAIT_SECONDS = 60;

// Reenvio de confirmação — US01 (Critério: "recomendar reenvio após 1 minuto")
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();

  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
  const genericMessage =
    "Se o e-mail existir e ainda não estiver confirmado, reenviamos a confirmação.";

  if (!user || user.email_verified) {
    return NextResponse.json({ message: genericMessage });
  }

  const lastToken = db
    .prepare(
      `SELECT * FROM tokens WHERE user_id = ? AND type = 'email_verify' ORDER BY id DESC LIMIT 1`
    )
    .get(user.id);

  if (lastToken) {
    const secondsSince = (Date.now() - parseSqliteDate(lastToken.created_at).getTime()) / 1000;
    if (secondsSince < MIN_WAIT_SECONDS) {
      return NextResponse.json(
        {
          error: `Aguarde ${Math.ceil(MIN_WAIT_SECONDS - secondsSince)}s antes de solicitar um novo reenvio.`,
        },
        { status: 429 }
      );
    }
  }

  const token = createEmailVerificationToken(user.id);
  const origin = request.headers.get("origin") || "";
  const link = `${origin}/confirmar-email?token=${token}`;

  const mailResult = await sendMail({
    to: user.email,
    subject: "Reenvio: confirme seu cadastro no TaskControl",
    text: `Aqui está seu novo link de confirmação:\n${link}`,
    link,
  });

  return NextResponse.json({
    message: genericMessage,
    devLink: mailResult.simulated ? link : null,
  });
}
