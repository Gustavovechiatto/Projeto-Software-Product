"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/Modal";
import PasswordField from "@/components/PasswordField";

export default function LoginForm() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockout, setLockout] = useState(null); // { message, devLink }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      toast.success(data.message || "Login realizado com sucesso!");
      router.push("/atividades");
      router.refresh();
    } catch (err) {
      if (err.payload?.lockout) {
        setLockout({ message: err.payload.message, devLink: err.payload.devLink });
      } else {
        toast.error(err.message || "E-mail ou senha incorretos.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-1">Entrar</h2>
      <p className="text-sm text-slate-400 mb-6">
        Acesse sua conta com o e-mail acadêmico ou profissional cadastrado.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="tc-label">
            E-mail acadêmico ou profissional
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
          label="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Sua senha"
        />

        <div className="text-right -mt-2">
          <Link href="/esqueci-senha" className="tc-link text-xs">
            Esqueci minha senha
          </Link>
        </div>

        <button type="submit" disabled={loading} className="tc-btn tc-btn-primary w-full">
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <Link href="/cadastro" className="tc-btn tc-btn-ghost w-full text-center block">
          Cadastrar-se
        </Link>
      </form>

      <Modal open={!!lockout} onClose={() => setLockout(null)} title="Muitas tentativas incorretas">
        <p className="text-sm text-slate-300 mb-4">{lockout?.message}</p>
        {lockout?.devLink && (
          <div className="mb-4 p-3 rounded-lg border border-dashed border-amber-700/60 bg-amber-950/20 text-xs">
            <p className="text-amber-300 mb-1 font-semibold">Modo desenvolvimento (sem SMTP configurado)</p>
            <a href={lockout.devLink} className="tc-link break-all">
              {lockout.devLink}
            </a>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => setLockout(null)} className="tc-btn tc-btn-ghost flex-1">
            Tentar novamente
          </button>
          <Link href="/esqueci-senha" className="tc-btn tc-btn-primary flex-1 text-center">
            Redefinir senha
          </Link>
        </div>
      </Modal>
    </>
  );
}
