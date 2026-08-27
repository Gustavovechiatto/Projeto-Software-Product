import db from "@/lib/db";

export const metadata = { title: "Caixa de saída (dev) - TaskControl" };
export const dynamic = "force-dynamic";

// Painel de desenvolvimento: mostra os "e-mails" simulados quando não há
// SMTP configurado, para testar cadastro/login/redefinição sem servidor de
// e-mail real. Veja SMTP_HOST/USER/PASS no .env.example para enviar e-mails
// de verdade.
export default function DevOutboxPage() {
  const emails = db
    .prepare(`SELECT * FROM outbox ORDER BY id DESC LIMIT 50`)
    .all();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Caixa de saída (modo desenvolvimento)</h1>
      <p className="text-sm text-slate-400 mb-8">
        Como nenhum SMTP foi configurado, os e-mails do TaskControl são
        simulados e registrados aqui. Configure <code>SMTP_HOST</code>,{" "}
        <code>SMTP_USER</code> e <code>SMTP_PASS</code> no <code>.env.local</code>{" "}
        para enviar e-mails reais.
      </p>

      {emails.length === 0 ? (
        <p className="text-slate-500 text-sm">Nenhum e-mail enviado ainda.</p>
      ) : (
        <ul className="space-y-4">
          {emails.map((mail) => (
            <li key={mail.id} className="tc-card p-4">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>{mail.created_at} UTC</span>
                <span>Para: {mail.to_email}</span>
              </div>
              <p className="font-semibold mb-1">{mail.subject}</p>
              <p className="text-sm text-slate-300 whitespace-pre-wrap mb-2">{mail.body}</p>
              {mail.link && (
                <a href={mail.link} className="tc-link text-xs break-all">
                  {mail.link}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
