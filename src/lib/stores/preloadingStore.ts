// src/lib/stores/preloadingStore.ts
import { writable, derived, get } from 'svelte/store';

export type TaskStatus = 'idle' | 'pending' | 'loading' | 'loaded' | 'error';
export type AssetStatus = 'idle' | 'loading' | 'loaded' | 'error';

// Locale detection status for root page geolocation (kept for potential future use)
export type LocaleDetectionStatus = 'idle' | 'detecting' | 'found-cookie' | 'detected' | 'error';
export const localeDetectionStatus = writable<LocaleDetectionStatus>('idle');

/**
 * Signals when the loading screen animation has started and heavy work can begin.
 * This prevents asset loading from causing animation stutter at startup.
 * Components should wait for this before starting network requests or heavy computation.
 */
export const loadingAnimationReady = writable<boolean>(false);

/**
 * Returns a promise that resolves when the loading animation is ready for heavy work.
 * Uses requestAnimationFrame-based waiting to ensure smooth animation startup.
 */
export function waitForLoadingAnimationReady(): Promise<void> {
  if (get(loadingAnimationReady)) return Promise.resolve();
  return new Promise(resolve => {
    const unsub = loadingAnimationReady.subscribe(ready => {
      if (ready) {
        unsub();
        resolve();
      }
    });
  });
}

export interface PreloadTask {
  id: string;
  status: TaskStatus;
  progress?: number;
  message?: string;
  priority?: number;
}

// This store tracks individual asset URLs to prevent re-downloads
const assetLoadingStatus = writable<Record<string, AssetStatus>>({});

// This store tracks tasks for the initial site loading screen
const tasks = writable<Record<string, PreloadTask>>({});

// Track in-flight loads so multiple callers can await the same work.
const inFlightAssetPromises = new Map<string, Promise<void>>();

// Configuration for the initial loading screen
export const minimumLoadingDuration = 1000; // Minimum time to show loading screen (ms)

/**
 * Tracks whether the initial, full-site loading sequence has completed.
 * Once true, the main loading screen should not reappear.
 */
export const initialSiteLoadComplete = writable<boolean>(false);

/**
 * Overall loading progress from 0 to 1 for the initial loading screen
 */
export const loadingProgress = derived(tasks, $tasks => {
  const allTasksArray = Object.values($tasks);
  if (allTasksArray.length === 0) return 0;

  let totalWeight = 0;
  let weightedProgress = 0;

  allTasksArray.forEach(task => {
    const weight = task.priority || 1;
    totalWeight += weight;

    let taskProgress = 0;
    switch (task.status) {
      case 'loaded': taskProgress = 1; break;
      case 'error': taskProgress = 1; break;
      case 'loading': taskProgress = task.progress || 0.5; break;
      default: taskProgress = 0; break;
    }

    weightedProgress += taskProgress * weight;
  });

  return totalWeight > 0 ? weightedProgress / totalWeight : 0;
});

export const preloadingStore = {
  subscribe: tasks.subscribe,
  
  registerTask: (taskId: string, initialStatus: TaskStatus = 'pending', priority: number = 1) => {
    tasks.update(currentTasks => {
      if (!currentTasks[taskId] || currentTasks[taskId].status === 'idle' || currentTasks[taskId].status === 'error') {
        currentTasks[taskId] = { 
          id: taskId, 
          status: initialStatus,
          priority,
          progress: initialStatus === 'loading' ? 0.5 : undefined
        };
      } else {
        currentTasks[taskId].priority = priority;
      }
      return currentTasks;
    });
  },
  
  updateTaskStatus: (taskId: string, status: TaskStatus, message?: string) => {
    tasks.update(currentTasks => {
      if (currentTasks[taskId]) {
        if (currentTasks[taskId].status !== 'loaded' || status !== 'loading') {
          currentTasks[taskId].status = status;
          if (message) currentTasks[taskId].message = message;
          if (status === 'loaded' || status === 'error') {
            currentTasks[taskId].progress = 1;
          }
        }
      } else {
        currentTasks[taskId] = { 
          id: taskId, 
          status: status, 
          message: message,
          progress: status === 'loaded' ? 1 : 0
        };
      }
      return currentTasks;
    });
  },
  
  updateTaskProgress: (taskId: string, progress: number) => {
    tasks.update(currentTasks => {
      if (currentTasks[taskId]) {
        currentTasks[taskId].progress = Math.max(0, Math.min(1, progress));
      }
      return currentTasks;
    });
  },
  
  getTaskStatus: (taskId: string): TaskStatus | undefined => {
    const currentTasks = get(tasks);
    return currentTasks[taskId]?.status;
  },
  
  resetTasks: () => {
    tasks.set({});
    initialSiteLoadComplete.set(false);
    loadingAnimationReady.set(false);
    assetLoadingStatus.set({});
  },

  getAssetStatus: (url: string): AssetStatus => {
    return get(assetLoadingStatus)[url] || 'idle';
  },

  setAssetStatus: (url: string, status: AssetStatus) => {
    assetLoadingStatus.update(current => {
      current[url] = status;
      return current;
    });
  }
};

