"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useToast } from "@/context/ToastContext";

export default function ForgotPasswordForm() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api("/auth/forgot-password", { method: "POST", body: { email } });
      setSent(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-2">Verifique seu e-mail</h2>
        <p className="text-sm text-slate-300 mb-4">{sent.message}</p>
        {sent.devLink && (
          <div className="mb-4 p-3 rounded-lg border border-dashed border-emerald-700/60 bg-emerald-950/30 text-xs">
            <p className="text-emerald-300 mb-1 font-semibold">Modo desenvolvimento (sem SMTP configurado)</p>
            <a href={sent.devLink} className="tc-link break-all">
              {sent.devLink}
            </a>
          </div>
        )}
        <Link href="/login" className="tc-btn tc-btn-ghost w-full text-center">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-1">Esqueci minha senha</h2>
      <p className="text-sm text-slate-400 mb-6">
        Informe o e-mail cadastrado e enviaremos um link para você criar uma nova senha.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="tc-label">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            className="tc-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading} className="tc-btn tc-btn-primary w-full">
          {loading ? "Enviando..." : "Enviar link de redefinição"}
        </button>
        <Link href="/login" className="tc-btn tc-btn-ghost w-full text-center block">
          Voltar para o login
        </Link>
      </form>
    </>
  );
}
