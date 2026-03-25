// ── OCR 캐시 시스템 ──────────────────────────────────────
// SHA-256 해시 기반 캐시 (IndexedDB, TTL 7일)
// localStorage 8MB 제한 회피를 위해 IndexedDB 사용

'use client';

const DB_NAME = 'ibs_ocr_cache';
const STORE_NAME = 'ocr_results';
const DB_VERSION = 1;
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

// ── IndexedDB 헬퍼 ──────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'hash' });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ── SHA-256 해시 생성 ────────────────────────────────────

export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── 캐시 조회 ────────────────────────────────────────────

export interface CachedOcrResult {
  hash: string;
  result: unknown; // OcrResult
  engine: string;
  mode: string;
  cachedAt: number;
  expiresAt: number;
}

export async function getCache(hash: string): Promise<CachedOcrResult | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(hash);

      request.onsuccess = () => {
        const record = request.result as CachedOcrResult | undefined;
        if (!record) {
          resolve(null);
          return;
        }
        // TTL 체크
        if (Date.now() > record.expiresAt) {
          // 만료됨 — 삭제
          deleteCache(hash).catch(() => {});
          resolve(null);
          return;
        }
        resolve(record);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

// ── 캐시 저장 ────────────────────────────────────────────

export async function setCache(
  hash: string,
  result: unknown,
  engine: string,
  mode: string,
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record: CachedOcrResult = {
        hash,
        result,
        engine,
        mode,
        cachedAt: Date.now(),
        expiresAt: Date.now() + TTL_MS,
      };

      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // 캐시 저장 실패 — silent
  }
}

// ── 캐시 삭제 ────────────────────────────────────────────

export async function deleteCache(hash: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(hash);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // silent
  }
}

// ── 만료된 캐시 정리 ────────────────────────────────────

export async function clearExpired(): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('expiresAt');
      const range = IDBKeyRange.upperBound(Date.now());
      const request = index.openCursor(range);
      let deletedCount = 0;

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return 0;
  }
}

// ── 전체 캐시 초기화 ────────────────────────────────────

export async function clearAllCache(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // silent
  }
}

// ── 캐시 통계 ────────────────────────────────────────────

export async function getCacheStats(): Promise<{ count: number; oldestAt: number | null }> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const countReq = store.count();
      
      countReq.onsuccess = () => {
        const count = countReq.result;
        if (count === 0) {
          resolve({ count: 0, oldestAt: null });
          return;
        }
        
        // 가장 오래된 항목
        const cursorReq = store.openCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          const oldest = cursor ? (cursor.value as CachedOcrResult).cachedAt : null;
          resolve({ count, oldestAt: oldest });
        };
        cursorReq.onerror = () => resolve({ count, oldestAt: null });
      };
      countReq.onerror = () => reject(countReq.error);
    });
  } catch {
    return { count: 0, oldestAt: null };
  }
}
