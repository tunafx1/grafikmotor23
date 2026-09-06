/** Storage denial or a full quota must never crash the editor or erase old data. */
export const storage = {
  getItem(key: string): string | null {
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  setItem(key: string, value: string): boolean {
    try { window.localStorage.setItem(key, value); return true; }
    catch { window.dispatchEvent(new Event('workspace-storage-error')); return false; }
  },
  removeItem(key: string): void {
    try { window.localStorage.removeItem(key); }
    catch { window.dispatchEvent(new Event('workspace-storage-error')); }
  },
};
