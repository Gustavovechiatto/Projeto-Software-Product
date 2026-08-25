import React from 'react';

const ROWS = [
  { label: 'Definir prioridades da sprint', done: true },
  { label: 'Revisar tarefas atrasadas', done: true },
  { label: 'Organizar backlog do time', done: false },
  { label: 'Compartilhar relatorio semanal', done: false },
];

export function AuthVisual({ headline }) {
  return (
    <aside className="auth-visual" aria-hidden="true">
      <div>
        <div className="auth-visual__wordmark">TaskControl</div>
        <p className="auth-visual__headline">{headline}</p>
      </div>
      <div className="checklist">
        {ROWS.map((row) => (
          <div key={row.label} className={`checklist__row ${row.done ? 'checklist__row--done' : ''}`}>
            <span className="checklist__box" />
            <span>{row.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
