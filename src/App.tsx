import { useState, useRef, useEffect } from 'react';
import { useAuditState } from './hooks/useAuditState';
import { useSharedStorage } from './hooks/useSharedStorage';
import { useWakeLock } from './hooks/useWakeLock';
import { Navbar, ActiveTab } from './components/Navbar';
import { ScoreBoard } from './components/ScoreBoard';
import { SegmentNav } from './components/SegmentNav';
import { GeneralFields } from './components/GeneralFields';
import { SegmentCard } from './components/SegmentCard';
import { SummaryTable } from './components/SummaryTable';
import { VerdictCard } from './components/VerdictCard';
import { DeviationsList } from './components/DeviationsList';
import { ActionToolbar } from './components/ActionToolbar';
import { HistorySection } from './components/HistorySection';
import { PhotoLightbox } from './components/PhotoLightbox';
import { BottomQuickBar } from './components/BottomQuickBar';
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
  const [viewMode, setViewMode] = useState<'focus' | 'all'>('focus');
  const [openSegments, setOpenSegments] = useState<Record<number, boolean>>({
    0: true
  });

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('migusto-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('migusto-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

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

  const handleToggleSegment = (si: number) => {
    setOpenSegments(prev => ({
      ...prev,
      [si]: !prev[si]
    }));
  };

  const handleSelectSegment = (si: number) => {
    setCurrentSegment(si);
    if (viewMode === 'all') {
      setOpenSegments(prev => ({
        ...prev,
        [si]: true
      }));
      setTimeout(() => {
        const el = document.getElementById(`seg${si + 1}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Find next unanswered item across segments to eliminate manual hunting and scrolling
  const handleJumpToNextPending = () => {
    let targetSi = -1;
    let targetIi = -1;

    // Start looking from current segment forward
    for (let offset = 0; offset < SEGMENTS.length; offset++) {
      const si = (currentSegment + offset) % SEGMENTS.length;
      const seg = SEGMENTS[si];
      for (let ii = 0; ii < seg.items.length; ii++) {
        const key = `${si}-${ii}`;
        if (!state.answers[key]) {
          targetSi = si;
          targetIi = ii;
          break;
        }
      }
      if (targetSi !== -1) break;
    }

    if (targetSi !== -1) {
      setCurrentSegment(targetSi);
      setActiveTab('audit');
      if (viewMode === 'all') {
        setOpenSegments(prev => ({ ...prev, [targetSi]: true }));
      }
      setTimeout(() => {
        const itemEl = document.getElementById(`item-${targetSi}-${targetIi}`);
        if (itemEl) {
          itemEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          itemEl.classList.add('highlight-pulse');
          setTimeout(() => itemEl.classList.remove('highlight-pulse'), 1800);
        }
      }, 100);
      flashMessage(`Ítem ${targetSi + 1}.${targetIi + 1} (${SEGMENTS[targetSi].short})`);
    } else {
      flashMessage('¡Todos los ítems están completos!');
      setActiveTab('summary');
    }
  };

  const handleCopyText = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      flashMessage('Resumen copiado para WhatsApp');
    } catch (e) {
      flashMessage('No se pudo copiar automáticamente', true);
    }
  };

  const pendingCount = TOTAL_ITEMS - summary.done;

  return (
    <div className="app-container">
      {/* Top Main Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        deviationsCount={summary.devs.length}
        historyCount={records.length}
        theme={theme}
        onToggleTheme={toggleTheme}
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
        {/* TAB 1: AUDIT VIEW (Optimized for field audit & zero scroll) */}
        {/* ============================================================ */}
        {activeTab === 'audit' && (
          <div className="audit-tab-content animate-fade-in">
            {/* Realtime dynamic ScoreBoard */}
            <ScoreBoard
              summary={summary}
              onNextPending={handleJumpToNextPending}
              onJumpToSummary={() => setActiveTab('summary')}
              pendingCount={pendingCount}
            />

            {/* General Fields (Compact & Expandable) */}
            <GeneralFields fields={state.fields} onFieldChange={setField} />

            {/* Horizontal Segment Navigation Rail */}
            <SegmentNav
              currentSegment={currentSegment}
              onSelectSegment={handleSelectSegment}
              summary={summary}
              viewMode={viewMode}
              onToggleViewMode={() => setViewMode(prev => (prev === 'focus' ? 'all' : 'focus'))}
            />

            {/* Segments Display */}
            <div id="segments" className="segments-viewport">
              {viewMode === 'focus' ? (
                // Focus Mode: Show only current segment for maximum speed & zero scroll clutter
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
              ) : (
                // All Mode: Show all segments in accordion list
                summary.rows.map(segCalc => (
                  <SegmentCard
                    key={segCalc.si}
                    segmentData={segCalc}
                    answers={state.answers}
                    photos={state.photos}
                    isOpen={!!openSegments[segCalc.si]}
                    isFocused={false}
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
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: SUMMARY & DEVIATIONS VIEW                             */}
        {/* ============================================================ */}
        {activeTab === 'summary' && (
          <div className="summary-tab-content animate-fade-in">
            {/* Score & Verdict Banner */}
            <VerdictCard summary={summary} />

            {/* Breakdown Table & Cards */}
            <SummaryTable
              summary={summary}
              onSelectSegment={si => {
                setCurrentSegment(si);
                setActiveTab('audit');
              }}
            />

            {/* Deviations List */}
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

            {/* Action Bar (Save, Export WhatsApp, Download, Reset) */}
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

      {/* Floating Bottom Quick Bar */}
      <BottomQuickBar
        summary={summary}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNextPending={handleJumpToNextPending}
        onSaveClick={async () => {
          if (!state.fields.f_tienda.trim()) {
            flashMessage('Ingresá el nombre de la sucursal antes de guardar.', true);
            setActiveTab('audit');
            return;
          }
          const record = buildRecordToSave(state, summary, myId);
          const res = await saveAudit(record);
          if (res.ok) {
            flashMessage(`Auditoría de ${state.fields.f_tienda} guardada correctamente`);
            setActiveTab('history');
          } else {
            flashMessage(res.error || 'Error al guardar.', true);
          }
        }}
      />

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
