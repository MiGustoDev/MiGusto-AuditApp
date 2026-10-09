import { useState, useEffect, useCallback, useRef } from 'react';
import { SavedAuditRecord, ClaudeAssets, ClaudeDb, ClaudeDownloads, ClaudeUser } from '../types/audit';
import { HISTORY_STORAGE_KEY } from '../data/segments';
import { supabase, isSupabaseConfigured, uploadPhotoToSupabase } from '../lib/supabase';

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
        const mapped: SavedAuditRecord[] = data.map((item: any) => ({
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
          savedBy: item.savedBy || '',
          savedAt: item.savedAt || new Date().toISOString()
        }));
        setRecords(mapped);
      }
    } catch (err) {
      console.error('Failed to query Supabase:', err);
      const local = loadLocalRecords();
      setRecords(local);
    } finally {
      setLoading(false);
    }
  }, [loadLocalRecords]);

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
          const payload: any = {
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
            savedBy: record.savedBy || myId || 'auditor',
            savedAt: record.savedAt || new Date().toISOString()
          };

          if (record._id && !record._id.startsWith('local_')) {
            payload.id = record._id;
          }

          const { data, error } = await supabase
            .from('audits')
            .upsert([payload])
            .select();

          if (error) {
            console.error('Supabase upsert error:', error);
            // Backup to local storage on error
            const id = record._id || ('local_' + Date.now());
            const fallbackRecord: SavedAuditRecord = { ...record, _id: id };
            const updated = [fallbackRecord, ...records.filter(r => r._id !== id)];
            setRecords(updated);
            saveLocalRecords(updated);
            return {
              ok: false,
              error: `Error de base de datos: ${error.message}. (Si es la primera vez, asegurate de ejecutar el script SQL en Supabase).`
            };
          }

          let savedId = record._id;
          if (data && data[0]) {
            savedId = data[0].id?.toString() || data[0]._id;
            const savedItem: SavedAuditRecord = {
              ...record,
              _id: savedId
            };
            setRecords(prev => [savedItem, ...prev.filter(r => r._id !== savedId)]);
          } else {
            await fetchSupabaseRecords();
          }

          return { ok: true, id: savedId };
        } catch (e: any) {
          console.error('Error saving to Supabase:', e);
          return { ok: false, error: e?.message || 'Error al conectar con la base de datos Supabase.' };
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
        const filtered = prev.filter(r => r._id !== id);
        const updatedList = [recordWithId, ...filtered];
        saveLocalRecords(updatedList);
        return updatedList;
      });
      return { ok: true, id };
    },
    [dbType, isClaudeEnv, canWrite, myId, records, saveLocalRecords, fetchSupabaseRecords]
  );

  const deleteAudit = useCallback(
    async (id: string): Promise<{ ok: boolean; error?: string }> => {
      // 1. Supabase delete
      if (dbType === 'supabase' && supabase) {
        try {
          const { error } = await supabase.from('audits').delete().eq('id', id);
          if (error) {
            console.error('Supabase delete error:', error);
          }
          const updated = records.filter(r => (r._id || `${r.fecha}-${r.tienda}`) !== id);
          setRecords(updated);
          saveLocalRecords(updated);
          return { ok: true };
        } catch (e: any) {
          const updated = records.filter(r => (r._id || `${r.fecha}-${r.tienda}`) !== id);
          setRecords(updated);
          saveLocalRecords(updated);
          return { ok: true };
        }
      }

      // 2. Claude Artifact delete
      if (isClaudeEnv && dbRef.current) {
        try {
          await dbRef.current.collection('audits').doc(id).delete();
          const updated = records.filter(r => (r._id || `${r.fecha}-${r.tienda}`) !== id);
          setRecords(updated);
          saveLocalRecords(updated);
          return { ok: true };
        } catch (e) {
          const updated = records.filter(r => (r._id || `${r.fecha}-${r.tienda}`) !== id);
          setRecords(updated);
          saveLocalRecords(updated);
          return { ok: true };
        }
      }

      // 3. Local storage delete
      const updated = records.filter(r => (r._id || `${r.fecha}-${r.tienda}`) !== id);
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
