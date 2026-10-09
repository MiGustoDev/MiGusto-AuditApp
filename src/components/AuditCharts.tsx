import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { AuditSummary } from '../types/audit';
import { f2 } from '../utils/formatters';
import { PASS_SCORE } from '../data/segments';
import { 
  CheckCircle2, 
  XCircle, 
  Award, 
  TrendingUp, 
  PieChart as PieIcon, 
  BarChart3, 
  ShieldAlert, 
  Target 
} from 'lucide-react';

interface AuditChartsProps {
  summary: AuditSummary;
  storeName?: string;
  auditorName?: string;
}

export const AuditCharts: React.FC<AuditChartsProps> = ({ summary, storeName }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalScore = Math.min(100, Math.max(0, summary.total));
  const isApproved = totalScore >= PASS_SCORE;

  const devsCount = summary.devs.length;
  
  // Categorize segments into high performance (>=85%), medium (60-84%), low (<60%)
  const highPerfSegs = summary.rows.filter(r => r.ideal > 0 && (r.real / r.ideal) * 100 >= 85);
  const medPerfSegs = summary.rows.filter(r => r.ideal > 0 && (r.real / r.ideal) * 100 >= 60 && (r.real / r.ideal) * 100 < 85);
  const lowPerfSegs = summary.rows.filter(r => r.ideal > 0 && (r.real / r.ideal) * 100 < 60);

  // Stagger animation on mount
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.chart-card-box, .kpi-card'),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
      );
    }
  }, []);

  return (
    <div ref={containerRef} className="audit-charts-container">
      {/* 1. EXECUTIVE SUMMARY KPI CARDS */}
      <div className="kpi-cards-grid">
        <div className="kpi-card card-blue">
          <div className="kpi-icon-wrap"><Target size={18} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Puntaje Final</span>
            <div className="kpi-val-row">
              <span className="kpi-value num">{f2(totalScore)}</span>
              <span className="kpi-unit">/ 100</span>
            </div>
            <span className="kpi-subtext">Meta: {PASS_SCORE} pts</span>
          </div>
        </div>

        <div className={`kpi-card ${isApproved ? 'card-green' : 'card-red'}`}>
          <div className="kpi-icon-wrap">
            {isApproved ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Dictamen Operativo</span>
            <div className="kpi-badge-wrap">
              <span className={`dictamen-chip ${isApproved ? 'chip-ok' : 'chip-bad'}`}>
                {isApproved ? 'APROBADO' : 'DESAPROBADO'}
              </span>
            </div>
            <span className="kpi-subtext">{isApproved ? 'Cumple Estándar' : 'Plan de Acción Requerido'}</span>
          </div>
        </div>

        <div className="kpi-card card-amber">
          <div className="kpi-icon-wrap"><ShieldAlert size={18} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Desvíos Detectados</span>
            <span className="kpi-value num">{devsCount} hallazgos</span>
            <span className="kpi-subtext">{devsCount === 0 ? 'Sin desvíos' : 'Pendientes de corrección'}</span>
          </div>
        </div>

        <div className="kpi-card card-purple">
          <div className="kpi-icon-wrap"><Award size={18} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Efectividad Global</span>
            <span className="kpi-value num">{totalScore.toFixed(1)}%</span>
            <span className="kpi-subtext">Calidad Operativa</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN CHARTS GRID: HORIZONTAL BARS & RADIAL DIAGRAM */}
      <div className="charts-main-grid">
        {/* BAR CHART: Rendimiento por Fase de Auditoría */}
        <div className="chart-card-box card">
          <div className="chart-header">
            <div className="chart-title-wrap">
              <BarChart3 size={18} className="chart-icon" />
              <h3>Rendimiento por Fase Operativa</h3>
            </div>
            <span className="chart-badge">9 Fases Evaluadas</span>
          </div>

          <div className="horizontal-bars-list">
            {summary.rows.map(r => {
              const pct = r.ideal > 0 ? (r.real / r.ideal) * 100 : 0;
              const barColor = pct >= 85 ? 'bg-green' : pct >= 60 ? 'bg-amber' : 'bg-red';

              return (
                <div key={r.si} className="bar-row-item">
                  <div className="bar-row-header">
                    <span className="bar-row-title">{r.si + 1}. {r.seg.name}</span>
                    <span className="bar-row-val num"><b>{f2(r.real)}</b> / {f2(r.ideal)} pts ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="bar-track">
                    <div 
                      className={`bar-fill ${barColor}`} 
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PIE / DONUT ANALYTICS & DIAGNOSIS */}
        <div className="chart-card-box card">
          <div className="chart-header">
            <div className="chart-title-wrap">
              <PieIcon size={18} className="chart-icon" />
              <h3>Diagnóstico de Salud Operativa</h3>
            </div>
          </div>

          <div className="health-distribution-wrapper">
            {/* Visual Ring Donut Chart */}
            <div className="donut-chart-box">
              <svg className="donut-svg" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" className="donut-bg" />
                <circle 
                  cx="60" 
                  cy="60" 
                  r="48" 
                  className={`donut-segment ${isApproved ? 'tier-green' : totalScore >= 60 ? 'tier-cyan' : 'tier-amber'}`}
                  style={{
                    strokeDasharray: 301,
                    strokeDashoffset: 301 - (301 * totalScore) / 100
                  }}
                />
              </svg>
              <div className="donut-center-content">
                <span className="donut-score-val num">{totalScore.toFixed(0)}%</span>
                <span className="donut-label">Calidad</span>
              </div>
            </div>

            {/* Performance breakdown pills */}
            <div className="health-metrics-list">
              <div className="health-metric-item">
                <div className="metric-indicator bg-green" />
                <div className="metric-info">
                  <span className="metric-name">Fases en Estándar (≥ 85%)</span>
                  <span className="metric-count">{highPerfSegs.length} de 9 fases</span>
                </div>
              </div>

              <div className="health-metric-item">
                <div className="metric-indicator bg-amber" />
                <div className="metric-info">
                  <span className="metric-name">Fases Aceptables (60-84%)</span>
                  <span className="metric-count">{medPerfSegs.length} de 9 fases</span>
                </div>
              </div>

              <div className="health-metric-item">
                <div className="metric-indicator bg-red" />
                <div className="metric-info">
                  <span className="metric-name">Fases Críticas (&lt; 60%)</span>
                  <span className="metric-count">{lowPerfSegs.length} de 9 fases</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Executive Summary Conclusions */}
          <div className="executive-summary-box">
            <h4 className="executive-box-title">
              <TrendingUp size={16} />
              <span>Conclusión y Análisis General</span>
            </h4>
            <ul className="executive-bullets">
              {isApproved ? (
                <>
                  <li>✅ <b>Cumplimiento General Aprobado</b>: La sucursal {storeName ? `"${storeName}"` : ''} mantiene los estándares operativos requeridos por Mi Gusto.</li>
                  {highPerfSegs.length > 0 && (
                    <li>🌟 <b>Puntos Fuertes</b>: Destaca el excelente nivel en {highPerfSegs.slice(0, 3).map(s => `"${s.seg.short}"`).join(', ')}.</li>
                  )}
                  {devsCount > 0 ? (
                    <li>⚠️ <b>Atención</b>: Se identificaron {devsCount} desvíos puntuales que deben ser corregidos.</li>
                  ) : (
                    <li>🏆 <b>Excelente Trabajo</b>: Auditoría perfecta sin desvíos registrados.</li>
                  )}
                </>
              ) : (
                <>
                  <li>❌ <b>Sucursal en Alerta Operativa</b>: El puntaje obtenido ({f2(totalScore)} pts) se encuentra por debajo de la meta de {PASS_SCORE} pts.</li>
                  {lowPerfSegs.length > 0 && (
                    <li>🚨 <b>Áreas Críticas</b>: Se requiere intervenir de forma urgente en {lowPerfSegs.map(s => `"${s.seg.short}"`).join(', ')}.</li>
                  )}
                  <li>📝 <b>Plan de Acción</b>: Se notifica a la gerencia del local para programar re-auditoría.</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
