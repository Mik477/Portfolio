// Phase 1 extraction of legacy preloadManager logic (behavior preserved)
// Future phases will replace internals with priority queue / predictive logic.

import { get } from 'svelte/store';
import { gsap } from 'gsap';
import { preloadAssets } from '$lib/stores/preloadingStore';
import { sectionStates, type SectionState } from '$lib/stores/sectionStateStore';
import type { SectionDescriptor } from './sectionDescriptors';
import { DefaultPredictionStrategy, DirectionalPredictionStrategy, type PredictionStrategy, type SchedulerConfig } from './schedulerCore';
import { recordFetchStart, recordFetchEnd, recordInitStart, recordInitEnd, recordReady, updateQueue, recordNavigationMetric } from './schedulerMetricsStore';

export interface SectionEnvironment {
	sections: SectionDescriptor[];
	sectionElements: HTMLElement[];
	sectionInstances: Map<string, any>; // IAnimatedComponent shape (loose for phase 1)
	contactSectionIndex: number;
}

export class LegacySectionScheduler {
	private env: SectionEnvironment;
	private sectionStatesStore = sectionStates;
	private prediction: PredictionStrategy;
	private debug: boolean;
	private maxConcurrent = 3;
	private activeFetches = 0;
	private queue: Array<() => Promise<void>> = [];
	private lastNavIndex = 0;
	private navHistory: number[] = [];
	private unloadDistance = 4; // sections farther than this from active may be unloaded

	constructor(env: SectionEnvironment, config: SchedulerConfig = {}) {
		this.env = env;
		this.prediction = config.prediction ?? new DirectionalPredictionStrategy();
		this.debug = !!config.debug;
	}

	setDebug(v: boolean) { this.debug = v; }
	recordNavigation(index: number) {
		this.navHistory.push(index);
		if (this.navHistory.length > 50) this.navHistory.shift();
		this.lastNavIndex = index;
		recordNavigationMetric(index);
	}
	setPrediction(strategy: PredictionStrategy) { this.prediction = strategy; }
	setMaxConcurrent(n: number) { this.maxConcurrent = Math.max(1, n); }
	setUnloadDistance(d: number) { this.unloadDistance = Math.max(2, d); }

	private log(...args: any[]) { if (this.debug) console.info('[Scheduler]', ...args); }

	private enqueue(task: () => Promise<void>) {
		this.queue.push(task);
		this.drain();
	}

	private drain() {
		while (this.activeFetches < this.maxConcurrent && this.queue.length) {
			const fn = this.queue.shift()!;
			this.activeFetches++;
			updateQueue(this.activeFetches, this.queue.length);
			fn().catch(()=>{}).finally(() => {
				this.activeFetches--;
				updateQueue(this.activeFetches, this.queue.length);
				this.drain();
			});
		}
		updateQueue(this.activeFetches, this.queue.length);
	}

	updateEnv(env: Partial<SectionEnvironment>) {
		this.env = { ...this.env, ...env } as SectionEnvironment;
	}

	async updateNeighborStates(activeIndex: number) {
		const { sections } = this.env;
		const currentStates = get(this.sectionStatesStore);
		const desiredStates: SectionState[] = sections.map((_, i) => {
			if (i === activeIndex) return 'ACTIVE';
			if (i === activeIndex - 1 || i === activeIndex + 1) return 'READY';
			return 'COOLDOWN';
		});

		const tasks: Promise<void>[] = [];

		for (let i = 0; i < sections.length; i++) {
			const currentState = currentStates[i];
			const desiredState = desiredStates[i];
			if (currentState !== desiredState) {
				if ((currentState === 'IDLE' || currentState === 'COOLDOWN') && desiredState === 'READY') {
					tasks.push(this.prepareSection(i));
				}
				if (currentState === 'READY' && desiredState === 'COOLDOWN') {
					tasks.push(this.coolDownSection(i));
				}
			}
		}

		this.sectionStatesStore.update(states => { states[activeIndex] = 'ACTIVE'; return states; });
		await Promise.all(tasks);
	}

