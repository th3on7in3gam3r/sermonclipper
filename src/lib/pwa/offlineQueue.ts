'use client';

const DB_NAME = 'vesper-pwa';
const STORE = 'offline-queue';

export type OfflineAction = {
  id: string;
  type: 'scheduled_post' | 'caption_edit';
  payload: Record<string, unknown>;
  createdAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueOfflineAction(action: Omit<OfflineAction, 'id' | 'createdAt'>) {
  if (typeof window === 'undefined') return;
  const db = await openDb();
  const item: OfflineAction = {
    ...action,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    const reg = await navigator.serviceWorker.ready;
    await (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync
      .register('vesper-offline-sync')
      .catch(() => {});
  }
}

export async function flushOfflineQueue(): Promise<number> {
  if (typeof window === 'undefined' || !navigator.onLine) return 0;
  const db = await openDb();
  const items: OfflineAction[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as OfflineAction[]);
    req.onerror = () => reject(req.error);
  });

  let flushed = 0;
  for (const item of items) {
    try {
      const endpoint =
        item.type === 'scheduled_post' ? '/api/scheduled-posts' : '/api/studio/save-caption';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });
      if (res.ok) {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).delete(item.id);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        flushed += 1;
      }
    } catch {
      /* keep in queue */
    }
  }
  return flushed;
}

export function getClipCountForInstall(): number {
  try {
    return Number(localStorage.getItem('vesper-clip-count') || 0);
  } catch {
    return 0;
  }
}

export function incrementClipCount() {
  try {
    const n = getClipCountForInstall() + 1;
    localStorage.setItem('vesper-clip-count', String(n));
    return n;
  } catch {
    return 0;
  }
}
