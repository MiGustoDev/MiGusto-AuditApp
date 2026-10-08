import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Deviation } from '../types/audit';
import { f2 } from '../utils/formatters';
import { CheckCircle2, MessageSquare } from 'lucide-react';

interface DeviationsListProps {
  deviations: Deviation[];
  onSelectDeviation?: (deviationNumber: string) => void;
}

export const DeviationsList: React.FC<DeviationsListProps> = ({ deviations, onSelectDeviation }) => {
  const pointsLost = deviations.reduce((sum, d) => sum + (d.ideal - d.got), 0);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (containerRef.current && deviations.length > 0) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.deviation-card'),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out' }
      );
    }
  }, [deviations.length]);

  return (
    <section ref={containerRef} className="deviations-section card" aria-label="Desvíos detectados">
      <div className="section-header-row">
        <div className="deviations-title-wrap">
          <div className="title-with-badge">
            <h3 className="section-title">Desvíos y Oportunidades</h3>
            <span className={`deviations-badge ${deviations.length > 0 ? 'badge-alert' : 'badge-good'}`}>
              {deviations.length} {deviations.length === 1 ? 'desvío' : 'desvíos'}
            </span>
          </div>
          <p className="section-subtitle">
            {deviations.length > 0 
              ? `Puntos no alcanzados: -${f2(pointsLost)} pts en total`
              : 'Excelente: Todos los ítems evaluados cumplen con el estándar'}
          </p>
        </div>
      </div>

      {deviations.length === 0 ? (
        <div className="empty-deviations-state">
          <CheckCircle2 size={40} className="empty-icon-good" />
          <p className="empty-state-title">¡Sin desvíos registrados!</p>
          <p className="empty-state-desc">Todos los ítems evaluados hasta el momento cumplen satisfactoriamente con los estándares operativos.</p>
        </div>
      ) : (
        <div className="deviations-list">
          {deviations.map((d) => {
            const isZero = d.got === 0;
            const diff = d.ideal - d.got;

            return (
              <div 
                key={d.n} 
                className={`deviation-card ${isZero ? 'dev-severe' : 'dev-partial'}`}
                onClick={() => onSelectDeviation?.(d.n)}
              >
                <div className="dev-header">
                  <div className="dev-id-group">
                    <span className="dev-number-badge">{d.n}</span>
                    <span className={`dev-status-tag ${isZero ? 'tag-no' : 'tag-partial'}`}>
                      {isZero ? 'No Cumple' : 'Cumple Parcial'}
                    </span>
                  </div>

                  <div className="dev-score-loss num">
                    <span className="loss-val">-{f2(diff)} pts</span>
                    <span className="real-val">({f2(d.got)} / {f2(d.ideal)})</span>
                  </div>
                </div>

                <p className="dev-text">{d.t}</p>

                {d.a.o && (
                  <div className="dev-observation-box">
                    <MessageSquare size={14} className="obs-icon" />
                    <span className="obs-content"><b>Obs:</b> {d.a.o}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
