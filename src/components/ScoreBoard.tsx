import React from 'react';
import { AuditSummary } from '../types/audit';
import { f2 } from '../utils/formatters';
import { TOTAL_ITEMS } from '../data/segments';
import { Zap, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ScoreBoardProps {
  summary: AuditSummary;
  onNextPending?: () => void;
  onJumpToSummary?: () => void;
  pendingCount: number;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  summary,
  onNextPending,
  onJumpToSummary,
  pendingCount
}) => {
  const percentScore = Math.min(100, Math.max(0, summary.total));
  const completionPercent = Math.round((summary.done / TOTAL_ITEMS) * 100);

  return (
    <div className="scoreboard-card" id="board">
      <div className="scoreboard-main">
        {/* Score Value & Status */}
        <div className="score-primary">
          <div className="score-circle-wrapper">
            <svg className="score-svg" viewBox="0 0 100 100">
              <circle
                className="score-circle-bg"
                cx="50"
                cy="50"
                r="42"
              />
              <circle
                className={`score-circle-progress ${summary.statusClass}`}
                cx="50"
                cy="50"
                r="42"
                style={{
                  strokeDasharray: 264,
                  strokeDashoffset: 264 - (264 * percentScore) / 100
                }}
              />
            </svg>
            <div className="score-circle-content">
              <span className="score-number num">{f2(summary.total)}</span>
              <span className="score-denom">/100</span>
            </div>
          </div>

          <div className="score-info">
            <div className="status-row">
              <span className={`status-badge ${summary.statusClass}`}>
                {summary.statusClass === 'ok' && <CheckCircle2 size={14} />}
                {summary.statusClass === 'warn' && <AlertTriangle size={14} />}
                {summary.statusClass === 'bad' && <XCircle size={14} />}
                <span>{summary.statusLabel}</span>
              </span>
              <span className="threshold-indicator" title="Mínimo para aprobar: 85 pts">
                Meta: <b>85 pts</b>
              </span>
            </div>

            <div className="progress-info">
              <div className="progress-text-row">
                <span className="progress-label">Progreso de evaluación</span>
                <span className="progress-count num">
                  {summary.done} / {TOTAL_ITEMS} ítems ({completionPercent}%)
                </span>
              </div>
              <div className="custom-progress-bar">
                <div
                  className={`custom-progress-fill ${completionPercent === 100 ? 'done' : ''}`}
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick action buttons on ScoreBoard */}
        <div className="score-actions">
          {pendingCount > 0 ? (
            <button
              type="button"
              className="quick-jump-btn pending-btn"
              onClick={onNextPending}
              title="Saltar automáticamente al próximo ítem sin responder"
            >
              <Zap size={15} className="zap-icon" />
              <span>Siguiente pendiente ({pendingCount})</span>
            </button>
          ) : (
            <button
              type="button"
              className="quick-jump-btn done-btn"
              onClick={onJumpToSummary}
            >
              <CheckCircle2 size={15} />
              <span>Auditoría completa · Ver informe</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
