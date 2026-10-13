import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { SavedAuditRecord } from '../types/audit';
import { f2, fmtDate, generateRecordSummaryText, generateRecordSummaryHtml } from '../utils/formatters';
import { TOTAL_ITEMS, PASS_SCORE } from '../data/segments';
import { downloadAuditPDF } from '../utils/pdfExport';
import { AuditCharts } from './AuditCharts';
import { 
  Search, 
  Store, 
  User, 
  Calendar, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Mail,
  Check,
  Filter,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';

export type HistoryFilterType = 'todos' | 'normal' | 'experience' | 'incompleta' | 'aprobada' | 'no_aprobada';

interface FilterOptionConfig {
  id: HistoryFilterType;
  label: string;
  badgeClass: string;
  icon?: React.ReactNode;
}

const FILTER_OPTIONS: FilterOptionConfig[] = [
  { id: 'todos', label: 'Todos', badgeClass: 'tag-todos', icon: <SlidersHorizontal size={13} /> },
  { id: 'normal', label: 'Normal', badgeClass: 'tag-normal' },
  { id: 'experience', label: 'Experience', badgeClass: 'tag-experience', icon: <Sparkles size={12} /> },
  { id: 'incompleta', label: 'Incompleta', badgeClass: 'tag-incomplete', icon: <AlertCircle size={12} /> },
  { id: 'aprobada', label: 'Aprobada', badgeClass: 'tag-approved', icon: <CheckCircle2 size={12} /> },
  { id: 'no_aprobada', label: 'No aprobada', badgeClass: 'tag-rejected', icon: <AlertCircle size={12} /> },
];

interface HistorySectionProps {
  records: SavedAuditRecord[];
  loading: boolean;
  isAdmin: boolean;
  onDeleteRecord: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onCopyText: (text: string) => void;
  onViewPhoto: (photoSrc: string) => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  records,
  loading,
  isAdmin,
  onDeleteRecord,
  onCopyText,
  onViewPhoto
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<HistoryFilterType>('todos');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedMailId, setCopiedMailId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleCopyEmail = async (r: SavedAuditRecord, id: string) => {
    const plainText = generateRecordSummaryText(r);
    const htmlText = generateRecordSummaryHtml(r);

    let copied = false;
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
      try {
        const item = new ClipboardItem({
          'text/html': new Blob([htmlText], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' })
        });
        await navigator.clipboard.write([item]);
        copied = true;
      } catch (err) {
        console.warn('ClipboardItem write falló, intentando fallback:', err);
      }
    }

    if (!copied) {
      try {
        await navigator.clipboard.writeText(plainText);
        copied = true;
      } catch (e) {
        onCopyText(plainText);
        return;
      }
    }

    setCopiedMailId(id);
    setTimeout(() => {
      setCopiedMailId(prev => (prev === id ? null : prev));
    }, 2500);

    // Disparar toast informativo
    onCopyText('¡Informe con gráficos copiado para mail! Ya podés pegarlo en tu correo.');
  };

  const isRecordApproved = (r: SavedAuditRecord): boolean => {
    const s = (r.estado || '').toLowerCase();
    if (s.startsWith('no')) return false;
    if (s.includes('aprob') || s.includes('aprue')) return true;
    return (r.total || 0) >= PASS_SCORE;
  };

  const q = searchTerm.trim().toLowerCase();
  const filteredList = records.filter(r => {
    // 1. Text search
    const matchesSearch =
      !q ||
      (r.tienda || '').toLowerCase().includes(q) ||
      (r.auditor || '').toLowerCase().includes(q) ||
      (r.fecha || '').includes(q);
    if (!matchesSearch) return false;

    // 2. Dropdown filter
    switch (selectedFilter) {
      case 'normal':
        return r.auditMode !== 'experience';
      case 'experience':
        return r.auditMode === 'experience';
      case 'incompleta':
        return !r.completa;
      case 'aprobada':
        return isRecordApproved(r);
      case 'no_aprobada':
        return !isRecordApproved(r);
      case 'todos':
      default:
        return true;
    }
  });

  useEffect(() => {
    if (listRef.current && filteredList.length > 0) {
      gsap.fromTo(
        listRef.current.querySelectorAll('.history-card'),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.035, ease: 'power2.out', clearProps: 'all' }
      );
    }
  }, [filteredList.length, searchTerm, selectedFilter]);

  const getStatusClass = (estado?: string): 'bad' | 'ok' | 'warn' => {
    const s = (estado || '').toLowerCase();
    if (s.startsWith('no')) return 'bad';
    if (s.includes('aprob') || s.includes('aprue')) return 'ok';
    return 'warn';
  };

  const resolvePhotoSrc = (id: string) => {
    if (id.startsWith('data:') || id.startsWith('http://') || id.startsWith('https://') || id.startsWith('blob:')) {
      return id;
    }
    return `/_blob/${id}`;
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDeleteRecord(id);
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFilterOpen) {
          setIsFilterOpen(false);
        } else if (confirmDeleteId && !deletingId) {
          setConfirmDeleteId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFilterOpen, confirmDeleteId, deletingId]);

  const recordToDelete = confirmDeleteId
    ? records.find(r => (r._id || `${r.fecha}-${r.tienda}`) === confirmDeleteId)
    : null;

  const activeFilterOption = FILTER_OPTIONS.find(o => o.id === selectedFilter) || FILTER_OPTIONS[0];

  return (
    <section className="history-wrapper card" aria-label="Historial de auditorías">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">Historial de Auditorías</h2>
          <p className="section-subtitle">Consultá los informes operativos anteriores guardados en el sistema.</p>
        </div>
        <span className="history-count-badge num">
          {records.length === 0 ? (
            '0 registros'
          ) : filteredList.length === records.length ? (
            `${records.length} ${records.length === 1 ? 'registro' : 'registros'}`
          ) : (
            `${filteredList.length} de ${records.length} registros`
          )}
        </span>
      </div>

      {/* Search Bar & Dropdown Filter */}
      <div className="history-search-container">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            id="histFilter"
            type="search"
            placeholder="Buscar por tienda, auditor o fecha..."
            aria-label="Buscar en auditorías guardadas"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Dropdown */}
        <div className="hist-filter-dropdown-wrapper" ref={filterDropdownRef}>
          <button
            type="button"
            className={`hist-filter-trigger ${isFilterOpen ? 'is-open' : ''} ${selectedFilter !== 'todos' ? 'has-filter' : ''}`}
            onClick={() => setIsFilterOpen(prev => !prev)}
            aria-expanded={isFilterOpen}
            aria-haspopup="listbox"
            aria-label="Filtrar auditorías"
          >
            <div className="hist-filter-trigger-content">
              <Filter size={14} className="hist-filter-trigger-icon" />
              {selectedFilter === 'todos' ? (
                <span className="hist-filter-trigger-label">Filtro</span>
              ) : (
                <span className={`hist-filter-tag ${activeFilterOption.badgeClass} hist-filter-trigger-pill`}>
                  {activeFilterOption.icon}
                  <span>{activeFilterOption.label}</span>
                </span>
              )}
            </div>
            <ChevronDown size={14} className={`hist-filter-chevron ${isFilterOpen ? 'rotate' : ''}`} />
          </button>

          {isFilterOpen && (
            <div className="hist-filter-menu" role="listbox">
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={selectedFilter === opt.id}
                  className={`hist-filter-item ${selectedFilter === opt.id ? 'is-selected' : ''}`}
                  onClick={() => {
                    setSelectedFilter(opt.id);
                    setIsFilterOpen(false);
                  }}
                >
                  <div className="hist-filter-item-left">
                    <span className={`hist-filter-tag ${opt.badgeClass}`}>
                      {opt.icon}
                      <span>{opt.label}</span>
                    </span>
                  </div>
                  {selectedFilter === opt.id && <Check size={14} className="selected-check" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* List / Cards */}
      <div ref={listRef} className="history-list-container">
        {loading ? (
          <div className="history-loading-state">
            <div className="spinner-sm"></div>
            <span>Cargando auditorías guardadas...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="history-empty-state">
            <FileSpreadsheet size={42} className="empty-icon-subtle" />
            <h4>No hay auditorías registradas todavía</h4>
            <p>Al finalizar una evaluación, tocá <b>Guardar auditoría</b> para conservarla en este historial.</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="history-empty-state">
            <Search size={36} className="empty-icon-subtle" />
            <h4>Sin coincidencias</h4>
            <p>
              {searchTerm && selectedFilter !== 'todos'
                ? `No se encontraron auditorías para "${searchTerm}" con el filtro "${activeFilterOption.label}".`
                : searchTerm
                ? `No se encontraron auditorías para "${searchTerm}".`
                : `No se encontraron auditorías con el filtro "${activeFilterOption.label}".`}
            </p>
            {(searchTerm || selectedFilter !== 'todos') && (
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                style={{ marginTop: '12px' }}
                onClick={() => {
                  setSearchTerm('');
                  setSelectedFilter('todos');
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          filteredList.map(r => {
            const cls = getStatusClass(r.estado);
            const id = r._id || `${r.fecha}-${r.tienda}`;
            const isExpanded = expandedId === id;
            const isApproved = (r.total || 0) >= PASS_SCORE;

            return (
              <div className={`history-card ${cls} ${isExpanded ? 'is-open' : ''}`} key={id}>
                <div 
                  className="history-card-summary"
                  onClick={() => setExpandedId(isExpanded ? null : id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="hist-main-info">
                    <div className="hist-store-row">
                      <div className="hist-store-name">
                        <Store size={16} className="hist-icon" />
                        <span className="hist-store-title">{r.tienda || 'Sucursal no identificada'}</span>
                      </div>

                      {r.auditMode === 'experience' ? (
                        <span className="hist-mode-pill experience" title="Auditoría Mi Gusto Experience">
                          ✨ Experience
                        </span>
                      ) : (
                        <span className="hist-mode-pill normal" title="Auditoría Estándar">
                          Normal
                        </span>
                      )}
                    </div>

                    <div className="hist-meta-chips num">
                      <span className="hist-meta-item">
                        <Calendar size={13} /> <span>{fmtDate(r.fecha)}</span>
                      </span>
                      <span className="hist-meta-item hist-auditor-item">
                        <User size={13} /> <span className="hist-auditor-name">{r.auditor || 'Sin auditor'}</span>
                      </span>
                      {!r.completa && (
                        <span className="hist-incomplete-badge">
                          Incompleta ({r.evaluados || 0}/{r.auditMode === 'experience' ? 70 : TOTAL_ITEMS})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hist-score-col">
                    <div className="hist-score-val num">
                      <span className={`score-tag ${cls}`}>{f2(r.total)}</span>
                      <small>/100</small>
                    </div>

                    <span className={`status-badge-sm ${cls}`}>
                      {cls === 'ok' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      {r.estado || (isApproved ? 'Aprobado' : 'No Aprobado')}
                    </span>

                    <button 
                      type="button" 
                      className="hist-chevron-btn"
                      aria-label={isExpanded ? "Ocultar detalle" : "Ver detalle"}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="history-card-details animate-slide-down">
                    {/* FULL CHARTS & EXECUTIVE ANALYTICS COMPONENT */}
                    <AuditCharts
                      summary={{
                        total: r.total || 0,
                        done: r.evaluados || 180,
                        pendingIdeal: 0,
                        maxPossible: 100,
                        isComplete: r.completa ?? true,
                        rows: (r.segmentos || []).map((s, idx) => ({
                          seg: { name: s.nombre, short: s.nombre, items: [] },
                          si: idx,
                          ideal: s.ideal,
                          real: s.real,
                          pct: s.ideal ? (s.real / s.ideal) * 100 : 0,
                          segDone: 1
                        })),
                        devs: (r.desvios || []).map(d => ({
                          k: d.n,
                          n: d.n,
                          t: d.texto,
                          a: { s: 'no', o: d.obs },
                          ideal: d.ideal,
                          got: d.real
                        })),
                        statusClass: (r.total || 0) >= PASS_SCORE ? 'ok' : 'bad',
                        statusLabel: r.estado || ((r.total || 0) >= PASS_SCORE ? 'Dictamen Operativo: APROBADO' : 'Dictamen Operativo: NO APROBADO'),
                        verdictTitle: r.estado || ((r.total || 0) >= PASS_SCORE ? 'APROBADO' : 'NO APROBADO'),
                        verdictText: ''
                      }}
                      storeName={r.tienda}
                      auditorName={r.auditor}
                    />



                    {/* Deviations */}
                    <div className="hist-deviations-block">
                      <h4 className="hist-subhead">Desvíos detectados</h4>
                      {r.desvios && r.desvios.length > 0 ? (
                        <div className="hist-devs-list">
                          {r.desvios.map(d => (
                            <div key={d.n} className="hist-dev-item">
                              <span className="dev-n-tag">{d.n}</span>
                              <div className="dev-text-group">
                                <p className="dev-main-desc">
                                  <b>({f2(d.real)} de {f2(d.ideal)} pts)</b> {d.texto}
                                </p>
                                {d.obs && <p className="dev-obs-text">Obs: {d.obs}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="hist-clean-note">
                          <Check size={16} className="clean-check-green" />
                          <span>Sin desvíos registrados</span>
                        </p>
                      )}
                    </div>

                    {/* Photos */}
                    {r.fotos && r.fotos.length > 0 && (
                      <div className="hist-photos-block">
                        <h4 className="hist-subhead">Fotos adjuntas de evidencia ({r.fotos.length})</h4>
                        <div className="hist-photos-grid">
                          {r.fotos.map((p, idx) => {
                            const src = resolvePhotoSrc(p.id);
                            return (
                              <div 
                                key={idx} 
                                className="hist-photo-item" 
                                onClick={() => onViewPhoto(src)}
                                title={`Click para ver foto completa de Ítem ${p.n}: ${p.texto || ''}`}
                              >
                                <img src={src} alt={`Ítem ${p.n} - ${p.texto || ''}`} loading="lazy" />
                                <div className="hist-photo-label-box">
                                  <span className="hist-photo-item-badge">Ítem {p.n}</span>
                                  {p.texto && <span className="hist-photo-item-desc">{p.texto}</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Operational Notes */}
                    <div className="hist-footer-meta">
                      <span>Personal a cargo: <b>{r.personalACargo || '-'}</b></span>
                      <span className="dot-sep">·</span>
                      <span>Colaboradores: <b>{r.colaboradores || '-'}</b></span>
                      <span className="dot-sep">·</span>
                      <span>Unidades vendidas: <b>{r.unidades || '-'}</b></span>
                    </div>

                    {/* Actions */}
                    <div className="hist-actions-bar">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary-pdf"
                        onClick={() => {
                          downloadAuditPDF({
                            tienda: r.tienda || 'Sucursal',
                            auditor: r.auditor || 'Auditor',
                            fecha: r.fecha || '',
                            total: r.total || 0,
                            estado: r.estado || 'NO APROBADO',
                            desvios: r.desvios,
                            segmentos: r.segmentos,
                            fotos: r.fotos,
                            personalACargo: r.personalACargo,
                            colaboradores: r.colaboradores,
                            unidades: r.unidades
                          });
                        }}
                      >
                        <FileText size={15} />
                        <span>Descargar PDF</span>
                      </button>

                      <button
                        type="button"
                        className={`btn btn-sm btn-secondary-mail ${copiedMailId === id ? 'is-copied' : ''}`}
                        onClick={() => handleCopyEmail(r, id)}
                        title="Copiar informe completo con diseño y gráficos para pegar en el mail"
                      >
                        {copiedMailId === id ? <Check size={15} /> : <Mail size={15} />}
                        <span>{copiedMailId === id ? '¡Copiado para mail!' : 'Copiar para mail'}</span>
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger-subtle"
                          onClick={() => setConfirmDeleteId(id)}
                        >
                          <Trash2 size={14} />
                          <span>Eliminar registro</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal de confirmación para eliminar registro (solo si es Admin) */}
      {isAdmin && confirmDeleteId && (
        <div
          className="delete-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deletingId) {
              setConfirmDeleteId(null);
            }
          }}
        >
          <div className="delete-modal-card">
            <div className="delete-modal-icon-wrap">
              <Trash2 size={30} className="delete-modal-icon" />
            </div>

            <h3 className="delete-modal-title">¿Seguro que desea eliminar de forma permanente este registro?</h3>

            <p className="delete-modal-subtitle">
              {recordToDelete ? (
                <>
                  Auditoría de <strong>{recordToDelete.tienda || 'Sucursal'}</strong>{' '}
                  {recordToDelete.fecha ? `(${fmtDate(recordToDelete.fecha)})` : ''}.<br />
                </>
              ) : null}
              Esta acción no se puede deshacer.
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn-delete-modal-confirm"
                disabled={Boolean(deletingId)}
                onClick={() => handleDelete(confirmDeleteId)}
              >
                <Trash2 size={16} />
                <span>{deletingId ? 'Eliminando...' : 'Sí, eliminar'}</span>
              </button>

              <button
                type="button"
                className="btn-delete-modal-cancel"
                disabled={Boolean(deletingId)}
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
