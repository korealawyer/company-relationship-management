/**
 * Task 4.8: SSR Vercel 서버 크래시 방어용 스토리지 래퍼
 *
 * Next.js App Router 환경에서 SSR(Server Side Rendering) 진행 시
 * window나 localStorage 객체가 존재하지 않아 빌드 및 런타임 에러가 발생하는 것을 방지합니다.
 */

class SafeStorageManager {
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  getItem(key: string): string | null {
    if (!this.isBrowser) return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn(`[SafeStorage] Error reading ${key}`, e);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (!this.isBrowser) return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[SafeStorage] Error setting ${key}`, e);
    }
  }

  removeItem(key: string): void {
    if (!this.isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[SafeStorage] Error removing ${key}`, e);
    }
  }

  clear(): void {
    if (!this.isBrowser) return;
    try {
      window.localStorage.clear();
    } catch (e) {
      console.warn(`[SafeStorage] Error clearing storage`, e);
    }
  }
}

export const safeStorage = new SafeStorageManager();
