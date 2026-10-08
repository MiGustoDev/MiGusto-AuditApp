import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { AuditSummary } from '../types/audit';
import { f2 } from '../utils/formatters';
import { PASS_SCORE } from '../data/segments';

interface SummaryTableProps {
  summary: AuditSummary;
  onSelectSegment?: (segmentIndex: number) => void;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({ summary, onSelectSegment }) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.summary-mini-card'),
        { opacity: 0, y: 8, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, stagger: 0.025, ease: 'power2.out' }
      );
      gsap.fromTo(
        containerRef.current.querySelectorAll('tbody tr'),
        { opacity: 0, x: -8 },
        { opacity: 1, x: 0, duration: 0.28, stagger: 0.02, ease: 'power2.out', delay: 0.1 }
      );
    }
  }, []);

  return (
    <section ref={containerRef} className="summary-table-section card" aria-label="Desglose por segmento">
      <div className="section-header-row">
        <h3 className="section-title">Desglose por Segmento</h3>
        <span className="section-subtitle num">{summary.done} de 63 ítems evaluados</span>
      </div>

      <div className="summary-cards-grid">
        {summary.rows.map(r => {
          const pctVal = r.ideal > 0 ? (r.real / r.ideal) * 100 : 0;
          const statusCls = pctVal >= 85 ? 'ok' : pctVal >= 60 ? 'warn' : 'bad';

          return (
            <div 
              key={r.si} 
              className={`summary-mini-card ${statusCls}`}
              onClick={() => onSelectSegment?.(r.si)}
              role="button"
              tabIndex={0}
              title="Click para ir a este segmento"
            >
              <div className="mini-card-top">
                <span className="mini-card-name">
                  {r.si + 1}. {r.seg.name}
                </span>
                <span className={`mini-card-pct num ${statusCls}`}>
                  {pctVal.toFixed(0)}%
                </span>
              </div>

              <div className="mini-card-bar">
                <div 
                  className={`mini-bar-fill ${statusCls}`}
                  style={{ width: `${Math.min(100, pctVal)}%` }}
                />
              </div>

              <div className="mini-card-bottom num">
                <span>{r.segDone}/{r.seg.items.length} ítems</span>
                <span><b>{f2(r.real)}</b> / {f2(r.ideal)} pts</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="tbl-wrap responsive-table">
        <table>
          <thead>
            <tr>
              <th>Segmento</th>
              <th className="num-col">Ideal</th>
              <th className="num-col">Real</th>
              <th className="num-col">% Rendimiento</th>
              <th className="bar-col">Cumplimiento</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.map(r => {
              const pct = r.ideal > 0 ? (r.real / r.ideal) * 100 : 0;
              const isOk = pct >= 85;
              const isWarn = pct >= 60 && pct < 85;

              return (
                <tr 
                  key={r.si}
                  onClick={() => onSelectSegment?.(r.si)}
                  style={{ cursor: 'pointer' }}
                  title="Click para ver segmento"
                >
                  <td className="seg-cell">
                    <span className="seg-index-circle">{r.si + 1}</span>
                    <span className="seg-name-text">{r.seg.name}</span>
                  </td>
                  <td className="num-col num">{f2(r.ideal)}</td>
                  <td className="num-col num font-bold">{f2(r.real)}</td>
                  <td className="num-col num">
                    <span className={`table-pct-tag ${isOk ? 'ok' : isWarn ? 'warn' : 'bad'}`}>
                      {pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="bar-col">
                    <div className="table-row-bar">
                      <div 
                        className={`table-row-fill ${isOk ? 'ok' : isWarn ? 'warn' : 'bad'}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td>PUNTAJE FINAL TOTAL</td>
              <td className="num-col num">100.00</td>
              <td className="num-col num font-bold">{f2(summary.total)}</td>
              <td className="num-col num">
                <span className={`table-pct-tag ${summary.total >= PASS_SCORE ? 'ok' : 'bad'}`}>
                  {summary.total.toFixed(1)}%
                </span>
              </td>
              <td className="bar-col">
                <div className="table-row-bar">
                  <div 
                    className={`table-row-fill ${summary.total >= PASS_SCORE ? 'ok' : 'bad'}`}
                    style={{ width: `${Math.min(100, summary.total)}%` }}
                  />
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};
