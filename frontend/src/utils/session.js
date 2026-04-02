import { clearIDB } from './idb';
import { STORAGE_KEYS } from '../config';

export const clearAppSession = async (previewUrl = null) => {
  try {
    await clearIDB();
  } catch (e) {
    console.error("Error clearing IDB:", e);
  }
  
  localStorage.removeItem(STORAGE_KEYS.JOB_ID);
  localStorage.removeItem(STORAGE_KEYS.PROGRESS);
  localStorage.removeItem(STORAGE_KEYS.RESULT_URL);
  localStorage.removeItem(STORAGE_KEYS.IS_PROCESSING);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_COUNT);
  localStorage.removeItem(STORAGE_KEYS.RESULT_TIMESTAMP); 
  
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }
};