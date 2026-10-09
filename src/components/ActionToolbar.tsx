import React, { useState, useEffect } from 'react';
import { AuditState, AuditSummary } from '../types/audit';
import { TOTAL_ITEMS } from '../data/segments';
import { buildRecordToSave } from '../utils/formatters';
import { Save, RotateCcw, AlertTriangle } from 'lucide-react';

interface ActionToolbarProps {
  state: AuditState;
  summary: AuditSummary;
  canWrite: boolean | null;
  myId?: string;
  hasDownloadsApi?: boolean;
  onSave: (record: ReturnType<typeof buildRecordToSave>) => Promise<{ ok: boolean; error?: string }>;
  onReset: () => void;
  onDownload?: (filename: string, text: string) => void;
  toast?: { msg: string; isErr: boolean } | null;
  setToast: (toast: { msg: string; isErr: boolean } | null) => void;
  flashMessage?: (msg: string, isErr?: boolean) => void;
  saveNote?: string;
  onJumpToSummary?: () => void;
  activeTab?: string;
  onGoToHistory?: () => void;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  state,
  summary,
  canWrite,
  myId,
  onSave,
  onReset,
  setToast,
  flashMessage,
  saveNote
}) => {
  const [saveArmed, setSaveArmed] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const pendingCount = TOTAL_ITEMS - summary.done;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (saveArmed && !target.closest('#saveBtn')) {
        setSaveArmed(false);
      }
    };
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [saveArmed]);

  const flash = (msg: string, isErr = false) => {
    if (flashMessage) {
      flashMessage(msg, isErr);
    } else {
      setToast({ msg, isErr });
    }
  };

  const handleSaveClick = async () => {
    if (canWrite === false) {
      flash('Tu acceso es solo de lectura. Pedile al dueño acceso de edición.', true);
      return;
    }

    if (!state.fields.f_tienda.trim()) {
      flash('Por favor ingresá el nombre de la sucursal antes de guardar.', true);
      const input = document.getElementById('f_tienda');
      input?.focus();
      return;
    }

    if (pendingCount > 0 && !saveArmed) {
      setSaveArmed(true);
      return;
    }

    setSaveArmed(false);
    setIsSaving(true);

    try {
      const record = buildRecordToSave(state, summary, myId);
      const res = await onSave(record);
      if (res.ok) {
        flash(`¡Auditoría de ${state.fields.f_tienda} guardada con éxito!`);
        setTimeout(() => {
          onReset();
        }, 500);
      } else {
        flash(res.error || 'No se pudo guardar la auditoría.', true);
      }
    } catch (e) {
      flash('No se pudo guardar. Revisá la conexión y probá de nuevo.', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReset = () => {
    onReset();
    setShowResetConfirm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="action-toolbar-container">
      {/* Main Action Bar */}
      <div className="action-buttons-grid">
        <button
          className={`btn-action primary-save ${saveArmed ? 'is-armed' : ''}`}
          id="saveBtn"
          type="button"
          disabled={isSaving}
          onClick={handleSaveClick}
        >
          {saveArmed ? (
            <>
              <AlertTriangle size={18} />
              <span>Guardar igual (faltan {pendingCount})</span>
            </>
          ) : isSaving ? (
            <>
              <span className="spinner-sm"></span>
              <span>Guardando auditoría...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>Guardar auditoría</span>
            </>
          )}
        </button>

        {!showResetConfirm ? (
          <button
            className="btn-action danger-subtle"
            id="resetBtn"
            type="button"
            onClick={() => setShowResetConfirm(true)}
            title="Reiniciar planilla y comenzar nueva sucursal"
          >
            <RotateCcw size={17} />
            <span>Nueva auditoría</span>
          </button>
        ) : (
          <div className="reset-confirm-box">
            <span className="confirm-prompt">¿Borrar datos y empezar de cero?</span>
            <div className="confirm-btns-row">
              <button
                className="btn btn-sm btn-danger"
                id="resetYes"
                type="button"
                onClick={handleConfirmReset}
              >
                Sí, reiniciar
              </button>
              <button
                className="btn btn-sm btn-outline"
                id="resetNo"
                type="button"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Access and System Notes */}
      {saveNote && (
        <div className="system-note-box">
          <AlertTriangle size={16} />
          <span>{saveNote}</span>
        </div>
      )}
    </div>
  );
};
