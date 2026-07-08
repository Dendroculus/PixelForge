/**
 * Runtime upload/result limit resolver.
 *
 * PixelForge exposes backend-owned limits through ``GET /limits``. The frontend
 * uses those values for user experience, while the backend remains the source
 * of truth after direct-to-Azure upload.
 *
 * This module owns:
 *   - sessionStorage caching for runtime limits,
 *   - fallback limits when the API is unavailable,
 *   - upload byte-limit resolution when a tool provides a custom size override.
 */

import {
  AppConfig as config,
  STORAGE_KEYS,
  FILE_VALIDATION_CONFIG,
} from '@/config';
import { apiClient } from '@/services/base/apiClient';

export const RUNTIME_LIMIT_CACHE_MS =
  FILE_VALIDATION_CONFIG.RUNTIME_LIMIT_CACHE_MS;
export const RUNTIME_LIMIT_STORAGE_KEY =
  STORAGE_KEYS?.RUNTIME_LIMITS || 'pf_runtime_limits';

/**
 * Return conservative frontend fallback limits.
 *
 * These values are only used when ``/limits`` cannot be reached. They should
 * match backend defaults closely, but backend validation still decides the
 * actual final result.
 *
 * @returns {object} Runtime-limit object with upload and result groups.
 */
export const getFallbackLimits = () => ({
  upload: {
    max_file_size_mb: config.MAX_FILE_SIZE_MB,
    max_file_size_bytes: config.MAX_FILE_SIZE_MB * 1024 * 1024,
    max_megapixels: config.MAX_MEGAPIXELS,
    max_pixels: config.MAX_PIXELS,
    allowed_extensions: config.ALLOWED_EXTENSIONS,
  },
  result: {
    max_result_file_size_mb: config.MAX_RESULT_FILE_SIZE_MB,
  },
});

/**
 * Read a cached runtime-limit payload from sessionStorage.
 *
 * @returns {object|null} Cached runtime limits, or ``null`` when missing,
 * expired, unavailable, or malformed.
 */
const readCachedRuntimeLimits = () => {
  if (typeof sessionStorage === 'undefined') return null;

  try {
    const cachedRaw = sessionStorage.getItem(RUNTIME_LIMIT_STORAGE_KEY);
    if (!cachedRaw) return null;

    const cached = JSON.parse(cachedRaw);
    const isFresh = Date.now() - cached.savedAt < RUNTIME_LIMIT_CACHE_MS;

    return isFresh ? cached.value : null;
  } catch (e) {
    console.warn('Invalid runtime limit cache ignored.', e);
    sessionStorage.removeItem(RUNTIME_LIMIT_STORAGE_KEY);
    return null;
  }
};

/**
 * Save runtime limits in sessionStorage.
 *
 * @param {object} value - Runtime limits returned by the backend.
 * @returns {void}
 */
const writeCachedRuntimeLimits = (value) => {
  if (typeof sessionStorage === 'undefined') return;

  sessionStorage.setItem(
    RUNTIME_LIMIT_STORAGE_KEY,
    JSON.stringify({
      savedAt: Date.now(),
      value,
    }),
  );
};

/**
 * Fetch backend-owned upload/result limits with cache and fallback.
 *
 * @returns {Promise<object>} Runtime limits from backend or fallback config.
 */
export const getRuntimeLimits = async () => {
  try {
    const cached = readCachedRuntimeLimits();
    if (cached) return cached;

    const value = await apiClient.getRuntimeLimits();
    writeCachedRuntimeLimits(value);

    return value;
  } catch (e) {
    console.warn('Using fallback upload limits because /limits failed.', e);
    return getFallbackLimits();
  }
};

/**
 * Resolve the active upload byte limit.
 *
 * Some tools may pass a custom MB override. When no override is provided, this
 * function uses backend-owned runtime limits.
 *
 * @param {object} limits - Runtime limits from ``getRuntimeLimits``.
 * @param {number|null} customMaxSizeMB - Optional upload-size override in MB.
 * @returns {{limitMB: number, maxFileSizeBytes: number}} Active size limit.
 */
export const resolveUploadSizeLimit = (limits, customMaxSizeMB = null) => {
  const limitMB = customMaxSizeMB || limits.upload.max_file_size_mb;
  const maxFileSizeBytes =
    customMaxSizeMB != null
      ? customMaxSizeMB * 1024 * 1024
      : limits.upload.max_file_size_bytes;

  return { limitMB, maxFileSizeBytes };
};
