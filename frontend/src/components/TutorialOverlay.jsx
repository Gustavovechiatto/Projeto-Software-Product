import React, { useState } from 'react';
import { Button } from './Button.jsx';

const STEPS = [
  {
    title: 'Suas tarefas, em um so lugar',
    body: 'A lista central mostra tudo que esta pendente, concluido ou vencendo hoje.',
  },
  {
    title: 'Marque o que ja foi feito',
    body: 'Clique no circulo ao lado de uma tarefa para marca-la como concluida.',
  },
  {
    title: 'Acompanhe pelo resumo',
    body: 'Os cartoes no topo mostram rapidamente pendencias, entregas e prazos do dia.',
  },
];

export function TutorialOverlay({ onClose }) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-label="Mini tutorial">
      <div className="tutorial-card">
        <span className="tutorial-card__step">
          Passo {step + 1} de {STEPS.length}
        </span>
        <h2 className="tutorial-card__title">{current.title}</h2>
        <p className="tutorial-card__body">{current.body}</p>

        <div className="tutorial-card__dots">
          {STEPS.map((s, i) => (
            <span key={s.title} className={`tutorial-card__dot ${i === step ? 'is-active' : ''}`} />
          ))}
        </div>

        <div className="tutorial-card__actions">
          <Button variant="ghost" onClick={onClose}>
            Pular
          </Button>
          <Button variant="primary" onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}>
            {isLast ? 'Concluir' : 'Proximo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
