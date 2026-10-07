import React, { useState, useEffect, useRef } from 'react';
import { AuditState, AuditSummary } from '../types/audit';
import { TOTAL_ITEMS } from '../data/segments';
import { buildRecordToSave, generateSummaryText, getTodayDate } from '../utils/formatters';

interface ActionToolbarProps {
  state: AuditState;
  summary: AuditSummary;
  canWrite: boolean | null;
  myId?: string;
  hasDownloadsApi: boolean;
  onSave: (record: ReturnType<typeof buildRecordToSave>) => Promise<{ ok: boolean; error?: string }>;
  onReset: () => void;
  onDownload: (filename: string, text: string) => void;
  toast: { msg: string; isErr: boolean } | null;
  setToast: (toast: { msg: string; isErr: boolean } | null) => void;
  saveNote?: string;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  state,
  summary,
  canWrite,
  myId,
  hasDownloadsApi: _hasDownloadsApi,
  onSave,
  onReset,
  onDownload,
  toast,
  setToast,
  saveNote
}) => {
  const [saveArmed, setSaveArmed] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showCopyBox, setShowCopyBox] = useState<boolean>(false);
  const [copyBoxText, setCopyBoxText] = useState<string>('');
  const copyBoxRef = useRef<HTMLTextAreaElement>(null);

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
    setToast({ msg, isErr });
  };

  const handleCopySummary = async () => {
    const txt = generateSummaryText(state, summary);
    try {
      await navigator.clipboard.writeText(txt);
      flash('Resumen copiado');
      setShowCopyBox(false);
    } catch (e) {
      setCopyBoxText(txt);
      setShowCopyBox(true);
      setTimeout(() => {
        if (copyBoxRef.current) {
          copyBoxRef.current.focus();
          copyBoxRef.current.select();
        }
      }, 50);
      flash('Seleccioná y copiá el texto de abajo');
    }
  };

  const handleDownloadSummary = () => {
    const tiendaClean = (state.fields.f_tienda || 'tienda').replace(/[^\w-]+/g, '_');
    const fechaClean = state.fields.f_fecha || getTodayDate();
    const filename = `Auditoria_${tiendaClean}_${fechaClean}.txt`;
    const txt = generateSummaryText(state, summary);
    onDownload(filename, txt);
    flash('Resumen descargado');
  };

  const handleSaveClick = async () => {
    if (canWrite === false) {
      flash('Tu acceso es solo de lectura. Pedile al dueño acceso de edición.', true);
      return;
    }

    if (!state.fields.f_tienda.trim()) {
      flash('Completá el nombre de la tienda antes de guardar.', true);
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
        flash(`Auditoría de ${state.fields.f_tienda} guardada`);
      } else {
        flash(res.error || 'No se pudo guardar.', true);
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
    setShowCopyBox(false);
    flash('Auditoría nueva lista');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveBtnText = isSaving
    ? 'Guardando…'
    : saveArmed
    ? `Guardar igual (faltan ${pendingCount})`
    : 'Guardar auditoría';

  return (
    <>
      <div className="actions">
        <button
          className="btn"
          id="saveBtn"
          type="button"
          disabled={isSaving}
          onClick={handleSaveClick}
        >
          {saveBtnText}
        </button>

        <button
          className="btn ghost"
          id="copyBtn"
          type="button"
          onClick={handleCopySummary}
        >
          Copiar resumen
        </button>

        <button
          className="btn ghost"
          id="dlBtn"
          type="button"
          onClick={handleDownloadSummary}
        >
          Descargar resumen
        </button>

        {!showResetConfirm ? (
          <button
            className="btn ghost"
            id="resetBtn"
            type="button"
            onClick={() => setShowResetConfirm(true)}
          >
            Nueva auditoría
          </button>
        ) : (
          <>
            <button
              className="btn danger"
              id="resetYes"
              type="button"
              onClick={handleConfirmReset}
            >
              Sí, borrar todo
            </button>
            <button
              className="btn ghost"
              id="resetNo"
              type="button"
              onClick={() => setShowResetConfirm(false)}
            >
              Cancelar
            </button>
          </>
        )}
      </div>

      {toast && (
        <p className={`toast ${toast.isErr ? 'err' : ''}`} role="status">
          {toast.msg}
        </p>
      )}

      {saveNote && <p className="note">{saveNote}</p>}

      {showCopyBox && (
        <textarea
          ref={copyBoxRef}
          id="copyBox"
          readOnly
          aria-label="Resumen para copiar"
          value={copyBoxText}
          onChange={e => setCopyBoxText(e.target.value)}
        />
      )}
    </>
  );
};
