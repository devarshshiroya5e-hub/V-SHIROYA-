/**
 * IndexedDB storage for full uploaded policy PDF files.
 * This guarantees that uploaded PDF files are permanently stored
 * without hitting Firestore or localStorage size limits.
 */

const DB_NAME = 'VShiroyaPolicyPdfDB';
const STORE_NAME = 'uploaded_pdfs';
const DB_VERSION = 1;

function openPdfDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (event: any) => {
      resolve(event.target.result as IDBDatabase);
    };
    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function storePdfFile(policyKey: string, dataUrl: string): Promise<void> {
  if (!policyKey || !dataUrl) return;
  try {
    const db = await openPdfDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(dataUrl, policyKey);
  } catch (err) {
    console.warn('Failed to store PDF in IndexedDB:', err);
  }
}

export async function getPdfFile(policyKey: string): Promise<string | null> {
  if (!policyKey) return null;
  try {
    const db = await openPdfDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(policyKey);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('Failed to retrieve PDF from IndexedDB:', err);
    return null;
  }
}
