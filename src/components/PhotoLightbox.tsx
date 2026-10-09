import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';

interface PhotoLightboxProps {
  src: string | null;
  onClose: () => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ src, onClose }) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (src) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      if (backdropRef.current && contentRef.current) {
        gsap.fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.22, ease: 'power2.out', clearProps: 'opacity' }
        );
        gsap.fromTo(
          contentRef.current,
          { scale: 0.88, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.28, ease: 'back.out(1.5)', clearProps: 'transform,opacity' }
        );
      }
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [src, onClose]);

  if (!src) return null;

  return createPortal(
    <div ref={backdropRef} className="lightbox-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div ref={contentRef} className="lightbox-content" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          className="lightbox-close"
          onClick={onClose}
          aria-label="Cerrar vista de foto"
        >
          ✕
        </button>
        <img src={src} alt="Vista ampliada" />
      </div>
    </div>,
    document.body
  );
};
