import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const PRIORITIES = ["baixa", "media", "alta"];

// US05 - Listar atividades
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const activities = db
    .prepare(
      `SELECT * FROM activities WHERE user_id = ? ORDER BY status ASC, created_at DESC`
    )
    .all(user.id);

  return NextResponse.json({ activities });
}

// US04 - Cadastro de atividade
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const priority = PRIORITIES.includes(body.priority) ? body.priority : "media";
  const startDate = body.startDate || null;
  const endDate = body.endDate || null;

  if (!title) {
    return NextResponse.json(
      { error: "Informe o título da atividade." },
      { status: 400 }
    );
  }
  if (!description) {
    return NextResponse.json(
      { error: "Informe a descrição da atividade." },
      { status: 400 }
    );
  }

  const result = db
    .prepare(
      `INSERT INTO activities (user_id, title, description, priority, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(user.id, title, description, priority, startDate, endDate);

  const activity = db
    .prepare(`SELECT * FROM activities WHERE id = ?`)
    .get(result.lastInsertRowid);

  return NextResponse.json({ activity }, { status: 201 });
}
