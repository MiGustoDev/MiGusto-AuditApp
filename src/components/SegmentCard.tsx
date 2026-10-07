import React from 'react';
import { ItemAnswer, ItemStatus, SegmentCalculation } from '../types/audit';
import { f2 } from '../utils/formatters';
import { PASS_SCORE } from '../data/segments';
import { SegmentItem } from './SegmentItem';

interface SegmentCardProps {
  segmentData: SegmentCalculation;
  answers: Record<string, ItemAnswer>;
  photos: Record<string, string[]>;
  isOpen: boolean;
  onToggle: () => void;
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
}

export const SegmentCard: React.FC<SegmentCardProps> = ({
  segmentData,
  answers,
  photos,
  isOpen,
  onToggle,
  onChoice,
  onPartialScore,
  onAdjustPartialScore,
  onObservation,
  onMarkPendingAsOk,
  onAddPhoto,
  onRemovePhoto,
  onViewPhoto,
  onFlashMessage,
  uploadAsset
}) => {
  const { seg, si, ideal, real, pct, segDone } = segmentData;
  const isStarted = segDone > 0;

  const getPctColor = () => {
    if (!isStarted) return 'var(--muted)';
    if (pct >= PASS_SCORE) return 'var(--ok)';
    if (pct >= 60) return 'var(--warn)';
    return 'var(--bad)';
  };

  return (
    <details
      className="seg"
      id={`seg${si + 1}`}
      open={isOpen}
      onToggle={e => {
        // keep sync with details native toggle
        const target = e.currentTarget as HTMLDetailsElement;
        if (target.open !== isOpen) {
          onToggle();
        }
      }}
    >
      <summary>
        <span className="seg-title">
          {si + 1}. {seg.name}
        </span>
        <span className="seg-score num">
          <span>{f2(real)}</span> / {f2(ideal)}
        </span>
        <span className="seg-sub num">
          {segDone} de {seg.items.length} ítems
        </span>
        <span className="seg-pct num" style={{ color: getPctColor() }}>
          {isStarted ? `${pct.toFixed(0)}%` : '–'}
        </span>
      </summary>

      <div className="seg-tools">
        <button
          type="button"
          className="linkbtn"
          onClick={e => {
            e.stopPropagation();
            onMarkPendingAsOk(si);
          }}
        >
          Marcar los pendientes como Cumple
        </button>
      </div>

      <div className="segment-items">
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
    </details>
  );
};
