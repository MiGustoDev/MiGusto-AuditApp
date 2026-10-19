import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { f2, fmtDate } from './formatters';
import { PASS_SCORE } from '../data/segments';

interface ReportData {
  tienda: string;
  auditor: string;
  fecha: string;
  total: number;
  estado?: string;
  desvios?: Array<{ n: string; texto: string; ideal: number; real: number; obs?: string }>;
  segmentos?: Array<{ n: number; nombre: string; ideal: number; real: number }>;
  fotos?: Array<{ n: string; id: string; texto?: string }>;
  personalACargo?: string;
  colaboradores?: string;
  unidades?: string;
  respuestas?: Record<string, { s: string; v?: number; o?: string }>;
}

let cachedLogoBase64: string | null = null;

async function convertImageToBlack(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 800;
        canvas.height = img.naturalHeight || img.height || 400;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
          return;
        }

        ctx.drawImage(img, 0, 0);
        // Replace all non-transparent pixels with black
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    };
    img.src = objectUrl;
  });
}

async function getLogoBase64(): Promise<string | null> {
  if (cachedLogoBase64) return cachedLogoBase64;
  const logoUrls = ['logo-black.png', '/logo-black.png', 'logo-script.png', '/logo-script.png', 'logo.png', '/logo.png'];

  for (const url of logoUrls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const blob = await res.blob();
      const base64 = await convertImageToBlack(blob);
      if (base64) {
        cachedLogoBase64 = base64;
        return base64;
      }
    } catch (e) {}
  }
  return null;
}

async function loadImageBase64(src: string): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith('data:image')) return src;

  let finalUrl = src;
  if (!src.startsWith('data:') && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('blob:')) {
    finalUrl = `/_blob/${src}`;
  }

  try {
    const res = await fetch(finalUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    return null;
  }
}

