"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/Modal";
import ActivityFormModal from "@/components/ActivityFormModal";
import TutorialOverlay from "@/components/TutorialOverlay";

const PRIORITY_LABEL = { baixa: "Baixa", media: "Média", alta: "Alta" };
const FILTERS = [
  { key: "todas", label: "Todas" },
  { key: "pendente", label: "Pendentes" },
  { key: "concluida", label: "Concluídas" },
];

function formatDate(value) {
  if (!value) return null;
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

export default function ActivitiesApp({ user }) {
  const router = useRouter();
  const toast = useToast();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todas");
  const [formModal, setFormModal] = useState(null); // { mode: 'create' | 'edit', activity? }
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showTutorial, setShowTutorial] = useState(user.tutorial_seen === 0);

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    setLoading(true);
    try {
      const data = await api("/activities");
      setActivities(data.activities);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (filter === "todas") return activities;
    return activities.filter((a) => a.status === filter);
  }, [activities, filter]);

  const pendingCount = activities.filter((a) => a.status === "pendente").length;
  const doneCount = activities.filter((a) => a.status === "concluida").length;

  async function handleCreateOrEdit(form) {
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };
      if (formModal.mode === "edit") {
        await api(`/activities/${formModal.activity.id}`, { method: "PATCH", body: payload });
        toast.success("Alterações feitas com sucesso!");
      } else {
        await api("/activities", { method: "POST", body: payload });
        toast.success("Atividade cadastrada com sucesso!");
      }
      setFormModal(null);
      await loadActivities();
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(activity) {
    const nextStatus = activity.status === "concluida" ? "pendente" : "concluida";
    setActivities((prev) =>
      prev.map((a) => (a.id === activity.id ? { ...a, status: nextStatus } : a))
    );
    try {
      await api(`/activities/${activity.id}`, { method: "PATCH", body: { status: nextStatus } });
    } catch (err) {
      toast.error(err.message);
      loadActivities();
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api(`/activities/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Exclusão feita com sucesso!");
      setDeleteTarget(null);
      await loadActivities();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleLogout() {
    await api("/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh max-w-5xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-emerald-950">
            T
          </div>
          <span className="text-lg font-semibold">TaskControl</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTutorial(true)}
            className="tc-btn tc-btn-ghost !px-3 !py-2 text-xs"
            title="Ver tutorial novamente"
          >
            ? Ajuda
          </button>
          <span className="text-sm text-slate-400 hidden sm:inline">{user.email}</span>
          <button onClick={handleLogout} className="tc-btn tc-btn-ghost !px-3 !py-2 text-xs">
            Sair
          </button>
        </div>
      </header>

      {!user.email_verified && (
        <div className="tc-card border-amber-700/50 px-4 py-3 mb-6 text-sm text-amber-200">
          Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada para
          confirmar o cadastro.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lista de Atividades</h1>
          <p className="text-sm text-slate-400">
            {pendingCount} pendente{pendingCount === 1 ? "" : "s"} · {doneCount} concluída
            {doneCount === 1 ? "" : "s"}
          </p>
        </div>
        <button
          className="tc-btn tc-btn-primary"
          onClick={() => setFormModal({ mode: "create" })}
        >
          + Nova atividade
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`tc-btn !px-3 !py-1.5 text-xs ${
              filter === f.key ? "tc-btn-primary" : "tc-btn-ghost"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Carregando atividades...</p>
      ) : filtered.length === 0 ? (
        <div className="tc-card p-10 text-center text-slate-400">
          <p className="mb-1">Nenhuma atividade encontrada.</p>
          <p className="text-xs">Clique em “Nova atividade” para cadastrar a primeira.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((activity) => (
            <li key={activity.id} className="tc-card p-4 flex items-start gap-4">
              <button
                onClick={() => toggleStatus(activity)}
                title={activity.status === "concluida" ? "Marcar como pendente" : "Marcar como concluída"}
                className={`mt-1 h-5 w-5 shrink-0 rounded-md border flex items-center justify-center text-xs transition-colors ${
                  activity.status === "concluida"
                    ? "bg-emerald-500 border-emerald-500 text-emerald-950"
                    : "border-slate-500 text-transparent hover:border-emerald-400"
                }`}
              >
                ✓
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3
                    className={`font-semibold ${
                      activity.status === "concluida" ? "line-through text-slate-500" : ""
                    }`}
                  >
                    {activity.title}
                  </h3>
                  <span className={`tc-badge tc-badge-${activity.priority}`}>
                    {PRIORITY_LABEL[activity.priority]}
                  </span>
                  <span className={`tc-badge tc-badge-${activity.status}`}>
                    {activity.status === "concluida" ? "Concluída" : "Pendente"}
                  </span>
                </div>
                <p className="text-sm text-slate-400 break-words">{activity.description}</p>
                {(activity.start_date || activity.end_date) && (
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDate(activity.start_date) || "?"} — {formatDate(activity.end_date) || "?"}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setFormModal({ mode: "edit", activity })}
                  className="h-8 w-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-300"
                  title="Editar"
                >
                  ✎
                </button>
                <button
                  onClick={() => setDeleteTarget(activity)}
                  className="h-8 w-8 rounded-lg hover:bg-red-950 flex items-center justify-center text-red-400"
                  title="Excluir"
                >
                  🗑
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ActivityFormModal
        open={!!formModal}
        mode={formModal?.mode}
        activity={formModal?.activity}
        onClose={() => setFormModal(null)}
        onSubmit={handleCreateOrEdit}
        saving={saving}
      />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmar exclusão">
        <p className="text-sm text-slate-300 mb-6">
          Tem certeza de que deseja excluir a atividade{" "}
          <strong>{deleteTarget?.title}</strong>? Essa ação não pode ser desfeita.
        </p>
        <div className="flex gap-2">
          <button onClick={() => setDeleteTarget(null)} className="tc-btn tc-btn-ghost flex-1">
            Cancelar
          </button>
          <button onClick={confirmDelete} disabled={deleting} className="tc-btn tc-btn-danger flex-1">
            {deleting ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </Modal>

      {showTutorial && (
        <TutorialOverlay
          onFinish={() => {
            setShowTutorial(false);
            user.tutorial_seen = 1;
          }}
        />
      )}
    </div>
  );
}
