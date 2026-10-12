import {
  AuditMode,
  AuditState,
  AuditSummary,
  Deviation,
  ItemAnswer,
  PhotoEntry,
  SavedAuditRecord,
  SegmentCalculation
} from '../types/audit';
import { PASS_SCORE, getSegments, getTotalItems } from '../data/segments';

export const f2 = (n: number): string => (Math.round(n * 100) / 100).toFixed(2);

export const fmtPts = (n: number): string => {
  const formatted = Number.isInteger(n) ? n.toString() : f2(n).replace(/0$/, '');
  return `${formatted}${n === 1 ? ' pt' : ' pts'}`;
};

export const fmtDate = (iso?: string): string => {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  return d && m ? `${d}/${m}/${y}` : iso;
};

export const getTodayDate = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const scoreOf = (a?: ItemAnswer, ideal: number = 0): number => {
  if (!a) return 0;
  if (a.s === 'ok') return ideal;
  if (a.s === 'no') return 0;
  return Math.min(ideal, Math.max(0, Number(a.v) || 0));
};

export const calculateAuditSummary = (
  answers: Record<string, ItemAnswer>,
  mode: AuditMode = 'normal'
): AuditSummary => {
  const activeSegments = getSegments(mode);
  const totalItemsCount = getTotalItems(mode);

  let total = 0;
  let done = 0;
  let pendingIdeal = 0;
  const rows: SegmentCalculation[] = [];
  const devs: Deviation[] = [];

  let hasCriticalFailure = false;
  let criticalFailReason = '';

  activeSegments.forEach((seg, si) => {
    let real = 0;
    let segDone = 0;
    const ideal = seg.ideal ?? seg.items.reduce((sum, item) => sum + item.points, 0);

    seg.items.forEach((it, ii) => {
      const k = `${si}-${ii}`;
      const a = answers[k];
      if (a) {
        segDone++;
        const got = scoreOf(a, it.points);
        real += got;

        // Validar ítem crítico (ej. 2.6 producto vencido)
        if (it.isCritical && a.s !== 'ok') {
          hasCriticalFailure = true;
          criticalFailReason = `No cumple el ítem crítico ${si + 1}.${ii + 1} (${it.text.slice(0, 60)}...): la auditoría se desaprueba automáticamente.`;
        }

        if (a.s !== 'ok') {
          devs.push({
            k,
            n: `${si + 1}.${ii + 1}`,
            t: it.text,
            a,
            ideal: it.points,
            got
          });
        }
      } else {
        pendingIdeal += it.points;
      }
    });

    total += real;
    done += segDone;
    const pct = ideal ? (real / ideal) * 100 : 0;

    rows.push({
      seg,
      si,
      ideal,
      real,
      pct,
      segDone
    });
  });

  const maxPossible = total + pendingIdeal;
  const isComplete = done === totalItemsCount;

  let statusClass: 'idle' | 'ok' | 'warn' | 'bad';
  let statusLabel: string;
  let verdictTitle: string;
  let verdictText: string;

  if (hasCriticalFailure) {
    statusClass = 'bad';
    statusLabel = 'Desaprobada';
    verdictTitle = 'No aprobada (Ítem crítico)';
    verdictText = criticalFailReason || `No cumple ítem crítico: la auditoría se desaprueba automáticamente (${f2(total)} / 100 pts).`;
  } else if (done === 0) {
    statusClass = 'idle';
    statusLabel = 'Sin empezar';
    verdictTitle = 'Auditoría incompleta';
    verdictText = 'Faltan ítems por evaluar.';
  } else if (isComplete) {
    if (total >= PASS_SCORE) {
      statusClass = 'ok';
      statusLabel = 'Aprobada';
      verdictTitle = 'Aprobada';
      verdictText = `${f2(total)} puntos sobre 100. Supera el mínimo de ${PASS_SCORE}.`;
    } else {
      statusClass = 'bad';
      statusLabel = 'No aprobada';
      verdictTitle = 'No aprobada';
      verdictText = `${f2(total)} puntos sobre 100. Le faltan ${f2(PASS_SCORE - total)} para llegar a ${PASS_SCORE}.`;
    }
  } else if (maxPossible < PASS_SCORE) {
    statusClass = 'bad';
    statusLabel = 'No llega a 85';
    verdictTitle = 'No aprueba';
    verdictText = `Aunque cumpla todo lo pendiente, el máximo posible es ${f2(maxPossible)}. Faltan ${totalItemsCount - done} ítems.`;
  } else if (total >= PASS_SCORE) {
    statusClass = 'ok';
    statusLabel = 'Ya aprueba';
    verdictTitle = 'Aprobación asegurada';
    verdictText = `Ya suma ${f2(total)}. Faltan ${totalItemsCount - done} ítems para cerrar la auditoría.`;
  } else {
    statusClass = 'warn';
    statusLabel = 'En curso';
    verdictTitle = 'En curso';
    verdictText = `Suma ${f2(total)}. Puede perder hasta ${f2(maxPossible - PASS_SCORE)} puntos más y seguir aprobando. Faltan ${totalItemsCount - done} ítems.`;
  }

  return {
    total,
    done,
    pendingIdeal,
    maxPossible,
    isComplete,
    rows,
    devs,
    statusClass,
    statusLabel,
    verdictTitle,
    verdictText
  };
};

