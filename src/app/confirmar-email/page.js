import { Suspense } from "react";
import AuthShell from "@/components/AuthShell";
import ConfirmEmailPanel from "@/components/ConfirmEmailPanel";

export const metadata = { title: "Confirmar e-mail - TaskControl" };

export default function ConfirmarEmailPage() {
  return (
    <AuthShell>
      <Suspense fallback={<p className="text-sm text-slate-400">Carregando...</p>}>
        <ConfirmEmailPanel />
      </Suspense>
    </AuthShell>
  );
}
