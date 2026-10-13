import { Station, PlaybackHistoryItem, AppSettings, BackupData } from '../types';
import initialCategories from '../data/initialCategories.json';

const DB_NAME = 'RadioHubDB';
const DB_VERSION = 1;

interface DBSchema {
  customStations: Station;
  favorites: { id: string };
  history: PlaybackHistoryItem;
  metadata: { key: string; value: unknown };
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('customStations')) {
        db.createObjectStore('customStations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('history')) {
        const historyStore = db.createObjectStore('history', { keyPath: 'stationId' });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.warn('Failed to open IndexedDB, fallback will be used', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

// Helper generic transaction
async function performTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => Promise<T> | IDBRequest
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = callback(store);

    if (result instanceof Promise) {
      result.then(resolve).catch(reject);
    } else {
      result.onsuccess = () => resolve(result.result);
      result.onerror = () => reject(result.error);
    }
    tx.onerror = () => reject(tx.error);
  });
}

// 1. Custom Stations
export async function getCustomStations(): Promise<Station[]> {
  try {
    return await performTx<Station[]>('customStations', 'readonly', (store) => store.getAll());
  } catch {
    const local = localStorage.getItem('radiohub_custom_stations');
    return local ? JSON.parse(local) : [];
  }
}

export async function saveCustomStation(station: Station): Promise<void> {
  try {
    await performTx('customStations', 'readwrite', (store) => store.put(station));
  } catch {
    // fallback
    const stations = await getCustomStations();
    const idx = stations.findIndex((s) => s.id === station.id);
    if (idx >= 0) stations[idx] = station;
    else stations.push(station);
    localStorage.setItem('radiohub_custom_stations', JSON.stringify(stations));
  }
}

export async function deleteCustomStation(id: string): Promise<void> {
  try {
    await performTx('customStations', 'readwrite', (store) => store.delete(id));
  } catch {
    const stations = (await getCustomStations()).filter((s) => s.id !== id);
    localStorage.setItem('radiohub_custom_stations', JSON.stringify(stations));
  }
}

// 2. Favorites
export async function getFavorites(): Promise<string[]> {
  try {
    const items = await performTx<{ id: string }[]>('favorites', 'readonly', (store) => store.getAll());
    return items.map((i) => i.id);
  } catch {
    const local = localStorage.getItem('radiohub_favorites');
    return local ? JSON.parse(local) : [];
  }
}

export async function saveFavorites(ids: string[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('favorites', 'readwrite');
      const store = tx.objectStore('favorites');
      store.clear();
      ids.forEach((id) => store.put({ id }));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    localStorage.setItem('radiohub_favorites', JSON.stringify(ids));
  }
}

export async function toggleFavorite(stationId: string): Promise<boolean> {
  const current = await getFavorites();
  const exists = current.includes(stationId);
  const updated = exists ? current.filter((id) => id !== stationId) : [...current, stationId];
  await saveFavorites(updated);
  return !exists;
}

// 3. Playback History (recent 50)
export async function getHistory(): Promise<PlaybackHistoryItem[]> {
  try {
    const items = await performTx<PlaybackHistoryItem[]>('history', 'readonly', (store) => store.getAll());
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  } catch {
    const local = localStorage.getItem('radiohub_history');
    return local ? JSON.parse(local) : [];
  }
}

export async function addToHistory(station: Station): Promise<void> {
  const item: PlaybackHistoryItem = {
    stationId: station.id,
    timestamp: Date.now(),
    station,
  };
  try {
    await performTx('history', 'readwrite', (store) => store.put(item));
  } catch {
    const history = (await getHistory()).filter((h) => h.stationId !== station.id);
    history.unshift(item);
    localStorage.setItem('radiohub_history', JSON.stringify(history.slice(0, 50)));
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await performTx('history', 'readwrite', (store) => store.clear());
  } catch {
    localStorage.removeItem('radiohub_history');
  }
}

// 4. Categories Order
export async function getCategoryOrder(): Promise<string[]> {
  try {
    const item = await performTx<{ key: string; value: string[] } | undefined>(
      'metadata',
      'readonly',
      (store) => store.get('categoryOrder')
    );
    if (item && Array.isArray(item.value) && item.value.length > 0) {
      return item.value;
    }
  } catch {
    // try local storage
  }

  const local = localStorage.getItem('radiohub_category_order');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }

  return [...initialCategories];
}

export async function saveCategoryOrder(order: string[]): Promise<void> {
  try {
    await performTx('metadata', 'readwrite', (store) =>
      store.put({ key: 'categoryOrder', value: order })
    );
  } catch {}
  localStorage.setItem('radiohub_category_order', JSON.stringify(order));
}

export async function resetCategoryOrder(): Promise<string[]> {
  const defaultOrder = [...initialCategories];
  await saveCategoryOrder(defaultOrder);
  return defaultOrder;
}

// 5. Settings
export const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'ko',
  volume: 0.85,
  isMuted: false,
  autoReconnect: true,
  sleepTimerMinutes: null,
  preferredView: 'grid',
};

export async function getSettings(): Promise<AppSettings> {
  let settings = { ...defaultSettings };
  try {
    const item = await performTx<{ key: string; value: Partial<AppSettings> } | undefined>(
      'metadata',
      'readonly',
      (store) => store.get('settings')
    );
    if (item && item.value) {
      settings = { ...settings, ...item.value };
    }
  } catch {}

  const local = localStorage.getItem('radiohub_settings');
  if (local) {
    try {
      settings = { ...settings, ...JSON.parse(local) };
    } catch {}
  }
  return settings;
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated = { ...current, ...partial };
  try {
    await performTx('metadata', 'readwrite', (store) =>
      store.put({ key: 'settings', value: updated })
    );
  } catch {}
  localStorage.setItem('radiohub_settings', JSON.stringify(updated));
  return updated;
}

// 6. Backup & Restore
export async function exportAllData(): Promise<BackupData> {
  const [customStations, favorites, history, categoryOrder, settings] = await Promise.all([
    getCustomStations(),
    getFavorites(),
    getHistory(),
    getCategoryOrder(),
    getSettings(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    customStations,
    favorites,
    history,
    categoryOrder,
    settings,
  };
}

export async function importAllData(data: BackupData): Promise<void> {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid backup format');
  }

  if (Array.isArray(data.customStations)) {
    for (const s of data.customStations) {
      await saveCustomStation(s);
    }
  }

  if (Array.isArray(data.favorites)) {
    await saveFavorites(data.favorites);
  }

  if (Array.isArray(data.categoryOrder) && data.categoryOrder.length > 0) {
    await saveCategoryOrder(data.categoryOrder);
  }

  if (data.settings && typeof data.settings === 'object') {
    await saveSettings(data.settings);
  }
}