export const generateSummaryText = (
  state: AuditState,
  summary: AuditSummary
): string => {
  const f = state.fields;
  const lines: string[] = [];

  lines.push('INFORME DE AUDITORÍA OPERATIVA — MI GUSTO');
  lines.push('==================================================');
  lines.push(`Sucursal: ${f.f_tienda || '-'} | Fecha: ${f.f_fecha || '-'} | Auditor/a: ${f.f_auditor || '-'}`);
  lines.push(`Colaboradores: ${f.f_colab || '-'} | Personal a cargo: ${f.f_cargo || '-'} | Unidades: ${f.f_unid || '-'}`);
  lines.push('--------------------------------------------------');
  lines.push(`DICTAMEN OPERATIVO: ${(summary.isComplete ? summary.verdictTitle : summary.statusLabel).toUpperCase()}`);
  lines.push(`PUNTAJE FINAL: ${f2(summary.total)} / 100 pts`);
  lines.push('--------------------------------------------------');
  lines.push('');

  lines.push('RENDIMIENTO POR FASES OPERATIVAS:');
  summary.rows.forEach(r => {
    const pct = r.ideal ? ((r.real / r.ideal) * 100).toFixed(0) : '0';
    lines.push(`• ${r.si + 1}. ${r.seg.name}: ${f2(r.real)} de ${f2(r.ideal)} pts (${pct}%)`);
  });
  lines.push('');

  lines.push(`DESVÍOS DETECTADOS (${summary.devs.length}):`);
  if (summary.devs.length) {
    summary.devs.forEach(d => {
      lines.push(`• Ítem ${d.n} (${f2(d.got)}/${f2(d.ideal)} pts) — ${d.t}`);
      if (d.a.o) {
        lines.push(`   Observación: ${d.a.o}`);
      }
    });
  } else {
    lines.push('✓ Sin desvíos registrados en esta auditoría.');
  }

  lines.push('');
  lines.push('==================================================');
  lines.push('— Documento generado automáticamente desde la App de Auditorias de Mi Gusto —');

  return lines.join('\n');
};

export const generateRecordSummaryText = (r: SavedAuditRecord): string => {
  const lines: string[] = [];

  lines.push('INFORME DE AUDITORÍA OPERATIVA — MI GUSTO');
  lines.push('==================================================');
  lines.push(`Sucursal: ${r.tienda || '-'} | Fecha: ${fmtDate(r.fecha)}`);
  lines.push(`Auditor/a: ${r.auditor || '-'}`);
  if (r.personalACargo || r.colaboradores || r.unidades) {
    lines.push(`Personal a cargo: ${r.personalACargo || '-'} | Colaboradores: ${r.colaboradores || '-'} | Unidades: ${r.unidades || '-'}`);
  }
  lines.push('--------------------------------------------------');
  lines.push(`DICTAMEN OPERATIVO: ${(r.estado || ((r.total || 0) >= PASS_SCORE ? 'APROBADO' : 'NO APROBADO')).toUpperCase()}`);
  lines.push(`PUNTAJE FINAL: ${f2(r.total)} / 100 pts`);
  lines.push('--------------------------------------------------');
  lines.push('');

  lines.push('RENDIMIENTO POR FASES OPERATIVAS:');
  (r.segmentos || []).forEach(s => {
    const pct = s.ideal ? ((s.real / s.ideal) * 100).toFixed(0) : '0';
    lines.push(`• ${s.n}. ${s.nombre}: ${f2(s.real)} de ${f2(s.ideal)} pts (${pct}%)`);
  });
  lines.push('');

  lines.push(`DESVÍOS DETECTADOS (${(r.desvios || []).length}):`);
  if (r.desvios && r.desvios.length > 0) {
    r.desvios.forEach(d => {
      lines.push(`• Ítem ${d.n} (${f2(d.real)}/${f2(d.ideal)} pts) — ${d.texto}`);
      if (d.obs) {
        lines.push(`   Observación: ${d.obs}`);
      }
    });
  } else {
    lines.push('✓ Sin desvíos registrados en esta auditoría.');
  }

  lines.push('');
  lines.push('==================================================');
  lines.push('— Documento generado automáticamente desde la App de Auditorias de Mi Gusto —');

  return lines.join('\n');
};

