import React, { useRef, useEffect, useState } from 'react';
import { ClipboardCheck, History, Check, Edit3, Menu, X, Store } from 'lucide-react';
import { SEGMENTS } from '../data/segments';
import { AuditSummary } from '../types/audit';

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
  onLogoClick
}) => {
  const activePhaseRef = useRef<HTMLButtonElement>(null);
  const phasesRailRef = useRef<HTMLDivElement>(null);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
  }, [currentSegment, activeTab]);

  const handleNavClick = (tab: ActiveTab) => {
    onTabChange(tab);
    setIsSideMenuOpen(false);
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

          {/* Center/Right: Single "Auditar" Indicator + Menu Hamburger Button when in Audit mode */}
          {activeTab === 'audit' ? (
            <div className="audit-active-nav-bar">
              <div className="single-audit-pill">
                <ClipboardCheck size={16} />
                <span>Auditar</span>
              </div>

              <button
                type="button"
                className="btn-side-menu-trigger"
                onClick={() => setIsSideMenuOpen(true)}
                aria-label="Abrir menú de opciones"
                title="Menú de navegación"
              >
                <Menu size={20} />
                {(deviationsCount > 0 || historyCount > 0) && <span className="menu-has-badge-dot" />}
              </button>
            </div>
          ) : (
            /* Standard navigation tabs when in Summary or History mode */
            <nav className="main-nav-centered" aria-label="Navegación principal">
              <button
                type="button"
                className="nav-tab"
                onClick={() => handleNavClick('audit')}
              >
                <ClipboardCheck size={17} className="tab-icon" />
                <span>Auditar</span>
              </button>

              <button
                type="button"
                className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => handleNavClick('history')}
              >
                <History size={17} className="tab-icon" />
                <span>Historial</span>
                {historyCount > 0 && (
                  <span className="tab-badge neutral">{historyCount}</span>
                )}
              </button>
            </nav>
          )}

          {activeTab !== 'audit' && <div className="header-right-spacer" aria-hidden="true" />}
        </div>

        {/* Sticky Phases Rail inside header for Audit View */}
        {activeTab === 'audit' && onSelectSegment && summary && (
          <div className={`header-phases-subbar ${isScrolled ? 'is-scrolled-hidden' : ''}`}>
            <div className="phases-rail-container" ref={phasesRailRef}>
              {/* Nivel 0: Sucursal Chip */}
              {onEditSetup && (
                <button
                  type="button"
                  className="header-phase-chip level-zero-chip"
                  onClick={onEditSetup}
                  title="Volver a los datos del Nivel 0 (Sucursal)"
                >
                  <span className="header-phase-num">0</span>
                  <span className="header-phase-name">Sucursal</span>
                </button>
              )}

              {SEGMENTS.map((seg, si) => {
                const rowData = summary.rows[si];
                const isSegComplete = rowData ? rowData.segDone === seg.items.length : false;
                const isActive = currentSegment === si;
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
        <div className="side-menu-backdrop" onClick={() => setIsSideMenuOpen(false)}>
          <div className="side-menu-drawer" onClick={e => e.stopPropagation()}>
            <div className="side-menu-header">
              <div className="brand-logo-wrap">
                <img src="logo.png" alt="Mi Gusto" className="brand-logo-img" />
              </div>
              <button
                type="button"
                className="icon-btn-subtle"
                onClick={() => setIsSideMenuOpen(false)}
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
            </div>

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
                  <span>Planilla de Auditoría</span>
                </div>
              </button>

              <button
                type="button"
                className={`side-menu-item ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => handleNavClick('history')}
              >
                <div className="side-menu-item-left">
                  <History size={18} />
                  <span>Historial de Auditorías</span>
                </div>
                {historyCount > 0 && (
                  <span className="side-badge neutral">{historyCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
