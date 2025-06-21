// src/lib/stores/preloadingStore.ts
import { writable, derived, get } from 'svelte/store';

export type TaskStatus = 'idle' | 'pending' | 'loading' | 'loaded' | 'error';

export interface PreloadTask {
  id: string;
  status: TaskStatus;
  progress?: number; // 0-1 progress value for individual tasks
  message?: string; // Optional message, e.g., for errors
  priority?: number; // Higher priority tasks contribute more to overall progress
}

// Configuration
export const minimumLoadingDuration = 1780; // Minimum time to show loading screen (ms)

// --- NEW ---
/**
 * A queue of asset URLs (e.g., images) to be displayed on the loading screen.
 */
export const loadingAssetQueue = writable<string[]>([]);

const tasks = writable<Record<string, PreloadTask>>({});

/**
 * Tracks whether the initial, full-site loading sequence has completed.
 * Once true, the main loading screen should not reappear.
 */
export const initialSiteLoadComplete = writable<boolean>(false);

/**
 * Overall loading progress from 0 to 1
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
    loadingAssetQueue.set([]); // Reset the asset queue as well
  },
};

export const overallLoadingState = derived(tasks, $tasks => {
  const allTasksArray = Object.values($tasks);

  if (allTasksArray.length === 0) return 'idle';
  if (allTasksArray.some(task => task.status === 'error')) return 'error';
  if (allTasksArray.every(task => task.status === 'loaded')) return 'loaded';
  if (allTasksArray.some(task => task.status === 'loading' || task.status === 'pending')) return 'loading';
  return 'idle';
});

// Helper to initiate a task with priority
export const startLoadingTask = (taskId: string, priority: number = 1) => {
  preloadingStore.registerTask(taskId, 'loading', priority);
};

// --- NEW ---
/**
 * Helper function to populate the loading screen's asset queue.
 * @param urls An array of image URLs to display.
 */
export function addAssetsToLoadingQueue(urls: string[]) {
    loadingAssetQueue.set(urls);
}