export interface SegmentMetadata {
  icon: string;
  badgeColor?: string;
  description?: string;
}

export const SEGMENT_META: Record<number, SegmentMetadata> = {
  0: { icon: 'Users', description: 'Atención, fachada, tiempos y delivery' },
  1: { icon: 'Utensils', description: 'Cocción, rótulos, vencimientos y gramajes' },
  2: { icon: 'ShieldCheck', description: 'Temperaturas, indumentaria e higiene' },
  3: { icon: 'Sparkles', description: 'Hornos, feteadora, baños y pisos' },
  4: { icon: 'Wrench', description: 'Tableros, heladeras, bachas y extracción' },
  5: { icon: 'TrendingUp', description: 'Vendor Late, Inaccuracy y Reclamos' },
  6: { icon: 'FileSpreadsheet', description: 'Habilitación, F960, ARCA y botiquín' },
  7: { icon: 'UserCheck', description: 'Uniforme y legajos del personal' },
  8: { icon: 'Package', description: 'Orden de insumos, PEPS y rótulos' }
};
