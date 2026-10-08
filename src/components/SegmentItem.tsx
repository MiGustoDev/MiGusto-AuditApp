import React, { useRef, useState } from 'react';
import { ItemAnswer, ItemStatus, SegmentItemDef } from '../types/audit';
import { fmtPts } from '../utils/formatters';
import { blobToDataUrl, shrinkImage } from '../utils/image';
import { 
  Check, 
  Slash, 
  X, 
  Camera, 
  Plus, 
  Minus, 
  Trash2, 
  Flame
} from 'lucide-react';

interface SegmentItemProps {
  segmentIndex: number;
  itemIndex: number;
  itemDef: SegmentItemDef;
  answer?: ItemAnswer;
  photos?: string[];
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

  const itemNumber = `${itemIndex + 1}.`;
  const isSelected = !!answer;
  const currentStatus = answer?.s;
  const showExtra = (answer && answer.s !== 'ok') || Boolean(answer && answer.o);
  const isPartial = currentStatus === 'partial';
  const isCritical = itemDef.points >= 3.5;

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
            ? 'Se llenó el espacio de fotos.'
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
    <div 
      className={`item-card ${isSelected ? `status-${currentStatus}` : 'unanswered'} ${isCritical ? 'high-impact-item' : ''}`}
      data-key={`${segmentIndex}-${itemIndex}`}
      id={`item-${segmentIndex}-${itemIndex}`}
    >
      {/* Top Header: Number, Text, Points */}
      <div className="item-header-row">
        <div className="item-title-col">
          <span className="item-badge-num">{itemNumber}</span>
          <p className="item-description-text">{itemDef.text}</p>
        </div>

        <div className="item-points-col">
          <span className={`pts-tag num ${isCritical ? 'high-impact-pts' : ''}`}>
            {isCritical && <Flame size={12} className="pts-icon" />}
            {fmtPts(itemDef.points)}
          </span>
        </div>
      </div>

      {/* Choice Buttons Bar */}
      <div className="item-actions-row">
        <div className="item-choices-group" role="group" aria-label={`Evaluación ítem ${itemNumber}`}>
          <button
            type="button"
            className={`btn-choice choice-ok ${currentStatus === 'ok' ? 'active' : ''}`}
            onClick={() => handleChoiceClick('ok')}
            aria-pressed={currentStatus === 'ok'}
          >
            <Check size={16} className="choice-icon" />
            <span>Cumple</span>
          </button>

          <button
            type="button"
            className={`btn-choice choice-partial ${currentStatus === 'partial' ? 'active' : ''}`}
            onClick={() => handleChoiceClick('partial')}
            aria-pressed={currentStatus === 'partial'}
          >
            <Slash size={14} className="choice-icon rotate-icon" />
            <span>Parcial</span>
          </button>

          <button
            type="button"
            className={`btn-choice choice-no ${currentStatus === 'no' ? 'active' : ''}`}
            onClick={() => handleChoiceClick('no')}
            aria-pressed={currentStatus === 'no'}
          >
            <X size={16} className="choice-icon" />
            <span>No</span>
          </button>
        </div>

        {/* Camera trigger */}
        <div className="item-camera-wrapper">
          <button
            type="button"
            className={`btn-camera ${photos.length > 0 ? 'has-photos' : ''}`}
            aria-label={`Adjuntar foto al ítem ${itemNumber}`}
            onClick={() => fileInputRef.current?.click()}
            title="Agregar foto de evidencia"
          >
            <Camera size={17} />
            {photos.length > 0 && <span className="camera-counter-badge">{photos.length}</span>}
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
      </div>

      {/* Uploaded Photos Thumbnails */}
      {(photos.length > 0 || uploadingCount > 0) && (
        <div className="item-photos-grid">
          {photos.map(photoIdOrUrl => {
            const src = resolvePhotoSrc(photoIdOrUrl);
            return (
              <div key={photoIdOrUrl} className="photo-thumb-card">
                <img
                  src={src}
                  alt={`Evidencia ${itemNumber}`}
                  loading="lazy"
                  onClick={() => onViewPhoto(src)}
                />
                <button
                  type="button"
                  className="photo-remove-btn"
                  aria-label="Quitar foto"
                  onClick={e => {
                    e.stopPropagation();
                    onRemovePhoto(segmentIndex, itemIndex, photoIdOrUrl);
                  }}
                  title="Eliminar foto"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
          {Array.from({ length: uploadingCount }).map((_, i) => (
            <div key={i} className="photo-thumb-card uploading-placeholder">
              <span>Subiendo...</span>
            </div>
          ))}
        </div>
      )}

      {/* Extra Fields for Partial Score & Observation */}
      {showExtra && (
        <div className="item-extra-panel animate-slide-down">
          {isPartial && (
            <div className="partial-score-editor">
              <span className="editor-label">Puntaje asignado:</span>
              <div className="stepper-control">
                <button
                  type="button"
                  className="stepper-btn"
                  aria-label="Restar 0.25 puntos"
                  onClick={() => onAdjustPartialScore(segmentIndex, itemIndex, -0.25)}
                >
                  <Minus size={15} />
                </button>
                <input
                  ref={partialInputRef}
                  type="number"
                  inputMode="decimal"
                  step="0.25"
                  min="0"
                  max={itemDef.points}
                  aria-label={`Puntaje asignado al ítem ${itemNumber}`}
                  value={answer?.v !== undefined ? answer.v : ''}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    onPartialScore(segmentIndex, itemIndex, isNaN(val) ? 0 : val);
                  }}
                  className="stepper-input num"
                />
                <button
                  type="button"
                  className="stepper-btn"
                  aria-label="Sumar 0.25 puntos"
                  onClick={() => onAdjustPartialScore(segmentIndex, itemIndex, 0.25)}
                >
                  <Plus size={15} />
                </button>
                <span className="stepper-max">de {fmtPts(itemDef.points)}</span>
              </div>
            </div>
          )}

          <div className="observation-input-box">
            <textarea
              ref={obsTextareaRef}
              placeholder="Describí el motivo del desvío u observación..."
              aria-label={`Observación del ítem ${itemNumber}`}
              value={answer?.o || ''}
              onChange={e => onObservation(segmentIndex, itemIndex, e.target.value)}
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
};
