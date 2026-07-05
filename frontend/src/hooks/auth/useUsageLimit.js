/**
 * Usage-limit hook for feature quota UI.
 *
 * Fetches, refreshes, and locally adjusts the remaining daily usage count for a
 * specific AI feature.
 */

import { useState, useCallback, useEffect } from 'react';
import { AppConfig as config, FEATURE_LIMITS } from '@/config';

const apiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '');

/**
 * Manage usage-limit state for a specific PixelForge feature.
 *
 * @returns {object} Hook state and handlers.
 */
export function useUsageLimit(feature = 'upscale') {
  const maxLimit = FEATURE_LIMITS[feature] ?? FEATURE_LIMITS.default;

  const [usesRemaining, setUsesRemaining] = useState(maxLimit);
  const [resetTimestamp, setResetTimestamp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUsage = useCallback(async () => {
    if (!apiUrl) return;
    try {
      const res = await fetch(`${apiUrl}/usage?feature=${feature}`);
      if (!res.ok) return;
      const data = await res.json();
      setUsesRemaining(
        Number.isFinite(data.uses_remaining) ? data.uses_remaining : maxLimit,
      );
      setResetTimestamp(
        Number.isFinite(data.reset_timestamp) ? data.reset_timestamp : null,
      );
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
        setUsesRemaining(
          Number.isFinite(data.uses_remaining) ? data.uses_remaining : maxLimit,
        );
        setResetTimestamp(
          Number.isFinite(data.reset_timestamp) ? data.reset_timestamp : null,
        );
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
    refreshUsage().catch((err) => {
      console.error(`Failed to refresh usage data for ${feature}:`, err);
    });
  }, [refreshUsage, feature]);

  const forceMaxLimit = useCallback(() => {
    setUsesRemaining(0);
    setResetTimestamp(Date.now() + (config.DAY_MS || 86400000));
  }, []);

  return {
    usesRemaining,
    resetTimestamp,
    recordUsage,
    forceMaxLimit,
    refreshUsage,
    isLoading,
    maxLimit,
  };
}
