import { useState, useCallback, useEffect } from 'react';
import { APP_CONFIG as config } from '../config';

export function useUsageLimit() {
  const [usesRemaining, setUsesRemaining] = useState(config.UPSCALE_LIMIT);
  const [resetTimestamp, setResetTimestamp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUsage = useCallback(async () => {
    const res = await fetch(`${config.API_URL}/usage`);
    if (!res.ok) return;
    const data = await res.json();
    setUsesRemaining(Number.isFinite(data.uses_remaining) ? data.uses_remaining : config.UPSCALE_LIMIT);
    setResetTimestamp(Number.isFinite(data.reset_timestamp) ? data.reset_timestamp : null);
  }, []);

  useEffect(() => {
    let active = true;

    const initFetch = async () => {
      try {
        const res = await fetch(`${config.API_URL}/usage`);
        if (!res.ok || !active) return;
        const data = await res.json();
        if (!active) return;
        setUsesRemaining(Number.isFinite(data.uses_remaining) ? data.uses_remaining : config.UPSCALE_LIMIT);
        setResetTimestamp(Number.isFinite(data.reset_timestamp) ? data.reset_timestamp : null);
      } catch {
        if (!active) return;
      } finally {
        if (active) setIsLoading(false);
      }
    };

    initFetch();

    return () => {
      active = false;
    };
  }, []);

  const recordUsage = useCallback(() => {
    setUsesRemaining((prev) => Math.max(0, prev - 1));
    void refreshUsage();
  }, [refreshUsage]);

  const forceMaxLimit = useCallback(() => {
    setUsesRemaining(0);
    setResetTimestamp(Date.now() + config.DAY_MS);
  }, []);

  return { usesRemaining, resetTimestamp, recordUsage, forceMaxLimit, refreshUsage, isLoading };
}