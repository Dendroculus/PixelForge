const DB_NAME = 'PixelForgeDB';
const STORE_NAME = 'files';

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

const getFileKey = (feature) => {
  if (!feature) throw new Error('Feature parameter is required for IDB operations');
  return `currentFile_${feature}`;
};

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