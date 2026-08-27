"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useToast } from "@/context/ToastContext";
import PasswordField from "@/components/PasswordField";

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const data = await api("/auth/reset-password", {
        method: "POST",
        body: { token, password, confirmPassword },
      });
      toast.success(data.message);
      router.push("/login");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-2">Link inválido</h2>
        <p className="text-sm text-slate-300 mb-6">
          Este link de redefinição de senha está incompleto ou inválido.
        </p>
        <Link href="/esqueci-senha" className="tc-btn tc-btn-primary w-full text-center">
          Solicitar novo link
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-1">Criar nova senha</h2>
      <p className="text-sm text-slate-400 mb-6">Escolha uma nova senha segura para sua conta.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField
          id="password"
          label="Nova senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres, letras e números"
        />
        <PasswordField
          id="confirmPassword"
          label="Confirmar nova senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Repita a nova senha"
        />
        <button type="submit" disabled={loading} className="tc-btn tc-btn-primary w-full">
          {loading ? "Salvando..." : "Redefinir senha"}
        </button>
      </form>
    </>
  );
}
