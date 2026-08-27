"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { api } from "@/lib/apiClient";

// US03 - Tutoria do Programa (mini-tutorial guiado no primeiro login)
const STEPS = [
  {
    key: "create",
    title: "1. Como criar uma atividade",
    body: (
      <>
        <p className="mb-3">
          Clique em <strong>“Nova atividade”</strong> na tela de Lista de
          Atividades. Você vai preencher:
        </p>
        <ul className="space-y-1.5 text-sm text-slate-300 list-disc list-inside">
          <li><strong>Título</strong> da atividade</li>
          <li><strong>Descrição</strong> com os detalhes</li>
          <li><strong>Prioridade</strong> (baixa, média ou alta)</li>
          <li><strong>Período estimado</strong> (data de início e entrega)</li>
        </ul>
      </>
    ),
  },
  {
    key: "manage",
    title: "2. Como ver, editar e excluir",
    body: (
      <>
        <p className="mb-3">Depois de criada, a atividade aparece na sua lista:</p>
        <ul className="space-y-1.5 text-sm text-slate-300 list-disc list-inside">
          <li>Clique no <strong>título</strong> para ver os detalhes</li>
          <li>Use o ícone de <strong>lápis</strong> para editar</li>
          <li>Use o ícone de <strong>lixeira</strong> para excluir (com confirmação)</li>
          <li>Marque o <strong>checkbox</strong> para concluir a tarefa</li>
        </ul>
      </>
    ),
  },
];

export default function TutorialOverlay({ onFinish }) {
  const [stage, setStage] = useState("invite"); // invite | steps | done
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  async function finish() {
    setSaving(true);
    try {
      await api("/auth/tutorial", { method: "POST" });
    } catch {
      // Even if this fails, don't block the user from using the app.
    } finally {
      setSaving(false);
      onFinish?.();
    }
  }

  if (stage === "invite") {
    return (
      <Modal open title="Seja bem-vindo(a) ao TaskControl!">
        <p className="text-sm text-slate-300 mb-6">
          Olá! Gostaria de um mini-tutorial rápido para aprender a usar as
          principais funcionalidades?
        </p>
        <div className="flex flex-col gap-2">
          <button
            className="tc-btn tc-btn-primary w-full"
            onClick={() => setStage("steps")}
          >
            Sim, aceito o mini-tutorial
          </button>
          <button className="tc-btn tc-btn-ghost w-full" onClick={finish} disabled={saving}>
            Não, obrigado (ir direto para a lista)
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3 text-center">
          Você pode pular a qualquer momento.
        </p>
      </Modal>
    );
  }

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <Modal open title={step.title}>
      <div className="mb-6">{step.body}</div>
      <div className="flex items-center justify-between gap-2">
        <button className="tc-btn tc-btn-ghost" onClick={finish} disabled={saving}>
          Pular tutorial
        </button>
        <button
          className="tc-btn tc-btn-primary"
          disabled={saving}
          onClick={() => (isLast ? finish() : setStepIndex((i) => i + 1))}
        >
          {isLast ? (saving ? "Concluindo..." : "Concluir tutorial") : "Próximo"}
        </button>
      </div>
      <div className="flex justify-center gap-1.5 mt-4">
        {STEPS.map((s, i) => (
          <span
            key={s.key}
            className={`h-1.5 rounded-full transition-all ${
              i === stepIndex ? "w-6 bg-emerald-500" : "w-1.5 bg-slate-700"
            }`}
          />
        ))}
      </div>
    </Modal>
  );
}
