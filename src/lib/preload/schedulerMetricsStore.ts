// Metrics store for scheduler instrumentation
import { writable, type Writable } from 'svelte/store';

export interface SectionTiming {
  index: number;
  id: string;
  fetchStart?: number;
  fetchEnd?: number;
  initStart?: number;
  initEnd?: number;
  readyAt?: number;
}

export interface TransitionTiming {
  id: string;
  cause: 'wheel' | 'key' | 'dot' | 'swipe' | 'hash' | 'unknown';
  fromIndex: number;
  toIndex: number;
  targetSectionId?: string;
  triggerAt: number;
  navigateStartAt?: number;
  timelineCreatedAt?: number;
  firstFrameAt?: number;
  completeAt?: number;
}

export interface SchedulerMetricsState {
  queueLength: number;
  activeFetches: number;
  timings: Record<string, SectionTiming>; // keyed by section id
  lastNavigationIndex: number;

  // Transition instrumentation (opt-in; populated only when callers invoke it)
  activeTransition: TransitionTiming | null;
  transitionHistory: TransitionTiming[];
}

const initial: SchedulerMetricsState = {
  queueLength: 0,
  activeFetches: 0,
  timings: {},
  lastNavigationIndex: 0,
  activeTransition: null,
  transitionHistory: []
};

export const schedulerMetrics: Writable<SchedulerMetricsState> = writable(initial);

let transitionCounter = 0;

export function beginTransitionMetric(args: {
  cause: TransitionTiming['cause'];
  fromIndex: number;
  toIndex: number;
  targetSectionId?: string;
  triggerAt: number;
}): string {
  const id = `${Date.now()}-${++transitionCounter}`;
  const timing: TransitionTiming = {
    id,
    cause: args.cause,
    fromIndex: args.fromIndex,
    toIndex: args.toIndex,
    targetSectionId: args.targetSectionId,
    triggerAt: args.triggerAt
  };

  schedulerMetrics.update(s => {
    s.activeTransition = timing;
    s.transitionHistory = [timing, ...s.transitionHistory].slice(0, 30);
    return s;
  });

  return id;
}

export function markTransitionMetric(
  id: string,
  mark: 'navigateStartAt' | 'timelineCreatedAt' | 'firstFrameAt' | 'completeAt',
  at: number = performance.now()
) {
  schedulerMetrics.update(s => {
    if (s.activeTransition?.id === id) {
      (s.activeTransition as any)[mark] = at;
    }
    const idx = s.transitionHistory.findIndex(t => t.id === id);
    if (idx >= 0) {
      (s.transitionHistory[idx] as any)[mark] = at;
    }
    return s;
  });
}

export function clearActiveTransitionMetric(id?: string) {
  schedulerMetrics.update(s => {
    if (!id || s.activeTransition?.id === id) {
      s.activeTransition = null;
    }
    return s;
  });
}

export function recordFetchStart(id: string, index: number) {
  schedulerMetrics.update(s => {
    const t = s.timings[id] ||= { id, index } as SectionTiming;
    t.fetchStart = performance.now();
    return s;
  });
}
export function recordFetchEnd(id: string) {
  schedulerMetrics.update(s => { const t = s.timings[id]; if (t) t.fetchEnd = performance.now(); return s; });
}
export function recordInitStart(id: string) {
  schedulerMetrics.update(s => { const t = s.timings[id]; if (t) t.initStart = performance.now(); return s; });
}
export function recordInitEnd(id: string) {
  schedulerMetrics.update(s => { const t = s.timings[id]; if (t) t.initEnd = performance.now(); return s; });
}
export function recordReady(id: string) {
  schedulerMetrics.update(s => { const t = s.timings[id]; if (t) t.readyAt = performance.now(); return s; });
}
export function updateQueue(activeFetches: number, queueLength: number) {
  schedulerMetrics.update(s => { s.activeFetches = activeFetches; s.queueLength = queueLength; return s; });
}
export function recordNavigationMetric(index: number) {
  schedulerMetrics.update(s => { s.lastNavigationIndex = index; return s; });
}
