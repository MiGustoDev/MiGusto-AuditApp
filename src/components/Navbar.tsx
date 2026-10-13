import React, { useRef, useEffect, useState } from 'react';
import { ClipboardCheck, History, Check, Edit3, Menu, X, Store, Sparkles, LogOut, User as UserIcon } from 'lucide-react';
import { getSegments } from '../data/segments';
import { AuditSummary } from '../types/audit';
import { UserProfile } from '../lib/auth';

export type ActiveTab = 'audit' | 'summary' | 'history';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  deviationsCount: number;
  historyCount: number;
  storeName?: string;
  currentSegment?: number;
  onSelectSegment?: (index: number) => void;
  summary?: AuditSummary;
  onEditSetup?: () => void;
  onLogoClick?: () => void;
  auditMode?: 'normal' | 'experience';
  onModeChange?: (mode: 'normal' | 'experience') => void;
  auditStep?: 'setup' | 'evaluate';
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  deviationsCount,
  historyCount,
  storeName,
  currentSegment = 0,
  onSelectSegment,
  summary,
  onEditSetup,
  onLogoClick,
  auditMode = 'normal',
  onModeChange,
  auditStep = 'evaluate',
  currentUser,
  onLogout
}) => {
  const activePhaseRef = useRef<HTMLButtonElement>(null);
  const phasesRailRef = useRef<HTMLDivElement>(null);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleOpenMenu = () => {
    setIsClosing(false);
    setIsSideMenuOpen(true);
  };

  const handleCloseMenu = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsSideMenuOpen(false);
      setIsClosing(false);
    }, 220);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSideMenuOpen && !isClosing) {
        handleCloseMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSideMenuOpen, isClosing]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll active phase button into view smoothly on horizontal rail
  useEffect(() => {
    if (activePhaseRef.current && phasesRailRef.current) {
      const container = phasesRailRef.current;
      const tab = activePhaseRef.current;
      const containerLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const tabLeft = tab.offsetLeft;
      const tabWidth = tab.clientWidth;

      if (tabLeft < containerLeft || tabLeft + tabWidth > containerLeft + containerWidth) {
        container.scrollTo({
          left: tabLeft - containerWidth / 2 + tabWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [currentSegment, activeTab, auditStep]);

  const handleNavClick = (tab: ActiveTab) => {
    onTabChange(tab);
    handleCloseMenu();
  };

  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          {/* Left: Brand Logo & Store */}
          <div className="brand-section">
            <div 
              className="brand-logo-wrap clickable"
              onClick={onLogoClick}
              role="button"
              tabIndex={0}
              title="Ir al inicio para cargar una nueva sucursal"
              style={{ cursor: 'pointer' }}
            >
              <img src="logo.png" alt="Mi Gusto" className="brand-logo-img" />
            </div>
            {storeName && (
              <button 
                type="button" 
                className="current-store-pill clickable"
                onClick={onEditSetup}
                title="Click para editar datos del local"
              >
                <span className="store-dot"></span>
                <span className="store-name-label">{storeName}</span>
                <Edit3 size={11} className="store-edit-icon" />
              </button>
            )}
          </div>

          {/* Center: Always show Mode Switcher (Normal / Experience) */}
          {onModeChange && (
            <div className="header-center-mode-wrap">
              <div className="audit-mode-switcher-pill" role="group" aria-label="Tipo de auditoría">
                <button
                  type="button"
                  className={`mode-btn ${auditMode === 'normal' ? 'active' : ''}`}
                  onClick={() => onModeChange('normal')}
                  title="Auditoría Normal Estándar (9 fases)"
                >
                  <span>Normal</span>
                </button>
                <button
                  type="button"
                  className={`mode-btn experience ${auditMode === 'experience' ? 'active' : ''}`}
                  onClick={() => onModeChange('experience')}
                  title="Auditoría Mi Gusto Experience (12 fases)"
                >
                  <Sparkles size={13} className="mode-sparkle-icon" />
                  <span>Experience</span>
                </button>
              </div>
            </div>
          )}

          {/* Right Section: Mobile Hamburger Menu & Desktop Switch */}
          <div className="header-right-nav-section">
            <button
              type="button"
              className="btn-side-menu-trigger mobile-only"
              onClick={handleOpenMenu}
              aria-label="Abrir menú de opciones"
              title="Menú de navegación"
            >
              <Menu size={20} />
              {(deviationsCount > 0 || historyCount > 0) && <span className="menu-has-badge-dot" />}
            </button>

            {/* Desktop Navigation: Switch Segmentado Auditoría / Historial */}
            <div className="desktop-header-actions">
              <div className="desktop-view-switch" role="tablist" aria-label="Vista principal">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab !== 'history'}
                  className={`switch-option-btn ${activeTab !== 'history' ? 'active' : ''}`}
                  onClick={() => onTabChange('audit')}
                  title="Auditoría en curso"
                >
                  <ClipboardCheck size={15} />
                  <span>Auditoría</span>
                </button>
                <button
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
              </div>

              {/* User profile & Logout */}
              {currentUser && (
                <div className="header-user-badge" title={`${currentUser.name} (${currentUser.roleLabel})`}>
                  <div className="header-user-info">
                    <span className="header-user-name">{currentUser.name}</span>
                    <span className="header-user-role">{currentUser.roleLabel}</span>
                  </div>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="header-logout-btn"
                      title="Cerrar sesión"
                      aria-label="Cerrar sesión"
                    >
                      <LogOut size={15} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Phases Rail inside header for Mobile View only */}
        {activeTab === 'audit' && onSelectSegment && summary && (
          <div className={`header-phases-subbar mobile-only ${isScrolled ? 'is-scrolled-hidden' : ''}`}>
            {/* Mobile Rail (capsules) */}
            <div className="phases-rail-container" ref={phasesRailRef}>
              {/* Nivel 0: Sucursal Chip */}
              {onEditSetup && (
                <button
                  type="button"
                  ref={auditStep === 'setup' ? activePhaseRef : null}
                  className={`header-phase-chip level-zero-chip ${auditStep === 'setup' ? 'active' : ''}`}
                  onClick={onEditSetup}
                  title="Volver a los datos del Nivel 0 (Sucursal)"
                >
                  <span className="header-phase-num">0</span>
                  <span className="header-phase-name">Sucursal</span>
                </button>
              )}

              {getSegments(auditMode).map((seg, si) => {
                const rowData = summary.rows[si];
                const isSegComplete = rowData ? rowData.segDone === seg.items.length : false;
                const isActive = auditStep === 'evaluate' && currentSegment === si;
                const doneItems = rowData ? rowData.segDone : 0;
                const totalItems = seg.items.length;

                return (
                  <button
                    key={si}
                    ref={isActive ? activePhaseRef : null}
                    type="button"
                    className={`header-phase-chip ${isActive ? 'active' : ''} ${isSegComplete ? 'is-complete' : ''}`}
                    onClick={() => onSelectSegment(si)}
                  >
                    <span className="header-phase-num">
                      {isSegComplete ? <Check size={11} /> : si + 1}
                    </span>
                    <span className="header-phase-name">{seg.short}</span>
                    <span className="header-phase-score num">
                      {isSegComplete ? '100%' : `${doneItems}/${totalItems}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Side Menu Drawer Component */}
      {isSideMenuOpen && (
        <div className={`side-menu-backdrop ${isClosing ? 'is-closing' : ''}`} onClick={handleCloseMenu}>
          <div className={`side-menu-drawer ${isClosing ? 'is-closing' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="side-menu-header">
              <div className="brand-logo-wrap">
                <img src="logo.png" alt="Mi Gusto" className="brand-logo-img" />
              </div>
              <button
                type="button"
                className="icon-btn-subtle"
                onClick={handleCloseMenu}
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
            </div>

            {currentUser && (
              <div className="side-menu-user-card">
                <div className="side-menu-user-avatar">
                  <UserIcon size={16} />
                </div>
                <div className="side-menu-user-details">
                  <div className="side-menu-user-name">{currentUser.name}</div>
                  <div className="side-menu-user-role">{currentUser.roleLabel} • {currentUser.email}</div>
                </div>
              </div>
            )}

            {storeName && (
              <div className="side-menu-store-info">
                <Store size={14} />
                <span>Tienda: <b>{storeName}</b></span>
              </div>
            )}

            <div className="side-menu-nav">
              <span className="side-menu-section-label">Menú de Navegación</span>

              <button
                type="button"
                className={`side-menu-item ${activeTab === 'audit' ? 'active' : ''}`}
                onClick={() => handleNavClick('audit')}
              >
                <div className="side-menu-item-left">
                  <ClipboardCheck size={18} />
                  <span>Auditoría</span>
                </div>
              </button>

              <button
                type="button"
                className={`side-menu-item ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => handleNavClick('history')}
              >
                <div className="side-menu-item-left">
                  <History size={18} />
                  <span>Historial</span>
                </div>
                {historyCount > 0 && (
                  <span className="side-badge neutral">{historyCount}</span>
                )}
              </button>
            </div>

            {currentUser && onLogout && (
              <div className="side-menu-footer-actions">
                <button
                  type="button"
                  className="side-menu-logout-btn"
                  onClick={() => {
                    handleCloseMenu();
                    onLogout();
                  }}
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
