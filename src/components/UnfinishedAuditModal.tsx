import React from 'react';
import { AlertTriangle, Play, Trash2 } from 'lucide-react';

interface UnfinishedAuditModalProps {
  storeName?: string;
  auditorName?: string;
  doneCount: number;
  totalCount: number;
  onContinue: () => void;
  onDiscard: () => void;
}

export const UnfinishedAuditModal: React.FC<UnfinishedAuditModalProps> = ({
  storeName,
  auditorName,
  doneCount,
  totalCount,
  onContinue,
  onDiscard,
}) => {
  return (
    <div className="evaluating-fullscreen-backdrop" role="dialog" aria-modal="true">
      <div className="unfinished-modal-card">
        <div className="unfinished-icon-wrap">
          <AlertTriangle size={36} className="unfinished-icon" />
        </div>

        <h3 className="unfinished-title">Ops! Tenés una auditoría sin finalizar</h3>

        <p className="unfinished-subtitle">
          {storeName ? (
            <>
              Detectamos una auditoría en curso para la sucursal <strong>{storeName}</strong>
              {auditorName ? ` (${auditorName})` : ''} con <strong>{doneCount} de {totalCount}</strong> ítems evaluados.
            </>
          ) : (
            <>
              Tenés una auditoría guardada con <strong>{doneCount} de {totalCount}</strong> ítems evaluados.
            </>
          )}
        </p>

        <div className="unfinished-actions">
          <button
            type="button"
            className="btn-modal-continue"
            onClick={onContinue}
          >
            <Play size={18} />
            <span>Continuar</span>
          </button>

          <button
            type="button"
            className="btn-modal-discard"
            onClick={onDiscard}
          >
            <Trash2 size={18} />
            <span>Descartar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
