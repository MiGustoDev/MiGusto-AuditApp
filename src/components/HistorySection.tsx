import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { SavedAuditRecord } from '../types/audit';
import { f2, fmtDate } from '../utils/formatters';
import { TOTAL_ITEMS, PASS_SCORE } from '../data/segments';
import { 
  Search, 
  Store, 
  User, 
  Calendar, 
  Copy, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet
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
  isAdmin,
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
        { opacity: 0, y: 10, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, stagger: 0.035, ease: 'power2.out' }
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
                    {/* Segment scores mini table */}
                    <div className="hist-details-table-wrap">
                      <table className="hist-table">
                        <thead>
                          <tr>
                            <th>Segmento</th>
                            <th className="num-col">Ideal</th>
                            <th className="num-col">Real</th>
                            <th className="num-col">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(r.segmentos || []).map(s => (
                            <tr key={s.n}>
                              <td>{s.n}. {s.nombre}</td>
                              <td className="num-col num">{f2(s.ideal)}</td>
                              <td className="num-col num font-bold">{f2(s.real)}</td>
                              <td className="num-col num">
                                {s.ideal ? ((s.real / s.ideal) * 100).toFixed(0) : '0'}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

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
                        <h4 className="hist-subhead">Fotos adjuntas ({r.fotos.length})</h4>
                        <div className="hist-photos-grid">
                          {r.fotos.map((p, idx) => {
                            const src = resolvePhotoSrc(p.id);
                            return (
                              <div key={idx} className="hist-photo-item" onClick={() => onViewPhoto(src)}>
                                <img src={src} alt={`Ítem ${p.n}`} loading="lazy" />
                                <span className="hist-photo-label">Ítem {p.n}</span>
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
                        className="btn btn-sm btn-outline"
                        onClick={() => onCopyText(r.resumen || '')}
                      >
                        <Copy size={14} />
                        <span>Copiar resumen</span>
                      </button>

                      {isAdmin && r._id && (
                        confirmDeleteId !== r._id ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-danger-subtle"
                            onClick={() => setConfirmDeleteId(r._id!)}
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
                              disabled={deletingId === r._id}
                              onClick={() => handleDelete(r._id!)}
                            >
                              {deletingId === r._id ? 'Eliminando...' : 'Sí, eliminar'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Cancelar
                            </button>
                          </div>
                        )
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
