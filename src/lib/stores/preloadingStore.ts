import { writable, derived, get } from 'svelte/store';

export type TaskStatus = 'idle' | 'pending' | 'loading' | 'loaded' | 'error';

export interface PreloadTask {
  id: string;
  status: TaskStatus;
  message?: string; // Optional message, e.g., for errors
}

const tasks = writable<Record<string, PreloadTask>>({});

/**
 * Tracks whether the initial, full-site loading sequence has completed.
 * Once true, the main loading screen should not reappear.
 */
export const initialSiteLoadComplete = writable<boolean>(false);

export const preloadingStore = {
  subscribe: tasks.subscribe,
  registerTask: (taskId: string, initialStatus: TaskStatus = 'pending') => {
    tasks.update(currentTasks => {
      if (!currentTasks[taskId] || currentTasks[taskId].status === 'idle' || currentTasks[taskId].status === 'error') {
        currentTasks[taskId] = { id: taskId, status: initialStatus };
        // console.log(`PreloadingStore: Task '${taskId}' registered with status '${initialStatus}'.`);
      } else {
        // console.log(`PreloadingStore: Task '${taskId}' already registered with status '${currentTasks[taskId].status}'. Not overwriting.`);
      }
      return currentTasks;
    });
  },
  updateTaskStatus: (taskId: string, status: TaskStatus, message?: string) => {
    tasks.update(currentTasks => {
      if (currentTasks[taskId]) {
        if (currentTasks[taskId].status !== 'loaded' || status !== 'loading') { // Avoid resetting 'loaded' to 'loading'
            currentTasks[taskId].status = status;
            if (message) currentTasks[taskId].message = message;
            // console.log(`PreloadingStore: Task '${taskId}' status updated to '${status}'.`);
        }
      } else {
        // console.warn(`PreloadingStore: Task '${taskId}' not found to update status. Registering.`);
        currentTasks[taskId] = { id: taskId, status: status, message: message };
      }
      return currentTasks;
    });
  },
  getTaskStatus: (taskId: string): TaskStatus | undefined => {
    const currentTasks = get(tasks);
    return currentTasks[taskId]?.status;
  },
  resetTasks: () => {
    // console.log("PreloadingStore: Resetting all tasks.");
    tasks.set({});
    initialSiteLoadComplete.set(false); // Also reset initial load complete status
  }
};

export const overallLoadingState = derived(tasks, $tasks => {
  const allTasksArray = Object.values($tasks);

  if (allTasksArray.length === 0) {
    return 'idle'; // No tasks registered yet, or all tasks were cleared.
  }

  if (allTasksArray.some(task => task.status === 'error')) {
    return 'error';
  }

  if (allTasksArray.every(task => task.status === 'loaded')) {
    return 'loaded';
  }
  
  // If any task is 'loading' or 'pending', overall state is 'loading'.
  // 'pending' means it's registered but not actively fetching yet.
  if (allTasksArray.some(task => task.status === 'loading' || task.status === 'pending')) {
    return 'loading';
  }

  return 'idle'; // Should ideally be covered by 'loaded' or 'loading' if tasks exist.
});

export const isEverythingLoading = derived(overallLoadingState, $status => $status === 'loading');
export const isEverythingLoaded = derived(overallLoadingState, $status => $status === 'loaded');
export const hasLoadingError = derived(overallLoadingState, $status => $status === 'error');

// Helper to initiate a task: registers it and sets its status to 'loading'.
export const startLoadingTask = (taskId: string) => {
  preloadingStore.registerTask(taskId, 'loading'); // Will set to loading only if not already loaded
};
