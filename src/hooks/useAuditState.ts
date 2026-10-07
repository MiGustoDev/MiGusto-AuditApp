import { useState, useEffect, useMemo, useCallback } from 'react';
import { AuditFields, AuditState, ItemStatus } from '../types/audit';
import { SEGMENTS, STORAGE_KEY } from '../data/segments';
import { calculateAuditSummary, getTodayDate } from '../utils/formatters';

const initialFields: AuditFields = {
  f_tienda: '',
  f_auditor: '',
  f_fecha: getTodayDate(),
  f_colab: '',
  f_cargo: '',
  f_unid: ''
};

const getInitialState = (): AuditState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        answers: parsed.answers || {},
        fields: { ...initialFields, ...(parsed.fields || {}), f_fecha: parsed.fields?.f_fecha || getTodayDate() },
        photos: parsed.photos || {}
      };
    }
  } catch (e) {
    console.error('Error loading audit state from localStorage:', e);
  }
  return {
    answers: {},
    fields: initialFields,
    photos: {}
  };
};

export function useAuditState() {
  const [state, setState] = useState<AuditState>(getInitialState);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving audit state to localStorage:', e);
    }
  }, [state]);

  const summary = useMemo(() => calculateAuditSummary(state.answers), [state.answers]);

  const setField = useCallback((field: keyof AuditFields, value: string) => {
    setState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: value
      }
    }));
  }, []);

  const setChoice = useCallback((segmentIndex: number, itemIndex: number, status: ItemStatus) => {
    const key = `${segmentIndex}-${itemIndex}`;
    const ideal = SEGMENTS[segmentIndex].items[itemIndex].points;

    setState(prev => {
      const prevAnswer = prev.answers[key];
      const newAnswers = { ...prev.answers };

      if (prevAnswer && prevAnswer.s === status) {
        // Deselect if already active
        delete newAnswers[key];
      } else {
        newAnswers[key] = {
          s: status,
          v: status === 'partial' ? (prevAnswer && prevAnswer.s === 'partial' && prevAnswer.v !== undefined ? prevAnswer.v : Math.round((ideal / 2) * 4) / 4) : undefined,
          o: prevAnswer?.o || ''
        };
      }

      return {
        ...prev,
        answers: newAnswers
      };
    });
  }, []);

  const setPartialScore = useCallback((segmentIndex: number, itemIndex: number, value: number) => {
    const key = `${segmentIndex}-${itemIndex}`;
    const ideal = SEGMENTS[segmentIndex].items[itemIndex].points;
    const clampedValue = Math.min(ideal, Math.max(0, Math.round(value * 100) / 100));

    setState(prev => {
      const current = prev.answers[key];
      if (!current) return prev;

      return {
        ...prev,
        answers: {
          ...prev.answers,
          [key]: {
            ...current,
            v: clampedValue
          }
        }
      };
    });
  }, []);

  const adjustPartialScore = useCallback((segmentIndex: number, itemIndex: number, step: number) => {
    const key = `${segmentIndex}-${itemIndex}`;
    const ideal = SEGMENTS[segmentIndex].items[itemIndex].points;

    setState(prev => {
      const current = prev.answers[key];
      if (!current) return prev;

      const currentVal = Number(current.v) || 0;
      const nextVal = Math.min(ideal, Math.max(0, Math.round((currentVal + step) * 100) / 100));

      return {
        ...prev,
        answers: {
          ...prev.answers,
          [key]: {
            ...current,
            v: nextVal
          }
        }
      };
    });
  }, []);

  const setObservation = useCallback((segmentIndex: number, itemIndex: number, obs: string) => {
    const key = `${segmentIndex}-${itemIndex}`;
    setState(prev => {
      const current = prev.answers[key] || { s: 'ok' as ItemStatus, o: '' };
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [key]: {
            ...current,
            o: obs
          }
        }
      };
    });
  }, []);

  const markSegmentPendingAsOk = useCallback((segmentIndex: number) => {
    setState(prev => {
      const newAnswers = { ...prev.answers };
      SEGMENTS[segmentIndex].items.forEach((_, ii) => {
        const key = `${segmentIndex}-${ii}`;
        if (!newAnswers[key]) {
          newAnswers[key] = { s: 'ok', o: '' };
        }
      });
      return {
        ...prev,
        answers: newAnswers
      };
    });
  }, []);

  const addPhoto = useCallback((segmentIndex: number, itemIndex: number, photoIdOrUrl: string) => {
    const key = `${segmentIndex}-${itemIndex}`;
    setState(prev => {
      const currentPhotos = prev.photos[key] || [];
      return {
        ...prev,
        photos: {
          ...prev.photos,
          [key]: [...currentPhotos, photoIdOrUrl]
        }
      };
    });
  }, []);

  const removePhoto = useCallback((segmentIndex: number, itemIndex: number, photoIdOrUrl: string) => {
    const key = `${segmentIndex}-${itemIndex}`;
    setState(prev => {
      const currentPhotos = prev.photos[key] || [];
      const filtered = currentPhotos.filter(id => id !== photoIdOrUrl);
      const newPhotos = { ...prev.photos };
      if (filtered.length > 0) {
        newPhotos[key] = filtered;
      } else {
        delete newPhotos[key];
      }
      return {
        ...prev,
        photos: newPhotos
      };
    });
  }, []);

  const resetAudit = useCallback(() => {
    const freshState: AuditState = {
      answers: {},
      fields: {
        ...initialFields,
        f_fecha: getTodayDate()
      },
      photos: {}
    };
    setState(freshState);
  }, []);

  return {
    state,
    summary,
    setField,
    setChoice,
    setPartialScore,
    adjustPartialScore,
    setObservation,
    markSegmentPendingAsOk,
    addPhoto,
    removePhoto,
    resetAudit
  };
}
