/**
 * IndexedDB helpers for workspace file persistence.
 *
 * Stores and retrieves feature-scoped files so AI workspaces can restore selected
 * uploads after reloads or route transitions.
 */

const DB_NAME = 'PixelForgeDB';
const STORE_NAME = 'files';

/**
 * Open the PixelForge IndexedDB database and create the file store if needed.
 *
 * @returns {Promise<IDBDatabase>} Open IndexedDB database instance.
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Build the feature-scoped storage key used for persisted files.
 *
 * @param {string} feature PixelForge feature key.
 * @returns {string} IndexedDB object-store key.
 */
const getFileKey = (feature) => {
  if (!feature) throw new Error('Feature parameter is required for IDB operations');
  return `currentFile_${feature}`;
};

/**
 * Save a feature-scoped file in IndexedDB.
 *
 * @returns {Promise<void>} Promise that resolves when the IndexedDB operation completes.
 */
export const saveFileToIDB = async (file, feature) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(file, getFileKey(feature));
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Load a feature-scoped file from IndexedDB.
 *
 * @returns {Promise<File | undefined>} Stored file, if one exists.
 */
export const loadFileFromIDB = async (feature) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(getFileKey(feature));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Remove a feature-scoped file from IndexedDB.
 *
 * @returns {Promise<void>} Promise that resolves when the IndexedDB operation completes.
 */
export const clearIDB = async (feature) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(getFileKey(feature));
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};