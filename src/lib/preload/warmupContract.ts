export type WarmupStage = 'fetch' | 'init' | 'prime';

// Phase 3: Section-owned warmup contract.
// Kept intentionally minimal and backward-compatible.
export interface SectionWarmupContract {
	// Assets required for the section’s first meaningful frame.
	getPreloadAssets?: () => string[];

	// Heavy effect init; must be idempotent.
	// If an AbortSignal is provided, it should stop ASAP and avoid committing partial state.
	initializeEffect?: (signal?: AbortSignal) => Promise<void>;

	// Optional: do one cheap “first frame” render/paint without making the section visible.
	// Must be safe to call multiple times.
	primeFirstFrame?: (signal?: AbortSignal) => Promise<void>;
}
