import { get } from 'svelte/store';
import { gsap } from 'gsap';
import { preloadAssets } from '$lib/stores/preloadingStore';
import { sectionStates } from '$lib/stores/sectionStateStore';
import { recordFetchEnd, recordFetchStart, recordInitEnd, recordInitStart, recordReady } from './schedulerMetricsStore';
import type { SectionEnvironment } from './sectionScheduler';
import type { SectionWarmupContract } from './warmupContract';

export interface WarmupToken {
	signal: AbortSignal;
	cancel: (reason?: string) => void;
}

export interface StagedSchedulerConfig {
	debug?: boolean;
	idleBudgetMs?: number;
	idleTimeoutMs?: number;
}

export interface WarmupOptions {
	priority?: number;
	mode?: 'idle' | 'immediate';
	signal?: AbortSignal;
}

type IdleDeadlineLike = {
	didTimeout: boolean;
	timeRemaining: () => number;
};

type QueueTask = {
	key: string;
	priority: number;
	createdAt: number;
	run: () => Promise<void>;
	signal?: AbortSignal;
};

function createAbortError(message: string) {
	try {
		return new DOMException(message, 'AbortError');
	} catch {
		const err = new Error(message);
		(err as any).name = 'AbortError';
		return err;
	}
}

function assertNotAborted(signal?: AbortSignal) {
	if (signal?.aborted) throw createAbortError('Warmup cancelled');
}

function requestIdle(timeoutMs: number): Promise<IdleDeadlineLike> {
	const w = window as any;
	if (typeof w.requestIdleCallback === 'function') {
		return new Promise(resolve => {
			w.requestIdleCallback((deadline: IdleDeadlineLike) => resolve(deadline), { timeout: timeoutMs });
		});
	}
	return new Promise(resolve => {
		setTimeout(() => resolve({ didTimeout: true, timeRemaining: () => 0 }), 0);
	});
}

export class StagedSectionScheduler {
	private env: SectionEnvironment;
	private debug: boolean;
	private idleBudgetMs: number;
	private idleTimeoutMs: number;

	private queue: QueueTask[] = [];
	private taskPromises = new Map<string, Promise<void>>();
	private running = false;

	private inFlightSectionWarmups = new Map<number, Promise<void>>();
	private inFlightStagePromises = new Map<
		number,
		{
			fetch?: Promise<void>;
			init?: Promise<void>;
			prime?: Promise<void>;
		}
	>();

	constructor(env: SectionEnvironment, config: StagedSchedulerConfig = {}) {
		this.env = env;
		this.debug = !!config.debug;
		this.idleBudgetMs = Math.max(1, config.idleBudgetMs ?? 12);
		this.idleTimeoutMs = Math.max(1, config.idleTimeoutMs ?? 80);
	}

	updateEnv(env: Partial<SectionEnvironment>) {
		this.env = { ...this.env, ...env } as SectionEnvironment;
	}

	setDebug(v: boolean) {
		this.debug = v;
	}

	createToken(): WarmupToken {
		const controller = new AbortController();
		return {
			signal: controller.signal,
			cancel: (reason?: string) => controller.abort(reason)
		};
	}

	async warmSection(index: number, options: WarmupOptions = {}): Promise<void> {
		const existing = this.inFlightSectionWarmups.get(index);
		if (existing) return existing;

		const p = this.warmSectionInternal(index, options).finally(() => {
			this.inFlightSectionWarmups.delete(index);
		});
		this.inFlightSectionWarmups.set(index, p);
		return p;
	}

	private async warmSectionInternal(index: number, options: WarmupOptions): Promise<void> {
		const mode = options.mode ?? 'idle';
		const priority = options.priority ?? 0;
		const signal = options.signal;
		assertNotAborted(signal);

		const { sections, sectionInstances, sectionElements } = this.env;
		if (index < 0 || index >= sections.length) return;

		const sectionInfo = sections[index];
		const instance = sectionInstances.get(sectionInfo.id);
		const element = sectionElements[index];
		if (!instance || !element) return;

		const fetchKey = `${sectionInfo.id}:fetch`;
		const initKey = `${sectionInfo.id}:init`;
		const primeKey = `${sectionInfo.id}:prime`;

		const fetchP = this.getOrCreateStagePromise(index, 'fetch', () => {
			if (mode === 'immediate') return this.fetchStage(index, signal);
			return this.enqueue(fetchKey, priority + 30, () => this.fetchStage(index, signal), signal);
		});

		const initP = fetchP.then(() =>
			this.getOrCreateStagePromise(index, 'init', () => {
				if (mode === 'immediate') return this.initStage(index, signal);
				return this.enqueue(initKey, priority + 20, () => this.initStage(index, signal), signal);
			})
		);

		await initP.then(() =>
			this.getOrCreateStagePromise(index, 'prime', () => {
				if (mode === 'immediate') return this.primeStage(index, signal);
				return this.enqueue(primeKey, priority + 10, () => this.primeStage(index, signal), signal);
			})
		);
	}

