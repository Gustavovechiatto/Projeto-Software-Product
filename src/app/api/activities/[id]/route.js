import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const PRIORITIES = ["baixa", "media", "alta"];
const STATUSES = ["pendente", "concluida"];

function getOwnedActivity(id, userId) {
  return db
    .prepare(`SELECT * FROM activities WHERE id = ? AND user_id = ?`)
    .get(id, userId);
}

// US06 (marcar concluída) + US07 (editar atividade)
export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = getOwnedActivity(id, user.id);
  if (!existing) {
    return NextResponse.json({ error: "Atividade não encontrada." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  const title = body.title !== undefined ? String(body.title).trim() : existing.title;
  const description =
    body.description !== undefined ? String(body.description).trim() : existing.description;
  const priority = PRIORITIES.includes(body.priority) ? body.priority : existing.priority;
  const status = STATUSES.includes(body.status) ? body.status : existing.status;
  const startDate = body.startDate !== undefined ? body.startDate : existing.start_date;
  const endDate = body.endDate !== undefined ? body.endDate : existing.end_date;

  if (!title) {
    return NextResponse.json({ error: "O título não pode ficar vazio." }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json({ error: "A descrição não pode ficar vazia." }, { status: 400 });
  }

  db.prepare(
    `UPDATE activities
     SET title = ?, description = ?, priority = ?, status = ?, start_date = ?, end_date = ?,
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(title, description, priority, status, startDate, endDate, id);

  const activity = db.prepare(`SELECT * FROM activities WHERE id = ?`).get(id);
  return NextResponse.json({ activity });
}

// US08 - Excluir atividade
export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = getOwnedActivity(id, user.id);
  if (!existing) {
    return NextResponse.json({ error: "Atividade não encontrada." }, { status: 404 });
  }

  db.prepare(`DELETE FROM activities WHERE id = ?`).run(id);
  return NextResponse.json({ message: "Atividade excluída com sucesso." });
}
