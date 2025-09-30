// Phase 2: Core scheduling & prediction primitives
import type { SectionDescriptor } from './sectionDescriptors';
import type { SectionState } from '$lib/stores/sectionStateStore';

export interface SectionContextSnapshot {
	activeIndex: number;
	states: SectionState[];
	sections: SectionDescriptor[];
	// Potentially add render profile signals later (mobile, reducedMotion...)
}

export interface PredictionResult {
	warmupCandidates: number[]; // indices to pre-warm (assets + minimal init)
	preloadOnly: number[];      // indices to just asset-preload (defer effect init)
}

export interface PredictionStrategy {
	predict(ctx: SectionContextSnapshot): PredictionResult;
}

// Default naive strategy:
// - Always attempt to warmup the next section (active+1) if exists & not READY/ACTIVE
// - Preload-only the section after that (active+2) if exists & currently IDLE/COOLDOWN
export class DefaultPredictionStrategy implements PredictionStrategy {
	predict(ctx: SectionContextSnapshot): PredictionResult {
		const warmupCandidates: number[] = [];
		const preloadOnly: number[] = [];
		const { activeIndex, sections, states } = ctx;
		const next = activeIndex + 1;
		const afterNext = activeIndex + 2;
		if (next < sections.length && !['READY','ACTIVE','PRELOADING'].includes(states[next] as any)) {
			warmupCandidates.push(next);
		}
		if (afterNext < sections.length && ['IDLE','COOLDOWN'].includes(states[afterNext] as any)) {
			preloadOnly.push(afterNext);
		}
		return { warmupCandidates, preloadOnly };
	}
}

// Direction-aware strategy:
// Tracks last travel direction; prioritizes warming only in that direction.
// If user changes direction, performs a conservative warmup of the immediate neighbor both directions once.
export class DirectionalPredictionStrategy implements PredictionStrategy {
	private lastDirection: number = 1; // 1 forward, -1 backward
	private lastActive = 0;
	private directionStreak = 0;

	predict(ctx: SectionContextSnapshot): PredictionResult {
		const { activeIndex, sections, states } = ctx;
		const delta = activeIndex - this.lastActive;
		if (delta !== 0) {
			const dir = Math.sign(delta);
			if (dir === this.lastDirection) {
				this.directionStreak++;
			} else {
				this.directionStreak = 1; // reset streak
				this.lastDirection = dir;
			}
			this.lastActive = activeIndex;
		}

		const warmupCandidates: number[] = [];
		const preloadOnly: number[] = [];

		const forward = activeIndex + 1;
		const backward = activeIndex - 1;

		// Helper to test if we should warm a given index
		const canWarm = (i: number) => i >= 0 && i < sections.length && !['READY','ACTIVE','PRELOADING','FETCHING_ASSETS','EFFECT_INIT'].includes(states[i] as any);

		if (this.directionStreak > 1) {
			// Strong directional intent: warm only in travel direction
			const primary = this.lastDirection === 1 ? forward : backward;
			if (canWarm(primary)) warmupCandidates.push(primary);
			// Asset-preload one further in that direction
			const further = primary + this.lastDirection;
			if (further >= 0 && further < sections.length && ['IDLE','COOLDOWN'].includes(states[further] as any)) preloadOnly.push(further);
		} else {
			// Neutral / direction change: prepare both immediate neighbors lightly
			if (canWarm(forward)) warmupCandidates.push(forward);
			if (canWarm(backward)) warmupCandidates.push(backward);
			// Preload second forward as a small look-ahead
			const secondForward = activeIndex + 2;
			if (secondForward < sections.length && ['IDLE','COOLDOWN'].includes(states[secondForward] as any)) preloadOnly.push(secondForward);
		}

		return { warmupCandidates, preloadOnly };
	}
}

export interface SchedulerConfig {
	prediction?: PredictionStrategy;
	debug?: boolean;
}