	private getOrCreateStagePromise(index: number, stage: 'fetch' | 'init' | 'prime', factory: () => Promise<void>): Promise<void> {
		const existing = this.inFlightStagePromises.get(index)?.[stage];
		if (existing) return existing;

		const bucket = this.inFlightStagePromises.get(index) ?? {};
		const promise = factory().finally(() => {
			const current = this.inFlightStagePromises.get(index);
			if (current) {
				delete (current as any)[stage];
				if (!current.fetch && !current.init && !current.prime) {
					this.inFlightStagePromises.delete(index);
				}
			}
		});
		(bucket as any)[stage] = promise;
		this.inFlightStagePromises.set(index, bucket as any);
		return promise;
	}

	private enqueue(key: string, priority: number, run: () => Promise<void>, signal?: AbortSignal): Promise<void> {
		assertNotAborted(signal);
		const existing = this.taskPromises.get(key);
		if (existing) return existing;

		const createdAt = performance.now();
		let resolve!: () => void;
		let reject!: (e: unknown) => void;
		const promise = new Promise<void>((res, rej) => {
			resolve = res;
			reject = rej;
		});
		this.taskPromises.set(key, promise);

		this.queue.push({
			key,
			priority,
			createdAt,
			signal,
			run: async () => {
				try {
					assertNotAborted(signal);
					await run();
					resolve();
				} catch (e) {
					reject(e);
				} finally {
					this.taskPromises.delete(key);
				}
			}
		});

		this.queue.sort((a, b) => (b.priority - a.priority) || (a.createdAt - b.createdAt));
		this.kick();
		return promise;
	}

	private kick() {
		if (this.running) return;
		this.running = true;
		void this.runLoop();
	}

	private async runLoop() {
		try {
			while (this.queue.length) {
				const deadline = await requestIdle(this.idleTimeoutMs);
				await this.processUntilBudget(deadline);
			}
		} finally {
			this.running = false;
		}
	}

	private async processUntilBudget(deadline: IdleDeadlineLike) {
		const start = performance.now();
		while (this.queue.length) {
			const elapsed = performance.now() - start;
			const remainingBudget = this.idleBudgetMs - elapsed;
			if (!deadline.didTimeout && deadline.timeRemaining() <= 1) break;
			if (remainingBudget <= 0) break;

			const task = this.queue.shift()!;
			try {
				if (task.signal?.aborted) {
					throw createAbortError('Warmup cancelled');
				}
				await task.run();
			} catch {
				// Swallow errors at scheduler level; callers awaiting the promise receive rejection.
			}
		}
	}

	private log(...args: unknown[]) {
		if (this.debug) console.info('[StagedScheduler]', ...args);
	}

	private getSectionAssetUrlsFallback(index: number): string[] {
		const { sections } = this.env;
		if (index < 0 || index >= sections.length) return [];
		const section = sections[index];
		const urls: string[] = [];
		if (section.id === 'about') {
			const data: any = section.data;
			if (data?.imageUrl) urls.push(data.imageUrl);
		} else if (section.id.startsWith('project-')) {
			const p: any = section.data;
			if (p.backgrounds?.length) {
				urls.push(p.backgrounds[0].value);
				if (p.backgrounds.length > 1) urls.push(p.backgrounds[1].value);
			}
			p.cards?.forEach((card: any) => {
				if (card?.cardImage) urls.push(card.cardImage);
			});
		}
		return urls.filter(Boolean);
	}

