"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/apiClient";

export default function ConfirmEmailPanel() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Link de confirmação inválido ou incompleto.");
      return;
    }
    api("/auth/confirm", { method: "POST", body: { token } })
      .then((data) => {
        setStatus("success");
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message);
      });
  }, [token]);

  if (status === "loading") {
    return <p className="text-sm text-slate-400">Confirmando seu e-mail...</p>;
  }

  if (status === "success") {
    return (
      <div>
        <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl mb-4">
          ✓
        </div>
        <h2 className="text-2xl font-bold mb-2">Seja bem-vindo(a) ao TaskControl!</h2>
        <p className="text-sm text-slate-300 mb-6">{message}</p>
        <Link href="/login" className="tc-btn tc-btn-primary w-full text-center">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-2xl mb-4">
        !
      </div>
      <h2 className="text-2xl font-bold mb-2">Não foi possível confirmar</h2>
      <p className="text-sm text-slate-300 mb-6">{message}</p>
      <Link href="/login" className="tc-btn tc-btn-ghost w-full text-center">
        Voltar para o login
      </Link>
    </div>
  );
}
