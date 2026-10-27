import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Sparkles, ClipboardCheck, History, LayoutDashboard } from 'lucide-react';
import { ActiveTab } from './Navbar';

/* ==========================================================================
   Lava Mode Switcher (Normal vs Experience)
   Mantiene 100% los colores y estilos originales, aplicando la física de lámpara de lava.
   ========================================================================== */
interface LavaModeSwitcherProps {
  auditMode: 'normal' | 'experience';
  onModeChange: (mode: 'normal' | 'experience') => void;
}

export const LavaModeSwitcher: React.FC<LavaModeSwitcherProps> = ({ auditMode, onModeChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  const normalLayerRef = useRef<HTMLDivElement>(null);
  const experienceLayerRef = useRef<HTMLDivElement>(null);

  const normalBtnRef = useRef<HTMLButtonElement>(null);
  const expBtnRef = useRef<HTMLButtonElement>(null);

  const isInitialRef = useRef(true);
  const prevModeRef = useRef(auditMode);

  useEffect(() => {
    const targetBtn = auditMode === 'normal' ? normalBtnRef.current : expBtnRef.current;
    if (!targetBtn || !blobRef.current || !containerRef.current) return;

    const targetLeft = targetBtn.offsetLeft;
    const targetWidth = targetBtn.offsetWidth;
    const targetHeight = targetBtn.offsetHeight;
    const targetTop = targetBtn.offsetTop;

    const isNormal = auditMode === 'normal';

    if (isInitialRef.current) {
      isInitialRef.current = false;
      prevModeRef.current = auditMode;

      gsap.set(blobRef.current, {
        x: targetLeft,
        y: targetTop,
        width: targetWidth,
        height: targetHeight,
        scaleX: 1,
        scaleY: 1
      });
      gsap.set(normalLayerRef.current, { opacity: isNormal ? 1 : 0 });
      gsap.set(experienceLayerRef.current, { opacity: isNormal ? 0 : 1 });
      return;
    }

    if (prevModeRef.current === auditMode) return;
    const movingRight = auditMode === 'experience';
    prevModeRef.current = auditMode;

    const blob = blobRef.current;
    gsap.killTweensOf([blob, normalLayerRef.current, experienceLayerRef.current]);

    const tl = gsap.timeline();

    // 1. Estiramiento fluido / succión de gota de lámpara de lava
    tl.to(blob, {
      x: movingRight ? targetLeft - 8 : targetLeft + 8,
      width: targetWidth + 16,
      scaleX: 1.22,
      scaleY: 0.85,
      duration: 0.16,
      ease: 'power2.in'
    })
    // 2. Encaje elástico con rebote orgánico en el botón destino
    .to(blob, {
      x: targetLeft,
      y: targetTop,
      width: targetWidth,
      height: targetHeight,
      scaleX: 1,
      scaleY: 1,
      duration: 0.42,
      ease: 'elastic.out(1.15, 0.55)'
    });

    // 3. Absorción de color entre el azul original y el ámbar original ("chupa el color")
    tl.to(
      normalLayerRef.current,
      { opacity: isNormal ? 1 : 0, duration: 0.24, ease: 'power2.inOut' },
      0
    );
    tl.to(
      experienceLayerRef.current,
      { opacity: isNormal ? 0 : 1, duration: 0.24, ease: 'power2.inOut' },
      0
    );
  }, [auditMode]);

  // Mantener alineado ante cambios de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const targetBtn = auditMode === 'normal' ? normalBtnRef.current : expBtnRef.current;
      if (!targetBtn || !blobRef.current) return;
      gsap.set(blobRef.current, {
        x: targetBtn.offsetLeft,
        y: targetBtn.offsetTop,
        width: targetBtn.offsetWidth,
        height: targetBtn.offsetHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [auditMode]);

  return (
    <div
      className="audit-mode-switcher-pill lava-container"
      ref={containerRef}
      role="group"
      aria-label="Tipo de auditoría"
    >
      {/* Fondo móvil animado con los estilos originales */}
      <div className="lava-blob" ref={blobRef}>
        <div className="lava-blob-surface lava-surface-normal" ref={normalLayerRef} />
        <div className="lava-blob-surface lava-surface-experience" ref={experienceLayerRef} />
      </div>

      <button
        ref={normalBtnRef}
        type="button"
        className={`mode-btn ${auditMode === 'normal' ? 'active' : ''}`}
        onClick={() => onModeChange('normal')}
        title="Auditoría Normal Estándar (9 fases)"
      >
        <span>Normal</span>
      </button>

      <button
        ref={expBtnRef}
        type="button"
        className={`mode-btn experience ${auditMode === 'experience' ? 'active' : ''}`}
        onClick={() => onModeChange('experience')}
        title="Auditoría Mi Gusto Experience (12 fases)"
      >
        <Sparkles size={13} className="mode-sparkle-icon" />
        <span>Experience</span>
      </button>
    </div>
  );
};

/* ==========================================================================
   Lava View Switcher (Auditoría vs Historial vs Dashboard)
   Mantiene 100% los colores y estilos originales (var(--accent) azul),
   con la física de desplazamiento líquido estilo lámpara de lava.
   ========================================================================== */
interface LavaViewSwitchProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  historyCount: number;
  canAccessDashboard?: boolean;
}

export const LavaViewSwitch: React.FC<LavaViewSwitchProps> = ({
  activeTab,
  onTabChange,
  historyCount,
  canAccessDashboard = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);

  const auditBtnRef = useRef<HTMLButtonElement>(null);
  const historyBtnRef = useRef<HTMLButtonElement>(null);
  const dashBtnRef = useRef<HTMLButtonElement>(null);

  const isInitialRef = useRef(true);
  const prevTabRef = useRef(activeTab);

  const getTargetBtn = (tab: ActiveTab): HTMLButtonElement | null => {
    if (tab === 'history') return historyBtnRef.current;
    if (tab === 'dashboard') return dashBtnRef.current;
    return auditBtnRef.current;
  };

  useEffect(() => {
    const targetBtn = getTargetBtn(activeTab);
    if (!targetBtn || !blobRef.current || !containerRef.current) return;

    const targetLeft = targetBtn.offsetLeft;
    const targetWidth = targetBtn.offsetWidth;
    const targetHeight = targetBtn.offsetHeight;
    const targetTop = targetBtn.offsetTop;

    if (isInitialRef.current) {
      isInitialRef.current = false;
      prevTabRef.current = activeTab;

      gsap.set(blobRef.current, {
        x: targetLeft,
        y: targetTop,
        width: targetWidth,
        height: targetHeight,
        scaleX: 1,
        scaleY: 1
      });
      return;
    }

    if (prevTabRef.current === activeTab) return;
    const prevBtn = getTargetBtn(prevTabRef.current);
    const prevLeft = prevBtn?.offsetLeft ?? targetLeft;
    const movingRight = targetLeft > prevLeft;
    prevTabRef.current = activeTab;

    const blob = blobRef.current;
    gsap.killTweensOf(blob);

    const tl = gsap.timeline();

    // 1. Estiramiento líquido estilo lámpara de lava hacia el botón destino
    tl.to(blob, {
      x: movingRight ? targetLeft - 8 : targetLeft + 8,
      width: targetWidth + 16,
      scaleX: 1.22,
      scaleY: 0.85,
      duration: 0.16,
      ease: 'power2.in'
    })
    // 2. Encaje con rebote elástico orgánico en el destino
    .to(blob, {
      x: targetLeft,
      y: targetTop,
      width: targetWidth,
      height: targetHeight,
      scaleX: 1,
      scaleY: 1,
      duration: 0.42,
      ease: 'elastic.out(1.15, 0.55)'
    });
  }, [activeTab, canAccessDashboard]);

  // Mantener alineado ante cambios de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const targetBtn = getTargetBtn(activeTab);
      if (!targetBtn || !blobRef.current) return;
      gsap.set(blobRef.current, {
        x: targetBtn.offsetLeft,
        y: targetBtn.offsetTop,
        width: targetBtn.offsetWidth,
        height: targetBtn.offsetHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  const isAuditActive = activeTab === 'audit' || activeTab === 'summary';

  return (
    <div
      className="desktop-view-switch lava-container"
      ref={containerRef}
      role="tablist"
      aria-label="Vista principal"
    >
      {/* Fondo móvil animado con el estilo azul original */}
      <div className="lava-blob" ref={blobRef}>
        <div className="lava-blob-surface lava-surface-view" />
      </div>

      <button
        ref={auditBtnRef}
        type="button"
        role="tab"
        aria-selected={isAuditActive}
        className={`switch-option-btn ${isAuditActive ? 'active' : ''}`}
        onClick={() => onTabChange('audit')}
        title="Auditoría en curso"
      >
        <ClipboardCheck size={15} />
        <span>Auditoría</span>
      </button>

      <button
        ref={historyBtnRef}
        type="button"
        role="tab"
        aria-selected={activeTab === 'history'}
        className={`switch-option-btn ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => onTabChange('history')}
        title="Historial de auditorías"
      >
        <History size={15} />
        <span>Historial</span>
        {historyCount > 0 && (
          <span className="switch-badge">{historyCount}</span>
        )}
      </button>

      {canAccessDashboard && (
        <button
          ref={dashBtnRef}
          type="button"
          role="tab"
          aria-selected={activeTab === 'dashboard'}
          className={`switch-option-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabChange('dashboard')}
          title="Dashboard de auditorías"
        >
          <LayoutDashboard size={15} />
          <span>Dashboard</span>
        </button>
      )}
    </div>
  );
};
