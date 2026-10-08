import React from 'react';
import { ClipboardCheck, BarChart3, History } from 'lucide-react';

export type ActiveTab = 'audit' | 'summary' | 'history';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  deviationsCount: number;
  historyCount: number;
  storeName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  deviationsCount,
  historyCount,
  storeName
}) => {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand-section">
          <div className="brand-logo-wrap">
            <img src="/logo.png" alt="Mi Gusto" className="brand-logo-img" />
          </div>
          {storeName && (
            <div className="current-store-pill" title={`Tienda activa: ${storeName}`}>
              <span className="store-dot"></span>
              <span className="store-name-label">{storeName}</span>
            </div>
          )}
        </div>

        <nav className="main-nav" aria-label="Navegación principal">
          <button
            type="button"
            className={`nav-tab ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => onTabChange('audit')}
          >
            <ClipboardCheck size={18} className="tab-icon" />
            <span>Auditar</span>
          </button>

          <button
            type="button"
            className={`nav-tab ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => onTabChange('summary')}
          >
            <BarChart3 size={18} className="tab-icon" />
            <span>Resultados</span>
            {deviationsCount > 0 && (
              <span className="tab-badge warn" title={`${deviationsCount} desvíos detectados`}>
                {deviationsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => onTabChange('history')}
          >
            <History size={18} className="tab-icon" />
            <span>Historial</span>
            {historyCount > 0 && (
              <span className="tab-badge neutral">{historyCount}</span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
