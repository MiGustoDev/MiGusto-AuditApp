import { useState, useRef } from 'react';
import { useAuditState } from './hooks/useAuditState';
import { useSharedStorage } from './hooks/useSharedStorage';
import { useWakeLock } from './hooks/useWakeLock';
import { ScoreBoard } from './components/ScoreBoard';
import { GeneralFields } from './components/GeneralFields';
import { SegmentCard } from './components/SegmentCard';
import { SummaryTable } from './components/SummaryTable';
import { VerdictCard } from './components/VerdictCard';
import { DeviationsList } from './components/DeviationsList';
import { ActionToolbar } from './components/ActionToolbar';
import { HistorySection } from './components/HistorySection';
import { PhotoLightbox } from './components/PhotoLightbox';

export function App() {
  const {
    state,
    summary,
    setField,
    setChoice,
    setPartialScore,
    adjustPartialScore,
    setObservation,
    markSegmentPendingAsOk,
    addPhoto,
    removePhoto,
    resetAudit
  } = useAuditState();

  const {
    records,
    loading: historyLoading,
    isClaudeEnv,
    canWrite,
    isAdmin,
    myId,
    hasDownloadsApi,
    saveAudit,
    deleteAudit,
    downloadFile,
    uploadAsset
  } = useSharedStorage();

  const [openSegments, setOpenSegments] = useState<Record<number, boolean>>({
    0: true // First segment open by default
  });

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; isErr: boolean } | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Activate wake lock when items are being evaluated
  useWakeLock(summary.done > 0);

  const flashMessage = (msg: string, isErr = false) => {
    setToast({ msg, isErr });
    clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, isErr ? 6000 : 3000);
  };

  const handleToggleSegment = (si: number) => {
    setOpenSegments(prev => ({
      ...prev,
      [si]: !prev[si]
    }));
  };

  const handleJumpToSegment = (si: number) => {
    setOpenSegments(prev => ({
      ...prev,
      [si]: true
    }));
    setTimeout(() => {
      const el = document.getElementById(`seg${si + 1}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleJumpToSummary = () => {
    const el = document.getElementById('resumen');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCopyText = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      flashMessage('Resumen copiado');
    } catch (e) {
      flashMessage('No se pudo copiar automáticamente', true);
    }
  };

  return (
    <div className="wrap">
      <ScoreBoard
        summary={summary}
        onJumpToSegment={handleJumpToSegment}
        onJumpToSummary={handleJumpToSummary}
      />

      {isClaudeEnv && canWrite === false && (
        <div className="access" id="accessBanner" role="status">
          <strong>Estás con acceso de solo lectura</strong>
          <span>
            Podés completar la planilla y copiar el resumen, pero no guardar ni subir fotos. Revisá
            que estés con la cuenta de Claude correcta, o pedile al dueño que te invite como Editor.
          </span>
        </div>
      )}

      <h1>Auditoría operativa Mi Gusto</h1>
      <p className="lead">
        9 segmentos · 100 puntos · aprueba con 85 o más. Tocá Cumple, Parcial o No en cada ítem y el
        puntaje se suma solo.
      </p>

      <GeneralFields fields={state.fields} onFieldChange={setField} />

      <div id="segments">
        {summary.rows.map(segCalc => (
          <SegmentCard
            key={segCalc.si}
            segmentData={segCalc}
            answers={state.answers}
            photos={state.photos}
            isOpen={!!openSegments[segCalc.si]}
            onToggle={() => handleToggleSegment(segCalc.si)}
            onChoice={setChoice}
            onPartialScore={setPartialScore}
            onAdjustPartialScore={adjustPartialScore}
            onObservation={setObservation}
            onMarkPendingAsOk={markSegmentPendingAsOk}
            onAddPhoto={addPhoto}
            onRemovePhoto={removePhoto}
            onViewPhoto={setLightboxSrc}
            onFlashMessage={flashMessage}
            uploadAsset={uploadAsset}
          />
        ))}
      </div>

      <SummaryTable summary={summary} />

      <VerdictCard summary={summary} />

      <DeviationsList deviations={summary.devs} />

      <ActionToolbar
        state={state}
        summary={summary}
        canWrite={canWrite}
        myId={myId}
        hasDownloadsApi={hasDownloadsApi}
        onSave={saveAudit}
        onReset={resetAudit}
        onDownload={downloadFile}
        toast={toast}
        setToast={setToast}
        saveNote={
          isClaudeEnv && canWrite === false
            ? 'Tenés acceso de solo lectura: ves el historial pero no podés guardar. Pedile al dueño acceso de edición, o copiá el resumen y mandáselo.'
            : undefined
        }
      />

      <HistorySection
        records={records}
        loading={historyLoading}
        isAdmin={isAdmin}
        onDeleteRecord={deleteAudit}
        onCopyText={handleCopyText}
        onViewPhoto={setLightboxSrc}
      />

      <PhotoLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}

export default App;
