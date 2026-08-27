"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/Modal";
import PasswordField, { passwordStrength } from "@/components/PasswordField";

const STRENGTH_LABELS = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte"];

export default function RegisterForm() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentModal, setSentModal] = useState(null); // { email, devLink }
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const data = await api("/auth/register", {
        method: "POST",
        body: { email, password, confirmPassword },
      });
      setSentModal({ email: data.email, devLink: data.devLink });
      setCooldown(60);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      const data = await api("/auth/resend-confirmation", {
        method: "POST",
        body: { email: sentModal.email },
      });
      toast.success("Reenviamos o e-mail de confirmação.");
      setSentModal((s) => ({ ...s, devLink: data.devLink || s.devLink }));
      setCooldown(60);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResending(false);
    }
  }

  const strength = passwordStrength(password);

  return (
    <>
      <h2 className="text-2xl font-bold mb-1">Criar conta</h2>
      <p className="text-sm text-slate-400 mb-6">
        Use seu e-mail acadêmico ou pessoal para começar a organizar suas tarefas.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="tc-label">
            E-mail acadêmico ou pessoal
          </label>
          <input
            id="email"
            type="email"
            className="tc-input"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <PasswordField
          id="password"
          label="Criar senha segura"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres, letras e números"
        />
        {password && (
          <div className="-mt-2">
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden flex gap-0.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors ${
                    i < strength
                      ? strength <= 1
                        ? "bg-red-500"
                        : strength === 2
                        ? "bg-amber-400"
                        : "bg-emerald-500"
                      : "bg-slate-800"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">{STRENGTH_LABELS[strength]}</p>
          </div>
        )}

        <PasswordField
          id="confirmPassword"
          label="Confirmar senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Repita a senha"
        />

        <button type="submit" disabled={loading} className="tc-btn tc-btn-primary w-full">
          {loading ? "Cadastrando..." : "Cadastrar-se"}
        </button>
      </form>

      <p className="text-sm text-slate-400 mt-6 text-center">
        Já tem uma conta?{" "}
        <Link href="/login" className="tc-link">
          Entrar
        </Link>
      </p>

      <Modal open={!!sentModal} onClose={() => {}} title="Confirme seu e-mail">
        <p className="text-sm text-slate-300 mb-4">
          Enviamos um e-mail de confirmação para <strong>{sentModal?.email}</strong>.
          Abra o link recebido para ativar sua conta.
        </p>

        {sentModal?.devLink && (
          <div className="mb-4 p-3 rounded-lg border border-dashed border-emerald-700/60 bg-emerald-950/30 text-xs">
            <p className="text-emerald-300 mb-1 font-semibold">Modo desenvolvimento (sem SMTP configurado)</p>
            <p className="text-slate-300 mb-2">
              Nenhum servidor de e-mail foi configurado, então geramos o link de
              confirmação aqui mesmo para você testar:
            </p>
            <a href={sentModal.devLink} className="tc-link break-all">
              {sentModal.devLink}
            </a>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="tc-btn tc-btn-ghost w-full"
          >
            {cooldown > 0 ? `Reenviar confirmação (${cooldown}s)` : resending ? "Reenviando..." : "Reenviar confirmação"}
          </button>
          <Link href="/login" className="tc-btn tc-btn-primary w-full text-center">
            Ir para o login
          </Link>
        </div>
      </Modal>
    </>
  );
}