	async prepareSection(index: number) {
		const { sections, sectionInstances, sectionElements } = this.env;
		const currentState = get(this.sectionStatesStore)[index];
		if (currentState !== 'IDLE' && currentState !== 'COOLDOWN') return;
		const sectionInfo = sections[index];
		const instance = sectionInstances.get(sectionInfo.id);
		const element = sectionElements[index];
		if (!instance || !element) return;

		// Stage 1: assets
		this.sectionStatesStore.update(states => { states[index] = 'FETCHING_ASSETS'; return states; });
		recordFetchStart(sectionInfo.id, index);
		const urls = this.getSectionAssetUrls(index);
		if (urls.length > 0) {
			await new Promise<void>((resolve) => {
				this.enqueue(async () => {
					try { await preloadAssets(urls); } finally { resolve(); recordFetchEnd(sectionInfo.id); }
				});
			});
		} else { recordFetchEnd(sectionInfo.id); }

		// Stage 2: effect init
		this.sectionStatesStore.update(states => { states[index] = 'EFFECT_INIT'; return states; });
		recordInitStart(sectionInfo.id);
		if (instance.initializeEffect) await instance.initializeEffect();
		recordInitEnd(sectionInfo.id);

		// Legacy PRELOADING transitional state (optional) — keep for compatibility
		this.sectionStatesStore.update(states => { states[index] = 'PRELOADING'; return states; });

		if (sectionInfo.id === 'about' || sectionInfo.id === 'contact') {
			gsap.set(element, { yPercent: 0, autoAlpha: 0.0001 });
			instance.onEnterSection();
			instance.onTransitionComplete?.();
			await new Promise(resolve => setTimeout(resolve, 200));
			instance.onLeaveSection();
			gsap.set(element, { yPercent: 100, autoAlpha: 0 });
		} else if (sectionInfo.id.startsWith('project-')) {
			gsap.set(element, { yPercent: 0, autoAlpha: 0.0001 });
			await new Promise(resolve => requestAnimationFrame(resolve));
			await new Promise(resolve => requestAnimationFrame(resolve));
			gsap.set(element, { yPercent: 100, autoAlpha: 0 });
		}

		this.sectionStatesStore.update(states => { states[index] = 'READY'; return states; });
		recordReady(sectionInfo.id);
	}

	async coolDownSection(index: number) {
		const { sections, sectionInstances } = this.env;
		const sectionId = sections[index].id;
		this.sectionStatesStore.update(states => { states[index] = 'COOLDOWN'; return states; });
		const instance = sectionInstances.get(sectionId);
		instance?.onUnload?.();
		this.sectionStatesStore.update(states => { states[index] = 'IDLE'; return states; });
	}

	// Mirrors old inline function; duplicates logic for Phase 1 extraction.
	getSectionAssetUrls(index: number): string[] {
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
			p.cards.forEach((card: any) => { if (card.cardImage) urls.push(card.cardImage); });
		}
		return urls.filter(Boolean);
	}

	// Phase 2: predictive warmup using strategy
	predictiveWarmup(activeIndex: number) {
		const states = get(this.sectionStatesStore);
		const snapshot = { activeIndex, states, sections: this.env.sections } as const;
		const { warmupCandidates, preloadOnly } = this.prediction.predict(snapshot);
		if (this.debug) {
			console.info('[Scheduler] prediction', { warmupCandidates, preloadOnly });
		}
		// Fire and forget warmup (full prepare)
		warmupCandidates.forEach(i => this.prepareSection(i).catch(()=>{}));
		// Preload-only: fetch assets but don't run effect initialization
		preloadOnly.forEach(i => {
			const urls = this.getSectionAssetUrls(i);
			if (urls.length) {
				this.enqueue(async () => { await preloadAssets(urls); });
			}
		});

		// Memory heuristic: unload distant sections
		this.applyUnloadHeuristic(activeIndex);
	}

	private applyUnloadHeuristic(activeIndex: number) {
		const { sections, sectionInstances } = this.env;
		const states = get(this.sectionStatesStore);
		let mutated = false;
		for (let i = 0; i < sections.length; i++) {
			if (states[i] === 'READY' || states[i] === 'IDLE' || states[i] === 'COOLDOWN' || states[i] === 'ACTIVE') continue;
		}
		// Unload logic: if section is READY and farther than unloadDistance -> move to COOLDOWN then IDLE
		for (let i = 0; i < sections.length; i++) {
			const dist = Math.abs(i - activeIndex);
			if (dist > this.unloadDistance && states[i] === 'READY') {
				const id = sections[i].id;
				sectionInstances.get(id)?.onUnload?.();
				states[i] = 'COOLDOWN';
				states[i] = 'IDLE';
				mutated = true;
				this.log('Unloaded distant section', id, 'dist', dist);
			}
		}
		if (mutated) this.sectionStatesStore.set([...states]);
	}
}
