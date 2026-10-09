import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useAuditState } from './hooks/useAuditState';
import { useSharedStorage } from './hooks/useSharedStorage';
import { useWakeLock } from './hooks/useWakeLock';
import { Navbar, ActiveTab } from './components/Navbar';
import { ScoreBoard } from './components/ScoreBoard';
import { GeneralFields } from './components/GeneralFields';
import { SegmentCard } from './components/SegmentCard';
import { VerdictCard } from './components/VerdictCard';
import { DeviationsList } from './components/DeviationsList';
import { ActionToolbar } from './components/ActionToolbar';
import { HistorySection } from './components/HistorySection';
import { PhotoLightbox } from './components/PhotoLightbox';
import { AuditCharts } from './components/AuditCharts';
import { UnfinishedAuditModal } from './components/UnfinishedAuditModal';
import { SEGMENTS, TOTAL_ITEMS } from './data/segments';
import { buildRecordToSave } from './utils/formatters';

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
  const [auditStep, setAuditStep] = useState<'setup' | 'evaluate'>(() => {
    return Boolean(state.fields.f_tienda && state.fields.f_auditor) ? 'evaluate' : 'setup';
  });
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [showUnfinishedModal, setShowUnfinishedModal] = useState<boolean>(() => {
    // Show modal if an audit was in progress (has items done or store name set) when re-entering app
    const hasProgress = summary.done > 0 || Boolean(state.fields.f_tienda.trim());
    return hasProgress;
  });

  const tabContentRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  const isAuditStarted = summary.done > 0;
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);

  const handleStartAudit = () => {
    if (!state.fields.f_tienda.trim() || !state.fields.f_auditor.trim()) {
      flashMessage('Por favor completá los campos obligatorios: Tienda y Auditor/a', true);
      return;
    }
    setAuditStep('evaluate');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditSetup = () => {
    setAuditStep('setup');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveAuditRecord = async (recordToSave: ReturnType<typeof buildRecordToSave>) => {
    if (currentAuditId) {
      recordToSave._id = currentAuditId;
    }
    const res = await saveAudit(recordToSave);
    if (res.ok && res.id) {
      setCurrentAuditId(res.id);
    }
    return res;
  };

  // Trigger 3-second evaluation spinner transition, auto-save to history, and prepare clean slate
  const handleJumpToSummaryWithLoading = async () => {
    setIsEvaluating(true);
    
    // Build and save record automatically to history
    try {
      const record = buildRecordToSave(state, summary, myId);
      if (currentAuditId) {
        record._id = currentAuditId;
      }
      const res = await saveAudit(record);
      if (res.ok && res.id) {
        setCurrentAuditId(res.id);
      }
    } catch (err) {
      console.error('Error auto-saving evaluation:', err);
    }

    setTimeout(() => {
      setIsEvaluating(false);
      setActiveTab('summary');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 3000);
  };

  // Animate tab switch smoothly with GSAP
  useEffect(() => {
    if (tabContentRef.current) {
      gsap.fromTo(
        tabContentRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' }
      );
    }
  }, [activeTab]);

  // Always force Dark Mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; isErr: boolean } | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Animate toast notification with GSAP
  useEffect(() => {
    if (toast && toastRef.current) {
      gsap.fromTo(
        toastRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'back.out(1.5)' }
      );
    }
  }, [toast]);

  // Activate wake lock when items are being evaluated
  useWakeLock(summary.done > 0);

  // Toast notification state & auto-dismiss timeout
  const flashMessage = (msg: string, isErr = false) => {
    setToast({ msg, isErr });
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, isErr ? 4000 : 2500);
  };

  const handleFullReset = () => {
    setCurrentAuditId(null);
    resetAudit();
    setAuditStep('setup');
    setCurrentSegment(0);
    setActiveTab('audit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      {/* Top Navbar with Centered Links & Sticky Mobile Phases Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        deviationsCount={summary.devs.length}
        historyCount={records.length}
        storeName={state.fields.f_tienda}
        currentSegment={currentSegment}
        onSelectSegment={handleSelectSegment}
        summary={summary}
        onEditSetup={handleEditSetup}
        onLogoClick={handleFullReset}
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
          <div ref={tabContentRef} className="audit-tab-content">
            {/* STEP 1: PRE-AUDIT SETUP FORM */}
            {auditStep === 'setup' ? (
              <GeneralFields
                fields={state.fields}
                onFieldChange={setField}
                onStartAudit={handleStartAudit}
                isStarted={isAuditStarted}
              />
            ) : (
              /* STEP 2: EVALUATION MODE (NO GENERAL FIELDS PANEL VISIBLE) */
              <>
                <ScoreBoard
                  summary={summary}
                  currentSegment={currentSegment}
                  onSelectSegment={handleSelectSegment}
                  onJumpToSummary={handleJumpToSummaryWithLoading}
                />

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
                    onJumpToSummary={handleJumpToSummaryWithLoading}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: SUMMARY & DEVIATIONS VIEW                             */}
        {/* ============================================================ */}
        {activeTab === 'summary' && (
          <div ref={tabContentRef} className="summary-tab-content">
            <VerdictCard summary={summary} onFinishAudit={handleFullReset} />

            {/* CHARTS & ANALYTICS SECTION */}
            <AuditCharts
              summary={summary}
              storeName={state.fields.f_tienda}
              auditorName={state.fields.f_auditor}
            />



            <DeviationsList
              deviations={summary.devs}
              photos={state.photos}
              onViewPhoto={setLightboxSrc}
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
              onSave={handleSaveAuditRecord}
              onReset={handleFullReset}
              onDownload={downloadFile}
              toast={toast}
              setToast={setToast}
              flashMessage={flashMessage}
              onGoToHistory={() => {
                setActiveTab('history');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
          <div ref={tabContentRef} className="history-tab-content">
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
        <div ref={toastRef} className={`toast-notification ${toast.isErr ? 'is-error' : 'is-success'}`} role="status">
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Photo Zoom Lightbox Modal */}
      <PhotoLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      {/* 3-Second Fullscreen Evaluation Loading Screen */}
      {isEvaluating && (
        <div className="evaluating-fullscreen-backdrop" role="dialog" aria-modal="true">
          <div className="evaluating-card">
            <div className="evaluating-spinner-wrap">
              <div className="evaluating-ring" />
              <img src="logo.png" alt="Mi Gusto" className="evaluating-logo-center" />
            </div>
            <h3 className="evaluating-title">Evaluando sucursal...</h3>
            <p className="evaluating-subtitle">
              Analizando cumplimiento de {summary.done} ítems y procesando indicadores de calidad.
            </p>
          </div>
        </div>
      )}

      {/* Unfinished Audit Recovery Modal Prompt */}
      {showUnfinishedModal && (
        <UnfinishedAuditModal
          storeName={state.fields.f_tienda}
          auditorName={state.fields.f_auditor}
          doneCount={summary.done}
          totalCount={TOTAL_ITEMS}
          onContinue={() => {
            setShowUnfinishedModal(false);
            if (state.fields.f_tienda && state.fields.f_auditor) {
              setAuditStep('evaluate');
            } else {
              setAuditStep('setup');
            }
          }}
          onDiscard={() => {
            setShowUnfinishedModal(false);
            handleFullReset();
          }}
        />
      )}

    </div>
  );
}

export default App;
