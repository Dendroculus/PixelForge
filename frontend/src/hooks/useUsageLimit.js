import { useState, useCallback, useMemo } from 'react';
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
 * @returns {{usesRemaining: number, resetTimestamp: number|null}}
 */
function computeSnapshot() {
  const history = readValidHistory();
  const usesRemaining = Math.max(0, CONFIG.UPSCALE_LIMIT - history.length);
  // FIX: Renamed resetAt to resetTimestamp
  const resetTimestamp =
    usesRemaining === 0 && history.length > 0 ? history[0] + CONFIG.DAY_MS : null;

  return { usesRemaining, resetTimestamp };
}

export function useUsageLimit() {
  const initial = useMemo(() => computeSnapshot(), []);
  const [usesRemaining, setUsesRemaining] = useState(initial.usesRemaining);
  
  // FIX: Renamed state to match what we are returning
  const [resetTimestamp, setResetTimestamp] = useState(initial.resetTimestamp);

  /**
   * Refreshes usage state from localStorage.
   */
  const refreshFromStorage = useCallback(() => {
    const snap = computeSnapshot();
    setUsesRemaining(snap.usesRemaining);
    setResetTimestamp(snap.resetTimestamp); // <-- Updated
  }, []);

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

  return { usesRemaining, resetTimestamp, recordUsage, forceMaxLimit };
}