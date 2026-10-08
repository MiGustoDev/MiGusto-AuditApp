import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ItemAnswer, ItemStatus, SegmentCalculation } from '../types/audit';
import { f2 } from '../utils/formatters';
import { PASS_SCORE, SEGMENTS } from '../data/segments';
import { SegmentItem } from './SegmentItem';
import { ChevronRight, ChevronLeft, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

interface SegmentCardProps {
  segmentData: SegmentCalculation;
  answers: Record<string, ItemAnswer>;
  photos: Record<string, string[]>;
  isOpen?: boolean;
  isFocused?: boolean;
  onToggle?: () => void;
  onChoice: (segmentIndex: number, itemIndex: number, status: ItemStatus) => void;
  onPartialScore: (segmentIndex: number, itemIndex: number, value: number) => void;
  onAdjustPartialScore: (segmentIndex: number, itemIndex: number, step: number) => void;
  onObservation: (segmentIndex: number, itemIndex: number, obs: string) => void;
  onMarkPendingAsOk: (segmentIndex: number) => void;
  onAddPhoto: (segmentIndex: number, itemIndex: number, photoIdOrUrl: string) => void;
  onRemovePhoto: (segmentIndex: number, itemIndex: number, photoIdOrUrl: string) => void;
  onViewPhoto: (photoSrc: string) => void;
  onFlashMessage?: (msg: string, isErr?: boolean) => void;
  uploadAsset?: (blob: Blob) => Promise<{ id: string } | null>;
  onNextSegment?: () => void;
  onPrevSegment?: () => void;
  onJumpToSummary?: () => void;
}

export const SegmentCard: React.FC<SegmentCardProps> = ({
  segmentData,
  answers,
  photos,
  isOpen = true,
  isFocused = false,
  onToggle,
  onChoice,
  onPartialScore,
  onAdjustPartialScore,
  onObservation,
  onAddPhoto,
  onRemovePhoto,
  onViewPhoto,
  onFlashMessage,
  uploadAsset,
  onNextSegment,
  onPrevSegment,
  onJumpToSummary
}) => {
  const { seg, si, ideal, real, pct, segDone } = segmentData;
  const isStarted = segDone > 0;
  const isLastSegment = si === SEGMENTS.length - 1;
  const stackRef = useRef<HTMLDivElement>(null);

  // Stagger animation for 2x2 item cards on segment change
  useEffect(() => {
    if (stackRef.current) {
      gsap.fromTo(
        stackRef.current.children,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out' }
      );
    }
  }, [si]);

  const getPctBadgeClass = () => {
    if (!isStarted) return 'badge-neutral';
    if (pct >= PASS_SCORE) return 'badge-ok';
    if (pct >= 60) return 'badge-warn';
    return 'badge-bad';
  };

  return (
    <div className={`segment-container ${isFocused ? 'is-focused-view' : 'is-list-view'}`} id={`seg${si + 1}`}>
      {/* Header bar */}
      <div 
        className="segment-card-header"
        onClick={!isFocused ? onToggle : undefined}
        role={!isFocused ? "button" : undefined}
      >
        <div className="seg-header-info">
          <div className="seg-title-row">
            <span className="seg-index-tag">{si + 1} de {SEGMENTS.length}</span>
            <h2 className="seg-name-heading">{seg.name}</h2>
          </div>
          <p className="seg-stats-text">
            <span>Evaluados: <b>{segDone}/{seg.items.length}</b></span>
            <span className="dot-sep">·</span>
            <span>Puntos: <b>{f2(real)}</b> / {f2(ideal)}</span>
          </p>
        </div>

        <div className="seg-header-right">
          <span className={`seg-score-pill num ${getPctBadgeClass()}`}>
            {isStarted ? `${pct.toFixed(0)}%` : '0%'}
          </span>
          {!isFocused && onToggle && (
            <button type="button" className="icon-btn-subtle" aria-label="Colapsar o expandir">
              {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="segment-body-wrapper">
          {/* List of segment items in 2x2 grid */}
          <div ref={stackRef} className="segment-items-stack">
            {seg.items.map((it, ii) => {
              const key = `${si}-${ii}`;
              return (
                <SegmentItem
                  key={key}
                  segmentIndex={si}
                  itemIndex={ii}
                  itemDef={it}
                  answer={answers[key]}
                  photos={photos[key]}
                  onChoice={onChoice}
                  onPartialScore={onPartialScore}
                  onAdjustPartialScore={onAdjustPartialScore}
                  onObservation={onObservation}
                  onAddPhoto={onAddPhoto}
                  onRemovePhoto={onRemovePhoto}
                  onViewPhoto={onViewPhoto}
                  onFlashMessage={onFlashMessage}
                  uploadAsset={uploadAsset}
                />
              );
            })}
          </div>

          {/* Focus mode navigation footer */}
          {isFocused && (
            <div className="segment-focus-footer">
              {si > 0 && onPrevSegment ? (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={onPrevSegment}
                >
                  <ChevronLeft size={18} />
                  <span>Anterior</span>
                </button>
              ) : (
                <div />
              )}

              {!isLastSegment && onNextSegment ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onNextSegment}
                >
                  <span>Siguiente segmento</span>
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={onJumpToSummary}
                >
                  <span>Ver resultados finales</span>
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
