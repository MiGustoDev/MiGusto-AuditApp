import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { AuditSummary } from '../types/audit';
import { f2 } from '../utils/formatters';
import { PASS_SCORE, TOTAL_ITEMS, SEGMENTS } from '../data/segments';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Check,
  FileText
} from 'lucide-react';

interface ScoreBoardProps {
  summary: AuditSummary;
  currentSegment: number;
  onSelectSegment: (index: number) => void;
  onJumpToSummary: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  summary,
  currentSegment,
  onSelectSegment,
  onJumpToSummary
}) => {
  const percentScore = Math.min(100, Math.max(0, summary.total));
  const completionPercent = Math.round((summary.done / TOTAL_ITEMS) * 100);
  const isComplete = summary.isComplete;
  const boardRef = useRef<HTMLDivElement>(null);
  const prevScoreRef = useRef(summary.total);

  // 3-color tier shared between circle and progress bar:
  // 1. < 50%: Amber / Warm Yellow (inicio)
  // 2. 50% - 84%: Cyan / Sky Blue (mitad alcanzada)
  // 3. >= 85%: Emerald Green (tramo final / aprobado)
  const getProgressTier = (pct: number) => {
    if (pct >= 85) return 'tier-green';
    if (pct >= 50) return 'tier-cyan';
    return 'tier-amber';
  };

  const currentTier = getProgressTier(completionPercent);

  // Stagger animation on phase buttons on initial mount
  useEffect(() => {
    if (boardRef.current) {
      gsap.fromTo(
        boardRef.current.querySelectorAll('.phase-card-btn'),
        { opacity: 0, y: 8, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.025, ease: 'power2.out' }
      );
    }
  }, []);

  // Subtle pulse on score when score updates
  useEffect(() => {
    if (boardRef.current && prevScoreRef.current !== summary.total) {
      prevScoreRef.current = summary.total;
      gsap.fromTo(
        boardRef.current.querySelector('.score-number'),
        { scale: 1.08 },
        { scale: 1, duration: 0.28, ease: 'power2.out' }
      );
    }
  }, [summary.total]);

  return (
    <div ref={boardRef} className="scoreboard-card" id="board">
      {/* Top Header: Score circle, status and Ver Informe button */}
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
                className={`score-circle-progress ${currentTier}`}
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
                  className={`custom-progress-fill ${currentTier}`}
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="score-actions">
          <button
            type="button"
            className={`btn-report-action ${isComplete ? 'is-enabled' : 'is-disabled'}`}
            disabled={!isComplete}
            onClick={onJumpToSummary}
            title={isComplete ? 'Ver informe completo de resultados' : `Faltan ${TOTAL_ITEMS - summary.done} ítems para ver el informe`}
          >
            <FileText size={16} />
            <span>Ver informe</span>
          </button>
        </div>
      </div>

      {/* Integrated Phases Section (Sin botón Ver Todas, todas las 9 fases visibles) */}
      <div className="phases-integrated-container">
        <div className="phases-section-header">
          <span className="phases-section-title">Fases de Auditoría ({SEGMENTS.length})</span>
        </div>

        <div className="phases-grid-all">
          {SEGMENTS.map((seg, si) => {
            const rowData = summary.rows[si];
            const isSegComplete = rowData ? rowData.segDone === seg.items.length : false;
            const isActive = currentSegment === si;
            const doneItems = rowData ? rowData.segDone : 0;
            const totalItems = seg.items.length;
            const realPts = rowData ? rowData.real : 0;

            return (
              <button
                key={si}
                type="button"
                className={`phase-card-btn ${isActive ? 'active' : ''} ${isSegComplete ? 'is-complete' : ''}`}
                onClick={() => onSelectSegment(si)}
              >
                <div className="phase-card-header">
                  <span className="phase-number-tag">
                    {isSegComplete ? <Check size={12} className="phase-check-icon" /> : `${si + 1}`}
                  </span>
                  <span className="phase-name-text">{seg.short}</span>
                </div>

                <div className="phase-card-bottom num">
                  <span className="phase-items-count">{doneItems}/{totalItems}</span>
                  <span className={`phase-pct-tag ${isSegComplete ? 'done' : doneItems > 0 ? 'prog' : 'empty'}`}>
                    {isSegComplete ? '100%' : `${f2(realPts)} pts`}
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
