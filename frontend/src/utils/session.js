import { clearIDB } from './idb';
import { makeStorageKeys } from './storageKeys';

/**
 * Clears feature-specific persisted app session state from IndexedDB and localStorage.
 * Also revokes the object URL for preview image if provided.
 *
 * @param {string|null} previewUrl - Optional object URL created with URL.createObjectURL for preview cleanup.
 * @param {string} feature - The feature namespace to clear (e.g., 'upscale' or 'rembg')
 * @returns {Promise<void>}
 */
export const clearAppSession = async (previewUrl = null, feature) => {
  if (!feature) {
    console.warn('clearAppSession called without feature parameter. Session clear aborted to prevent global data loss.');
    return;
  }

  try {
    await clearIDB(feature);
  } catch (e) {
    console.error(`Error clearing IDB for feature ${feature}:`, e);
  }

  const storageKeys = makeStorageKeys(feature);

  localStorage.removeItem(storageKeys.JOB_ID);
  localStorage.removeItem(storageKeys.PROGRESS);
  localStorage.removeItem(storageKeys.RESULT_URL);
  localStorage.removeItem(storageKeys.IS_PROCESSING);
  localStorage.removeItem(storageKeys.REFRESH_COUNT);
  localStorage.removeItem(storageKeys.RESULT_TIMESTAMP);
  localStorage.removeItem(storageKeys.UPLOAD_TIMESTAMP);

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }
};