export type ItemStatus = 'ok' | 'partial' | 'no';

export interface ItemAnswer {
  s: ItemStatus;
  v?: number; // Score value for 'partial'
  o?: string; // Observation note
}

export interface SegmentItemDef {
  points: number;
  text: string;
}

export interface SegmentDef {
  name: string;
  short: string;
  items: SegmentItemDef[];
  ideal?: number;
}

export interface AuditFields {
  f_tienda: string;
  f_auditor: string;
  f_fecha: string;
  f_colab: string;
  f_cargo: string;
  f_unid: string;
}

export interface AuditState {
  answers: Record<string, ItemAnswer>; // key: "si-ii"
  fields: AuditFields;
  photos: Record<string, string[]>; // key: "si-ii" -> array of image IDs or data URLs
}

export interface SegmentCalculation {
  seg: SegmentDef;
  si: number;
  ideal: number;
  real: number;
  pct: number;
  segDone: number;
}

export interface Deviation {
  k: string;
  n: string; // e.g. "1.3"
  t: string; // item text
  a: ItemAnswer;
  ideal: number;
  got: number;
}

export interface AuditSummary {
  total: number;
  done: number;
  pendingIdeal: number;
  maxPossible: number;
  isComplete: boolean;
  rows: SegmentCalculation[];
  devs: Deviation[];
  statusClass: 'idle' | 'ok' | 'warn' | 'bad';
  statusLabel: string;
  verdictTitle: string;
  verdictText: string;
}

export interface PhotoEntry {
  n: string;
  texto: string;
  id: string;
}

export interface SavedAuditRecord {
  _id?: string;
  tienda: string;
  auditor: string;
  fecha: string;
  colaboradores: string;
  personalACargo: string;
  unidades: string;
  total: number;
  estado: string;
  completa: boolean;
  evaluados: number;
  segmentos: Array<{
    n: number;
    nombre: string;
    ideal: number;
    real: number;
  }>;
  desvios: Array<{
    n: string;
    texto: string;
    ideal: number;
    real: number;
    obs: string;
    fotos: string[];
  }>;
  fotos: PhotoEntry[];
  respuestas: Record<string, ItemAnswer>;
  resumen: string;
  savedBy?: string;
  savedAt: string;
}

// Global Claude window declaration for optional shared context
export interface ClaudeDbDoc {
  delete: () => Promise<void>;
}

export interface ClaudeDbQuery {
  limit: (n: number) => {
    onSnapshot: (
      callback: (snapshot: { docs: Array<{ id: string; data: () => any }> }) => void,
      errorCallback?: (err: any) => void
    ) => () => void;
  };
}

export interface ClaudeDbCollection {
  add: (data: any) => Promise<{ id: string }>;
  doc: (id: string) => ClaudeDbDoc;
  orderBy: (field: string, direction: 'asc' | 'desc') => ClaudeDbQuery;
}

export interface ClaudeDb {
  collection: (name: string) => ClaudeDbCollection;
}

export interface ClaudeUser {
  id: () => Promise<string>;
  canEdit: () => Promise<boolean>;
  can: (action: string) => Promise<boolean>;
}

export interface ClaudeDownloads {
  save: (options: { filename: string; data: string }) => Promise<void>;
}

export interface ClaudeAssets {
  upload: (blob: Blob, options: { type: string }) => Promise<{ id: string }>;
}

declare global {
  interface Window {
    claude?: {
      use: (
        service: 'db' | 'user' | 'downloads' | 'assets'
      ) => Promise<any>;
    };
  }
}
