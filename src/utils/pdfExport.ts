import { f2, fmtDate } from './formatters';
import { PASS_SCORE } from '../data/segments';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function generateAuditReportHTML(data: {
  tienda: string;
  auditor: string;
  fecha: string;
  total: number;
  estado: string;
  desvios?: Array<{ n: string; texto: string; ideal: number; real: number; obs?: string }>;
  segmentos?: Array<{ n: number; nombre: string; ideal: number; real: number }>;
  fotos?: Array<{ n: string; id: string; texto?: string }>;
  personalACargo?: string;
  colaboradores?: string;
  unidades?: string;
}): string {
  const isApproved = data.total >= PASS_SCORE;
  const statusColor = isApproved ? '#059669' : '#dc2626';
  const statusBg = isApproved ? '#ecfdf5' : '#fef2f2';
  const statusBorder = isApproved ? '#a7f3d0' : '#fecaca';

  const segmentsList = data.segmentos || [];
  const desviosList = data.desvios || [];
  const fotosList = (data.fotos || []).map(p => {
    let src = p.id;
    if (!src.startsWith('data:') && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('blob:')) {
      src = `/_blob/${src}`;
    }
    return { ...p, src };
  });

  return `
    <div id="pdf-report-render" style="background: #ffffff; color: #0f172a; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 24px; font-size: 12px; line-height: 1.4; width: 794px; box-sizing: border-box;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <h1 style="margin: 0; font-size: 20px; color: #0284c7; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">MI GUSTO · Auditoría Operativa</h1>
          <span style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Informe Ejecutivo de Sucursal</span>
        </div>
        <div style="text-align: center; background: ${statusBg}; border: 2px solid ${statusBorder}; padding: 6px 16px; border-radius: 8px; min-width: 140px;">
          <div style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Dictamen Operativo</div>
          <div style="font-size: 15px; font-weight: 900; color: ${statusColor}; margin-top: 1px;">${data.estado || (isApproved ? 'APROBADO' : 'NO APROBADO')}</div>
        </div>
      </div>

      <!-- General Info Bar -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; padding: 12px 14px; border-radius: 8px; margin-bottom: 14px; border: 1px solid #e2e8f0;">
        <div>
          <label style="display: block; font-size: 9px; color: #0284c7; text-transform: uppercase; font-weight: 800; margin-bottom: 2px;">SUCURSAL</label>
          <span style="display: inline-block; font-size: 14px; font-weight: 900; color: #0369a1; background: #e0f2fe; padding: 3px 8px; border-radius: 6px; border: 1px solid #bae6fd;">${data.tienda}</span>
        </div>
        <div>
          <label style="display: block; font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">AUDITOR / A</label>
          <span style="display: block; font-size: 12px; font-weight: 700; color: #0f172a;">${data.auditor || '-'}</span>
        </div>
        <div>
          <label style="display: block; font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">FECHA</label>
          <span style="display: block; font-size: 12px; font-weight: 700; color: #0f172a;">${fmtDate(data.fecha)}</span>
        </div>
        <div>
          <label style="display: block; font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">PUNTAJE FINAL</label>
          <span style="display: block; font-size: 14px; font-weight: 900; color: #0284c7;">${f2(data.total)} / 100 pts</span>
        </div>
      </div>

      ${data.personalACargo || data.colaboradores || data.unidades ? `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #f8fafc; padding: 10px 14px; border-radius: 8px; margin-top: -6px; margin-bottom: 14px; border: 1px solid #e2e8f0;">
          <div>
            <label style="display: block; font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700;">PERSONAL A CARGO</label>
            <span style="font-size: 11px; font-weight: 700; color: #0f172a;">${data.personalACargo || '-'}</span>
          </div>
          <div>
            <label style="display: block; font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700;">COLABORADORES</label>
            <span style="font-size: 11px; font-weight: 700; color: #0f172a;">${data.colaboradores || '-'}</span>
          </div>
          <div>
            <label style="display: block; font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700;">UNIDADES VENDIDAS</label>
            <span style="font-size: 11px; font-weight: 700; color: #0f172a;">${data.unidades || '-'}</span>
          </div>
        </div>
      ` : ''}

      <!-- Eco-Friendly Light Score Banner -->
      <div style="display: flex; align-items: center; justify-content: space-between; background: #f1f5f9; border: 2px solid #0284c7; border-radius: 10px; padding: 12px 18px; margin-bottom: 16px;">
        <div>
          <div style="font-size: 28px; font-weight: 900; color: #0284c7; line-height: 1;">${f2(data.total)} <span style="font-size: 16px; font-weight: 600; color: #475569;">/ 100 pts</span></div>
          <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">Puntaje total obtenido en la evaluación operativa</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #334155;">
          <div>Estándar mínimo exigido: <b>${PASS_SCORE} pts</b></div>
          <div style="margin-top: 3px; font-weight: 800; color: ${isApproved ? '#059669' : '#dc2626'};">
            ${isApproved ? '✓ CUMPLE ESTÁNDAR EXIGIDO' : '⚠️ PLAN DE ACCIÓN REQUERIDO'}
          </div>
        </div>
      </div>

      <div style="font-size: 11.5px; font-weight: 800; color: #0f172a; border-left: 4px solid #0284c7; padding-left: 8px; margin: 14px 0 8px 0; text-transform: uppercase;">
        Rendimiento por Fase Operativa
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; background: #ffffff; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0;">
        <thead>
          <tr style="background: #f1f5f9; color: #475569; font-size: 10px; text-transform: uppercase;">
            <th style="padding: 6px 10px; text-align: left; border-bottom: 2px solid #cbd5e1; font-weight: 800;">Fase Operativa</th>
            <th style="padding: 6px 10px; text-align: right; border-bottom: 2px solid #cbd5e1; font-weight: 800;">Ideal</th>
            <th style="padding: 6px 10px; text-align: right; border-bottom: 2px solid #cbd5e1; font-weight: 800;">Obtenido</th>
            <th style="padding: 6px 10px; text-align: right; border-bottom: 2px solid #cbd5e1; font-weight: 800;">Rendimiento</th>
          </tr>
        </thead>
        <tbody>
          ${segmentsList.map(s => {
            const pctNum = s.ideal ? Math.min(100, Math.round((s.real / s.ideal) * 100)) : 0;
            const barColor = pctNum >= 85 ? '#10b981' : pctNum >= 60 ? '#f59e0b' : '#ef4444';
            return `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 7px 10px; font-size: 11px; color: #0f172a; font-weight: 700;">${s.n}. ${s.nombre}</td>
                <td style="padding: 7px 10px; text-align: right; font-size: 11px; color: #334155; font-weight: 600;">${f2(s.ideal)}</td>
                <td style="padding: 7px 10px; text-align: right; font-size: 11px; font-weight: 800; color: #0f172a;">${f2(s.real)}</td>
                <td style="padding: 7px 10px; text-align: right;">
                  <div style="display: flex; align-items: center; gap: 6px; justify-content: flex-end;">
                    <div style="width: 65px; height: 7px; background: #cbd5e1; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${pctNum}%; height: 100%; background: ${barColor}; border-radius: 4px;"></div>
                    </div>
                    <span style="font-weight: 800; font-size: 10.5px; width: 32px; text-align: right; color: #0f172a;">${pctNum}%</span>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div style="font-size: 11.5px; font-weight: 800; color: #0f172a; border-left: 4px solid #0284c7; padding-left: 8px; margin: 14px 0 8px 0; text-transform: uppercase;">
        Desvíos Detectados (${desviosList.length})
      </div>
      ${desviosList.length > 0 ? desviosList.map(d => `
        <div style="background: #fff5f5; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; padding: 7px 10px; border-radius: 6px; margin-bottom: 6px;">
          <div style="font-weight: 700; color: #991b1b; display: flex; justify-content: space-between; font-size: 10.5px;">
            <span>Ítem ${d.n} — ${d.texto}</span>
            <span>(${f2(d.real)} / ${f2(d.ideal)} pts)</span>
          </div>
          ${d.obs ? `<div style="font-size: 10px; color: #475569; margin-top: 2px; font-style: italic;">Observación: ${d.obs}</div>` : ''}
        </div>
      `).join('') : '<p style="color: #059669; font-weight: 700; padding: 4px 0; font-size: 11px;">✓ Sin desvíos registrados en esta auditoría.</p>'}

      <!-- SECTOR APARTE: REGISTRO FOTOGRÁFICO DE EVIDENCIAS EN IMPRESIÓN -->
      ${fotosList.length > 0 ? `
        <div style="page-break-before: always; margin-top: 24px; padding-top: 14px; border-top: 2px solid #0284c7;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <div>
              <div style="font-size: 13px; font-weight: 900; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px;">
                REGISTRO FOTOGRÁFICO DE EVIDENCIAS
              </div>
              <div style="font-size: 10px; color: #64748b;">
                Imágenes adjuntas con índice de ítem para inspección visual e impresión
              </div>
            </div>
            <span style="background: #e0f2fe; color: #0369a1; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 6px; border: 1px solid #bae6fd;">
              Total: ${fotosList.length} ${fotosList.length === 1 ? 'fotografía' : 'fotografías'}
            </span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
            ${fotosList.map(p => `
              <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; page-break-inside: avoid; display: flex; flex-direction: column;">
                <div style="background: #0284c7; color: #ffffff; padding: 6px 10px; font-weight: 800; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
                  <span>ÍTEM EVALUADO ${p.n}</span>
                  <span style="font-size: 9px; opacity: 0.9; text-transform: uppercase;">Fotografía de evidencia</span>
                </div>
                ${p.texto ? `
                  <div style="padding: 6px 10px; font-size: 10px; font-weight: 600; color: #334155; border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                    ${p.texto}
                  </div>
                ` : ''}
                <div style="padding: 8px; background: #ffffff; text-align: center; flex: 1; display: flex; align-items: center; justify-content: center; min-height: 220px;">
                  <img src="${p.src}" alt="Evidencia Ítem ${p.n}" style="max-width: 100%; max-height: 280px; object-fit: contain; border-radius: 4px; border: 1px solid #e2e8f0;" />
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div style="text-align: center; margin-top: 18px; padding-top: 10px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 9.5px;">
        © Departamento de Sistemas de Mi Gusto — Documento oficial generado en PDF
      </div>
    </div>
  `;
}

export async function downloadAuditPDF(data: {
  tienda: string;
  auditor: string;
  fecha: string;
  total: number;
  estado: string;
  desvios?: Array<{ n: string; texto: string; ideal: number; real: number; obs?: string }>;
  segmentos?: Array<{ n: number; nombre: string; ideal: number; real: number }>;
  fotos?: Array<{ n: string; id: string; texto?: string }>;
  personalACargo?: string;
  colaboradores?: string;
  unidades?: string;
}) {
  // Clean store name for filename
  const storeClean = (data.tienda || 'Sucursal').trim().replace(/[^\w-]+/g, '_');
  
  // Format date as dia-mes-año (DD-MM-YYYY)
  let formattedDate = '';
  if (data.fecha) {
    const parts = data.fecha.split('-');
    if (parts.length === 3) {
      formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else {
      formattedDate = data.fecha.replace(/\//g, '-');
    }
  } else {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    formattedDate = `${dd}-${mm}-${yyyy}`;
  }

  // Filename: Auditoria_(sucursal)_(fecha dia-mes-año).pdf
  const filename = `Auditoria_${storeClean}_${formattedDate}.pdf`;

  const htmlString = generateAuditReportHTML(data);
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = htmlString;
  document.body.appendChild(container);

  const targetEl = container.querySelector('#pdf-report-render') as HTMLElement || container;

  try {
    const canvas = await html2canvas(targetEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfPageWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfPageWidth;
    const imgHeight = (canvas.height * pdfPageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfPageHeight;

    // Add remaining pages if rendered HTML exceeds a single A4 page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfPageHeight;
    }

    pdf.save(filename);
  } catch (err) {
    console.error('Error generating PDF with jsPDF/html2canvas:', err);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
