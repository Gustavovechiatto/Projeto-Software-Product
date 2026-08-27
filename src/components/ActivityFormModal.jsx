"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";

const EMPTY = { title: "", description: "", priority: "media", startDate: "", endDate: "" };

// US04 (criar) + US07 (editar)
export default function ActivityFormModal({ open, mode, activity, onClose, onSubmit, saving }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && mode === "edit" && activity) {
      setForm({
        title: activity.title || "",
        description: activity.description || "",
        priority: activity.priority || "media",
        startDate: activity.start_date || "",
        endDate: activity.end_date || "",
      });
    } else if (open) {
      setForm(EMPTY);
    }
    setError("");
  }, [open, mode, activity]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError("Informe o título da atividade.");
    if (!form.description.trim()) return setError("Informe a descrição da atividade.");
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Editar atividade" : "Cadastrar nova atividade"}
      width="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="tc-label" htmlFor="title">Título da atividade</label>
          <input
            id="title"
            className="tc-input"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ex: Preparar relatório de vendas"
          />
        </div>

        <div>
          <label className="tc-label" htmlFor="description">Descrição</label>
          <textarea
            id="description"
            className="tc-input min-h-24 resize-y"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Detalhes sobre a atividade"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="tc-label" htmlFor="priority">Prioridade</label>
            <select
              id="priority"
              className="tc-input"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="tc-label" htmlFor="startDate">Início</label>
            <input
              id="startDate"
              type="date"
              className="tc-input"
              value={form.startDate || ""}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="tc-label" htmlFor="endDate">Entrega</label>
            <input
              id="endDate"
              type="date"
              className="tc-input"
              value={form.endDate || ""}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="tc-btn tc-btn-ghost flex-1">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="tc-btn tc-btn-primary flex-1">
            {saving ? "Salvando..." : mode === "edit" ? "Salvar alterações" : "Cadastrar nova atividade"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
