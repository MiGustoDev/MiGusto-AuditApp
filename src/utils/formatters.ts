import {
  AuditState,
  AuditSummary,
  Deviation,
  ItemAnswer,
  PhotoEntry,
  SavedAuditRecord,
  SegmentCalculation
} from '../types/audit';
import { PASS_SCORE, SEGMENTS, TOTAL_ITEMS } from '../data/segments';

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

export const calculateAuditSummary = (answers: Record<string, ItemAnswer>): AuditSummary => {
  let total = 0;
  let done = 0;
  let pendingIdeal = 0;
  const rows: SegmentCalculation[] = [];
  const devs: Deviation[] = [];

  SEGMENTS.forEach((seg, si) => {
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
  const isComplete = done === TOTAL_ITEMS;

  let statusClass: 'idle' | 'ok' | 'warn' | 'bad';
  let statusLabel: string;
  let verdictTitle: string;
  let verdictText: string;

  if (done === 0) {
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
    verdictText = `Aunque cumpla todo lo pendiente, el máximo posible es ${f2(maxPossible)}. Faltan ${TOTAL_ITEMS - done} ítems.`;
  } else if (total >= PASS_SCORE) {
    statusClass = 'ok';
    statusLabel = 'Ya aprueba';
    verdictTitle = 'Aprobación asegurada';
    verdictText = `Ya suma ${f2(total)}. Faltan ${TOTAL_ITEMS - done} ítems para cerrar la auditoría.`;
  } else {
    statusClass = 'warn';
    statusLabel = 'En curso';
    verdictTitle = 'En curso';
    verdictText = `Suma ${f2(total)}. Puede perder hasta ${f2(maxPossible - PASS_SCORE)} puntos más y seguir aprobando. Faltan ${TOTAL_ITEMS - done} ítems.`;
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

  lines.push('AUDITORÍA OPERATIVA MI GUSTO');
  lines.push(`Tienda: ${f.f_tienda || '-'} | Fecha: ${f.f_fecha || '-'} | Auditor/a: ${f.f_auditor || '-'}`);
  lines.push(`Colaboradores: ${f.f_colab || '-'} | Personal a cargo: ${f.f_cargo || '-'} | Unidades vendidas: ${f.f_unid || '-'}`);
  lines.push('');
  lines.push(`RESULTADO: ${f2(summary.total)} / 100 → ${(summary.isComplete ? summary.verdictTitle : summary.statusLabel).toUpperCase()} (aprueba con ${PASS_SCORE})`);
  lines.push('');

  summary.rows.forEach(r => {
    lines.push(`${r.si + 1}. ${r.seg.name}: ${f2(r.real)} / ${f2(r.ideal)} (${((r.real / r.ideal) * 100).toFixed(1)}%)`);
  });

  if (summary.devs.length) {
    lines.push('');
    lines.push('DESVÍOS:');
    summary.devs.forEach(d => {
      lines.push(`- ${d.n} (${f2(d.got)}/${f2(d.ideal)}) ${d.t}${d.a.o ? ' — Obs.: ' + d.a.o : ''}`);
    });
  }

  const pend = TOTAL_ITEMS - summary.done;
  if (pend) {
    lines.push('');
    lines.push(`Ítems sin evaluar: ${pend}`);
  }

  const nf = Object.values(state.photos || {}).reduce((t, a) => t + a.length, 0);
  if (nf) {
    lines.push(`Fotos adjuntas: ${nf} (ver en el historial de la planilla)`);
  }

  return lines.join('\n');
};

export const getPhotoList = (
  photos: Record<string, string[]>
): PhotoEntry[] => {
  const out: PhotoEntry[] = [];
  const keys = Object.keys(photos || {}).sort((a, b) => {
    const [a1, a2] = a.split('-').map(Number);
    const [b1, b2] = b.split('-').map(Number);
    return a1 - b1 || a2 - b2;
  });

  keys.forEach(k => {
    const [si, ii] = k.split('-').map(Number);
    if (SEGMENTS[si] && SEGMENTS[si].items[ii]) {
      (photos[k] || []).forEach(id => {
        out.push({
          n: `${si + 1}.${ii + 1}`,
          texto: SEGMENTS[si].items[ii].text,
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
  savedBy: string = ''
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
    fotos: getPhotoList(state.photos),
    respuestas: state.answers,
    resumen: generateSummaryText(state, summary),
    savedBy,
    savedAt: new Date().toISOString()
  };
};