	private sleep(ms: number, signal?: AbortSignal): Promise<void> {
		assertNotAborted(signal);
		return new Promise<void>((resolve, reject) => {
			let timeoutId: number | undefined;
			const onAbort = () => {
				if (timeoutId != null) clearTimeout(timeoutId);
				reject(createAbortError('Warmup cancelled'));
			};
			signal?.addEventListener('abort', onAbort, { once: true });
			timeoutId = window.setTimeout(() => {
				signal?.removeEventListener('abort', onAbort);
				resolve();
			}, ms);
		});
	}

	private raf(signal?: AbortSignal): Promise<void> {
		assertNotAborted(signal);
		return new Promise<void>((resolve, reject) => {
			let rafId: number | undefined;
			const onAbort = () => {
				if (rafId != null) cancelAnimationFrame(rafId);
				reject(createAbortError('Warmup cancelled'));
			};
			signal?.addEventListener('abort', onAbort, { once: true });
			rafId = requestAnimationFrame(() => {
				signal?.removeEventListener('abort', onAbort);
				resolve();
			});
		});
	}

	private async fetchStage(index: number, signal?: AbortSignal) {
		assertNotAborted(signal);
		const { sections, sectionInstances } = this.env;
		const sectionInfo = sections[index];
		const instance = sectionInstances.get(sectionInfo.id) as SectionWarmupContract | undefined;

		// Keep section state semantics compatible with legacy scheduler.
		sectionStates.update(states => {
			states[index] = 'FETCHING_ASSETS' as any;
			return states;
		});

		recordFetchStart(sectionInfo.id, index);
		const urls = instance?.getPreloadAssets?.() ?? this.getSectionAssetUrlsFallback(index);
		this.log('fetch+decode', sectionInfo.id, urls.length);
		if (urls.length) {
			await preloadAssets(urls);
		}
		recordFetchEnd(sectionInfo.id);
	}

	private async initStage(index: number, signal?: AbortSignal) {
		assertNotAborted(signal);
		const { sections, sectionInstances } = this.env;
		const sectionInfo = sections[index];
		const instance = sectionInstances.get(sectionInfo.id) as SectionWarmupContract | undefined;
		if (!instance) return;

		sectionStates.update(states => {
			states[index] = 'EFFECT_INIT' as any;
			return states;
		});

		recordInitStart(sectionInfo.id);
		this.log('effect init', sectionInfo.id);
		if (instance.initializeEffect) await instance.initializeEffect(signal);
		assertNotAborted(signal);
		recordInitEnd(sectionInfo.id);

		// Keep legacy transitional state semantics, but don't commit if cancelled.
		sectionStates.update(states => {
			states[index] = 'PRELOADING' as any;
			return states;
		});
	}

	private async primeStage(index: number, signal?: AbortSignal) {
		assertNotAborted(signal);
		const { sections, sectionInstances, sectionElements } = this.env;
		const sectionInfo = sections[index];
		const instance = sectionInstances.get(sectionInfo.id) as SectionWarmupContract | undefined;
		const element = sectionElements[index];
		if (!instance || !element) return;

		this.log('prime render', sectionInfo.id);

		if (instance.primeFirstFrame) {
			await instance.primeFirstFrame(signal);
		} else if (sectionInfo.id === 'about' || sectionInfo.id === 'contact') {
			// Legacy priming heuristic (abort-safe cleanup)
			try {
				gsap.set(element, { yPercent: 0, autoAlpha: 0.0001 });
				(instance as any).onEnterSection?.();
				(instance as any).onTransitionComplete?.();
				await this.sleep(200, signal);
				assertNotAborted(signal);
				(instance as any).onLeaveSection?.();
			} finally {
				// Ensure we don't leave the section visible if cancelled mid-prime.
				gsap.set(element, { yPercent: 100, autoAlpha: 0 });
			}
		} else if (sectionInfo.id.startsWith('project-')) {
			// Legacy priming heuristic (abort-safe cleanup)
			try {
				gsap.set(element, { yPercent: 0, autoAlpha: 0.0001 });
				await this.raf(signal);
				await this.raf(signal);
			} finally {
				gsap.set(element, { yPercent: 100, autoAlpha: 0 });
			}
		}

		assertNotAborted(signal);
		sectionStates.update(states => {
			states[index] = 'READY' as any;
			return states;
		});
		recordReady(sectionInfo.id);
	}
}
