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

export interface SchedulerMetricsState {
  queueLength: number;
  activeFetches: number;
  timings: Record<string, SectionTiming>; // keyed by section id
  lastNavigationIndex: number;
}

const initial: SchedulerMetricsState = {
  queueLength: 0,
  activeFetches: 0,
  timings: {},
  lastNavigationIndex: 0
};

export const schedulerMetrics: Writable<SchedulerMetricsState> = writable(initial);

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
