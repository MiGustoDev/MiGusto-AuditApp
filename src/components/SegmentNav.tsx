import React, { useRef, useEffect } from 'react';
import { SEGMENTS } from '../data/segments';
import { AuditSummary } from '../types/audit';
import { f2 } from '../utils/formatters';
import { 
  Users, 
  UtensilsCrossed, 
  ShieldCheck, 
  Sparkles, 
  Wrench, 
  TrendingUp, 
  FileSpreadsheet, 
  UserCheck, 
  Package,
  Check,
  List,
  Layers
} from 'lucide-react';

interface SegmentNavProps {
  currentSegment: number;
  onSelectSegment: (index: number) => void;
  summary: AuditSummary;
  viewMode: 'focus' | 'all';
  onToggleViewMode: () => void;
}

const SEGMENT_ICONS = [
  Users,
  UtensilsCrossed,
  ShieldCheck,
  Sparkles,
  Wrench,
  TrendingUp,
  FileSpreadsheet,
  UserCheck,
  Package
];

export const SegmentNav: React.FC<SegmentNavProps> = ({
  currentSegment,
  onSelectSegment,
  summary,
  viewMode,
  onToggleViewMode
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll the active chip into view smoothly
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const tab = activeTabRef.current;
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
  }, [currentSegment]);

  return (
    <div className="segment-nav-wrapper">
      <div className="segment-nav-header">
        <div className="segment-nav-title">
          <span>Segmentos ({SEGMENTS.length})</span>
        </div>

        <button
          type="button"
          className="view-toggle-btn"
          onClick={onToggleViewMode}
          title={viewMode === 'focus' ? 'Cambiar a ver todos los segmentos' : 'Cambiar a modo enfocado (uno por uno)'}
        >
          {viewMode === 'focus' ? (
            <>
              <Layers size={14} />
              <span>Modo Enfocado</span>
            </>
          ) : (
            <>
              <List size={14} />
              <span>Ver Todos</span>
            </>
          )}
        </button>
      </div>

      <div className="segment-rail" ref={scrollContainerRef}>
        {SEGMENTS.map((seg, si) => {
          const Icon = SEGMENT_ICONS[si] || Package;
          const rowData = summary.rows[si];
          const isComplete = rowData ? rowData.segDone === seg.items.length : false;
          const isActive = viewMode === 'focus' && currentSegment === si;
          const doneItems = rowData ? rowData.segDone : 0;
          const totalItems = seg.items.length;
          const realPts = rowData ? rowData.real : 0;
          const idealPts = rowData ? rowData.ideal : seg.ideal || 0;

          return (
            <button
              key={si}
              ref={isActive ? activeTabRef : null}
              type="button"
              className={`segment-chip ${isActive ? 'active' : ''} ${isComplete ? 'is-complete' : ''}`}
              onClick={() => onSelectSegment(si)}
            >
              <div className="chip-left">
                <span className="chip-icon-box">
                  {isComplete ? <Check size={14} className="check-icon" /> : <Icon size={14} />}
                </span>
                <div className="chip-text">
                  <span className="chip-name">
                    {si + 1}. {seg.short}
                  </span>
                  <span className="chip-meta num">
                    {doneItems}/{totalItems} · {f2(realPts)}/{f2(idealPts)} pts
                  </span>
                </div>
              </div>

              <span className={`chip-progress-pill ${isComplete ? 'done' : doneItems > 0 ? 'progress' : 'empty'}`}>
                {isComplete ? '100%' : `${Math.round((doneItems / totalItems) * 100)}%`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
