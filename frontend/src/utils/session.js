import { clearIDB } from './idb';
import { STORAGE_KEYS } from '../config';

/**
 * Clears all persisted app session state from IndexedDB and localStorage.
 * Also revokes the object URL for preview image if provided.
 *
 * @param {string|null} [previewUrl=null] - Optional object URL created with URL.createObjectURL for preview cleanup.
 * @returns {Promise<void>}
 */
export const clearAppSession = async (previewUrl = null) => {
  try {
    await clearIDB();
  } catch (e) {
    console.error('Error clearing IDB:', e);
  }

  localStorage.removeItem(STORAGE_KEYS.JOB_ID);
  localStorage.removeItem(STORAGE_KEYS.PROGRESS);
  localStorage.removeItem(STORAGE_KEYS.RESULT_URL);
  localStorage.removeItem(STORAGE_KEYS.IS_PROCESSING);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_COUNT);
  localStorage.removeItem(STORAGE_KEYS.RESULT_TIMESTAMP);
  localStorage.removeItem(STORAGE_KEYS.UPLOAD_TIMESTAMP); // NEW

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }
};