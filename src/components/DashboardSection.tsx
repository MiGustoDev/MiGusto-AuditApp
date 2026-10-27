import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  DASHBOARD_SEED, 
  DashboardSeedData, 
  DashboardTienda 
} from '../data/dashboardSeed';
import { SavedAuditRecord } from '../types/audit';
import { f2, fmtDate } from '../utils/formatters';
import { Upload, X, Calendar, Users, ChevronDown, Check } from 'lucide-react';

interface DashboardSectionProps {
  records: SavedAuditRecord[];
  onSelectAudit?: (record: SavedAuditRecord) => void;
}

const SUPERVISOR_COLORS: Record<string, string> = {
  'p-damaris': '#e0687c',
  'p-evelyn': '#f5cb4f',
  'p-wanda': '#ff9d7f',
  'p-selene': '#4fd8e3',
  'p-sasha': '#c6a2ff',
  'p-lidya': '#f07acb',
  'p-martin': '#82b2ff'
};

const DEFAULT_SUP_COLOR = '#3b82f6';

function normalizeName(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bde\b/g, '')
    .replace(/\bla\b/g, '')
    .replace(/\blas\b/g, '')
    .replace(/\blos\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({ records, onSelectAudit }) => {
  const [seedData, setSeedData] = useState<DashboardSeedData>(() => {
    try {
      const saved = localStorage.getItem('dashboard-auditorias-datos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.config?.tiendas) return parsed;
      }
    } catch (e) {}
    return DASHBOARD_SEED;
  });

  const [periodo, setPeriodo] = useState<'mes' | 'mesant' | '3m' | 'todo'>('mes');
  const [selectedSup, setSelectedSup] = useState<string>('');
  const [dashFilter, setDashFilter] = useState<'all' | 'crit' | 'rev' | 'ok' | 'none'>('all');
  const [toastMsg, setToastMsg] = useState<{ text: string; isErr: boolean } | null>(null);
  const [inspectAudit, setInspectAudit] = useState<SavedAuditRecord | null>(null);

  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isSupOpen, setIsSupOpen] = useState(false);

  const periodDropdownRef = useRef<HTMLDivElement>(null);
  const supDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(e.target as Node)) {
        setIsPeriodOpen(false);
      }
      if (supDropdownRef.current && !supDropdownRef.current.contains(e.target as Node)) {
        setIsSupOpen(false);
      }
    }
    if (isPeriodOpen || isSupOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPeriodOpen, isSupOpen]);

  // Close dropdowns on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsPeriodOpen(false);
        setIsSupOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (text: string, isErr = false) => {
    setToastMsg({ text, isErr });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed || !parsed.config || !Array.isArray(parsed.config.tiendas)) {
          throw new Error('Formato inválido');
        }
        setSeedData(parsed);
        localStorage.setItem('dashboard-auditorias-datos', JSON.stringify(parsed));
        showToast(`Datos cargados correctamente: ${parsed.auditorias?.length || 0} auditorías.`);
      } catch (err) {
        showToast('El archivo no tiene el formato de exportación esperado.', true);
      }
    };
    reader.readAsText(file);
  };

  const THR = seedData.umbrales || { critica: 70, ok: 85 };

  // Calculate Period Date Range
  const [dateFrom, dateTo] = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    const firstDay = (yy: number, mm: number) => {
      const d = new Date(yy, mm, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    };

    if (periodo === 'mes') return [firstDay(y, m), '9999-99-99'];
    if (periodo === 'mesant') return [firstDay(y, m - 1), firstDay(y, m)];
    if (periodo === '3m') return [firstDay(y, m - 2), '9999-99-99'];
    return ['', '9999-99-99'];
  }, [periodo]);

  // Combined audit records: app's live records + any uploaded custom auditorias
  const allRecords = useMemo(() => {
    const customRecs = (seedData.auditorias || []) as SavedAuditRecord[];
    const combined = [...records];
    
    // Merge custom records if any, deduplicating by _id
    customRecs.forEach(cr => {
      if (!combined.some(r => r._id === cr._id || (r.tienda === cr.tienda && r.fecha === cr.fecha))) {
        combined.push(cr);
      }
    });

    return combined;
  }, [records, seedData.auditorias]);

  // Helper to map store names to seed stores
  const storeMap = useMemo(() => {
    const map = new Map<string, DashboardTienda>();
    seedData.config.tiendas.forEach(t => {
      map.set(normalizeName(t.name), t);
      map.set(normalizeName(t.id), t);
    });
    return map;
  }, [seedData.config.tiendas]);

  // Determine supervisor for a store
  const getSupIdOfStore = (storeName: string): string => {
    const matched = storeMap.get(normalizeName(storeName));
    if (matched) return matched.sup;
    // Fallback search
    const norm = normalizeName(storeName);
    for (const t of seedData.config.tiendas) {
      if (norm.includes(normalizeName(t.name)) || normalizeName(t.name).includes(norm)) {
        return t.sup;
      }
    }
    return '';
  };

  // Determine critical status
  const getRecordStatus = (r: SavedAuditRecord): 'crit' | 'rev' | 'ok' => {
    const total = Number(r.total) || 0;
    const hasCritDev = (r.desvios || []).some(
      d => d.n === '2.6' || d.texto?.toLowerCase().includes('vencimiento') || d.texto?.toLowerCase().includes('crítico')
    );
    const hasCritFail = (r as any).critico || hasCritDev;

    if (hasCritFail || total < THR.critica) return 'crit';
    if (total >= THR.ok) return 'ok';
    return 'rev';
  };

  // Filter records by period and supervisor
  const periodFilteredRecords = useMemo(() => {
    return allRecords.filter(r => {
      const f = r.fecha || '';
      if (f < dateFrom || f >= dateTo) return false;
      if (selectedSup) {
        const supId = getSupIdOfStore(r.tienda);
        if (supId !== selectedSup && (r as any).supervisoraId !== selectedSup) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }, [allRecords, dateFrom, dateTo, selectedSup, storeMap]);

  // Store statuses calculated based on their last audit in period
  const storeStatusList = useMemo(() => {
    const tiendas = seedData.config.tiendas.filter(t => !selectedSup || t.sup === selectedSup);

    return tiendas.map(t => {
      const normT = normalizeName(t.name);
      const storeAudits = periodFilteredRecords.filter(r => {
        const normR = normalizeName(r.tienda);
        return normR === normT || normR.includes(normT) || normT.includes(normR);
      });

      const last = storeAudits[0] || null;
      const status: 'crit' | 'rev' | 'ok' | 'none' = last ? getRecordStatus(last) : 'none';

      return {
        tienda: t,
        last,
        auditCount: storeAudits.length,
        status
      };
    });
  }, [seedData.config.tiendas, selectedSup, periodFilteredRecords]);

  // Counts for tiles
  const counts = useMemo(() => {
    const c = { crit: 0, rev: 0, ok: 0, none: 0 };
    storeStatusList.forEach(s => c[s.status]++);
    const totalStores = storeStatusList.length;
    const audited = totalStores - c.none;
    const auditedPct = totalStores > 0 ? Math.round((audited / totalStores) * 100) : 0;
    return { ...c, totalStores, audited, auditedPct };
  }, [storeStatusList]);

  // Supervisora Summary Table Data
  const supervisorStats = useMemo(() => {
    return seedData.config.supervisoras
      .filter(s => !selectedSup || s.id === selectedSup)
      .map(sup => {
        const supStores = storeStatusList.filter(x => x.tienda.sup === sup.id);
        const k = { crit: 0, rev: 0, ok: 0, none: 0 };
        supStores.forEach(x => k[x.status]++);

        const auditedStores = supStores.filter(x => x.last);
        const avg = auditedStores.length
          ? auditedStores.reduce((acc, curr) => acc + Number(curr.last!.total), 0) / auditedStores.length
          : null;

        return {
          sup,
          total: supStores.length,
          audited: auditedStores.length,
          crit: k.crit,
          rev: k.rev,
          ok: k.ok,
          none: k.none,
          avg
        };
      })
      .filter(x => x.total > 0);
  }, [seedData.config.supervisoras, selectedSup, storeStatusList]);

  const supNameById = (id: string): string => {
    return seedData.config.supervisoras.find(s => s.id === id)?.name || 'Sin supervisora';
  };

  const supColorById = (id: string): string => {
    return SUPERVISOR_COLORS[id] || DEFAULT_SUP_COLOR;
  };

  // Group definitions for the store cards grid
  const groups: Array<{ key: 'crit' | 'rev' | 'ok' | 'none'; label: string; color: string; borderVar: string }> = [
    { key: 'crit', label: 'Críticas', color: 'var(--bad)', borderVar: 'var(--bad)' },
    { key: 'rev', label: 'Para revisión', color: 'var(--warn)', borderVar: 'var(--warn)' },
    { key: 'ok', label: 'OK', color: 'var(--ok)', borderVar: 'var(--ok)' },
    { key: 'none', label: 'Sin auditar', color: 'var(--fg-muted)', borderVar: 'var(--line)' }
  ];

  // Filtered stores to display
  const displayedGroups = groups.filter(g => dashFilter === 'all' || dashFilter === g.key);

  const PERIOD_OPTIONS = [
    { id: 'mes', label: 'Este mes' },
    { id: 'mesant', label: 'Mes anterior' },
    { id: '3m', label: 'Últimos 3 meses' },
    { id: 'todo', label: 'Todo el historial' },
  ] as const;

  return (
    <div className="dashboard-wrapper">
      {/* Primer Sección Unificada en un solo contenedor Card */}
      <section className="dash-overview-card card" aria-label="Resumen de Dashboard">
        {/* Dashboard Top Header */}
        <div className="dash-header-row">
          <div>
            <h2 className="dash-title">Dashboard de Auditorías</h2>
            <p className="dash-subtitle">
              Estado de cada tienda según su última auditoría: críticas, para revisión, OK y sin auditar.
            </p>
          </div>

          {/* Action Buttons: Load JSON & Export */}
          <div className="dash-actions-row">
            <label className="btn-dash-action" htmlFor="dashFileIn" title="Cargar archivo .json con auditorías">
              <Upload size={14} />
              <span>Cargar datos (.json)</span>
            </label>
            <input
              id="dashFileIn"
              type="file"
              accept=".json,application/json"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {toastMsg && (
          <div className={`dash-toast-banner ${toastMsg.isErr ? 'err' : 'ok'}`} role="status">
            {toastMsg.text}
          </div>
        )}

        {/* Filter Bar: Periodo y Supervisora con desplegables estilizados */}
        <div className="dash-filters-row">
          {/* Desplegable Período */}
          <div className="dash-filter-col">
            <label id="dPeriodoLabel">Período</label>
            <div className="dash-filter-dropdown-wrapper" ref={periodDropdownRef}>
              <button
                type="button"
                className={`dash-select-trigger ${isPeriodOpen ? 'is-open' : ''}`}
                onClick={() => {
                  setIsPeriodOpen(prev => !prev);
                  setIsSupOpen(false);
                }}
                aria-expanded={isPeriodOpen}
                aria-haspopup="listbox"
                aria-labelledby="dPeriodoLabel"
              >
                <div className="dash-select-trigger-left">
                  <Calendar size={15} className="dash-select-icon" />
                  <span className="dash-select-trigger-label">
                    {PERIOD_OPTIONS.find(p => p.id === periodo)?.label || 'Este mes'}
                  </span>
                </div>
                <ChevronDown size={14} className={`dash-select-chevron ${isPeriodOpen ? 'rotate' : ''}`} />
              </button>

              {isPeriodOpen && (
                <div className="dash-select-menu" role="listbox">
                  {PERIOD_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      role="option"
                      aria-selected={periodo === opt.id}
                      className={`dash-select-item ${periodo === opt.id ? 'is-selected' : ''}`}
                      onClick={() => {
                        setPeriodo(opt.id);
                        setIsPeriodOpen(false);
                      }}
                    >
                      <span className="dash-select-item-text">{opt.label}</span>
                      {periodo === opt.id && <Check size={14} className="selected-check" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desplegable Supervisora */}
          <div className="dash-filter-col">
            <label id="dSupLabel">Supervisora</label>
            <div className="dash-filter-dropdown-wrapper" ref={supDropdownRef}>
              <button
                type="button"
                className={`dash-select-trigger ${isSupOpen ? 'is-open' : ''} ${selectedSup ? 'has-filter' : ''}`}
                onClick={() => {
                  setIsSupOpen(prev => !prev);
                  setIsPeriodOpen(false);
                }}
                aria-expanded={isSupOpen}
                aria-haspopup="listbox"
                aria-labelledby="dSupLabel"
              >
                <div className="dash-select-trigger-left">
                  {selectedSup ? (
                    <i className="dash-dot" style={{ background: supColorById(selectedSup), marginRight: '4px' }} />
                  ) : (
                    <Users size={15} className="dash-select-icon" />
                  )}
                  <span className="dash-select-trigger-label">
                    {selectedSup ? supNameById(selectedSup) : 'Todas'}
                  </span>
                </div>
                <ChevronDown size={14} className={`dash-select-chevron ${isSupOpen ? 'rotate' : ''}`} />
              </button>

              {isSupOpen && (
                <div className="dash-select-menu" role="listbox" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedSup === ''}
                    className={`dash-select-item ${selectedSup === '' ? 'is-selected' : ''}`}
                    onClick={() => {
                      setSelectedSup('');
                      setIsSupOpen(false);
                    }}
                  >
                    <div className="dash-select-item-left">
                      <Users size={13} style={{ opacity: 0.7 }} />
                      <span className="dash-select-item-text">Todas las supervisoras</span>
                    </div>
                    {selectedSup === '' && <Check size={14} className="selected-check" />}
                  </button>

                  {seedData.config.supervisoras
                    .filter(s => seedData.config.tiendas.some(t => t.sup === s.id))
                    .map(s => (
                      <button
                        key={s.id}
                        type="button"
                        role="option"
                        aria-selected={selectedSup === s.id}
                        className={`dash-select-item ${selectedSup === s.id ? 'is-selected' : ''}`}
                        onClick={() => {
                          setSelectedSup(s.id);
                          setIsSupOpen(false);
                        }}
                      >
                        <div className="dash-select-item-left">
                          <i className="dash-dot" style={{ background: supColorById(s.id) }} />
                          <span className="dash-select-item-text">{s.name}</span>
                        </div>
                        {selectedSup === s.id && <Check size={14} className="selected-check" />}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPI Tiles */}
        <div className="dash-tiles-grid">
          <button
            type="button"
            className={`dash-tile t-all ${dashFilter === 'all' ? 'active' : ''}`}
            onClick={() => setDashFilter('all')}
          >
            <span className="dash-tile-label">Auditadas</span>
            <b className="dash-tile-val num">
              {counts.audited}
              <small>/ {counts.totalStores}</small>
            </b>
            <span className="dash-tile-sub">
              {counts.totalStores ? `${counts.auditedPct}% de las tiendas` : 'Sin tiendas'}
            </span>
          </button>

          <button
            type="button"
            className={`dash-tile t-crit ${dashFilter === 'crit' ? 'active' : ''}`}
            onClick={() => setDashFilter(dashFilter === 'crit' ? 'all' : 'crit')}
          >
            <span className="dash-tile-label">Críticas</span>
            <b className="dash-tile-val num">{counts.crit}</b>
            <span className="dash-tile-sub">menos de {THR.critica} o ítem 2.6</span>
          </button>

          <button
            type="button"
            className={`dash-tile t-rev ${dashFilter === 'rev' ? 'active' : ''}`}
            onClick={() => setDashFilter(dashFilter === 'rev' ? 'all' : 'rev')}
          >
            <span className="dash-tile-label">Para revisión</span>
            <b className="dash-tile-val num">{counts.rev}</b>
            <span className="dash-tile-sub">de {THR.critica} a {f2(THR.ok - 0.01)}</span>
          </button>

          <button
            type="button"
            className={`dash-tile t-ok ${dashFilter === 'ok' ? 'active' : ''}`}
            onClick={() => setDashFilter(dashFilter === 'ok' ? 'all' : 'ok')}
          >
            <span className="dash-tile-label">OK</span>
            <b className="dash-tile-val num">{counts.ok}</b>
            <span className="dash-tile-sub">{THR.ok} puntos o más</span>
          </button>

          <button
            type="button"
            className={`dash-tile t-none ${dashFilter === 'none' ? 'active' : ''}`}
            onClick={() => setDashFilter(dashFilter === 'none' ? 'all' : 'none')}
          >
            <span className="dash-tile-label">Sin auditar</span>
            <b className="dash-tile-val num">{counts.none}</b>
            <span className="dash-tile-sub">en el período</span>
          </button>
        </div>

        {/* Coverage Progress Bar & Legend */}
        {counts.totalStores > 0 && (
          <div className="dash-coverage-block">
            <div className="dash-coverage-bar" role="img" aria-label="Distribución de auditorías">
              <span
                style={{
                  width: `${(counts.crit / counts.totalStores) * 100}%`,
                  background: 'var(--bad)'
                }}
              />
              <span
                style={{
                  width: `${(counts.rev / counts.totalStores) * 100}%`,
                  background: 'var(--warn)'
                }}
              />
              <span
                style={{
                  width: `${(counts.ok / counts.totalStores) * 100}%`,
                  background: 'var(--ok)'
                }}
              />
            </div>

            <div className="dash-coverage-legend num">
              <span>
                <i className="dash-dot" style={{ background: 'var(--bad)' }} />
                Críticas <b>{counts.crit}</b>
              </span>
              <span>
                <i className="dash-dot" style={{ background: 'var(--warn)' }} />
                Revisión <b>{counts.rev}</b>
              </span>
              <span>
                <i className="dash-dot" style={{ background: 'var(--ok)' }} />
                OK <b>{counts.ok}</b>
              </span>
              <span>
                <i className="dash-dot" style={{ background: 'var(--surface-3)', border: '1px solid var(--line-strong)' }} />
                Sin auditar <b>{counts.none}</b>
              </span>
            </div>

            <div className="dash-threshold-notes">
              <span>Se toma la última auditoría de cada tienda en el período.</span>
              <span><b style={{ color: 'var(--ok)' }}>OK</b>: {THR.ok} o más</span>
              <span><b style={{ color: 'var(--warn)' }}>Revisión</b>: {THR.critica} a {f2(THR.ok - 0.01)}</span>
              <span><b style={{ color: 'var(--bad)' }}>Crítica</b>: menos de {THR.critica} o falla ítem 2.6</span>
            </div>
          </div>
        )}
      </section>

      {/* Store Cards by Status */}
      <div className="dash-status-sections">
        {displayedGroups.map(group => {
          const items = storeStatusList
            .filter(x => x.status === group.key)
            .sort((a, b) => {
              if (group.key === 'none') return a.tienda.name.localeCompare(b.tienda.name);
              return Number(a.last?.total || 0) - Number(b.last?.total || 0);
            });

          if (!items.length) {
            if (dashFilter === group.key) {
              return (
                <div key={group.key} className="dash-group-section">
                  <div className="dash-group-header">
                    <h3 style={{ color: group.color }}>{group.label}</h3>
                    <span className="dash-group-empty">ninguna</span>
                  </div>
                </div>
              );
            }
            return null;
          }

          return (
            <div key={group.key} className="dash-group-section">
              <div className="dash-group-header">
                <h3 style={{ color: group.color }}>{group.label}</h3>
                <span className="dash-group-count num">
                  {items.length} {items.length === 1 ? 'tienda' : 'tiendas'}
                </span>
              </div>

              {group.key === 'none' ? (
                <div className="dash-none-grid">
                  {items.map(x => (
                    <span key={x.tienda.id} className="dash-none-chip">
                      <i className="dash-dot" style={{ background: supColorById(x.tienda.sup) }} />
                      {x.tienda.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="dash-stores-grid">
                  {items.map(x => {
                    const r = x.last!;
                    const devs = (r.desvios || [])
                      .slice()
                      .sort((a, b) => (b.ideal - b.real) - (a.ideal - a.real))
                      .slice(0, 3);

                    const statusClass = group.key;

                    return (
                      <div key={x.tienda.id} className={`dash-store-card ${statusClass}`}>
                        <div className="dash-store-card-head">
                          <div>
                            <div className="dash-store-name">
                              {x.tienda.name}
                              {(x.tienda.tags || []).map(tag => (
                                <span key={tag} className="tag-mini">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="dash-store-sup">
                              <i className="dash-dot" style={{ background: supColorById(x.tienda.sup) }} />
                              {supNameById(x.tienda.sup)}
                            </div>
                          </div>

                          <div className={`dash-store-score num ${statusClass}`}>
                            {f2(r.total)}
                          </div>
                        </div>

                        <div className="dash-store-meta num">
                          <span>{fmtDate(r.fecha)}</span>
                          <span>·</span>
                          <span>{r.auditMode === 'experience' ? '✨ Experience' : 'Normal'}</span>
                          <span>·</span>
                          <span>{r.auditor || 'Sin auditor'}</span>
                          {(r as any).critico && (
                            <b style={{ color: 'var(--bad)', marginLeft: '4px' }}>· falla ítem 2.6</b>
                          )}
                          {!r.completa && (
                            <span className="tag-mini warn" style={{ marginLeft: '4px' }}>
                              Incompleta
                            </span>
                          )}
                          {x.auditCount > 1 && (
                            <span style={{ color: 'var(--fg-muted)', marginLeft: '4px' }}>
                              ({x.auditCount} auditorías)
                            </span>
                          )}
                        </div>

                        {devs.length > 0 && group.key !== 'ok' && (
                          <ul className="dash-store-devs">
                            {devs.map((d, dIdx) => (
                              <li key={dIdx}>
                                <b>{d.n}</b> {d.texto.length > 68 ? `${d.texto.slice(0, 68)}…` : d.texto}{' '}
                                <span className="num" style={{ color: 'var(--fg-muted)' }}>
                                  ({f2(d.real)}/{f2(d.ideal)})
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="dash-store-actions">
                          <button
                            type="button"
                            className="btn-dash-open"
                            onClick={() => {
                              if (onSelectAudit) onSelectAudit(r);
                              else setInspectAudit(r);
                            }}
                          >
                            Ver auditoría
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Por Supervisora Table */}
      <div className="dash-section-divider">
        <h3 className="dash-sub-heading">Rendimiento por Supervisora</h3>
      </div>

      <div className="tbl-wrap card dash-table-card">
        <table className="dash-sup-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Supervisora</th>
              <th>Tiendas</th>
              <th>Auditadas</th>
              <th>Críticas</th>
              <th>Revisión</th>
              <th>OK</th>
              <th>Sin auditar</th>
              <th>Promedio</th>
            </tr>
          </thead>
          <tbody>
            {supervisorStats.map(row => (
              <tr key={row.sup.id}>
                <td style={{ textAlign: 'left', fontWeight: 600 }}>
                  <i className="dash-dot" style={{ background: supColorById(row.sup.id) }} />
                  {row.sup.name}
                </td>
                <td className="num">{row.total}</td>
                <td className="num">{row.audited}</td>
                <td className={`num ${row.crit ? 'c-bad' : ''}`}>{row.crit}</td>
                <td className={`num ${row.rev ? 'c-warn' : ''}`}>{row.rev}</td>
                <td className={`num ${row.ok ? 'c-ok' : ''}`}>{row.ok}</td>
                <td className="num" style={{ color: 'var(--fg-muted)' }}>{row.none}</td>
                <td className="num" style={{ fontWeight: 700 }}>
                  {row.avg != null ? f2(row.avg) : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal to inspect audit details */}
      {inspectAudit && (
        <div className="modal-backdrop" onClick={() => setInspectAudit(null)}>
          <div className="modal-card card" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{inspectAudit.tienda}</h3>
                <p className="modal-subtitle">
                  {fmtDate(inspectAudit.fecha)} · Auditor/a: {inspectAudit.auditor || 'Sin auditor'}
                </p>
              </div>
              <button
                type="button"
                className="icon-btn-subtle"
                onClick={() => setInspectAudit(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span className="num" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                  {f2(inspectAudit.total)} <small style={{ fontSize: '1rem', color: 'var(--fg-muted)' }}>/ 100</small>
                </span>
                <span className={`pill ${inspectAudit.total >= 85 ? 'ok' : inspectAudit.total >= 70 ? 'warn' : 'bad'}`}>
                  {inspectAudit.estado || (inspectAudit.total >= 85 ? 'Aprobada' : 'No aprobada')}
                </span>
              </div>

              {/* Segment breakdown */}
              <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: '8px' }}>
                Puntaje por fase
              </h4>
              <div className="tbl-wrap" style={{ marginBottom: '16px' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Fase</th>
                      <th>Ideal</th>
                      <th>Real</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(inspectAudit.segmentos || []).map((s, sIdx) => (
                      <tr key={sIdx}>
                        <td style={{ textAlign: 'left' }}>{s.n}. {s.nombre}</td>
                        <td className="num">{f2(s.ideal)}</td>
                        <td className="num">{f2(s.real)}</td>
                        <td className="num">{s.ideal > 0 ? (s.real / s.ideal * 100).toFixed(0) : '0'}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Deviations */}
              <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: '8px' }}>
                Desvíos ({inspectAudit.desvios?.length || 0})
              </h4>
              {(!inspectAudit.desvios || inspectAudit.desvios.length === 0) ? (
                <p style={{ color: 'var(--fg-muted)', fontSize: '0.9rem' }}>Sin desvíos registrados.</p>
              ) : (
                <ul className="dash-store-devs" style={{ listStyle: 'none', padding: 0 }}>
                  {inspectAudit.desvios.map((d, dIdx) => (
                    <li key={dIdx} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                      <b>{d.n}</b> {d.texto}{' '}
                      <span className="num" style={{ color: 'var(--warn)' }}>({f2(d.real)}/{f2(d.ideal)})</span>
                      {d.obs && <div style={{ fontSize: '0.8rem', color: 'var(--fg-muted)', marginTop: '2px' }}>Obs: {d.obs}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setInspectAudit(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
