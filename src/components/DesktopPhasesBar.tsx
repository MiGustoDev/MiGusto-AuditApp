import React from 'react';
import { Check } from 'lucide-react';
import { getSegments } from '../data/segments';
import { AuditSummary, AuditMode } from '../types/audit';
import { f2 } from '../utils/formatters';

interface DesktopPhasesBarProps {
  auditMode: AuditMode;
  summary: AuditSummary;
  currentSegment: number;
  auditStep: 'setup' | 'evaluate';
  onSelectSegment: (index: number) => void;
  onEditSetup: () => void;
}

export const DesktopPhasesBar: React.FC<DesktopPhasesBarProps> = ({
  auditMode,
  summary,
  currentSegment,
  auditStep,
  onSelectSegment,
  onEditSetup
}) => {
  const segments = getSegments(auditMode);

  return (
    <div className="desktop-phases-standalone desktop-only">
      <div className="phases-section-header">
        <span className="phases-section-title">
          FASES DE AUDITORÍA ({segments.length})
        </span>
      </div>

      <div className={`phases-grid-all phases-grid-${auditMode}`}>
        {/* Nivel 0: Sucursal Card */}
        <button
          type="button"
          className={`phase-card-btn phase-card-level-zero ${auditStep === 'setup' ? 'active level-zero-active' : ''}`}
          onClick={onEditSetup}
          title="Nivel 0: Datos de la Sucursal"
        >
          <div className="phase-card-header">
            <span className="phase-number-tag level-zero-tag">0</span>
            <span className="phase-name-text">Sucursal</span>
          </div>
          <div className="phase-card-bottom num">
            <span className="phase-items-count">Inicio</span>
            <span className={`phase-pct-tag ${auditStep === 'setup' ? 'level-zero-active-text' : 'empty'}`}>
              Nivel 0
            </span>
          </div>
        </button>

        {/* Segment Cards 1 to 9 (or 1 to 12) */}
        {segments.map((seg, si) => {
          const rowData = summary.rows[si];
          const isSegComplete = rowData ? rowData.segDone === seg.items.length : false;
          const isActive = auditStep === 'evaluate' && currentSegment === si;
          const doneItems = rowData ? rowData.segDone : 0;
          const totalItems = seg.items.length;
          const realPts = rowData ? rowData.real : 0;

          return (
            <button
              key={si}
              type="button"
              className={`phase-card-btn ${isActive ? 'active' : ''} ${isSegComplete ? 'is-complete' : ''}`}
              onClick={() => onSelectSegment(si)}
              title={`Fase ${si + 1}: ${seg.name}`}
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
                  {isSegComplete ? '100%' : `${doneItems > 0 ? f2(realPts) : '0'} pts`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