export const overallLoadingState = derived(tasks, $tasks => {
  const allTasksArray = Object.values($tasks);

  if (allTasksArray.length === 0) return 'idle';
  if (allTasksArray.some(task => task.status === 'error')) return 'error';
  if (allTasksArray.every(task => task.status === 'loaded')) return 'loaded';
  if (allTasksArray.some(task => task.status === 'loading' || task.status === 'pending')) return 'loading';
  return 'idle';
});

export const startLoadingTask = (taskId: string, priority: number = 1) => {
  preloadingStore.registerTask(taskId, 'loading', priority);
};

/**
 * A robust, generic function to preload an array of assets (images, fonts, etc.).
 * It updates the central asset status store to prevent re-downloads.
 * @param urls An array of asset URLs to load.
 * @returns A promise that resolves when all assets are loaded, or rejects on the first error.
 */
export async function preloadAssets(urls: string[]): Promise<void> {
  const promises: Promise<void>[] = [];

  for (const url of urls) {
    const status = preloadingStore.getAssetStatus(url);
    if (status === 'loaded') continue;
    if (status === 'loading') {
      const existing = inFlightAssetPromises.get(url);
      if (existing) promises.push(existing);
      continue;
    }
    
    preloadingStore.setAssetStatus(url, 'loading');

    const promise: Promise<void> = new Promise((resolve, reject) => {
      // Image preloader with decode guarantee (when supported)
      if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url)) {
        const img = new Image();
        img.decoding = 'async';
        let settled = false;

        const cleanup = () => {
          img.onload = null;
          img.onerror = null;
        };

        const markLoaded = () => {
          if (settled) return;
          settled = true;
          cleanup();
          preloadingStore.setAssetStatus(url, 'loaded');
          resolve();
        };

        const markError = (err?: unknown) => {
          if (settled) return;
          settled = true;
          cleanup();
          preloadingStore.setAssetStatus(url, 'error');
          reject(err instanceof Error ? err : new Error(`Failed to load image: ${url}`));
        };

        img.onload = () => {
          if (typeof img.decode === 'function') {
            img
              .decode()
              .then(markLoaded)
              .catch(() => {
                // Some browsers reject decode even though the image is usable.
                if (img.complete && img.naturalWidth > 0) markLoaded();
                else markError();
              });
          } else {
            markLoaded();
          }
        };
        img.onerror = () => markError(new Error(`Failed to load image: ${url}`));
        img.src = url;
      }
      // Basic font preloader (for .json from FontLoader)
      else if (/\.json$/i.test(url)) {
        fetch(url)
          .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
          })
          .then(() => {
            preloadingStore.setAssetStatus(url, 'loaded');
            resolve();
          })
          .catch(error => {
            preloadingStore.setAssetStatus(url, 'error');
            reject(new Error(`Failed to load font data: ${url} - ${error.message}`));
          });
      }
      // Add other file types (videos, etc.) here if needed
      else {
        console.warn(`Preloading not implemented for file type: ${url}`);
        resolve(); // Resolve unsupported types immediately
      }
    })
      .finally(() => {
        inFlightAssetPromises.delete(url);
      });

    inFlightAssetPromises.set(url, promise);
    promises.push(promise);
  }

  await Promise.all(promises);
}