/** Store video bytes locally; blob: URLs alone cannot survive a browser reload. */
let database: Promise<IDBDatabase> | undefined;
const liveUrls = new Map<string, Promise<string | null>>();
function openMediaStore() {
  return database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('grafik-motoru-media', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('videos');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function storeVideo(file: Blob) {
  const id = crypto.randomUUID();
  const db = await openMediaStore();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('videos', 'readwrite');
    tx.objectStore('videos').put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  const url = URL.createObjectURL(file);
  liveUrls.set(id, Promise.resolve(url));
  return {id, url};
}
export function getVideoUrl(id: string): Promise<string | null> {
  if (!liveUrls.has(id)) liveUrls.set(id, openMediaStore().then(db => new Promise<string | null>((resolve, reject) => {
    const request = db.transaction('videos').objectStore('videos').get(id);
    request.onsuccess = () => resolve(request.result instanceof Blob ? URL.createObjectURL(request.result) : null);
    request.onerror = () => reject(request.error);
  })).catch(() => null));
  return liveUrls.get(id)!;
}
/** Preserve references for untouched branches, so hydration does not create undo steps or loops. */
export function replaceVideoUrls<T>(value: T, urls: Map<string, string>): T {
  if (!value || typeof value !== 'object') return value;
  let result: any = value;
  if (Array.isArray(value)) {
    const items = value.map(item => replaceVideoUrls(item, urls));
    return (items.some((item, i) => item !== value[i]) ? items : value) as T;
  }
  for (const [key, child] of Object.entries(value)) {
    const updated = replaceVideoUrls(child, urls);
    if (updated !== child) { if (result === value) result = {...value}; result[key] = updated; }
  }
  const media = result as {mediaId?: string; videoUrl?: string};
  if (media.mediaId && urls.has(media.mediaId) && media.videoUrl !== urls.get(media.mediaId)) {
    result = {...result, videoUrl: urls.get(media.mediaId)};
  }
  return result;
}
export function videoFileExtension(blob: Blob) { return blob.type.includes('webm') ? 'webm' : 'mp4'; }
