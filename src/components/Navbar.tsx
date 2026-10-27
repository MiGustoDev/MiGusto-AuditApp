import React, { useRef, useEffect, useState } from 'react';
import { ClipboardCheck, History, Check, Edit3, Menu, X, Store, LogOut, User as UserIcon, KeyRound, ChevronDown, ShieldCheck, Lock } from 'lucide-react';
import { getSegments } from '../data/segments';
import { AuditSummary } from '../types/audit';
import { UserProfile, getUserAvatarUrl } from '../lib/auth';
import { LavaModeSwitcher, LavaViewSwitch } from './LavaSwitcher';

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
  onOpenChangePassword?: () => void;
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
  onLogout,
  onOpenChangePassword
}) => {
  const activePhaseRef = useRef<HTMLButtonElement>(null);
  const phasesRailRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const avatarSrc = currentUser ? (currentUser.avatarUrl || getUserAvatarUrl(currentUser)) : undefined;

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarSrc]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

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
      if (e.key === 'Escape') {
        if (isUserMenuOpen) setIsUserMenuOpen(false);
        if (isSideMenuOpen && !isClosing) handleCloseMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSideMenuOpen, isClosing, isUserMenuOpen]);

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
              <div className="brand-titles-desktop">
                <span className="brand-app-title">Control Operativo</span>
                <span className="brand-app-subtitle">Auditoría Integral de Calidad</span>
              </div>
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

          {/* Center: When in Historial, show sleek history count badge. When in Auditoría, show Mode Switcher (Normal / Experience) */}
          {activeTab === 'history' ? (
            <div className="header-center-mode-wrap">
              <div className="header-history-badge" title={`${historyCount} auditorías registradas en el historial`}>
                <History size={13} className="header-history-badge-icon" />
                <span className="header-history-badge-num">{historyCount}</span>
                <span className="header-history-badge-label">{historyCount === 1 ? 'registro' : 'registros'}</span>
              </div>
            </div>
          ) : (
            onModeChange && (
              <div className="header-center-mode-wrap">
                <LavaModeSwitcher
                  auditMode={auditMode || 'normal'}
                  onModeChange={onModeChange}
                />
              </div>
            )
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

            {/* Desktop Navigation: Switch Segmentado Auditoría / Historial con efecto Lámpara de Lava */}
            <div className="desktop-header-actions">
              <LavaViewSwitch
                activeTab={activeTab}
                onTabChange={onTabChange}
                historyCount={historyCount}
              />

              {/* User Profile & Dropdown Trigger */}
              {currentUser && (
                <div className="header-user-menu-wrap" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="header-user-trigger"
                    title={`Perfil de ${currentUser.name}`}
                    aria-expanded={isUserMenuOpen}
                  >
                    <div className={`header-user-avatar ${avatarSrc && !avatarFailed ? 'has-image' : ''}`}>
                      {avatarSrc && !avatarFailed ? (
                        <img
                          src={avatarSrc}
                          alt={currentUser.name}
                          className="header-user-avatar-img"
                          onError={() => setAvatarFailed(true)}
                        />
                      ) : (
                        currentUser.name ? currentUser.name.charAt(0) : 'U'
                      )}
                    </div>

                    <div className="header-user-info">
                      <span className="header-user-name">{currentUser.name}</span>
                      <span className="header-user-role">{currentUser.roleLabel}</span>
                    </div>

                    <ChevronDown
                      size={14}
                      className={`header-user-chevron ${isUserMenuOpen ? 'rotated' : ''}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="header-user-dropdown" role="menu">
                      {/* Profile Card Header */}
                      <div className="dropdown-user-header">
                        <div className={`dropdown-user-avatar ${avatarSrc && !avatarFailed ? 'has-image' : ''}`}>
                          {avatarSrc && !avatarFailed ? (
                            <img
                              src={avatarSrc}
                              alt={currentUser.name}
                              className="dropdown-user-avatar-img"
                            />
                          ) : (
                            currentUser.name ? currentUser.name.charAt(0) : 'U'
                          )}
                        </div>
                        <div className="dropdown-user-details">
                          <p className="dropdown-user-name">{currentUser.name}</p>
                          <p className="dropdown-user-email">{currentUser.email}</p>
                        </div>
                        <div className="dropdown-status-row">
                          <span className="dropdown-status-active">
                            <ShieldCheck size={12} />
                            <span>Sesión activa</span>
                          </span>
                        </div>
                      </div>

                      {/* Menu Options */}
                      <div className="dropdown-menu-list">
                        {onOpenChangePassword && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onOpenChangePassword();
                            }}
                            className="dropdown-menu-item change-pwd"
                          >
                            <Lock size={15} />
                            <span>Cambiar contraseña</span>
                          </button>
                        )}

                        {onLogout && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onLogout();
                            }}
                            className="dropdown-menu-item logout"
                          >
                            <LogOut size={15} />
                            <span>Cerrar Sesión</span>
                          </button>
                        )}
                      </div>
                    </div>
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
                <div className="side-menu-brand-titles">
                  <span className="brand-app-title">Control Operativo</span>
                  <span className="brand-app-subtitle">Auditoría Integral de Calidad</span>
                </div>
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
                <div className={`side-menu-user-avatar ${avatarSrc && !avatarFailed ? 'has-image' : ''}`}>
                  {avatarSrc && !avatarFailed ? (
                    <img
                      src={avatarSrc}
                      alt={currentUser.name}
                      className="side-menu-user-avatar-img"
                    />
                  ) : (
                    <UserIcon size={16} />
                  )}
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

            {currentUser && (
              <div className="side-menu-footer-actions">
                {onOpenChangePassword && (
                  <button
                    type="button"
                    className="side-menu-pwd-btn"
                    onClick={() => {
                      handleCloseMenu();
                      onOpenChangePassword();
                    }}
                  >
                    <KeyRound size={15} />
                    <span>Cambiar Contraseña</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    type="button"
                    className="side-menu-logout-btn"
                    onClick={() => {
                      handleCloseMenu();
                      onLogout();
                    }}
                  >
                    <LogOut size={15} />
                    <span>Cerrar Sesión</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
