import { useState, useEffect, useCallback, useRef } from 'react';
import { SavedAuditRecord, ClaudeAssets, ClaudeDb, ClaudeDownloads, ClaudeUser } from '../types/audit';
import { HISTORY_STORAGE_KEY } from '../data/segments';

export function useSharedStorage() {
  const [records, setRecords] = useState<SavedAuditRecord[]>([]);
  const [isClaudeEnv, setIsClaudeEnv] = useState<boolean>(false);
  const [canWrite, setCanWrite] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [myId, setMyId] = useState<string>('');
  const [hasDownloadsApi, setHasDownloadsApi] = useState<boolean>(false);
  const [hasAssetsApi, setHasAssetsApi] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const dbRef = useRef<ClaudeDb | null>(null);
  const userRef = useRef<ClaudeUser | null>(null);
  const downloadsRef = useRef<ClaudeDownloads | null>(null);
  const assetsRef = useRef<ClaudeAssets | null>(null);

  // Load from local storage fallback
  const loadLocalRecords = useCallback(() => {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecords(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading local history:', e);
    }
  }, []);

  // Save to local storage
  const saveLocalRecords = useCallback((newRecords: SavedAuditRecord[]) => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newRecords));
    } catch (e) {
      console.error('Error saving local history:', e);
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function init() {
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
            unsubscribe = dbNs
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
                  loadLocalRecords();
                  setLoading(false);
                }
              );
            return;
          }
        } catch (e) {
          console.warn('Claude API initialization failed, using local storage fallback:', e);
        }
      }

      // Local storage fallback
      setIsClaudeEnv(false);
      setCanWrite(true);
      setIsAdmin(true);
      loadLocalRecords();
      setLoading(false);
    }

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadLocalRecords]);

  const saveAudit = useCallback(
    async (record: SavedAuditRecord): Promise<{ ok: boolean; error?: string }> => {
      if (isClaudeEnv && dbRef.current) {
        if (canWrite === false) {
          return { ok: false, error: 'Tu acceso es solo de lectura. Pedile al dueño acceso de edición.' };
        }
        try {
          await dbRef.current.collection('audits').add(record);
          return { ok: true };
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
      } else {
        // Local storage saving
        const id = 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const recordWithId: SavedAuditRecord = {
          ...record,
          _id: id
        };
        const updated = [recordWithId, ...records];
        setRecords(updated);
        saveLocalRecords(updated);
        return { ok: true };
      }
    },
    [isClaudeEnv, canWrite, records, saveLocalRecords]
  );

  const deleteAudit = useCallback(
    async (id: string): Promise<{ ok: boolean; error?: string }> => {
      if (isClaudeEnv && dbRef.current) {
        try {
          await dbRef.current.collection('audits').doc(id).delete();
          return { ok: true };
        } catch (e) {
          return { ok: false, error: 'No se pudo eliminar. Probá de nuevo.' };
        }
      } else {
        const updated = records.filter(r => r._id !== id);
        setRecords(updated);
        saveLocalRecords(updated);
        return { ok: true };
      }
    },
    [isClaudeEnv, records, saveLocalRecords]
  );

  const downloadFile = useCallback(
    async (filename: string, textData: string) => {
      if (downloadsRef.current) {
        try {
          await downloadsRef.current.save({ filename, data: textData });
          return;
        } catch (e) {
          // Fallback to browser download if user cancelled or API fails
        }
      }
      // Standard browser download
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
      if (assetsRef.current) {
        const type = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(blob.type)
          ? blob.type
          : 'image/jpeg';
        const res = await assetsRef.current.upload(blob, { type });
        return { id: res.id };
      }
      return null;
    },
    []
  );

  return {
    records,
    loading,
    isClaudeEnv,
    canWrite,
    isAdmin,
    myId,
    hasDownloadsApi,
    hasAssetsApi,
    saveAudit,
    deleteAudit,
    downloadFile,
    uploadAsset
  };
}
