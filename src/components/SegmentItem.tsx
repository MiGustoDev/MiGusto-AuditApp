import React, { useRef, useState } from 'react';
import { ItemAnswer, ItemStatus, SegmentItemDef } from '../types/audit';
import { fmtPts } from '../utils/formatters';
import { blobToDataUrl, shrinkImage } from '../utils/image';

interface SegmentItemProps {
  segmentIndex: number;
  itemIndex: number;
  itemDef: SegmentItemDef;
  answer?: ItemAnswer;
  photos?: string[];
  isClaudeEnv?: boolean;
  onChoice: (segmentIndex: number, itemIndex: number, status: ItemStatus) => void;
  onPartialScore: (segmentIndex: number, itemIndex: number, value: number) => void;
  onAdjustPartialScore: (segmentIndex: number, itemIndex: number, step: number) => void;
  onObservation: (segmentIndex: number, itemIndex: number, obs: string) => void;
  onAddPhoto: (segmentIndex: number, itemIndex: number, photoIdOrUrl: string) => void;
  onRemovePhoto: (segmentIndex: number, itemIndex: number, photoIdOrUrl: string) => void;
  onViewPhoto: (photoSrc: string) => void;
  onFlashMessage?: (msg: string, isErr?: boolean) => void;
  uploadAsset?: (blob: Blob) => Promise<{ id: string } | null>;
}

export const SegmentItem: React.FC<SegmentItemProps> = ({
  segmentIndex,
  itemIndex,
  itemDef,
  answer,
  photos = [],
  onChoice,
  onPartialScore,
  onAdjustPartialScore,
  onObservation,
  onAddPhoto,
  onRemovePhoto,
  onViewPhoto,
  onFlashMessage,
  uploadAsset
}) => {
  const [uploadingCount, setUploadingCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const partialInputRef = useRef<HTMLInputElement>(null);
  const obsTextareaRef = useRef<HTMLTextAreaElement>(null);

  const itemNumber = `${segmentIndex + 1}.${itemIndex + 1}`;
  const itemStatusClass = answer ? ` s-${answer.s}` : '';
  const showExtra = (answer && answer.s !== 'ok') || Boolean(answer && answer.o);
  const isPartial = answer?.s === 'partial';

  const handleChoiceClick = (status: ItemStatus) => {
    onChoice(segmentIndex, itemIndex, status);
    if (status !== 'ok') {
      setTimeout(() => {
        if (status === 'partial') {
          partialInputRef.current?.focus({ preventScroll: true });
        } else {
          obsTextareaRef.current?.focus({ preventScroll: true });
        }
      }, 50);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    for (const file of files) {
      setUploadingCount(prev => prev + 1);
      try {
        const compressedBlob = await shrinkImage(file);
        if (uploadAsset) {
          const res = await uploadAsset(compressedBlob);
          if (res?.id) {
            onAddPhoto(segmentIndex, itemIndex, res.id);
            continue;
          }
        }
        // Fallback to Data URL for local display & storage
        const dataUrl = await blobToDataUrl(compressedBlob);
        onAddPhoto(segmentIndex, itemIndex, dataUrl);
      } catch (err: any) {
        console.error('Photo upload error:', err);
        const code = err?.code;
        const msg =
          code === 'too_large'
            ? 'La foto es demasiado pesada. Probá con otra.'
            : code === 'unsupported_type'
            ? 'Ese formato de imagen no se puede subir. Usá JPG o PNG.'
            : code === 'quota_or_state'
            ? 'Se llenó el espacio de fotos. Eliminá auditorías viejas del historial.'
            : code === 'rate_limited'
            ? 'Demasiadas fotos seguidas. Esperá unos segundos y probá de nuevo.'
            : 'No se pudo subir la foto. Revisá la imagen o conexión.';
        onFlashMessage?.(msg, true);
      } finally {
        setUploadingCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const resolvePhotoSrc = (idOrUrl: string) => {
    if (idOrUrl.startsWith('data:') || idOrUrl.startsWith('http://') || idOrUrl.startsWith('https://') || idOrUrl.startsWith('blob:')) {
      return idOrUrl;
    }
    return `/_blob/${idOrUrl}`;
  };

  return (
    <div className={`item${itemStatusClass}`} data-key={`${segmentIndex}-${itemIndex}`}>
      <div className="item-top">
        <div className="item-text">
          <b>{itemNumber}</b>
          {itemDef.text}
        </div>
        <span className={`pts num${itemDef.points >= 4 ? ' big' : ''}`}>
          {fmtPts(itemDef.points)}
        </span>
      </div>

      <div className="choices" role="group" aria-label={`Resultado ${itemNumber}`}>
        <button
          type="button"
          className="choice-btn c-ok"
          aria-pressed={answer?.s === 'ok'}
          onClick={() => handleChoiceClick('ok')}
        >
          ✓ Cumple
        </button>
        <button
          type="button"
          className="choice-btn c-partial"
          aria-pressed={answer?.s === 'partial'}
          onClick={() => handleChoiceClick('partial')}
        >
          Parcial
        </button>
        <button
          type="button"
          className="choice-btn c-no"
          aria-pressed={answer?.s === 'no'}
          onClick={() => handleChoiceClick('no')}
        >
          ✗ No
        </button>

        <button
          type="button"
          className="cam"
          aria-label={`Agregar foto al ítem ${itemNumber}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
          {photos.length > 0 && <span className="badge">{photos.length}</span>}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept="image/*"
          multiple
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleFileChange}
        />
      </div>

      {(photos.length > 0 || uploadingCount > 0) && (
        <div className="photos">
          {photos.map(photoIdOrUrl => {
            const src = resolvePhotoSrc(photoIdOrUrl);
            return (
              <div key={photoIdOrUrl} className="photo">
                <img
                  src={src}
                  alt={`Foto del ítem ${itemNumber}`}
                  loading="lazy"
                  onClick={() => onViewPhoto(src)}
                />
                <button
                  type="button"
                  className="rm-photo"
                  aria-label="Quitar foto"
                  onClick={e => {
                    e.stopPropagation();
                    onRemovePhoto(segmentIndex, itemIndex, photoIdOrUrl);
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
          {Array.from({ length: uploadingCount }).map((_, i) => (
            <div key={i} className="photo loading">
              Subiendo…
            </div>
          ))}
        </div>
      )}

      {showExtra && (
        <div className="extra">
          {isPartial && (
            <div className="partial-row">
              <button
                type="button"
                className="step"
                aria-label="Restar 0,25"
                onClick={() => onAdjustPartialScore(segmentIndex, itemIndex, -0.25)}
              >
                −
              </button>
              <input
                ref={partialInputRef}
                type="number"
                inputMode="decimal"
                step="0.25"
                min="0"
                max={itemDef.points}
                aria-label={`Puntaje real ${itemNumber}`}
                value={answer?.v !== undefined ? answer.v : ''}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  onPartialScore(segmentIndex, itemIndex, isNaN(val) ? 0 : val);
                }}
              />
              <button
                type="button"
                className="step"
                aria-label="Sumar 0,25"
                onClick={() => onAdjustPartialScore(segmentIndex, itemIndex, 0.25)}
              >
                +
              </button>
              <span>de {fmtPts(itemDef.points)}</span>
            </div>
          )}

          <textarea
            ref={obsTextareaRef}
            placeholder="Observación (qué se vio, qué falta)"
            aria-label={`Observación ${itemNumber}`}
            value={answer?.o || ''}
            onChange={e => onObservation(segmentIndex, itemIndex, e.target.value)}
          />
        </div>
      )}
    </div>
  );
};
