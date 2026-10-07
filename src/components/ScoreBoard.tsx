import React from 'react';
import { AuditSummary } from '../types/audit';
import { f2 } from '../utils/formatters';
import { PASS_SCORE, SEGMENTS, TOTAL_ITEMS } from '../data/segments';

interface ScoreBoardProps {
  summary: AuditSummary;
  onJumpToSegment: (segmentIndex: number) => void;
  onJumpToSummary: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  summary,
  onJumpToSegment,
  onJumpToSummary
}) => {
  const percentWidth = Math.min(100, Math.max(0, summary.total));

  return (
    <div className="board" id="board">
      <div className="board-row">
        <div className="score num">
          <span>{f2(summary.total)}</span> <small>/ 100</small>
        </div>
        <span className={`pill ${summary.statusClass}`}>{summary.statusLabel}</span>
      </div>

      <div className="bar" aria-hidden="true">
        <span style={{ width: `${percentWidth}%` }}></span>
        <i className="mark" title={`Mínimo aprobatorio: ${PASS_SCORE} pts`}></i>
      </div>

      <div className="board-meta num">
        <span>
          {summary.done} de {TOTAL_ITEMS} ítems
        </span>
        <span>
          {summary.isComplete ? 'Auditoría completa' : `Máximo posible: ${f2(summary.maxPossible)}`}
        </span>
      </div>

      <nav className="jump" id="jump" aria-label="Ir a segmento">
        {SEGMENTS.map((seg, si) => {
          const rowData = summary.rows[si];
          const isDone = rowData ? rowData.segDone === seg.items.length : false;
          return (
            <a
              key={si}
              href={`#seg${si + 1}`}
              className={isDone ? 'done' : ''}
              onClick={e => {
                e.preventDefault();
                onJumpToSegment(si);
              }}
            >
              {si + 1} {seg.short}
            </a>
          );
        })}
        <a
          href="#resumen"
          onClick={e => {
            e.preventDefault();
            onJumpToSummary();
          }}
        >
          Resumen
        </a>
      </nav>
    </div>
  );
};
