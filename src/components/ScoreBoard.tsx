import React from 'react';
import { AuditSummary } from '../types/audit';
import { f2 } from '../utils/formatters';
import { PASS_SCORE, TOTAL_ITEMS, SEGMENTS } from '../data/segments';
import { 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Check,
  Layers,
  List
} from 'lucide-react';

interface ScoreBoardProps {
  summary: AuditSummary;
  currentSegment: number;
  onSelectSegment: (index: number) => void;
  onNextPending?: () => void;
  onJumpToSummary?: () => void;
  pendingCount: number;
  viewMode: 'focus' | 'all';
  onToggleViewMode: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  summary,
  currentSegment,
  onSelectSegment,
  onNextPending,
  onJumpToSummary,
  pendingCount,
  viewMode,
  onToggleViewMode
}) => {
  const percentScore = Math.min(100, Math.max(0, summary.total));
  const completionPercent = Math.round((summary.done / TOTAL_ITEMS) * 100);

  return (
    <div className="scoreboard-card" id="board">
      {/* Top Header: Score circle, status and quick buttons */}
      <div className="scoreboard-main">
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
                Meta: <b>{PASS_SCORE} pts</b>
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

      {/* Integrated Phases Section (Visualizadas todas sin scroll horizontal) */}
      <div className="phases-integrated-container">
        <div className="phases-section-header">
          <span className="phases-section-title">Fases de Auditoría ({SEGMENTS.length})</span>
          <button
            type="button"
            className="view-toggle-btn"
            onClick={onToggleViewMode}
            title={viewMode === 'focus' ? 'Ver todas las fases juntas' : 'Ver una fase a la vez'}
          >
            {viewMode === 'focus' ? (
              <>
                <Layers size={13} />
                <span>Modo Enfocado</span>
              </>
            ) : (
              <>
                <List size={13} />
                <span>Ver Todas</span>
              </>
            )}
          </button>
        </div>

        <div className="phases-grid-all">
          {SEGMENTS.map((seg, si) => {
            const rowData = summary.rows[si];
            const isComplete = rowData ? rowData.segDone === seg.items.length : false;
            const isActive = viewMode === 'focus' && currentSegment === si;
            const doneItems = rowData ? rowData.segDone : 0;
            const totalItems = seg.items.length;
            const realPts = rowData ? rowData.real : 0;

            return (
              <button
                key={si}
                type="button"
                className={`phase-card-btn ${isActive ? 'active' : ''} ${isComplete ? 'is-complete' : ''}`}
                onClick={() => onSelectSegment(si)}
              >
                <div className="phase-card-header">
                  <span className="phase-number-tag">
                    {isComplete ? <Check size={12} className="phase-check-icon" /> : `${si + 1}`}
                  </span>
                  <span className="phase-name-text">{seg.short}</span>
                </div>

                <div className="phase-card-bottom num">
                  <span className="phase-items-count">{doneItems}/{totalItems}</span>
                  <span className={`phase-pct-tag ${isComplete ? 'done' : doneItems > 0 ? 'prog' : 'empty'}`}>
                    {isComplete ? '100%' : `${f2(realPts)} pts`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
