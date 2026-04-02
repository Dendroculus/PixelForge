import { useState, useEffect, useCallback, useMemo } from 'react';
import { STORAGE_KEYS, APP_CONFIG as CONFIG } from '../config';

const KEY = STORAGE_KEYS.UPSCALE_HISTORY;

/**
 * Reads and filters usage history from localStorage, keeping only entries within 24 hours.
 * @returns {number[]} Array of valid timestamps.
 */
function readValidHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const valid = parsed.filter((t) => now - t < CONFIG.DAY_MS);

    if (valid.length !== parsed.length) {
      localStorage.setItem(KEY, JSON.stringify(valid));
    }
    return valid;
  } catch {
    return [];
  }
}

/**
 * Computes usage snapshot including remaining uses and reset timestamp.
 * @returns {{usesRemaining: number, resetAt: number|null}}
 */
function computeSnapshot() {
  const history = readValidHistory();
  const usesRemaining = Math.max(0, CONFIG.UPSCALE_LIMIT - history.length);
  const resetAt =
    usesRemaining === 0 && history.length > 0 ? history[0] + CONFIG.  DAY_MS : null;

  return { usesRemaining, resetAt };
}

/**
 * React hook to manage usage limits with persistence and countdown timer.
 * @returns {{
 *  usesRemaining: number,
 *  timeUntilReset: string|null,
 *  recordUsage: () => void,
 *  forceMaxLimit: () => void
 * }}
 */
export function useUsageLimit() {
  const initial = useMemo(() => computeSnapshot(), []);
  const [usesRemaining, setUsesRemaining] = useState(initial.usesRemaining);
  const [resetAt, setResetAt] = useState(initial.resetAt);
  const [timeUntilReset, setTimeUntilReset] = useState(null);

  /**
   * Refreshes usage state from localStorage.
   */
  const refreshFromStorage = useCallback(() => {
    const snap = computeSnapshot();
    setUsesRemaining(snap.usesRemaining);
    setResetAt(snap.resetAt);
  }, []);

  useEffect(() => {
    if (!resetAt) return;

    const tick = () => {
      const diff = resetAt - Date.now();

      if (diff <= 0) {
        refreshFromStorage();
        setTimeUntilReset(null);
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const m = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
      const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      setTimeUntilReset(`${h}h ${m}m ${s}s`);
    };

    const start = setTimeout(() => { tick(); }, 0);
    const interval = setInterval(() => { tick(); }, 1000);

    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [resetAt, refreshFromStorage]);

  /**
   * Records a usage event and updates state.
   */
  const recordUsage = useCallback(() => {
    const history = readValidHistory();
    history.push(Date.now());
    localStorage.setItem(KEY, JSON.stringify(history));
    refreshFromStorage();
  }, [refreshFromStorage]);

  /**
   * Forces usage limit to maximum state.
   */
  const forceMaxLimit = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(KEY, JSON.stringify([now, now, now]));
    refreshFromStorage();
  }, [refreshFromStorage]);

  return { usesRemaining, timeUntilReset, recordUsage, forceMaxLimit };
}