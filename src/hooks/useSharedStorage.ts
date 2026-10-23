import { useState, useEffect, useCallback, useRef } from 'react';
import { SavedAuditRecord, ClaudeAssets, ClaudeDb, ClaudeDownloads, ClaudeUser } from '../types/audit';
import { HISTORY_STORAGE_KEY } from '../data/segments';
import { supabase, isSupabaseConfigured, uploadPhotoToSupabase } from '../lib/supabase';

// Generate business signature to identify the logical audit (prevents duplicating the same audit)
export const getRecordSignature = (r: { tienda?: string; fecha?: string; auditor?: string; auditMode?: string }): string => {
  const t = (r.tienda || '').trim().toLowerCase();
  const f = (r.fecha || '').trim().slice(0, 10);
  const a = (r.auditor || '').trim().toLowerCase();
  const m = r.auditMode || 'normal';
  return `${t}#${f}#${a}#${m}`;
};

export const isValidUuid = (id?: string | null): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export const generateSecureAuditId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export function useSharedStorage() {
  const [records, setRecords] = useState<SavedAuditRecord[]>([]);
  const [isClaudeEnv, setIsClaudeEnv] = useState<boolean>(false);
  const [canWrite, setCanWrite] = useState<boolean | null>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [myId, setMyId] = useState<string>('');
  const [hasDownloadsApi, setHasDownloadsApi] = useState<boolean>(false);
  const [hasAssetsApi, setHasAssetsApi] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [dbType, setDbType] = useState<'supabase' | 'claude' | 'local'>('local');

  const dbRef = useRef<ClaudeDb | null>(null);
  const userRef = useRef<ClaudeUser | null>(null);
  const downloadsRef = useRef<ClaudeDownloads | null>(null);
  const assetsRef = useRef<ClaudeAssets | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  // Load from local storage fallback
  const loadLocalRecords = useCallback((): SavedAuditRecord[] => {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading local history:', e);
    }
    return [];
  }, []);

  // Save to local storage
  const saveLocalRecords = useCallback((newRecords: SavedAuditRecord[]) => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newRecords));
    } catch (e) {
      console.error('Error saving local history:', e);
    }
  }, []);

  // Background sync for offline records to Supabase
  const syncOfflineRecords = useCallback(async (offlineList: SavedAuditRecord[]) => {
    if (!supabase || isSyncingRef.current || offlineList.length === 0) return;
    isSyncingRef.current = true;
    try {
      for (const record of offlineList) {
        try {
          const stableId = isValidUuid(record._id) ? record._id! : generateSecureAuditId();
          const payload: any = {
            id: stableId,
            tienda: record.tienda,
            auditor: record.auditor,
            fecha: record.fecha,
            colaboradores: record.colaboradores,
            personalACargo: record.personalACargo,
            unidades: record.unidades,
            total: record.total,
            estado: record.estado,
            completa: record.completa,
            evaluados: record.evaluados,
            segmentos: record.segmentos,
            desvios: record.desvios,
            fotos: record.fotos,
            respuestas: record.respuestas,
            resumen: record.resumen,
            auditMode: record.auditMode || 'normal',
            savedBy: record.savedBy || 'offline_sync',
            savedAt: record.savedAt || new Date().toISOString()
          };

          const { data, error } = await supabase.from('audits').upsert([payload]).select();
          if (!error && data && data[0]) {
            const syncedId = data[0].id?.toString() || stableId;
            const currentLocals = loadLocalRecords();
            const updatedLocals = currentLocals.map(l =>
              l._id === record._id ? { ...l, _id: syncedId } : l
            );
            saveLocalRecords(updatedLocals);
          }
        } catch (subErr) {
          console.warn('Failed to sync individual offline record:', subErr);
        }
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [loadLocalRecords, saveLocalRecords]);

  // Fetch audits from Supabase
  const fetchSupabaseRecords = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .order('savedAt', { ascending: false })
        .limit(500);

      if (error) {
        console.warn('Error fetching audits from Supabase (falling back to local storage):', error.message);
        const local = loadLocalRecords();
        setRecords(local);
      } else if (data) {
        const auditRows = data.filter((item: any) => item.id !== '00000000-0000-0000-0000-000000000001' && item.tienda !== '__CONFIG_STORE__');
        const mapped: SavedAuditRecord[] = auditRows.map((item: any) => ({
          _id: item.id?.toString() || item._id,
          tienda: item.tienda || '',
          auditor: item.auditor || '',
          fecha: item.fecha || '',
          colaboradores: item.colaboradores || '',
          personalACargo: item.personalACargo || '',
          unidades: item.unidades || '',
          total: Number(item.total) || 0,
          estado: item.estado || '',
          completa: Boolean(item.completa),
          evaluados: Number(item.evaluados) || 0,
          segmentos: Array.isArray(item.segmentos) ? item.segmentos : [],
          desvios: Array.isArray(item.desvios) ? item.desvios : [],
          fotos: Array.isArray(item.fotos) ? item.fotos : [],
          respuestas: item.respuestas || {},
          resumen: item.resumen || '',
          auditMode: item.auditMode || (Array.isArray(item.segmentos) && item.segmentos.length > 9 ? 'experience' : 'normal'),
          savedBy: item.savedBy || '',
          savedAt: item.savedAt || new Date().toISOString()
        }));

        // Combinar con los registros de LocalStorage deduplicando estrictamente por ID y por firma de auditoría
        const local = loadLocalRecords();
        const existingIds = new Set(mapped.map(m => m._id));
        const existingSignatures = new Set(mapped.map(getRecordSignature));

        const missingLocals: SavedAuditRecord[] = [];
        const offlineToSync: SavedAuditRecord[] = [];

        for (const l of local) {
          if (!l._id) continue;
          if (existingIds.has(l._id)) continue;
          const sig = getRecordSignature(l);
          if (existingSignatures.has(sig)) continue;

          missingLocals.push(l);
          if (l._id.startsWith('local_')) {
            offlineToSync.push(l);
          }
        }

        const merged = [...mapped, ...missingLocals].sort(
          (a, b) => new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime()
        );

        setRecords(merged);

        // Disparar sincronización automática en segundo plano si hay registros offline pendientes
        if (offlineToSync.length > 0) {
          syncOfflineRecords(offlineToSync);
        }
      }
    } catch (err) {
      console.error('Failed to query Supabase:', err);
      const local = loadLocalRecords();
      setRecords(local);
    } finally {
      setLoading(false);
    }
  }, [loadLocalRecords, syncOfflineRecords]);

  useEffect(() => {
    let unsubscribeClaude: (() => void) | undefined;
    let realtimeChannel: any;

    async function init() {
      // 1. Supabase Mode
      if (isSupabaseConfigured && supabase) {
        setDbType('supabase');
        setIsAdmin(true);
        setCanWrite(true);
        setHasAssetsApi(true);

        await fetchSupabaseRecords();

        try {
          const channelName = `audits_feed_${Math.random().toString(36).substring(2, 7)}`;
          const channel = supabase.channel(channelName);
          channel
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'audits' },
              () => {
                fetchSupabaseRecords();
              }
            )
            .subscribe();
          realtimeChannel = channel;
        } catch (e) {
          console.warn('Supabase realtime subscription failed:', e);
        }

        return;
      }

      // 2. Claude Artifact Environment (if embedded in Claude)
      if (window.claude && typeof window.claude.use === 'function') {
        try {
          const [dbNs, u, dl, as] = await Promise.all([
            window.claude.use('db'),
            window.claude.use('user'),
            window.claude.use('downloads'),
            window.claude.use('assets')
          ]);

          dbRef.current = dbNs;
          userRef.current = u;
          downloadsRef.current = dl;
          assetsRef.current = as;

          setIsClaudeEnv(true);
          setDbType('claude');
          setHasDownloadsApi(!!dl);
          setHasAssetsApi(!!as);

          if (u) {
            try {
              const id = await u.id();
              setMyId(id);
            } catch (e) {}
            try {
              const admin = await u.canEdit();
              setIsAdmin(!!admin);
            } catch (e) {}
            try {
              const write = await u.can('data.write');
              setCanWrite(write);
            } catch (e) {
              setCanWrite(null);
            }
          }

          if (dbNs) {
            unsubscribeClaude = dbNs
              .collection('audits')
              .orderBy('savedAt', 'desc')
              .limit(500)
              .onSnapshot(
                (snap: { docs: Array<{ id: string; data: () => any }> }) => {
                  const fetched = snap.docs.map((d: { id: string; data: () => any }) => ({
                    _id: d.id,
                    ...d.data()
                  }));
                  setRecords(fetched);
                  setLoading(false);
                },
                (err: any) => {
                  console.error('Failed to load shared history:', err);
                  const local = loadLocalRecords();
                  setRecords(local);
                  setLoading(false);
                }
              );
            return;
          }
        } catch (e) {
          console.warn('Claude API initialization failed, using local storage fallback:', e);
        }
      }

      // 3. Local Storage Fallback
      setDbType('local');
      setIsClaudeEnv(false);
      setCanWrite(true);
      setIsAdmin(true);
      const local = loadLocalRecords();
      setRecords(local);
      setLoading(false);
    }

    init();

    return () => {
      if (unsubscribeClaude) unsubscribeClaude();
      if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [fetchSupabaseRecords, loadLocalRecords]);

  const saveAudit = useCallback(
    async (record: SavedAuditRecord): Promise<{ ok: boolean; error?: string; id?: string }> => {
      // 1. Supabase save
      if (dbType === 'supabase' && supabase) {
        try {
          const sig = getRecordSignature(record);

          // Find existing record match in current memory to update rather than duplicate
          const existingMatch = records.find(r =>
            r._id &&
            !r._id.startsWith('local_') &&
            getRecordSignature(r) === sig
          );

          // Determine stable UUID
          let targetId = record._id;
          if (!isValidUuid(targetId)) {
            if (existingMatch?._id && isValidUuid(existingMatch._id)) {
              targetId = existingMatch._id;
            } else {
              targetId = generateSecureAuditId();
            }
          }

          const payload: any = {
            id: targetId,
            tienda: record.tienda,
            auditor: record.auditor,
            fecha: record.fecha,
            colaboradores: record.colaboradores,
            personalACargo: record.personalACargo,
            unidades: record.unidades,
            total: record.total,
            estado: record.estado,
            completa: record.completa,
            evaluados: record.evaluados,
            segmentos: record.segmentos,
            desvios: record.desvios,
            fotos: record.fotos,
            respuestas: record.respuestas,
            resumen: record.resumen,
            auditMode: record.auditMode || 'normal',
            savedBy: record.savedBy || myId || 'auditor',
            savedAt: record.savedAt || new Date().toISOString()
          };

          const { data, error } = await supabase
            .from('audits')
            .upsert([payload])
            .select();

          if (error) {
            console.error('Supabase upsert error:', error);
            // Backup to local storage on error with the stable ID
            const fallbackRecord: SavedAuditRecord = { ...record, _id: targetId };
            const updated = [
              fallbackRecord,
              ...records.filter(r => r._id !== targetId && getRecordSignature(r) !== sig)
            ];
            setRecords(updated);
            saveLocalRecords(updated);
            return {
              ok: false,
              id: targetId,
              error: `Error de base de datos: ${error.message}. Guardado localmente como respaldo.`
            };
          }

          const finalId = data?.[0]?.id?.toString() || targetId;
          const savedItem: SavedAuditRecord = {
            ...record,
            _id: finalId
          };

          setRecords(prev => {
            const updated = [
              savedItem,
              ...prev.filter(r => r._id !== finalId && getRecordSignature(r) !== sig)
            ];
            saveLocalRecords(updated);
            return updated;
          });

          return { ok: true, id: finalId };
        } catch (e: any) {
          console.error('Error saving to Supabase:', e);
          const fallbackId = isValidUuid(record._id) ? record._id! : generateSecureAuditId();
          const fallbackRecord: SavedAuditRecord = { ...record, _id: fallbackId };
          const updated = [
            fallbackRecord,
            ...records.filter(r => r._id !== fallbackId)
          ];
          setRecords(updated);
          saveLocalRecords(updated);
          return {
            ok: false,
            id: fallbackId,
            error: e?.message || 'Error al conectar con la base de datos Supabase. Guardado localmente.'
          };
        }
      }

      // 2. Claude Artifact save
      if (isClaudeEnv && dbRef.current) {
        if (canWrite === false) {
          return { ok: false, error: 'Tu acceso es solo de lectura. Pedile al dueño acceso de edición.' };
        }
        try {
          await dbRef.current.collection('audits').add(record);
          return { ok: true, id: record._id };
        } catch (e: any) {
          if (e && e.code === 'invalid_argument') {
            setCanWrite(false);
            return { ok: false, error: 'No tenés permiso para guardar. Pedile al dueño acceso de edición.' };
          }
          if (e && e.code === 'quota_exceeded') {
            return { ok: false, error: 'Se llenó el espacio de guardado. Borrá auditorías viejas del historial.' };
          }
          return { ok: false, error: 'No se pudo guardar. Revisá la conexión y probá de nuevo.' };
        }
      }

      // 3. Local storage fallback
      const id = record._id || ('local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
      const recordWithId: SavedAuditRecord = {
        ...record,
        _id: id
      };
      setRecords(prev => {
        const sig = getRecordSignature(record);
        const updatedList = [
          recordWithId,
          ...prev.filter(r => r._id !== id && getRecordSignature(r) !== sig)
        ];
        saveLocalRecords(updatedList);
        return updatedList;
      });
      return { ok: true, id };
    },
    [dbType, isClaudeEnv, canWrite, myId, records, saveLocalRecords]
  );

  const deleteAudit = useCallback(
    async (id: string): Promise<{ ok: boolean; error?: string }> => {
      // 1. Supabase delete
      if (dbType === 'supabase' && supabase) {
        try {
          if (isValidUuid(id)) {
            const { error } = await supabase.from('audits').delete().eq('id', id);
            if (error) {
              console.error('Supabase delete error:', error);
            }
          }
          // Strictly delete only the single target item
          const targetIndex = records.findIndex(r => r._id === id || (!r._id && `${r.fecha}-${r.tienda}` === id));
          const updated = targetIndex >= 0 ? records.filter((_, idx) => idx !== targetIndex) : records.filter(r => r._id !== id);
          setRecords(updated);
          saveLocalRecords(updated);
          return { ok: true };
        } catch (e: any) {
          const targetIndex = records.findIndex(r => r._id === id || (!r._id && `${r.fecha}-${r.tienda}` === id));
          const updated = targetIndex >= 0 ? records.filter((_, idx) => idx !== targetIndex) : records.filter(r => r._id !== id);
          setRecords(updated);
          saveLocalRecords(updated);
          return { ok: true };
        }
      }

      // 2. Claude Artifact delete
      if (isClaudeEnv && dbRef.current) {
        try {
          await dbRef.current.collection('audits').doc(id).delete();
          const targetIndex = records.findIndex(r => r._id === id || (!r._id && `${r.fecha}-${r.tienda}` === id));
          const updated = targetIndex >= 0 ? records.filter((_, idx) => idx !== targetIndex) : records.filter(r => r._id !== id);
          setRecords(updated);
          saveLocalRecords(updated);
          return { ok: true };
        } catch (e) {
          const targetIndex = records.findIndex(r => r._id === id || (!r._id && `${r.fecha}-${r.tienda}` === id));
          const updated = targetIndex >= 0 ? records.filter((_, idx) => idx !== targetIndex) : records.filter(r => r._id !== id);
          setRecords(updated);
          saveLocalRecords(updated);
          return { ok: true };
        }
      }

      // 3. Local storage delete
      const targetIndex = records.findIndex(r => r._id === id || (!r._id && `${r.fecha}-${r.tienda}` === id));
      const updated = targetIndex >= 0 ? records.filter((_, idx) => idx !== targetIndex) : records.filter(r => r._id !== id);
      setRecords(updated);
      saveLocalRecords(updated);
      return { ok: true };
    },
    [dbType, isClaudeEnv, records, saveLocalRecords]
  );

  const downloadFile = useCallback(
    async (filename: string, textData: string) => {
      if (downloadsRef.current) {
        try {
          await downloadsRef.current.save({ filename, data: textData });
          return;
        } catch (e) {
          // Fallback to browser download
        }
      }
      const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    []
  );

  const uploadAsset = useCallback(
    async (blob: Blob): Promise<{ id: string } | null> => {
      // If Supabase is active, upload to Supabase Storage bucket
      if (dbType === 'supabase' && supabase) {
        const res = await uploadPhotoToSupabase(blob);
        if (res?.url) {
          return { id: res.url };
        }
      }

      // If Claude assets API is available
      if (assetsRef.current) {
        try {
          const type = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(blob.type)
            ? blob.type
            : 'image/jpeg';
          const res = await assetsRef.current.upload(blob, { type });
          return { id: res.id };
        } catch (e) {
          console.warn('Claude asset upload failed:', e);
        }
      }

      return null;
    },
    [dbType]
  );

  return {
    records,
    loading,
    isClaudeEnv,
    canWrite,
    isAdmin,
    myId,
    dbType,
    hasDownloadsApi,
    hasAssetsApi,
    saveAudit,
    deleteAudit,
    downloadFile,
    uploadAsset
  };
}
