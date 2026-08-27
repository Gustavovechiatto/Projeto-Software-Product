import { Suspense } from "react";
import AuthShell from "@/components/AuthShell";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata = { title: "Redefinir senha - TaskControl" };

export default function RedefinirSenhaPage() {
  return (
    <AuthShell>
      <Suspense fallback={<p className="text-sm text-slate-400">Carregando...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
