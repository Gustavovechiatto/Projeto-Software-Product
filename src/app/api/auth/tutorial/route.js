import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// US03 - marca o tutorial como visto, seja concluído ou pulado.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  db.prepare(`UPDATE users SET tutorial_seen = 1 WHERE id = ?`).run(user.id);
  return NextResponse.json({ message: "Tutorial concluído." });
}
