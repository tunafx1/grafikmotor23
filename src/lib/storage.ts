/** Storage denial or a full quota must never crash the editor or erase old data. */

const DISPOSABLE_KEYS = [
  'active_generated_pages',     // Obsolete legacy duplicate of generated_pages_by_template
  'yt_recent_downloads',        // Temporary YouTube video download list
  'firestore_quota_exceeded',   // Ephemeral quota flag
];

let hasDispatchedError = false;

function tryRemoveItem(key: string): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.removeItem === 'function') {
      window.localStorage.removeItem(key);
      return true;
    }
  } catch {}
  return false;
}

function pruneDisposableStorage(): boolean {
  let freed = false;
  for (const key of DISPOSABLE_KEYS) {
    try {
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
        if (window.localStorage.getItem(key) !== null) {
          if (tryRemoveItem(key)) freed = true;
        }
      }
    } catch {}
  }
  return freed;
}

export const storage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): boolean {
    // 1. Direct attempt
    try {
      window.localStorage.setItem(key, value);
      if (hasDispatchedError) {
        hasDispatchedError = false;
        try { window.dispatchEvent(new Event('workspace-storage-restored')); } catch {}
      }
      return true;
    } catch (e1) {
      // 2. Recovery attempt A: Prune disposable / legacy redundant caches
      const freed = pruneDisposableStorage();
      if (freed) {
        try {
          window.localStorage.setItem(key, value);
          if (hasDispatchedError) {
            hasDispatchedError = false;
            try { window.dispatchEvent(new Event('workspace-storage-restored')); } catch {}
          }
          return true;
        } catch (e2) {}
      }

      // 3. Recovery attempt B: If generated_pages_by_template is growing too large, prune older template records
      if (key === 'generated_pages_by_template') {
        try {
          const parsed = JSON.parse(value);
          const keys = Object.keys(parsed);
          if (keys.length > 1) {
            const trimmed: Record<string, any> = {};
            const recentKeys = keys.slice(-2);
            for (const k of recentKeys) {
              trimmed[k] = parsed[k];
            }
            window.localStorage.setItem(key, JSON.stringify(trimmed));
            if (hasDispatchedError) {
              hasDispatchedError = false;
              try { window.dispatchEvent(new Event('workspace-storage-restored')); } catch {}
            }
            return true;
          }
        } catch {}
      }

      // 4. Final fallback: notify listeners of storage quota issue
      hasDispatchedError = true;
      try {
        window.dispatchEvent(new Event('workspace-storage-error'));
      } catch {}
      return false;
    }
  },

  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      try {
        window.dispatchEvent(new Event('workspace-storage-error'));
      } catch {}
    }
  },

  clearDisposableData(): boolean {
    const freed = pruneDisposableStorage();
    if (freed) {
      hasDispatchedError = false;
      try { window.dispatchEvent(new Event('workspace-storage-restored')); } catch {}
    }
    return freed;
  },

  clearAllCache(): void {
    try {
      tryRemoveItem('generated_pages_by_template');
      tryRemoveItem('active_generated_pages');
      tryRemoveItem('active_graphic_data');
      tryRemoveItem('yt_recent_downloads');
      hasDispatchedError = false;
      try { window.dispatchEvent(new Event('workspace-storage-restored')); } catch {}
    } catch {}
  }
};
