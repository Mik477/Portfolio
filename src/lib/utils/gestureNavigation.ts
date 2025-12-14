export type GestureIntent = 'vertical' | 'horizontal';

export type GestureIntentDecision = {
	intent: GestureIntent | null;
	startDragging: boolean;
};

export function computeInstantVelocityPxPerMs(params: {
	currentY: number;
	lastY: number;
	currentTimeMs: number;
	lastTimeMs: number;
}): number {
	const timeDelta = Math.max(1, params.currentTimeMs - params.lastTimeMs);
	const moveDelta = params.currentY - params.lastY;
	return moveDelta / timeDelta;
}

export function decideGestureIntent(params: {
	absDx: number;
	absDy: number;
	dragThresholdPx: number;
	horizTolerancePx: number;
}): GestureIntentDecision {
	if (!(params.absDy > params.dragThresholdPx || params.absDx > params.dragThresholdPx)) {
		return { intent: null, startDragging: false };
	}

	// Horizontal gesture (carousel interaction)
	if (params.absDx > params.absDy * 1.5 && params.absDx > params.horizTolerancePx * 0.5) {
		return { intent: 'horizontal', startDragging: false };
	}

	// Vertical navigation
	if (params.absDy > params.absDx * 0.7) {
		return { intent: 'vertical', startDragging: true };
	}

	return { intent: null, startDragging: false };
}

export function shouldCancelVerticalGesture(params: { absDx: number; horizTolerancePx: number }): boolean {
	return params.absDx > params.horizTolerancePx;
}

export function applyRubberBand(params: {
	offsetPx: number;
	atBoundary: boolean;
	rubberBandFactor: number;
	viewportHeightPx: number;
}): number {
	if (!params.atBoundary) return params.offsetPx;
	return (
		params.offsetPx *
		params.rubberBandFactor *
		(1 - Math.abs(params.offsetPx) / (params.viewportHeightPx * 2))
	);
}

export function computeDragProgress(params: {
	dragOffsetPx: number;
	maxVisualFeedback: number;
	atBoundary: boolean;
	rubberBandFactor: number;
	viewportHeightPx: number;
}): { effectiveOffsetPx: number; progress: number } {
	const scaledOffset = params.dragOffsetPx * params.maxVisualFeedback;
	const effectiveOffsetPx = applyRubberBand({
		offsetPx: scaledOffset,
		atBoundary: params.atBoundary,
		rubberBandFactor: params.rubberBandFactor,
		viewportHeightPx: params.viewportHeightPx
	});
	const progress = effectiveOffsetPx / params.viewportHeightPx;
	return { effectiveOffsetPx, progress };
}

export function decideSwipeNavigation(params: {
	dragOffsetPx: number;
	viewportHeightPx: number;
	finalVelocityPxPerMs: number;
	momentumMultiplier: number;
	minMomentumDistancePx: number;
	velocityThresholdPxPerMs: number;
	snapThreshold: number;
}): { shouldNavigate: boolean; direction: -1 | 0 | 1; dragPercent: number; momentumDistancePx: number } {
	const dragPercent = Math.abs(params.dragOffsetPx) / params.viewportHeightPx;
	const momentumDistancePx = Math.abs(params.finalVelocityPxPerMs) * params.momentumMultiplier;

	// Velocity-based momentum
	if (
		momentumDistancePx > params.minMomentumDistancePx &&
		Math.abs(params.finalVelocityPxPerMs) > params.velocityThresholdPxPerMs
	) {
		return {
			shouldNavigate: true,
			direction: params.dragOffsetPx < 0 ? 1 : -1,
			dragPercent,
			momentumDistancePx
		};
	}

	// Distance-based threshold
	if (dragPercent > params.snapThreshold) {
		return {
			shouldNavigate: true,
			direction: params.dragOffsetPx < 0 ? 1 : -1,
			dragPercent,
			momentumDistancePx
		};
	}

	return { shouldNavigate: false, direction: 0, dragPercent, momentumDistancePx };
}
