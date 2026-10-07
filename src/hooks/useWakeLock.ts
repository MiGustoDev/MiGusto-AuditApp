import { useEffect, useRef, useCallback } from 'react';

export function useWakeLock(hasAnswers: boolean) {
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = useCallback(async () => {
    try {
      if (!wakeLockRef.current && 'wakeLock' in navigator) {
        const lock = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current = lock;
        lock.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      }
    } catch (e) {
      // Browser or user denied
    }
  }, []);

  useEffect(() => {
    const handleClick = () => {
      requestWakeLock();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current && hasAnswers) {
        requestWakeLock();
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [hasAnswers, requestWakeLock]);
}