export const generateRecordSummaryHtml = (r: SavedAuditRecord): string => {
  const isApproved = (r.total || 0) >= PASS_SCORE;
  const statusColor = isApproved ? '#059669' : '#dc2626';
  const statusBg = isApproved ? '#ecfdf5' : '#fef2f2';
  const statusBorder = isApproved ? '#a7f3d0' : '#fecaca';
  const verdictText = (r.estado || (isApproved ? 'APROBADO' : 'NO APROBADO')).toUpperCase();
  const devsList = r.desvios || [];
  const segmentsList = r.segmentos || [];

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; background-color: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
  <!-- Cabecera Principal -->
  <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 24px 28px; color: #ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="vertical-align: middle;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">MI GUSTO · Auditoría Operativa</h1>
          <div style="font-size: 13px; color: #bae6fd; font-weight: 500; margin-top: 4px;">Informe Ejecutivo de Calidad y Rendimiento</div>
        </td>
        <td style="vertical-align: middle; text-align: right;">
          <span style="display: inline-block; background-color: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.35); padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">
            ${fmtDate(r.fecha)}
          </span>
        </td>
      </tr>
    </table>
  </div>

  <!-- Ficha de Datos Generales -->
  <div style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 18px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="33%" style="vertical-align: top; padding-right: 12px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0284c7; letter-spacing: 0.5px;">Sucursal</div>
          <div style="font-size: 16px; font-weight: 800; color: #0369a1; margin-top: 3px;">${r.tienda || '-'}</div>
        </td>
        <td width="33%" style="vertical-align: top; padding-right: 12px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Auditor / a</div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 3px;">${r.auditor || '-'}</div>
        </td>
        <td width="34%" style="vertical-align: top;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Personal a Cargo</div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 3px;">${r.personalACargo || '-'}</div>
        </td>
      </tr>
      ${(r.colaboradores || r.unidades) ? `
      <tr>
        <td colspan="3" style="padding-top: 12px; border-top: 1px dashed #cbd5e1; margin-top: 10px;">
          <span style="font-size: 12px; color: #475569; margin-right: 18px;">👥 <b>Colaboradores:</b> ${r.colaboradores || '-'}</span>
          <span style="font-size: 12px; color: #475569;">📦 <b>Unidades:</b> ${r.unidades || '-'}</span>
        </td>
      </tr>
      ` : ''}
    </table>
  </div>

  <div style="padding: 24px 28px;">
    <!-- Tarjeta de Dictamen & Puntaje Destacado -->
    <div style="background-color: ${statusBg}; border: 2px solid ${statusBorder}; border-radius: 10px; padding: 18px 22px; margin-bottom: 26px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align: middle;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Dictamen Operativo</div>
            <div style="font-size: 22px; font-weight: 900; color: ${statusColor}; margin-top: 2px;">${verdictText}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 4px;">
              ${isApproved ? '✓ Cumple con el estándar de calidad y procedimientos exigidos.' : '⚠️ Requiere plan de acción y corrección sobre desvíos.'}
            </div>
          </td>
          <td style="vertical-align: middle; text-align: right;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">Puntaje Final</div>
            <div style="font-size: 32px; font-weight: 900; color: #0284c7; line-height: 1.1; margin-top: 2px;">
              ${f2(r.total)} <span style="font-size: 16px; font-weight: 600; color: #64748b;">/ 100</span>
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Meta mínima: ${PASS_SCORE} pts</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Sección de Rendimiento por Fases Operativas con Gráficos -->
    <div style="margin-bottom: 26px;">
      <div style="font-size: 14px; font-weight: 800; text-transform: uppercase; color: #0f172a; border-left: 4px solid #0284c7; padding-left: 10px; margin-bottom: 14px; letter-spacing: 0.5px;">
        Rendimiento por Fases Operativas
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
            <th align="left" style="padding: 10px 14px; font-weight: 800; border-bottom: 2px solid #cbd5e1;">Fase</th>
            <th align="right" width="80" style="padding: 10px 12px; font-weight: 800; border-bottom: 2px solid #cbd5e1;">Puntaje</th>
            <th align="left" width="180" style="padding: 10px 14px; font-weight: 800; border-bottom: 2px solid #cbd5e1;">Cumplimiento</th>
          </tr>
        </thead>
        <tbody>
          ${segmentsList.map((s, idx) => {
            const pct = s.ideal ? Math.min(100, Math.round((s.real / s.ideal) * 100)) : 0;
            const barColor = pct >= 85 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
            const bgRow = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
            return `
            <tr style="background-color: ${bgRow}; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 9px 14px; font-size: 12px; font-weight: 600; color: #1e293b;">
                ${s.n}. ${s.nombre}
              </td>
              <td align="right" style="padding: 9px 12px; font-size: 12px; color: #0f172a; font-weight: 700; white-space: nowrap;">
                ${f2(s.real)} / ${f2(s.ideal)}
              </td>
              <td style="padding: 9px 14px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align: middle;">
                      <div style="background-color: #e2e8f0; border-radius: 6px; height: 9px; width: 100%; overflow: hidden;">
                        <div style="background-color: ${barColor}; height: 9px; width: ${pct}%; border-radius: 6px;"></div>
                      </div>
                    </td>
                    <td width="42" align="right" style="vertical-align: middle; padding-left: 8px; font-size: 11px; font-weight: 800; color: ${barColor};">
                      ${pct}%
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Sección de Desvíos Detectados -->
    <div style="margin-bottom: 20px;">
      <div style="font-size: 14px; font-weight: 800; text-transform: uppercase; color: #0f172a; border-left: 4px solid ${devsList.length > 0 ? '#ef4444' : '#10b981'}; padding-left: 10px; margin-bottom: 14px; letter-spacing: 0.5px;">
        Desvíos Detectados (${devsList.length})
      </div>

      ${devsList.length > 0 ? `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${devsList.map(d => `
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #ef4444; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size: 12px; font-weight: 700; color: #991b1b;">
                  • Ítem ${d.n} — ${d.texto}
                </td>
                <td align="right" style="font-size: 11px; font-weight: 800; color: #dc2626; white-space: nowrap; padding-left: 10px;">
                  (${f2(d.real)} / ${f2(d.ideal)} pts)
                </td>
              </tr>
              ${d.obs ? `
              <tr>
                <td colspan="2" style="font-size: 11px; color: #475569; font-style: italic; padding-top: 4px;">
                  Observación: ${d.obs}
                </td>
              </tr>
              ` : ''}
            </table>
          </div>
          `).join('')}
        </div>
      ` : `
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-left: 4px solid #10b981; border-radius: 6px; padding: 12px 16px; color: #065f46; font-size: 12px; font-weight: 700;">
          ✓ Sin desvíos registrados en esta auditoría. ¡Excelente gestión operativa!
        </div>
      `}
    </div>
  </div>

  <!-- Pie del informe -->
  <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; text-align: center; color: #64748b; font-size: 11px;">
    — Documento generado automáticamente desde la App de Auditorias de Mi Gusto —
  </div>
</div>
  `.trim();
};

export const getPhotoList = (
  photos: Record<string, string[]>,
  mode: AuditMode = 'normal'
): PhotoEntry[] => {
  const activeSegments = getSegments(mode);
  const out: PhotoEntry[] = [];
  const keys = Object.keys(photos || {}).sort((a, b) => {
    const [a1, a2] = a.split('-').map(Number);
    const [b1, b2] = b.split('-').map(Number);
    return a1 - b1 || a2 - b2;
  });

  keys.forEach(k => {
    const [si, ii] = k.split('-').map(Number);
    if (activeSegments[si] && activeSegments[si].items[ii]) {
      (photos[k] || []).forEach(id => {
        out.push({
          n: `${si + 1}.${ii + 1}`,
          texto: activeSegments[si].items[ii].text,
          id
        });
      });
    }
  });

  return out;
};

export const buildRecordToSave = (
  state: AuditState,
  summary: AuditSummary,
  savedBy: string = '',
  mode: AuditMode = 'normal'
): SavedAuditRecord => {
  const f = state.fields;
  return {
    tienda: (f.f_tienda || '').trim(),
    auditor: (f.f_auditor || '').trim(),
    fecha: f.f_fecha || '',
    colaboradores: f.f_colab || '',
    personalACargo: f.f_cargo || '',
    unidades: f.f_unid || '',
    total: Math.round(summary.total * 100) / 100,
    estado: summary.isComplete ? summary.verdictTitle : summary.statusLabel,
    completa: summary.isComplete,
    evaluados: summary.done,
    auditMode: mode,
    segmentos: summary.rows.map(r => ({
      n: r.si + 1,
      nombre: r.seg.name,
      ideal: r.ideal,
      real: Math.round(r.real * 100) / 100
    })),
    desvios: summary.devs.map(d => ({
      n: d.n,
      texto: d.t,
      ideal: d.ideal,
      real: d.got,
      obs: d.a.o || '',
      fotos: (state.photos || {})[d.k] || []
    })),
    fotos: getPhotoList(state.photos, mode),
    respuestas: state.answers,
    resumen: generateSummaryText(state, summary),
    savedBy,
    savedAt: new Date().toISOString()
  };
};
