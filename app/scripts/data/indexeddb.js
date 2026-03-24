const DB_NAME = 'bone-and-billing';
const DB_VERSION = 1;
const META_STORE = 'meta';
const HISTORY_STORE = 'billHistory';

let dbPromise;

function openDb() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        const history = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
        history.createIndex('closedAt', 'closedAt');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

async function withTransaction(storeNames, mode, callback) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeNames, mode);
    callback(transaction);
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getMeta(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(META_STORE, 'readonly');
    const request = transaction.objectStore(META_STORE).get(key);
    request.onsuccess = () => resolve(request.result?.value ?? null);
    request.onerror = () => reject(request.error);
  });
}

export function setMeta(key, value) {
  return withTransaction([META_STORE], 'readwrite', (transaction) => {
    transaction.objectStore(META_STORE).put({ key, value, updatedAt: new Date().toISOString() });
  });
}

export async function getBillHistory() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HISTORY_STORE, 'readonly');
    const request = transaction.objectStore(HISTORY_STORE).getAll();
    request.onsuccess = () => {
      const rows = request.result.sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt));
      resolve(rows);
    };
    request.onerror = () => reject(request.error);
  });
}

export function addBillHistory(record) {
  return withTransaction([HISTORY_STORE], 'readwrite', (transaction) => {
    transaction.objectStore(HISTORY_STORE).put(record);
  });
}

export function replaceBillHistory(records) {
  return withTransaction([HISTORY_STORE], 'readwrite', (transaction) => {
    const store = transaction.objectStore(HISTORY_STORE);
    store.clear();
    records.forEach((record) => store.put(record));
  });
}

export function clearBillHistory() {
  return replaceBillHistory([]);
}
