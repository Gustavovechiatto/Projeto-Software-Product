import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";

export const metadata = {
  title: "TaskControl",
  description: "Gerenciador de atividades para estudantes e profissionais.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