export async function downloadAuditPDF(data: ReportData) {
  const storeClean = (data.tienda || 'Sucursal').trim().replace(/[^\w-]+/g, '_');
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

  const filename = `Auditoria_${storeClean}_${formattedDate}.pdf`;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm

  const logoBase64 = await getLogoBase64();

  // Helper to draw clean executive header
  const drawHeader = (doc: jsPDF) => {
    // Header divider line at top
    doc.setDrawColor(2, 132, 199); // #0284c7 Mi Gusto Blue
    doc.setLineWidth(1);
    doc.line(margin, 22, pageWidth - margin, 22);

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', margin, 6, 30, 14.5);
      } catch (e) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text('MI GUSTO', margin, 16);
      }
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('MI GUSTO', margin, 16);
    }

    // Title on the right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('INFORME OFICIAL DE AUDITORÍA', pageWidth - margin, 13, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Departamento de Calidad y Procesos', pageWidth - margin, 18.5, { align: 'right' });
  };

  // Helper to draw clean page footer
  const drawFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
    const y = pageHeight - 11;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.4);
    doc.line(margin, y - 4, pageWidth - margin, y - 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Mi Gusto · Sistema de Gestión de Calidad Operativa', margin, y);
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, y, { align: 'right' });
  };

  // Safe vertical bounds:
  // Top: header line is at 22, content starts at 30 mm
  // Bottom: footer line is at pageHeight - 15 mm, content must stop by pageHeight - 24 mm
  const CONTENT_START_Y = 30;
  const MAX_CONTENT_Y = pageHeight - 24;

  // --- DRAW PAGE 1 HEADER ---
  drawHeader(pdf);
  let currentY = CONTENT_START_Y;

  const isApproved = data.total >= PASS_SCORE;

  // --- TOP HIGHLIGHT CARD (Store, Score, Dictamen) ---
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.setDrawColor(226, 232, 240); // slate-200
  pdf.setLineWidth(0.4);
  pdf.roundedRect(margin, currentY, contentWidth, 24, 3, 3, 'FD');

  // Store Name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(2, 132, 199);
  pdf.text('SUCURSAL EVALUADA', margin + 6, currentY + 7);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12.5);
  pdf.setTextColor(3, 105, 161);
  pdf.text(data.tienda || '-', margin + 6, currentY + 15);

  // Auditor & Date
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text('AUDITOR / A', margin + 62, currentY + 7);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text(data.auditor || '-', margin + 62, currentY + 14);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text('FECHA', margin + 104, currentY + 7);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text(fmtDate(data.fecha) || formattedDate, margin + 104, currentY + 14);

  // Score & Status Box
  const statusBgColor: [number, number, number] = isApproved ? [236, 253, 245] : [254, 242, 242];
  const statusBorderColor: [number, number, number] = isApproved ? [167, 243, 208] : [254, 202, 202];
  const statusTextColor: [number, number, number] = isApproved ? [5, 150, 105] : [220, 38, 38];

  pdf.setFillColor(statusBgColor[0], statusBgColor[1], statusBgColor[2]);
  pdf.setDrawColor(statusBorderColor[0], statusBorderColor[1], statusBorderColor[2]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(pageWidth - margin - 44, currentY + 3, 40, 18, 2.5, 2.5, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(2, 132, 199);
  pdf.text(`${f2(data.total)} pts`, pageWidth - margin - 24, currentY + 9, { align: 'center' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(statusTextColor[0], statusTextColor[1], statusTextColor[2]);
  pdf.text(data.estado || (isApproved ? 'APROBADO' : 'NO APROBADO'), pageWidth - margin - 24, currentY + 16, { align: 'center' });

  currentY += 28;

  // --- SECONDARY INFO ROW (Personal, Colaboradores, Unidades) ---
  if (data.personalACargo || data.colaboradores || data.unidades) {
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'FD');

    const colW = contentWidth / 3;
    // Personal a cargo
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text('PERSONAL A CARGO', margin + 6, currentY + 5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 23, 42);
    pdf.text(data.personalACargo || '-', margin + 6, currentY + 10.5);

    // Colaboradores
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text('COLABORADORES', margin + colW + 6, currentY + 5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 23, 42);
    pdf.text(data.colaboradores || '-', margin + colW + 6, currentY + 10.5);

    // Unidades
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text('UNIDADES VENDIDAS', margin + colW * 2 + 6, currentY + 5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 23, 42);
    pdf.text(data.unidades || '-', margin + colW * 2 + 6, currentY + 10.5);

    currentY += 18;
  }

  // --- SECTION: TABLA DE RENDIMIENTO POR FASE ---
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(2, 132, 199);
  pdf.text('RENDIMIENTO POR FASE OPERATIVA', margin, currentY);
  currentY += 2;

  const segmentsList = data.segmentos || [];
  const tableRows = segmentsList.map(s => {
    const pct = s.ideal ? Math.min(100, Math.round((s.real / s.ideal) * 100)) : 0;
    return [
      `${s.n}. ${s.nombre}`,
      `${f2(s.ideal)} pts`,
      `${f2(s.real)} pts`,
      `${pct}%`
    ];
  });

  autoTable(pdf, {
    startY: currentY,
    head: [['Fase Operativa', 'Puntaje Ideal', 'Puntaje Obtenido', 'Rendimiento']],
    body: tableRows,
    theme: 'plain',
    margin: { left: margin, right: margin, bottom: 16 },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.5
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: 'auto', fontStyle: 'bold' },
      1: { cellWidth: 28, halign: 'right' },
      2: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
    },
    didDrawCell: (dataCell) => {
      // Colorize the percentage text in last column
      if (dataCell.section === 'body' && dataCell.column.index === 3) {
        const rawText = String(dataCell.cell.raw || '');
        const val = parseInt(rawText, 10);
        if (!isNaN(val)) {
          if (val >= 85) dataCell.cell.styles.textColor = [16, 185, 129];
          else if (val >= 60) dataCell.cell.styles.textColor = [245, 158, 11];
          else dataCell.cell.styles.textColor = [239, 68, 68];
        }
      }
    }
  });

  // Update currentY after table
  const finalTable = (pdf as any).lastAutoTable;
  currentY = finalTable ? finalTable.finalY + 8 : currentY + 40;

  // --- SECTION: DESVÍOS DETECTADOS ---
  const desviosList = data.desvios || [];

  // Check if we need a new page for title
  if (currentY > MAX_CONTENT_Y - 20) {
    pdf.addPage();
    drawHeader(pdf);
    currentY = CONTENT_START_Y;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(2, 132, 199);
  pdf.text(`DESVÍOS DETECTADOS (${desviosList.length})`, margin, currentY);
  currentY += 4;

  if (desviosList.length === 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(5, 150, 105);
    pdf.text('✓ No se registraron desvíos en esta auditoría.', margin, currentY + 3);
    currentY += 12;
  } else {
    // Render each deviation card safely using page-break aware coordinates
    for (const d of desviosList) {
      // Calculate required height for this deviation card with safety padding
      const titleLines = pdf.splitTextToSize(`Ítem ${d.n} — ${d.texto}`, contentWidth - 36);
      const obsLines = d.obs ? pdf.splitTextToSize(`Observación: ${d.obs}`, contentWidth - 14) : [];
      
      const cardHeight = 8 + (titleLines.length * 3.8) + (obsLines.length ? obsLines.length * 3.4 + 2 : 0);

      // Page break check: if card won't fit entirely above the bottom footer margin, move to next page!
      if (currentY + cardHeight > MAX_CONTENT_Y) {
        pdf.addPage();
        drawHeader(pdf);
        currentY = CONTENT_START_Y;
      }

      // Draw background card
      pdf.setFillColor(255, 245, 245); // light rose #fff5f5
      pdf.setDrawColor(254, 226, 226); // border #fee2e2
      pdf.setLineWidth(0.3);
      pdf.roundedRect(margin, currentY, contentWidth, cardHeight, 1.5, 1.5, 'FD');

      // Red left indicator line
      pdf.setFillColor(239, 68, 68); // #ef4444
      pdf.rect(margin, currentY, 2, cardHeight, 'F');

      // Title & Points
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(153, 27, 27); // #991b1b
      pdf.text(titleLines, margin + 6, currentY + 4.5);

      pdf.text(`(${f2(d.real)} / ${f2(d.ideal)} pts)`, pageWidth - margin - 4, currentY + 4.5, { align: 'right' });

      // Observation text
      if (obsLines.length) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(7);
        pdf.setTextColor(71, 85, 105); // slate-600
        pdf.text(obsLines, margin + 6, currentY + 4.5 + (titleLines.length * 3.8) + 1);
      }

      currentY += cardHeight + 3.5;
    }
  }

  // --- SECTION: COMENTARIOS Y OBSERVACIONES ADICIONALES (ÍTEMS CONFORMES) ---
  const compliantComments: Array<{ n: string; obs: string }> = [];
  if (data.respuestas) {
    Object.entries(data.respuestas).forEach(([k, a]) => {
      if (a && a.s === 'ok' && a.o && a.o.trim()) {
        const [sStr, iStr] = k.split('-');
        const si = parseInt(sStr, 10);
        const ii = parseInt(iStr, 10);
        compliantComments.push({
          n: `${si + 1}.${ii + 1}`,
          obs: a.o.trim()
        });
      }
    });
  }

  if (compliantComments.length > 0) {
    if (currentY > MAX_CONTENT_Y - 25) {
      pdf.addPage();
      drawHeader(pdf);
      currentY = CONTENT_START_Y;
    }

    currentY += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(2, 132, 199);
    pdf.text(`COMENTARIOS Y OBSERVACIONES ADICIONALES (${compliantComments.length})`, margin, currentY);
    currentY += 6;

    for (const c of compliantComments) {
      const obsLines = pdf.splitTextToSize(`Ítem ${c.n} — Comentario: ${c.obs}`, contentWidth - 14);
      const cardHeight = 6 + (obsLines.length * 3.6);

      if (currentY + cardHeight > MAX_CONTENT_Y) {
        pdf.addPage();
        drawHeader(pdf);
        currentY = CONTENT_START_Y;
      }

      pdf.setFillColor(240, 249, 255); // light sky #f0f9ff
      pdf.setDrawColor(186, 230, 253); // border #bae6fd
      pdf.setLineWidth(0.3);
      pdf.roundedRect(margin, currentY, contentWidth, cardHeight, 1.5, 1.5, 'FD');

      // Blue left indicator line
      pdf.setFillColor(2, 132, 199); // #0284c7
      pdf.rect(margin, currentY, 2, cardHeight, 'F');

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(30, 41, 59); // slate-800
      pdf.text(obsLines, margin + 6, currentY + 4.5);

      currentY += cardHeight + 3;
    }
  }

  // --- SECTION: REGISTRO FOTOGRÁFICO DE EVIDENCIAS ---
  const fotosList = data.fotos || [];
  if (fotosList.length > 0) {
    // Photographs always start on a clean fresh page
    pdf.addPage();
    drawHeader(pdf);
    currentY = CONTENT_START_Y;

    // Header for evidence photos
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(2, 132, 199);
    pdf.text('REGISTRO FOTOGRÁFICO DE EVIDENCIAS', margin, currentY);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Total: ${fotosList.length} fotografía${fotosList.length === 1 ? '' : 's'} adjunta${fotosList.length === 1 ? '' : 's'} a la inspección`, pageWidth - margin, currentY, { align: 'right' });
    currentY += 6;

    // Grid layout: 2 columns per row
    // Each photo card has: header (8mm) + description (8mm) + photo (60mm) = ~76mm
    const cardW = (contentWidth - 6) / 2; // ~88 mm
    const cardH = 76; // mm

    for (let i = 0; i < fotosList.length; i += 2) {
      // Check if this pair fits before the safe bottom limit
      if (currentY + cardH > MAX_CONTENT_Y) {
        pdf.addPage();
        drawHeader(pdf);
        currentY = CONTENT_START_Y;
      }

      const pair = [fotosList[i], fotosList[i + 1]].filter(Boolean);

      for (let c = 0; c < pair.length; c++) {
        const item = pair[c];
        const cardX = margin + c * (cardW + 6);
        const cardY = currentY;

        // Card frame
        pdf.setFillColor(248, 250, 252);
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(cardX, cardY, cardW, cardH, 2, 2, 'FD');

        // Card header banner
        pdf.setFillColor(2, 132, 199);
        pdf.roundedRect(cardX, cardY, cardW, 6.5, 2, 2, 'F');
        // Square bottom corners of banner
        pdf.rect(cardX, cardY + 3.5, cardW, 3, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(255, 255, 255);
        pdf.text(`ÍTEM EVALUADO ${item.n}`, cardX + 3.5, cardY + 4.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6);
        pdf.text('EVIDENCIA', cardX + cardW - 3.5, cardY + 4.5, { align: 'right' });

        // Item Description (if any)
        let descOffset = 7;
        if (item.texto) {
          pdf.setFillColor(255, 255, 255);
          pdf.rect(cardX, cardY + 6.5, cardW, 7, 'F');
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(6.2);
          pdf.setTextColor(51, 65, 85);
          const descLines = pdf.splitTextToSize(item.texto, cardW - 6);
          pdf.text(descLines.slice(0, 2), cardX + 3, cardY + 10.5);
          descOffset = 14;
        }

        // Image container area
        const imgBoxX = cardX + 2;
        const imgBoxY = cardY + descOffset + 1;
        const imgBoxW = cardW - 4;
        const imgBoxH = cardH - descOffset - 3;

        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(226, 232, 240);
        pdf.rect(imgBoxX, imgBoxY, imgBoxW, imgBoxH, 'FD');

        // Load & draw image
        const imgBase64 = await loadImageBase64(item.id);
        if (imgBase64) {
          try {
            // Keep aspect ratio
            pdf.addImage(imgBase64, 'JPEG', imgBoxX + 1, imgBoxY + 1, imgBoxW - 2, imgBoxH - 2, undefined, 'FAST');
          } catch (e) {
            pdf.setFont('helvetica', 'italic');
            pdf.setFontSize(7);
            pdf.setTextColor(148, 163, 184);
            pdf.text('Imagen no disponible', cardX + cardW / 2, imgBoxY + imgBoxH / 2, { align: 'center' });
          }
        } else {
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(7);
          pdf.setTextColor(148, 163, 184);
          pdf.text('Imagen no disponible', cardX + cardW / 2, imgBoxY + imgBoxH / 2, { align: 'center' });
        }
      }

      currentY += cardH + 5;
    }
  }

  // --- ADD FOOTERS & PAGE NUMBERS ON ALL PAGES ---
  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    drawFooter(pdf, p, totalPages);
  }

  // Save PDF
  pdf.save(filename);
}

// Backwards compatibility export
export const generateAuditReportHTML = () => '';
