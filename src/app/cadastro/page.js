import AuthShell from "@/components/AuthShell";
import RegisterForm from "@/components/RegisterForm";

export const metadata = { title: "Cadastro - TaskControl" };

export default function CadastroPage() {
  return (
    <AuthShell>
      <RegisterForm />
    </AuthShell>
  );
}
