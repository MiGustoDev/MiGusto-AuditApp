import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { SavedAuditRecord } from '../types/audit';
import { f2, fmtDate, generateRecordSummaryText } from '../utils/formatters';
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
  ArrowLeft
} from 'lucide-react';

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
  onDeleteRecord,
  onCopyText,
  onViewPhoto
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const q = searchTerm.trim().toLowerCase();
  const filteredList = records.filter(
    r =>
      !q ||
      (r.tienda || '').toLowerCase().includes(q) ||
      (r.auditor || '').toLowerCase().includes(q) ||
      (r.fecha || '').includes(q)
  );

  useEffect(() => {
    if (listRef.current && filteredList.length > 0) {
      gsap.fromTo(
        listRef.current.querySelectorAll('.history-card'),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.035, ease: 'power2.out', clearProps: 'all' }
      );
    }
  }, [filteredList.length, searchTerm]);

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

  return (
    <section className="history-wrapper card" aria-label="Historial de auditorías">
      {/* Subtle Volver button placed above Historial de Auditorías */}
      {expandedId && (
        <div className="subtle-back-top-bar animate-fade-in">
          <button
            type="button"
            className="btn-subtle-back"
            onClick={() => setExpandedId(null)}
          >
            <ArrowLeft size={14} />
            <span>Volver al historial</span>
          </button>
        </div>
      )}

      <div className="section-header-row">
        <div>
          <h2 className="section-title">Historial de Auditorías</h2>
          <p className="section-subtitle">Consultá los informes operativos anteriores guardados en el sistema.</p>
        </div>
        <span className="history-count-badge num">
          {records.length} {records.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {/* Search Bar */}
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
            <p>No se encontraron auditorías para "{searchTerm}".</p>
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
                    <div className="hist-store-name">
                      <Store size={16} className="hist-icon" />
                      <span>{r.tienda || 'Sucursal no identificada'}</span>
                    </div>

                    <div className="hist-meta-chips num">
                      <span className="hist-meta-item">
                        <Calendar size={13} /> {fmtDate(r.fecha)}
                      </span>
                      <span className="hist-meta-item">
                        <User size={13} /> {r.auditor || 'Sin auditor'}
                      </span>
                      {!r.completa && (
                        <span className="hist-incomplete-badge">
                          Incompleta ({r.evaluados || 0}/{TOTAL_ITEMS})
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
                    {/* Top bar to return to collapsed history list */}
                    <div className="hist-back-nav-row">
                      <button
                        type="button"
                        className="btn-hist-back"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(null);
                        }}
                      >
                        <ArrowLeft size={16} />
                        <span>Volver</span>
                      </button>
                    </div>

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
                        <p className="hist-clean-note">✓ Sin desvíos registrados</p>
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
                        className="btn btn-sm btn-secondary-mail"
                        onClick={() => {
                          const emailText = generateRecordSummaryText(r);
                          onCopyText(emailText);
                        }}
                      >
                        <Mail size={15} />
                        <span>Copiar para mail</span>
                      </button>

                      {confirmDeleteId !== id ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger-subtle"
                          onClick={() => setConfirmDeleteId(id)}
                        >
                          <Trash2 size={14} />
                          <span>Eliminar registro</span>
                        </button>
                      ) : (
                        <div className="confirm-delete-row">
                          <span className="confirm-txt">¿Eliminar definitivamente?</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            disabled={deletingId === id}
                            onClick={() => handleDelete(id)}
                          >
                            {deletingId === id ? 'Eliminando...' : 'Sí, eliminar'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
