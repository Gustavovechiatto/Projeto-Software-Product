export default function AuthShell({ children, activeTab }) {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-2xl overflow-hidden border border-[var(--panel-border)] shadow-2xl">
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-emerald-600/20 via-slate-900 to-sky-900/30 relative">
          <div>
            <div className="flex items-center gap-2 mb-10">
              <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-emerald-950">
                T
              </div>
              <span className="text-xl font-semibold">TaskControl</span>
            </div>
            <h1 className="text-3xl font-bold leading-tight mb-4">
              Organize suas tarefas.
              <br />
              Recupere seu tempo.
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              Cadastre atividades acadêmicas, pessoais e profissionais, acompanhe
              prazos e nunca mais perca uma entrega.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span> Cadastro e login seguros
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span> Tutorial guiado na primeira vez
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span> Lista de atividades pendentes e concluídas
            </li>
          </ul>
        </div>

        <div className="tc-card md:rounded-none border-0 md:border-l p-8 sm:p-10 flex flex-col justify-center">
          <div className="md:hidden flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-emerald-950">
              T
            </div>
            <span className="text-lg font-semibold">TaskControl</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
