import React, { useState } from 'react';
import { SavedAuditRecord } from '../types/audit';
import { f2, fmtDate } from '../utils/formatters';
import { TOTAL_ITEMS } from '../data/segments';

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

  const q = searchTerm.trim().toLowerCase();
  const filteredList = records.filter(
    r =>
      !q ||
      (r.tienda || '').toLowerCase().includes(q) ||
      (r.auditor || '').toLowerCase().includes(q)
  );

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
    <>
      <h2 id="historial">Auditorías guardadas</h2>
      <div className="hist-tools">
        <input
          id="histFilter"
          type="search"
          placeholder="Buscar por tienda o auditor"
          aria-label="Buscar en auditorías guardadas"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <span className="hist-count num" id="histCount">
          {records.length > 0 ? `${filteredList.length} de ${records.length}` : ''}
        </span>
      </div>

      <div id="histList">
        {loading ? (
          <p className="note" id="histEmpty">
            Cargando auditorías guardadas…
          </p>
        ) : records.length === 0 ? (
          <p className="note">
            Todavía no hay auditorías guardadas. Al terminar una, tocá <b>Guardar auditoría</b> y aparece acá.
          </p>
        ) : filteredList.length === 0 ? (
          <p className="note">No hay auditorías que coincidan con la búsqueda.</p>
        ) : (
          filteredList.map(r => {
            const cls = getStatusClass(r.estado);
            const id = r._id || `${r.fecha}-${r.tienda}`;

            return (
              <details className="rec" key={id} data-id={id}>
                <summary>
                  <span className="rec-store">{r.tienda || 'Sin nombre'}</span>
                  <span className="rec-score num" style={{ color: `var(--${cls})` }}>
                    {f2(r.total)}
                  </span>
                  <span className="rec-meta num">
                    {fmtDate(r.fecha)} · {r.auditor || 'Sin auditor'}
                    {!r.completa && ` · incompleta (${r.evaluados}/${TOTAL_ITEMS})`}
                  </span>
                  <span
                    className={`pill ${cls}`}
                    style={{ fontSize: '.78rem', padding: '3px 9px', justifySelf: 'end' }}
                  >
                    {r.estado}
                  </span>
                </summary>

                <div className="rec-body">
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Segmento</th>
                          <th>Ideal</th>
                          <th>Real</th>
                          <th>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(r.segmentos || []).map(s => (
                          <tr key={s.n}>
                            <td>
                              {s.n}. {s.nombre}
                            </td>
                            <td>{f2(s.ideal)}</td>
                            <td>{f2(s.real)}</td>
                            <td>{s.ideal ? ((s.real / s.ideal) * 100).toFixed(1) : '0.0'}%</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td>Total</td>
                          <td>100.00</td>
                          <td>{f2(r.total)}</td>
                          <td>{Number(r.total).toFixed(1)}%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div>
                    <b>Desvíos</b>
                    {r.desvios && r.desvios.length > 0 ? (
                      <ol className="devs">
                        {r.desvios.map(d => (
                          <li key={d.n}>
                            <b>{d.n}</b> ({f2(d.real)} de {f2(d.ideal)}) {d.texto}
                            {d.obs && <div className="sm">Obs.: {d.obs}</div>}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="note">Sin desvíos.</p>
                    )}
                  </div>

                  {r.fotos && r.fotos.length > 0 && (
                    <div>
                      <b>Fotos ({r.fotos.length})</b>
                      <div className="gallery" style={{ marginTop: '8px' }}>
                        {r.fotos.map((p, idx) => {
                          const src = resolvePhotoSrc(p.id);
                          return (
                            <figure key={idx}>
                              <button
                                type="button"
                                className="photo-view"
                                onClick={() => onViewPhoto(src)}
                              >
                                <img
                                  src={src}
                                  alt={`Foto del ítem ${p.n}`}
                                  loading="lazy"
                                />
                              </button>
                              <figcaption>Ítem {p.n}</figcaption>
                            </figure>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <p className="note">
                    Personal a cargo: {r.personalACargo || '-'} · Colaboradores:{' '}
                    {r.colaboradores || '-'} · Unidades vendidas: {r.unidades || '-'}
                  </p>

                  <div className="actions">
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => onCopyText(r.resumen || '')}
                    >
                      Copiar resumen
                    </button>

                    {isAdmin && r._id && (
                      <>
                        {confirmDeleteId !== r._id ? (
                          <button
                            type="button"
                            className="btn ghost sm"
                            onClick={() => setConfirmDeleteId(r._id!)}
                          >
                            Eliminar
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn danger sm"
                            disabled={deletingId === r._id}
                            onClick={() => handleDelete(r._id!)}
                          >
                            {deletingId === r._id ? 'Eliminando…' : 'Sí, eliminar'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </details>
            );
          })
        )}
      </div>
    </>
  );
};
