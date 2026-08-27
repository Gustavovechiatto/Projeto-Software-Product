import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

export const SESSION_COOKIE = "tc_session";
const SESSION_DAYS = 7;
const TOKEN_MINUTES_EMAIL = 60 * 24; // 24h to confirm e-mail
const TOKEN_MINUTES_RESET = 60; // 1h to reset password

export function genToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

// "Senha segura": pelo menos 8 caracteres, uma letra e um número.
export function isStrongPassword(password) {
  const pw = String(password || "");
  return pw.length >= 8 && /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw);
}

function futureIso(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

// SQLite's datetime('now') yields "YYYY-MM-DD HH:MM:SS" (UTC, no timezone
// marker). Normalize it to a value the JS Date constructor parses correctly.
export function parseSqliteDate(value) {
  if (!value) return null;
  const iso = value.includes("T") ? value : value.replace(" ", "T") + "Z";
  return new Date(iso);
}

export function createEmailVerificationToken(userId) {
  const token = genToken();
  db.prepare(
    `INSERT INTO tokens (user_id, token, type, expires_at) VALUES (?, ?, 'email_verify', ?)`
  ).run(userId, token, futureIso(TOKEN_MINUTES_EMAIL));
  return token;
}

export function createPasswordResetToken(userId) {
  const token = genToken();
  db.prepare(
    `INSERT INTO tokens (user_id, token, type, expires_at) VALUES (?, ?, 'password_reset', ?)`
  ).run(userId, token, futureIso(TOKEN_MINUTES_RESET));
  return token;
}

export function consumeToken(token, type) {
  const row = db
    .prepare(`SELECT * FROM tokens WHERE token = ? AND type = ?`)
    .get(token, type);
  if (!row) return { ok: false, reason: "invalid" };
  if (row.used_at) return { ok: false, reason: "used" };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }
  db.prepare(`UPDATE tokens SET used_at = datetime('now') WHERE id = ?`).run(row.id);
  return { ok: true, userId: row.user_id };
}

export async function createSession(userId) {
  const token = genToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    `INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)`
  ).run(userId, token, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
  return token;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = db.prepare(`SELECT * FROM sessions WHERE token = ?`).get(token);
  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) {
    db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
    return null;
  }

  const user = db
    .prepare(
      `SELECT id, email, email_verified, tutorial_seen, created_at FROM users WHERE id = ?`
    )
    .get(session.user_id);
  return user || null;
}
