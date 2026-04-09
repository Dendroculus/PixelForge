import { useState, useCallback, useEffect } from 'react';
import { APP_CONFIG as config } from '../config';

const apiUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '');

export function useUsageLimit(feature = 'upscale') {
  const maxLimit = feature === 'rembg' ? 10 : 3; 

  const [usesRemaining, setUsesRemaining] = useState(maxLimit);
  const [resetTimestamp, setResetTimestamp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUsage = useCallback(async () => {
    if (!apiUrl) return; 
    try {
      const res = await fetch(`${apiUrl}/usage?feature=${feature}`);
      if (!res.ok) return;
      const data = await res.json();
      setUsesRemaining(Number.isFinite(data.uses_remaining) ? data.uses_remaining : maxLimit);
      setResetTimestamp(Number.isFinite(data.reset_timestamp) ? data.reset_timestamp : null);
    } catch {
      console.error(`Failed to refresh usage data for ${feature}`);
    }
  }, [feature, maxLimit]);

  useEffect(() => {
    let active = true;

    const initFetch = async () => {
      if (!apiUrl) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`${apiUrl}/usage?feature=${feature}`);
        if (!res.ok || !active) return;
        const data = await res.json();
        if (!active) return;
        setUsesRemaining(Number.isFinite(data.uses_remaining) ? data.uses_remaining : maxLimit);
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
  }, [feature, maxLimit]);

  const recordUsage = useCallback(() => {
    setUsesRemaining((prev) => Math.max(0, prev - 1));
    void refreshUsage();
  }, [refreshUsage]);

  const forceMaxLimit = useCallback(() => {
    setUsesRemaining(0);
    setResetTimestamp(Date.now() + (config.DAY_MS || 86400000));
  }, []);

  return { usesRemaining, resetTimestamp, recordUsage, forceMaxLimit, refreshUsage, isLoading, maxLimit };
}