import { useState, useRef, useEffect } from 'react';
import { useAuditState } from './hooks/useAuditState';
import { useSharedStorage } from './hooks/useSharedStorage';
import { useWakeLock } from './hooks/useWakeLock';
import { Navbar, ActiveTab } from './components/Navbar';
import { ScoreBoard } from './components/ScoreBoard';
import { GeneralFields } from './components/GeneralFields';
import { SegmentCard } from './components/SegmentCard';
import { SummaryTable } from './components/SummaryTable';
import { VerdictCard } from './components/VerdictCard';
import { DeviationsList } from './components/DeviationsList';
import { ActionToolbar } from './components/ActionToolbar';
import { HistorySection } from './components/HistorySection';
import { PhotoLightbox } from './components/PhotoLightbox';
import { SEGMENTS } from './data/segments';

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

  // Navigation state
  const [activeTab, setActiveTab] = useState<ActiveTab>('audit');
  const [currentSegment, setCurrentSegment] = useState<number>(0);

  // Always force Dark Mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

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
    }, isErr ? 6000 : 3200);
  };

  const handleSelectSegment = (si: number) => {
    setCurrentSegment(si);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyText = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      flashMessage('Resumen copiado para WhatsApp');
    } catch (e) {
      flashMessage('No se pudo copiar automáticamente', true);
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar with Centered Links */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        deviationsCount={summary.devs.length}
        historyCount={records.length}
        storeName={state.fields.f_tienda}
      />

      <main className="wrap">
        {/* Read-only notification if applicable */}
        {isClaudeEnv && canWrite === false && (
          <div className="access-banner" id="accessBanner" role="status">
            <strong>Acceso de solo lectura</strong>
            <span>
              Podés completar la planilla y copiar el resumen, pero no guardar ni subir fotos a la nube.
            </span>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 1: AUDIT VIEW                                            */}
        {/* ============================================================ */}
        {activeTab === 'audit' && (
          <div className="audit-tab-content animate-fade-in">
            {/* 1. PRIMERO: Círculo de progreso + Fases integradas sin scroll */}
            <ScoreBoard
              summary={summary}
              currentSegment={currentSegment}
              onSelectSegment={handleSelectSegment}
              onJumpToSummary={() => setActiveTab('summary')}
            />

            {/* 2. SEGUNDO: Datos del local en una sola línea con título */}
            <GeneralFields fields={state.fields} onFieldChange={setField} />

            {/* 3. TERCERO: Contenido de la fase activa */}
            <div id="segments" className="segments-viewport">
              <SegmentCard
                key={currentSegment}
                segmentData={summary.rows[currentSegment]}
                answers={state.answers}
                photos={state.photos}
                isOpen={true}
                isFocused={true}
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
                onNextSegment={() => {
                  if (currentSegment < SEGMENTS.length - 1) {
                    handleSelectSegment(currentSegment + 1);
                  }
                }}
                onPrevSegment={() => {
                  if (currentSegment > 0) {
                    handleSelectSegment(currentSegment - 1);
                  }
                }}
                onJumpToSummary={() => setActiveTab('summary')}
              />
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: SUMMARY & DEVIATIONS VIEW                             */}
        {/* ============================================================ */}
        {activeTab === 'summary' && (
          <div className="summary-tab-content animate-fade-in">
            <VerdictCard summary={summary} />

            <SummaryTable
              summary={summary}
              onSelectSegment={si => {
                setCurrentSegment(si);
                setActiveTab('audit');
              }}
            />

            <DeviationsList
              deviations={summary.devs}
              onSelectDeviation={itemNum => {
                const [sStr] = itemNum.split('.');
                const si = parseInt(sStr, 10) - 1;
                if (!isNaN(si) && si >= 0 && si < SEGMENTS.length) {
                  setCurrentSegment(si);
                  setActiveTab('audit');
                }
              }}
            />

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
                  ? 'Tenés acceso de solo lectura: podés copiar el informe pero no guardar cambios en el servidor.'
                  : undefined
              }
              activeTab={activeTab}
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: HISTORY VIEW                                          */}
        {/* ============================================================ */}
        {activeTab === 'history' && (
          <div className="history-tab-content animate-fade-in">
            <HistorySection
              records={records}
              loading={historyLoading}
              isAdmin={isAdmin}
              onDeleteRecord={deleteAudit}
              onCopyText={handleCopyText}
              onViewPhoto={setLightboxSrc}
            />
          </div>
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="app-footer">
        <p>© Desarrollado por el Departamento de Sistemas de Mi Gusto | Todos los derechos reservados.</p>
      </footer>

      {/* Toast Notification Alert */}
      {toast && (
        <div className={`toast-notification ${toast.isErr ? 'is-error' : 'is-success'}`} role="status">
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Photo Zoom Lightbox Modal */}
      <PhotoLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}

export default App;
