export function getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('crm-storage', 1);
        request.onupgradeneeded = (e: any) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('tempData')) {
                db.createObjectStore('tempData');
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function idbSet(key: string, val: any): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('tempData', 'readwrite');
        const store = tx.objectStore('tempData');
        store.put(val, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function idbGet(key: string): Promise<any> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('tempData', 'readonly');
        const store = tx.objectStore('tempData');
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function idbDel(key: string): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('tempData', 'readwrite');
        const store = tx.objectStore('tempData');
        store.delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}
