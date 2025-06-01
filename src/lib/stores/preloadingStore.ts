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
export const minimumLoadingDuration = 3000; // Minimum time to show loading screen (ms)

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
  
  // Calculate weighted progress
  let totalWeight = 0;
  let weightedProgress = 0;
  
  allTasksArray.forEach(task => {
    const weight = task.priority || 1;
    totalWeight += weight;
    
    // Calculate task progress
    let taskProgress = 0;
    switch (task.status) {
      case 'idle':
        taskProgress = 0;
        break;
      case 'pending':
        taskProgress = 0.1;
        break;
      case 'loading':
        taskProgress = task.progress || 0.5;
        break;
      case 'loaded':
        taskProgress = 1;
        break;
      case 'error':
        taskProgress = 1; // Count as complete for progress purposes
        break;
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
        // console.log(`PreloadingStore: Task '${taskId}' registered with status '${initialStatus}' and priority ${priority}.`);
      } else {
        // Update priority if task already exists
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
          // Set default progress based on status
          if (status === 'loading' && currentTasks[taskId].progress === undefined) {
            currentTasks[taskId].progress = 0.5;
          } else if (status === 'loaded') {
            currentTasks[taskId].progress = 1;
          } else if (status === 'error') {
            currentTasks[taskId].progress = 1;
          }
          // console.log(`PreloadingStore: Task '${taskId}' status updated to '${status}'.`);
        }
      } else {
        // console.warn(`PreloadingStore: Task '${taskId}' not found to update status. Registering.`);
        currentTasks[taskId] = { 
          id: taskId, 
          status: status, 
          message: message,
          progress: status === 'loaded' ? 1 : status === 'loading' ? 0.5 : 0
        };
      }
      return currentTasks;
    });
  },
  
  updateTaskProgress: (taskId: string, progress: number) => {
    tasks.update(currentTasks => {
      if (currentTasks[taskId]) {
        currentTasks[taskId].progress = Math.max(0, Math.min(1, progress));
        // console.log(`PreloadingStore: Task '${taskId}' progress updated to ${progress}.`);
      }
      return currentTasks;
    });
  },
  
  getTaskStatus: (taskId: string): TaskStatus | undefined => {
    const currentTasks = get(tasks);
    return currentTasks[taskId]?.status;
  },
  
  getTaskProgress: (taskId: string): number => {
    const currentTasks = get(tasks);
    const task = currentTasks[taskId];
    if (!task) return 0;
    
    switch (task.status) {
      case 'idle': return 0;
      case 'pending': return 0.1;
      case 'loading': return task.progress || 0.5;
      case 'loaded': return 1;
      case 'error': return 1;
      default: return 0;
    }
  },
  
  resetTasks: () => {
    // console.log("PreloadingStore: Resetting all tasks.");
    tasks.set({});
    initialSiteLoadComplete.set(false);
  },
  
  /**
   * Get a summary of all tasks for debugging
   */
  getTasksSummary: () => {
    const currentTasks = get(tasks);
    const summary = Object.values(currentTasks).map(task => ({
      id: task.id,
      status: task.status,
      progress: task.progress,
      priority: task.priority
    }));
    return summary;
  }
};

export const overallLoadingState = derived(tasks, $tasks => {
  const allTasksArray = Object.values($tasks);

  if (allTasksArray.length === 0) {
    return 'idle';
  }

  if (allTasksArray.some(task => task.status === 'error')) {
    return 'error';
  }

  if (allTasksArray.every(task => task.status === 'loaded')) {
    return 'loaded';
  }
  
  if (allTasksArray.some(task => task.status === 'loading' || task.status === 'pending')) {
    return 'loading';
  }

  return 'idle';
});

export const isEverythingLoading = derived(overallLoadingState, $status => $status === 'loading');
export const isEverythingLoaded = derived(overallLoadingState, $status => $status === 'loaded');
export const hasLoadingError = derived(overallLoadingState, $status => $status === 'error');

// Helper to initiate a task with priority
export const startLoadingTask = (taskId: string, priority: number = 1) => {
  preloadingStore.registerTask(taskId, 'loading', priority);
};

// Helper to simulate progress updates (useful for long-running tasks)
export const simulateTaskProgress = (taskId: string, duration: number = 2000) => {
  const steps = 20;
  const stepDuration = duration / steps;
  let currentStep = 0;
  
  const interval = setInterval(() => {
    currentStep++;
    const progress = currentStep / steps;
    preloadingStore.updateTaskProgress(taskId, progress);
    
    if (currentStep >= steps) {
      clearInterval(interval);
    }
  }, stepDuration);
  
  return () => clearInterval(interval);
};