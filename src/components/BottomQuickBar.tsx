import React from 'react';
import { AuditSummary } from '../types/audit';
import { f2 } from '../utils/formatters';
import { TOTAL_ITEMS } from '../data/segments';
import { Zap, CheckCircle2, Save, BarChart3 } from 'lucide-react';
import { ActiveTab } from './Navbar';

interface BottomQuickBarProps {
  summary: AuditSummary;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onNextPending: () => void;
  onSaveClick: () => void;
  isSaving?: boolean;
}

export const BottomQuickBar: React.FC<BottomQuickBarProps> = ({
  summary,
  activeTab,
  onTabChange,
  onNextPending,
  onSaveClick,
  isSaving
}) => {
  const pendingCount = TOTAL_ITEMS - summary.done;

  return (
    <div className="bottom-quick-bar">
      <div className="quick-bar-inner">
        {/* Score & Status pill */}
        <div 
          className="quick-score-group"
          onClick={() => onTabChange('summary')}
          role="button"
          tabIndex={0}
          title="Ver resumen y desglose"
        >
          <div className="quick-score-val num">
            <span>{f2(summary.total)}</span>
            <small>/100</small>
          </div>
          <span className={`quick-status-chip ${summary.statusClass}`}>
            {summary.statusLabel}
          </span>
        </div>

        {/* Center / Action Button */}
        <div className="quick-action-center">
          {activeTab === 'audit' ? (
            pendingCount > 0 ? (
              <button
                type="button"
                className="btn-quick-primary zap-gradient"
                onClick={onNextPending}
              >
                <Zap size={16} />
                <span>Próximo pendiente ({pendingCount})</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-quick-primary save-gradient"
                onClick={() => onTabChange('summary')}
              >
                <CheckCircle2 size={16} />
                <span>Ver Resultados Finales</span>
              </button>
            )
          ) : (
            <button
              type="button"
              className="btn-quick-primary save-gradient"
              onClick={onSaveClick}
              disabled={isSaving}
            >
              <Save size={16} />
              <span>{isSaving ? 'Guardando...' : 'Guardar Auditoría'}</span>
            </button>
          )}
        </div>

        {/* Tab switch icon shortcut */}
        <div className="quick-tab-shortcut">
          {activeTab === 'audit' ? (
            <button
              type="button"
              className="quick-tab-btn"
              onClick={() => onTabChange('summary')}
              title="Ir a resultados"
            >
              <BarChart3 size={18} />
              <span>Resultados</span>
            </button>
          ) : (
            <button
              type="button"
              className="quick-tab-btn"
              onClick={() => onTabChange('audit')}
              title="Volver a la planilla de auditoría"
            >
              <Zap size={18} />
              <span>Auditar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
