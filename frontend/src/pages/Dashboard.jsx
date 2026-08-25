import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { TutorialOverlay } from '../components/TutorialOverlay.jsx';

const SAMPLE_TASKS = [
  { id: 't1', title: 'Revisar proposta do cliente Aurora', due: 'Hoje, 17:00', done: false, priority: 'alta' },
  { id: 't2', title: 'Atualizar quadro do sprint', due: 'Hoje, 12:00', done: true, priority: 'media' },
  { id: 't3', title: 'Responder feedback do design', due: 'Amanha', done: false, priority: 'media' },
  { id: 't4', title: 'Preparar pauta da reuniao semanal', due: 'Amanha', done: false, priority: 'baixa' },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function firstName(fullName) {
  if (!fullName) return '';
  return fullName.trim().split(' ')[0];
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState(SAMPLE_TASKS);

  const showTutorial = searchParams.get('tutorial') === '1';
  const greeting = useMemo(getGreeting, []);

  const pendingCount = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.filter((t) => t.done).length;
  const overdueCount = tasks.filter((t) => !t.done && t.due === 'Hoje, 17:00').length;

  async function handleLogout() {
    await logout();
    toast.info('Voce saiu da sua conta.');
    navigate('/login');
  }

  function toggleTask(id) {
    setTasks((current) => current.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function closeTutorial() {
    searchParams.delete('tutorial');
    setSearchParams(searchParams, { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">TaskControl</div>
        <div className="topbar__user">
          <span className="topbar__avatar" aria-hidden="true">
            {(user?.name || '?').charAt(0).toUpperCase()}
          </span>
          <span className="topbar__name">{user?.name}</span>
          <button className="topbar__logout" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="dashboard__intro">
          <h1 className="dashboard__greeting">
            {greeting}, {firstName(user?.name)}.
          </h1>
          <p className="dashboard__subtitle">Aqui esta um resumo das suas tarefas.</p>
        </section>

        <section className="stat-grid" aria-label="Resumo de tarefas">
          <div className="stat-card">
            <span className="stat-card__value">{pendingCount}</span>
            <span className="stat-card__label">Pendentes</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{doneCount}</span>
            <span className="stat-card__label">Concluidas hoje</span>
          </div>
          <div className="stat-card stat-card--warn">
            <span className="stat-card__value">{overdueCount}</span>
            <span className="stat-card__label">Vencendo hoje</span>
          </div>
        </section>

        <section className="task-panel">
          <div className="task-panel__header">
            <h2>Suas tarefas</h2>
          </div>
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className={`task-row ${task.done ? 'task-row--done' : ''}`}>
                <button
                  type="button"
                  className="task-row__check"
                  onClick={() => toggleTask(task.id)}
                  aria-pressed={task.done}
                  aria-label={task.done ? 'Marcar como pendente' : 'Marcar como concluida'}
                />
                <div className="task-row__body">
                  <span className="task-row__title">{task.title}</span>
                  <span className="task-row__due">{task.due}</span>
                </div>
                <span className={`task-row__priority task-row__priority--${task.priority}`}>
                  {task.priority}
                </span>
              </li>
            ))}
          </ul>
          <p className="task-panel__note">
            Lista de exemplo — a criacao e gestao real de tarefas ainda nao foi implementada nesta
            entrega, que teve foco em Login e Cadastro.
          </p>
        </section>
      </main>

      {showTutorial ? <TutorialOverlay onClose={closeTutorial} /> : null}
    </div>
  );
}
