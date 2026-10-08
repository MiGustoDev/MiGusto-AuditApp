import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { AuditSummary } from '../types/audit';
import { f2 } from '../utils/formatters';
import { PASS_SCORE } from '../data/segments';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface VerdictCardProps {
  summary: AuditSummary;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({ summary }) => {
  const isApproved = summary.total >= PASS_SCORE;
  const ptsDiff = summary.total - PASS_SCORE;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.96, y: 8 },
        { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <div ref={cardRef} className={`verdict-banner ${summary.statusClass}`}>
      <div className="verdict-icon-container">
        {summary.statusClass === 'ok' && <CheckCircle2 size={36} />}
        {summary.statusClass === 'warn' && <AlertTriangle size={36} />}
        {summary.statusClass === 'bad' && <XCircle size={36} />}
      </div>

      <div className="verdict-details">
        <div className="verdict-title-row">
          <h3 className="verdict-heading">{summary.statusLabel}</h3>
          <span className="verdict-score-highlight num">{f2(summary.total)} / 100 pts</span>
        </div>
        <p className="verdict-explanation">
          {isApproved ? (
            <>
              El local <b>supera el estándar mínimo requerido</b> de {PASS_SCORE} puntos (+{f2(ptsDiff)} pts por encima de la meta).
            </>
          ) : (
            <>
              El local <b>no alcanza el umbral de aprobación</b> de {PASS_SCORE} puntos ({f2(Math.abs(ptsDiff))} pts por debajo de la meta). Se requiere plan de acción sobre los desvíos detectados.
            </>
          )}
        </p>
      </div>
    </div>
  );
};
