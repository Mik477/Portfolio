<!-- src/routes/[lang=lang]/+page.svelte -->
<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { writable, get } from 'svelte/store';
		import { siteConfig } from '$lib/data/siteConfig';
		import { page } from '$app/stores';
	import { getProjects, getAboutContent, getContactContent, type Project, type Locale, type AboutContent } from '$lib/data/projectsData';
	import { initialSiteLoadComplete } from '$lib/stores/preloadingStore';
	import { sectionStates, type SectionState } from '$lib/stores/sectionStateStore';
	import { renderProfile } from '$lib/stores/renderProfile';
	import { gsap } from 'gsap';
	import {
		computeInstantVelocityPxPerMs,
		decideGestureIntent,
		shouldCancelVerticalGesture,
		computeDragProgress,
		decideSwipeNavigation
	} from '$lib/utils/gestureNavigation';

	// Component Imports
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import HeroSection from '$lib/components/sections/HeroSection.svelte';
	import AboutSection from '$lib/components/sections/AboutSection.svelte';
	import ContactSection from '$lib/components/sections/ContactSection.svelte';
	import ProjectSection from '$lib/components/sections/ProjectSection.svelte'; 
	import ProjectOneLayout from '$lib/components/layouts/ProjectOneLayout.svelte';
	import MobileNavDots from '$lib/components/MobileNavDots.svelte';

	// Type Imports
	interface IAnimatedComponent {
		onEnterSection: () => void;
		onLeaveSection: () => void;
		initializeEffect?: (signal?: AbortSignal) => Promise<void>;
		onTransitionComplete?: () => void;
		onUnload?: () => void;
	}
	import type { HeroSectionInstance } from '$lib/components/sections/HeroSection.svelte';

	// Section Data Structure (reactive to locale)
	let allSectionsData: any[] = [];
	let currentLocale: Locale;
	$: currentLocale = ((($page.params as any)?.lang === 'de') ? 'de' : 'en');
	$: localizedProjects = getProjects(currentLocale);
	// Pull localized static content for About & Contact (must be reactive for language switch)
	let baseAboutContent = getAboutContent(currentLocale);
	let baseContactContent = getContactContent(currentLocale);
	$: if (currentLocale) {
		baseAboutContent = getAboutContent(currentLocale);
		baseContactContent = getContactContent(currentLocale);
	}
	$: allSectionsData = [
		{ id: 'hero', component: HeroSection, data: siteConfig.heroSection, layout: null },
		{ id: 'about', component: AboutSection, data: baseAboutContent, layout: null },
		{ id: `project-${localizedProjects[0].id}`, component: ProjectSection, layout: ProjectOneLayout, data: localizedProjects[0] },
		{ id: `project-${localizedProjects[1].id}`, component: ProjectSection, layout: ProjectOneLayout, data: localizedProjects[1] },
		{ id: 'contact', component: ContactSection, data: baseContactContent, layout: null }
	];
	let contactSectionIndex: number = allSectionsData.findIndex(s => s.id === 'contact');
	$: contactSectionIndex = allSectionsData.findIndex(s => s.id === 'contact');

		// Localized data overrides (recompute when base content or translation messages change)
		let aboutData = { ...baseAboutContent };
		let contactData = { ...baseContactContent };
		$: if (baseAboutContent && baseContactContent) {
			const common = ($page.data as any)?.messages?.common;
			aboutData = { ...baseAboutContent };
			contactData = { ...baseContactContent };
			if (common?.about) {
				aboutData = {
					...aboutData,
					title: common.about.title ?? aboutData.title,
					introduction: common.about.introduction ?? aboutData.introduction
				};
			}
			if (common?.contact) {
				contactData = {
					...contactData,
					title: common.contact.title ?? contactData.title,
					outroMessage: common.contact.outroMessage ?? contactData.outroMessage
				};
			}
		}

	// Instance Management
	let heroSectionInstance: HeroSectionInstance | null = null;
	let sectionInstancesArray: (IAnimatedComponent | null)[] = new Array(allSectionsData.length).fill(null);
	let sectionInstances = new Map<string, IAnimatedComponent>();
	$: if (sectionInstancesArray.length > 0) {
		const newMap = new Map<string, IAnimatedComponent>();
		allSectionsData.forEach((section, index) => {
			const instance = index === 0 ? heroSectionInstance : sectionInstancesArray[index];
			if (instance) newMap.set(section.id, instance);
		});
		sectionInstances = newMap;
	}
  
	// Core State
	const isAnimating = writable(false);
	const currentSectionIndex = writable(0);
	const isTransitioning = writable(false);
	const isInitialReveal = writable(true);
	const sectionStatesStore = sectionStates;
	const isLeavingHero = writable(false);
		// Dots active index updates at transition start for smooth grow/shrink
		const navActiveIndex = writable(0);

	// Page & Animation State
	let visibilityHideTimeoutId: number | undefined;
	let isDestroyed = false;
	const rafIds = new Set<number>();
	const timeoutIds = new Set<number>();
	let activeMasterTransitionTl: gsap.core.Timeline | null = null;
	let navUnlockDelayedCall: gsap.core.Tween | null = null;
	let initialRevealTimeoutId: number | null = null;
	let initialRevealEndTimeoutId: number | null = null;
	let orchestratorAbortController: AbortController | null = null;
	let isTabHiddenAndPaused = false;
	const HIDE_BUFFER_DURATION = 15000;
	let sectionElements: HTMLElement[] = [];
	let sectionBackgroundZooms: (gsap.core.Tween | null)[] = [];
	const transitionDuration = 1.1;
	const projectBgZoomDuration = 5;
	const minSectionDisplayDuration = 1.2;
	const initialRevealDelay = 300;
	const particleFadeInDuration = 1.5;
	let unsubInitialLoadComplete: (() => void) | undefined;
	let hasStartedInitialReveal = false;
	let resizeTimer: number | null = null;

	// --- HASH NAVIGATION STATE (declared early so usable everywhere) ---
	let initialHashFragment: string | null = null; // raw fragment captured on first mount
	let initialHashTargetIndex: number | null = null; // resolved index once sections known
	let suppressNextHashUpdate = false; // guard to avoid loops when we programmatically set hash
	let onHashChange: (() => void) | null = null; // reference for cleanup

	// --- DEEP LINK / LOADING CONTROL ---
	let startOnHero = true; // becomes false if deep link to non-hero
	let isDeepLinkStart = false;
	let showLoadingScreen = true; // controls LoadingScreen rendering

	// --- Focus management helpers ---
	function safeRaf(cb: () => void): number {
		const id = requestAnimationFrame(() => {
			rafIds.delete(id);
			if (isDestroyed) return;
			cb();
		});
		rafIds.add(id);
		return id;
	}

	function safeTimeout(cb: () => void, delayMs: number): number {
		const id = window.setTimeout(() => {
			timeoutIds.delete(id);
			if (isDestroyed) return;
			cb();
		}, delayMs);
		timeoutIds.add(id);
		return id;
	}

	function isElementVisible(el: Element): boolean {
		if (!(el instanceof HTMLElement)) return false;
		if (el.hidden) return false;
		if (el.getAttribute('aria-hidden') === 'true') return false;
		const rect = el.getBoundingClientRect();
		return rect.width > 0 && rect.height > 0;
	}

	function findFocusTarget(sectionEl: HTMLElement): HTMLElement | null {
		// New priority: dedicated invisible sentinel to avoid visual focus ring on buttons
		let candidate = sectionEl.querySelector('.section-focus-sentinel') as HTMLElement | null;
		if (candidate) return candidate;
		// fallback to previous logic (reduced) for robustness
		candidate = sectionEl.querySelector('[data-focus-first]') as HTMLElement | null;
		if (candidate && isElementVisible(candidate)) return candidate;
		candidate = sectionEl.querySelector('[autofocus]') as HTMLElement | null;
		if (candidate && isElementVisible(candidate)) return candidate;
		if (!sectionEl.hasAttribute('tabindex')) sectionEl.setAttribute('tabindex', '-1');
		return sectionEl;
	}

	function setActiveSectionInert(activeIndex: number) {
		sectionElements.forEach((el, idx) => {
			if (!el) return;
			if (idx === activeIndex) {
				el.removeAttribute('inert');
			} else {
				el.setAttribute('inert', '');
			}
		});
	}

	function focusSection(index: number) {
		const el = sectionElements[index];
		if (!el) return;
		const target = findFocusTarget(el);
		if (target) {
			// Use rAF to ensure styles/layout are settled post-transition
			safeRaf(() => {
				try { target.focus({ preventScroll: true } as any); } catch {}
				// move virtual cursor into view without jarring scroll (sections are full-screen)
				try { target.scrollIntoView({ block: 'nearest' }); } catch {}
			});
		}
	}

	// --- ARIA live region for section announcements ---
	let liveMessage = '';
	function computeSectionTitle(index: number): string {
		const section = allSectionsData[index];
		if (!section) return '';
		if (section.id === 'about') return aboutData.title ?? 'About';
		if (section.id === 'contact') return contactData.title ?? 'Contact';
		if (section.id === 'hero') {
			const name = siteConfig?.heroSection?.name ?? '';
			const greeting = siteConfig?.heroSection?.greeting ?? '';
			return [greeting, name].filter(Boolean).join(' ').trim() || 'Home';
		}
		if (section.id.startsWith('project-')) {
			try { return (section.data as any)?.headline || 'Project'; } catch { return 'Project'; }
		}
		return section.id;
	}

	function announceSection(index: number) {
		const title = computeSectionTitle(index);
		if (!title) return;
		// Clear then set to ensure screen readers announce changes
		liveMessage = '';
		safeRaf(() => { liveMessage = title; });
	}
  
	let particleLayerPointerEvents = 'none';
	$: particleLayerPointerEvents = ($currentSectionIndex === 0 && !$isInitialReveal) ? 'auto' : 'none';
	let mainContainerPointerEvents = 'auto';
	$: mainContainerPointerEvents = ($currentSectionIndex === 0 || $isInitialReveal) ? 'none' : 'auto';

	// Render profile

	// Promise setup for initial load
	let heroReadyResolver: () => void;
	const heroReadyPromise = new Promise<void>(resolve => {
		heroReadyResolver = resolve;
	});

	// Phase 1: extracted legacy preload manager -> LegacySectionScheduler
	import { LegacySectionScheduler } from '$lib/preload/sectionScheduler';
	// Phase 2: staged warmup scheduler (behind local flag)
	import { StagedSectionScheduler } from '$lib/preload/stagedSectionScheduler';
	import { schedulerMetrics, beginTransitionMetric, markTransitionMetric } from '$lib/preload/schedulerMetricsStore';
	let legacyScheduler: LegacySectionScheduler | null = null;
	let stagedScheduler: StagedSectionScheduler | null = null;
	let jumpWarmupAbortController: AbortController | null = null;
	const USE_STAGED_WARMUP_FOR_JUMP_PRELOAD = true;
	const USE_STAGED_WARMUP_FOR_BACKGROUND_WARMUP = true;
	let backgroundWarmupAbortController: AbortController | null = null;

	function scheduleBackgroundWarmup(activeIndex: number) {
		if (isDestroyed) return;
		if (!USE_STAGED_WARMUP_FOR_BACKGROUND_WARMUP) return;
		// Cancel any queued warmups from previous navigation.
		backgroundWarmupAbortController?.abort();
		backgroundWarmupAbortController = new AbortController();
		const signal = backgroundWarmupAbortController.signal;

		// Keep it simple and deterministic for Phase 3: warm immediate neighbors.
		// (No UX impact: fire-and-forget, idle-mode)
		const candidates = [activeIndex - 1, activeIndex + 1].filter(
			i => i >= 0 && i < allSectionsData.length && i !== activeIndex
		);
		for (const idx of candidates) {
			void ensureStagedScheduler().warmSection(idx, {
				priority: 20,
				mode: 'idle',
				signal
			}).catch(() => {});
		}
	}

	// Phase 1 perf instrumentation (opt-in via ?perf=1)
	let perfMetricsEnabled = false;
	let lastNavCause: 'wheel' | 'key' | 'dot' | 'swipe' | 'hash' | 'unknown' = 'unknown';
	let lastNavTriggerAt: number | null = null;
	function markNavCause(cause: typeof lastNavCause) {
		if (!perfMetricsEnabled) return;
		lastNavCause = cause;
		lastNavTriggerAt = performance.now();
	}

	function ensureScheduler() {
		if (!legacyScheduler) {
			legacyScheduler = new LegacySectionScheduler({
				sections: allSectionsData as any,
				sectionElements,
				sectionInstances,
				contactSectionIndex
			}, { debug: false, autoPrepareNeighbors: false });
		} else {
			legacyScheduler.updateEnv({
				sections: allSectionsData as any,
				sectionElements,
				sectionInstances,
				contactSectionIndex
			});
		}
		return legacyScheduler;
	}

	function ensureStagedScheduler() {
		if (!stagedScheduler) {
			stagedScheduler = new StagedSectionScheduler({
				sections: allSectionsData as any,
				sectionElements,
				sectionInstances,
				contactSectionIndex
			}, { debug: false });
		} else {
			stagedScheduler.updateEnv({
				sections: allSectionsData as any,
				sectionElements,
				sectionInstances,
				contactSectionIndex
			});
		}
		return stagedScheduler;
	}

	function handleAnimationComplete() {
		if (isDestroyed) return;
		// Phase 3: staged scheduler owns warmup.
		scheduleBackgroundWarmup(get(currentSectionIndex));
	}

	function handleResize() {
		if (resizeTimer !== null) clearTimeout(resizeTimer);
		resizeTimer = window.setTimeout(() => {
			if (isDestroyed) return;
			const currentIndex = get(currentSectionIndex);
			const currentInstance = sectionInstances.get(allSectionsData[currentIndex].id);
			
			if (currentInstance) {
				// Force a visual refresh of the current section to handle layout changes
				// 1. Cleanup/Hide
				currentInstance.onLeaveSection();
				
				// 2. Restart/Show (next frame)
				safeRaf(() => {
					if (isDestroyed) return;
					currentInstance.onEnterSection();
					currentInstance.onTransitionComplete?.();
				});
			}
		}, 250);
	}

	async function handleVisibilityChange() {
		if (isDestroyed) return;
		const currentIndex = get(currentSectionIndex);
		const currentInstance = sectionInstances.get(allSectionsData[currentIndex].id);
		if (!currentInstance) return;
		if (document.hidden) {
			visibilityHideTimeoutId = window.setTimeout(() => {
				if (isDestroyed) return;
				if (document.hidden && !isTabHiddenAndPaused) {
					currentInstance.onLeaveSection();
					isTabHiddenAndPaused = true;
				}
			}, HIDE_BUFFER_DURATION);
		} else {
			clearTimeout(visibilityHideTimeoutId);
			if (isTabHiddenAndPaused) {
				if (currentInstance.onUnload && currentInstance.initializeEffect) {
					currentInstance.onUnload();
					await currentInstance.initializeEffect(orchestratorAbortController?.signal);
				}
				if (isDestroyed) return;
				currentInstance.onEnterSection();
				safeRaf(() => {
					currentInstance.onTransitionComplete?.();
				});
				isTabHiddenAndPaused = false;
				ensureScheduler().updateNeighborStates(currentIndex);
				scheduleBackgroundWarmup(currentIndex);
			}
		}
	}

	onMount(() => {
		const mountLogic = async () => {
			isDestroyed = false;
			orchestratorAbortController?.abort();
			orchestratorAbortController = new AbortController();
			const orchestratorSignal = orchestratorAbortController.signal;

			await tick();
			if (isDestroyed) return;
			// --- HASH NAVIGATION: capture initial hash (without leading '#') ---
			if (typeof window !== 'undefined') {
				const raw = window.location.hash?.trim();
				if (raw && raw.length > 1) {
					const fragment = decodeURIComponent(raw.substring(1));
					// Store temporarily; we'll map to index after sections array is ready
					initialHashFragment = fragment;
				}
			}

			// Determine deep link target before preparing sections
			if (initialHashFragment && initialHashFragment !== 'hero') {
				initialHashTargetIndex = allSectionsData.findIndex(s => s.id === initialHashFragment);
				if (initialHashTargetIndex !== -1 && initialHashTargetIndex !== 0) {
					startOnHero = false;
					isDeepLinkStart = true;
					showLoadingScreen = false; // suppress overlay
				}
			}
      
				sectionStatesStore.set(new Array(allSectionsData.length).fill('IDLE'));
			sectionElements = allSectionsData.map(section => document.getElementById(section.id) as HTMLElement);

				sectionElements.forEach((sectionEl, index) => {
				const sectionData = allSectionsData[index];
				if (sectionData.id.startsWith('project-')) {
					const bgTarget = sectionEl.querySelector('.background-zoom-target') as HTMLElement;
					sectionBackgroundZooms[index] = bgTarget ? gsap.to(bgTarget, { scale: 1.08, duration: projectBgZoomDuration, ease: 'power1.out', paused: true, transformOrigin: '50% 50%' }) : null;
				}
					// Default positioning assumes hero start; override later for deep link
					gsap.set(sectionEl, { yPercent: index === 0 ? 0 : 100, autoAlpha: index === 0 ? 1 : 0 });
			});

				if (!isDeepLinkStart) {
					// Standard hero start
					setActiveSectionInert(0);
					announceSection(0);
				} else if (initialHashTargetIndex && initialHashTargetIndex > 0) {
					// Deep link fast path: position target section immediately
					const targetIdx = initialHashTargetIndex;
					sectionElements.forEach((el, idx) => {
						if (!el) return;
						if (idx === targetIdx) {
							gsap.set(el, { yPercent: 0, autoAlpha: 1 });
						} else {
							gsap.set(el, { yPercent: 100, autoAlpha: 0 });
						}
					});
					currentSectionIndex.set(targetIdx);
					navActiveIndex.set(targetIdx);
					setActiveSectionInert(targetIdx);
					announceSection(targetIdx);
					// Eagerly initialize heavy effect (todo 20) before lifecycle enter/complete to avoid first-frame pop-in
					const secId = allSectionsData[targetIdx].id;
					const inst = sectionInstances.get(secId);
					if (inst?.initializeEffect) {
						try { await inst.initializeEffect(orchestratorSignal); } catch {}
					}
					if (isDestroyed) return;
					inst?.onEnterSection();
					safeRaf(() => inst?.onTransitionComplete?.());
				}

			const setupInitialLoad = async () => {
				if (!isDeepLinkStart) {
					await Promise.all([
						heroReadyPromise,
						ensureStagedScheduler().warmSection(1, { priority: 100, mode: 'immediate' })
					]);
					if (isDestroyed) return;
					ensureScheduler().updateNeighborStates(0);
					scheduleBackgroundWarmup(0);
					initialSiteLoadComplete.set(true);
				} else if (initialHashTargetIndex && initialHashTargetIndex > 0) {
					// Preload neighbors of target section instead of hero neighbors
					const t = initialHashTargetIndex;
					const preloadPromises: Promise<void>[] = [];
					if (t - 1 >= 0) preloadPromises.push(ensureStagedScheduler().warmSection(t - 1, { priority: 80, mode: 'immediate' }));
					if (t + 1 < allSectionsData.length) preloadPromises.push(ensureStagedScheduler().warmSection(t + 1, { priority: 80, mode: 'immediate' }));
					await Promise.all(preloadPromises);
					if (isDestroyed) return;
					ensureScheduler().updateNeighborStates(t);
					scheduleBackgroundWarmup(t);
					initialSiteLoadComplete.set(true);
					// Immediately end initial reveal state
					isInitialReveal.set(false);
				}
			};

			void setupInitialLoad();

			onHashChange = () => {
				if (suppressNextHashUpdate) { suppressNextHashUpdate = false; return; }
				if (get(isInitialReveal) || get(isAnimating)) return; // ignore during reveal/animation
				const raw = window.location.hash?.trim();
				if (raw && raw.length > 1) {
					const fragment = decodeURIComponent(raw.substring(1));
					const idx = allSectionsData.findIndex(s => s.id === fragment);
					if (idx >= 0) { markNavCause('hash'); navigateToSection(idx); }
				} else {
					// Empty hash -> go back to hero
					if (get(currentSectionIndex) !== 0) { markNavCause('hash'); navigateToSection(0); }
				}
			};
			window.addEventListener('hashchange', onHashChange);

			// Always enable desktop-style navigation (wheel/keyboard) to support
			// vertical monitors (which use mobile layout) and hybrid devices.
			window.addEventListener('wheel', handleWheel, { passive: false });
			window.addEventListener('keydown', handleKeyDown);

			perfMetricsEnabled = new URLSearchParams(window.location.search).has('perf');
			document.addEventListener('visibilitychange', handleVisibilityChange);
			window.addEventListener('resize', handleResize);
		};

		mountLogic();
    
	unsubInitialLoadComplete = initialSiteLoadComplete.subscribe(complete => {
		if (!startOnHero) return; // deep link path handles its own reveal
		if (complete && !hasStartedInitialReveal) startInitialReveal();
	});

		return () => {
			isDestroyed = true;
			orchestratorAbortController?.abort();
			orchestratorAbortController = null;
			legacyScheduler?.dispose();
			backgroundWarmupAbortController?.abort();
			backgroundWarmupAbortController = null;
			jumpWarmupAbortController?.abort();
			jumpWarmupAbortController = null;
			activeMasterTransitionTl?.kill();
			activeMasterTransitionTl = null;
			navUnlockDelayedCall?.kill();
			navUnlockDelayedCall = null;

			for (const id of rafIds) cancelAnimationFrame(id);
			rafIds.clear();
			for (const id of timeoutIds) clearTimeout(id);
			timeoutIds.clear();
			if (initialRevealTimeoutId !== null) { clearTimeout(initialRevealTimeoutId); initialRevealTimeoutId = null; }
			if (initialRevealEndTimeoutId !== null) { clearTimeout(initialRevealEndTimeoutId); initialRevealEndTimeoutId = null; }

			window.removeEventListener('wheel', handleWheel);
			window.removeEventListener('keydown', handleKeyDown);

			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('resize', handleResize);
			if (onHashChange) window.removeEventListener('hashchange', onHashChange);
			if (unsubInitialLoadComplete) unsubInitialLoadComplete();
			sectionBackgroundZooms.forEach(tween => tween?.kill());
			clearTimeout(visibilityHideTimeoutId);
			if (wheelUnlockTimer !== null) {
				clearTimeout(wheelUnlockTimer);
				wheelUnlockTimer = null;
				wheelGestureLocked = false;
			}
		};
	});

	function onParticleEffectReady() {
		if (heroReadyResolver) heroReadyResolver();
	}

	function startInitialReveal() {
		if (hasStartedInitialReveal) return;
		hasStartedInitialReveal = true;

		initialRevealTimeoutId = safeTimeout(() => {
			if (heroSectionInstance) {
				heroSectionInstance.onTransitionToHeroComplete();
				scheduleBackgroundWarmup(0);
			}
			initialRevealEndTimeoutId = safeTimeout(() => { isInitialReveal.set(false); }, particleFadeInDuration * 1000);
		}, initialRevealDelay);
	}
  
	async function navigateToSection(newIndex: number) { 
		if (isDestroyed) return;
		if (get(isInitialReveal)) return; 
		const oldIndex = get(currentSectionIndex); 
		if (get(isAnimating) || newIndex === oldIndex || newIndex < 0 || newIndex >= sectionElements.length) return; 

		let transitionMetricId: string | null = null;
		if (perfMetricsEnabled) {
			const triggerAt = lastNavTriggerAt ?? performance.now();
			const cause = lastNavTriggerAt ? lastNavCause : 'unknown';
			lastNavCause = 'unknown';
			lastNavTriggerAt = null;
			transitionMetricId = beginTransitionMetric({
				cause,
				fromIndex: oldIndex,
				toIndex: newIndex,
				targetSectionId: allSectionsData[newIndex]?.id,
				triggerAt
			});
			markTransitionMetric(transitionMetricId, 'navigateStartAt');
		}

		// If jumping more than one section ahead/behind, proactively preload target before animating
		if (Math.abs(newIndex - oldIndex) > 1) {
			try {
				jumpWarmupAbortController?.abort();
				jumpWarmupAbortController = new AbortController();
				await ensureStagedScheduler().warmSection(newIndex, {
					priority: 100,
					mode: 'immediate',
					signal: jumpWarmupAbortController.signal
				});
			} catch {}
		}
		if (isDestroyed) return;
		// Update dots immediately to animate grow/shrink during transition
		navActiveIndex.set(newIndex);

		// Ensure target section is at least initialized if preload state was skipped (robustness)
		const targetId = allSectionsData[newIndex].id;
		const targetInstance = sectionInstances.get(targetId);
		if (targetInstance && targetInstance.initializeEffect) {
			try { void targetInstance.initializeEffect(orchestratorAbortController?.signal); } catch {}
		}
    
		isAnimating.set(true); 
		isTransitioning.set(true); 

		if (oldIndex === 0 && newIndex > 0) {
			isLeavingHero.set(true);
		}

		const oldInstance = sectionInstances.get(allSectionsData[oldIndex].id);
		const newInstance = sectionInstances.get(allSectionsData[newIndex].id);
    
		oldInstance?.onLeaveSection();
		sectionBackgroundZooms[oldIndex]?.progress(0).pause();
		newInstance?.onEnterSection();

		const currentSectionEl = sectionElements[oldIndex]; 
		const targetSectionEl = sectionElements[newIndex]; 
		const direction = newIndex > oldIndex ? 1 : -1; 
    
		if (perfMetricsEnabled && transitionMetricId) {
			markTransitionMetric(transitionMetricId, 'timelineCreatedAt');
		}

		activeMasterTransitionTl?.kill();
		activeMasterTransitionTl = gsap.timeline({ 
			onComplete: () => { 
				if (isDestroyed) return;
				currentSectionIndex.set(newIndex); 
				// Record navigation for direction-aware prediction
				ensureScheduler().recordNavigation(newIndex);
				if (perfMetricsEnabled && transitionMetricId) {
					markTransitionMetric(transitionMetricId, 'completeAt');
					try {
						const metrics = get(schedulerMetrics);
						const t = metrics.transitionHistory?.find(x => x.id === transitionMetricId);
						const targetId = allSectionsData[newIndex]?.id;
						const sec = targetId ? metrics.timings[targetId] : undefined;
						const triggerAt = t?.triggerAt;
						const fetchStartAt = sec?.fetchStart;
						const fetchEndAt = sec?.fetchEnd;
						const initStartAt = sec?.initStart;
						const initEndAt = sec?.initEnd;
						const fetchStartedBeforeTrigger =
							triggerAt != null && fetchStartAt != null ? fetchStartAt <= triggerAt : undefined;
						const fetchFinishedBeforeTrigger =
							triggerAt != null && fetchEndAt != null ? fetchEndAt <= triggerAt : undefined;
						const initStartedBeforeTrigger =
							triggerAt != null && initStartAt != null ? initStartAt <= triggerAt : undefined;
						const initFinishedBeforeTrigger =
							triggerAt != null && initEndAt != null ? initEndAt <= triggerAt : undefined;
						const firstFrameMs =
							t?.firstFrameAt != null ? (t.firstFrameAt - t.triggerAt) : undefined;
						const fetchMs = sec?.fetchStart != null && sec?.fetchEnd != null ? (sec.fetchEnd - sec.fetchStart) : undefined;
						const initMs = sec?.initStart != null && sec?.initEnd != null ? (sec.initEnd - sec.initStart) : undefined;
						const totalMs = t?.completeAt != null ? (t.completeAt - t.triggerAt) : undefined;
						console.info('[Perf] transition', {
							cause: t?.cause,
							from: t?.fromIndex,
							to: t?.toIndex,
							targetId,
							totalMs,
							firstFrameMs,
							fetchStartedBeforeTrigger,
							fetchFinishedBeforeTrigger,
							fetchMs,
							initStartedBeforeTrigger,
							initFinishedBeforeTrigger,
							initMs
						});
					} catch {}
				}
				isTransitioning.set(false);
				isLeavingHero.set(false);
				ensureScheduler().updateNeighborStates(newIndex);
				scheduleBackgroundWarmup(newIndex);
				safeRaf(() => newInstance?.onTransitionComplete?.());
				if (allSectionsData[newIndex].id === 'hero' && heroSectionInstance) {
					 heroSectionInstance.onTransitionToHeroComplete();
				}
				// Manage focus and inert after transition completes
				setActiveSectionInert(newIndex);
				focusSection(newIndex);
				announceSection(newIndex);
			} 
		}); 
    
		gsap.set(targetSectionEl, { yPercent: direction * 100, autoAlpha: 1 }); 
		activeMasterTransitionTl.to(currentSectionEl, { yPercent: -direction * 100, autoAlpha: 0, duration: transitionDuration, ease: 'expo.out' }, "slide"); 
		activeMasterTransitionTl.to(targetSectionEl, { yPercent: 0, duration: transitionDuration, ease: 'expo.out' }, "slide"); 
		if (perfMetricsEnabled && transitionMetricId) {
			safeRaf(() => {
				try { markTransitionMetric(transitionMetricId!, 'firstFrameAt'); } catch {}
			});
		}
		activeMasterTransitionTl.call(() => {
				sectionBackgroundZooms[newIndex]?.restart();
		}, [], `slide+=${transitionDuration * 0.1}`);

		navUnlockDelayedCall?.kill();
		navUnlockDelayedCall = gsap.delayedCall(Math.max(transitionDuration, minSectionDisplayDuration), () => { 
			if (isDestroyed) return;
			isAnimating.set(false); 
			// After animation complete, update hash (avoid doing for hero index 0 to keep URL clean?)
			const id = allSectionsData[newIndex].id;
			if (typeof window !== 'undefined') {
				// Option: keep hero clean; only set when not hero
				if (id === 'hero') {
					suppressNextHashUpdate = true;
					if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
				} else {
					suppressNextHashUpdate = true;
					const newHash = '#' + encodeURIComponent(id);
					if (window.location.hash !== newHash) {
						history.replaceState(null, '', newHash);
					}
				}
			}
			navUnlockDelayedCall = null;
		}); 
	}

	// Mobile navigation wrapper: optional haptic feedback
	function tryVibrate(duration = 15) {
		// Basic feature detection; most mobile browsers ignore silently if unsupported
		try {
			if (navigator && 'vibrate' in navigator) {
				// @ts-ignore - vibrate may not be in lib.dom.d.ts for all targets
				navigator.vibrate?.(duration);
			}
		} catch {}
	}
	function mobileNavigateTo(newIndex: number, _cause: 'swipe'|'dot') {
		if (!get(renderProfile).isMobile) return navigateToSection(newIndex);
		markNavCause(_cause);
		tryVibrate(15);
	    navigateToSection(newIndex);
	}

		let lastScrollTime = 0; // still used for keyboard debounce
		const scrollDebounce = 200;

		// Touchpad-friendly wheel gesture lock: one move per gesture
		const WHEEL_NOISE_THRESH = 2; // ignore tiny deltas/noise
		const WHEEL_LOCK_DURATION = Math.max(transitionDuration, minSectionDisplayDuration) * 1000 + 150; // ~1.35s
		// After unlock, briefly require higher delta to allow a second transition from the same ongoing gesture
		const SECONDARY_MIN_DELTA = 30; // px, only for a potential second transition
		const SECONDARY_WINDOW_MS = 600; // window right after unlock
		let wheelGestureLocked = false;
		let wheelUnlockTimer: number | null = null;
		let unlockAt = 0; // timestamp when wheel unlocks
		let lastWheelDir = 0; // direction of last triggered transition
		function handleWheel(event: WheelEvent) {
			event.preventDefault();
			if (get(isInitialReveal)) return;
			// Respect active animation; otherwise use our gesture lock
			if (get(isAnimating)) return;
			if (wheelGestureLocked) return;

			const now = Date.now();
			const dir = event.deltaY > 0 ? 1 : -1;
			const absDelta = Math.abs(event.deltaY);

			// Dynamic threshold: right after unlock, require a much larger delta (same direction)
			const withinSecondaryWindow = unlockAt && (now - unlockAt < SECONDARY_WINDOW_MS);
			const needsHigherThreshold = withinSecondaryWindow && dir === lastWheelDir;
			const minDelta = needsHigherThreshold ? Math.max(WHEEL_NOISE_THRESH, SECONDARY_MIN_DELTA) : WHEEL_NOISE_THRESH;
			if (absDelta < minDelta) return;

			// Lock for the duration of the transition
			wheelGestureLocked = true;
			if (wheelUnlockTimer === null) {
				wheelUnlockTimer = window.setTimeout(() => {
					wheelGestureLocked = false;
					wheelUnlockTimer = null;
					unlockAt = Date.now();
				}, WHEEL_LOCK_DURATION);
			}

			lastWheelDir = dir;
			markNavCause('wheel');
			navigateToSection(get(currentSectionIndex) + dir);
		}
	function handleKeyDown(event: KeyboardEvent) { if (get(isInitialReveal) || get(isAnimating)) { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(event.key)) event.preventDefault(); return; } const currentTime = Date.now(); if (currentTime - lastScrollTime < scrollDebounce) { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(event.key)) event.preventDefault(); return; } let newIndex = get(currentSectionIndex); let shouldScroll = false; switch (event.key) { case 'ArrowDown': case 'PageDown': case ' ': newIndex++; shouldScroll = true; break; case 'ArrowUp': case 'PageUp': newIndex--; shouldScroll = true; break; case 'Home': newIndex = 0; shouldScroll = true; break; case 'End': newIndex = sectionElements.length - 1; shouldScroll = true; break; } if (shouldScroll && newIndex !== get(currentSectionIndex)) { event.preventDefault(); lastScrollTime = currentTime; markNavCause('key'); navigateToSection(newIndex); } }

	// --- Natural Mobile Scroll Navigation with Progressive Drag ---
	// State tracking
	let touchStartY = 0;
	let touchStartX = 0;
	let touchStartTime = 0;
	let touchIntent: 'vertical' | 'horizontal' | 'interact' | null = null;
	let isInteractingWithEffect = false;
	let isDragging = false;
	let currentDragOffset = 0; // Current visual offset during drag
	let dragVelocity = 0; // Track velocity for momentum
	let lastTouchY = 0;
	let lastTouchTime = 0;

	// Natural scrolling thresholds (much more forgiving)
	const DRAG_THRESHOLD = 8; // px before starting drag (very low for immediate feedback)
	const SNAP_THRESHOLD = 0.25; // 25% of screen height to trigger section change
	const VELOCITY_THRESHOLD = 0.15; // px/ms for momentum-based navigation (very low)
	const HORIZ_TOLERANCE = 100; // px before canceling vertical gesture
	const RUBBER_BAND_FACTOR = 0.4; // Resistance at boundaries (0-1, lower = more resistance)
	const MOMENTUM_MULTIPLIER = 180; // Convert velocity to distance for momentum
	const MIN_MOMENTUM_DISTANCE = 30; // Minimum px for momentum to trigger navigation
	const MAX_VISUAL_FEEDBACK = 0.15; // Cap visual feedback at 15% of screen (just a nudge)

	/**
	 * Check if touch is in an area with interactive effects (hero or contact sections)
	 */
	function isTouchOnInteractiveEffect(target: EventTarget | null): boolean {
		if (!target || !(target instanceof Element)) return false;
		
		// Check if touching navigation dots (always prioritize these)
		if (target.closest('.mobile-dots')) return false;
		
		const currentIdx = get(currentSectionIndex);
		// Hero section (index 0) has particle effect
		if (currentIdx === 0) return true;
		// Contact section has ContactEffect
		if (allSectionsData[currentIdx]?.id === 'contact') return true;
		
		return false;
	}

	/**
	 * Forward touch events to particle effects for simultaneous interaction
	 */
	function forwardTouchToParticleEffect(event: TouchEvent, type: 'start' | 'move' | 'end') {
		const currentIdx = get(currentSectionIndex);
		
		// Forward to hero particle effect
		if (currentIdx === 0 && heroSectionInstance) {
			// The HeroParticleEffect component handles its own touch events
			// We just ensure our handler doesn't prevent them
			return;
		}
		
		// Forward to contact sphere effect
		if (allSectionsData[currentIdx]?.id === 'contact') {
			const contactSection = sectionInstancesArray[currentIdx];
			// The ContactEffect component handles its own touch events
			return;
		}
	}

	/**
	 * Update visual position during drag (progressive feedback)
	 */
	function updateDragPosition(offset: number) {
		if (!get(renderProfile).isMobile) return;
		
		const sections = document.querySelectorAll('.full-screen-section');
		const particleLayer = document.querySelector('.particle-effect-layer') as HTMLElement;
		const currentIdx = get(currentSectionIndex);
		const currentSection = sections[currentIdx] as HTMLElement;
		const viewportHeight = window.innerHeight;
		
		// Determine if at boundary
		const atTopBoundary = currentIdx === 0 && offset > 0;
		const atBottomBoundary = currentIdx === sections.length - 1 && offset < 0;
		const atBoundary = atTopBoundary || atBottomBoundary;
		
		const { progress } = computeDragProgress({
			dragOffsetPx: offset,
			maxVisualFeedback: MAX_VISUAL_FEEDBACK,
			atBoundary,
			rubberBandFactor: RUBBER_BAND_FACTOR,
			viewportHeightPx: viewportHeight
		});
		
		// Apply drag feedback to the hero particle layer (only when on hero section)
		if (particleLayer && currentIdx === 0) {
			gsap.set(particleLayer, {
				yPercent: progress * 100,
				force3D: true
			});
		}
		
		if (currentSection) {
			gsap.set(currentSection, { 
				yPercent: progress * 100,
				force3D: true
			});
		}
		
		// Show subtle preview of next/prev section
		if (!atBoundary) {
			const nextIdx = offset < 0 ? currentIdx + 1 : currentIdx - 1;
			if (nextIdx >= 0 && nextIdx < sections.length) {
				const nextSection = sections[nextIdx] as HTMLElement;
				const direction = offset < 0 ? 1 : -1;
				gsap.set(nextSection, { 
					yPercent: direction * 100 + progress * 100,
					autoAlpha: 1,
					force3D: true
				});
			}
		}
	}

	/**
	 * Reset drag state and snap to nearest section
	 */
	function finishDragAndSnap(finalVelocity: number) {
		if (!get(renderProfile).isMobile) return;
		
		isDragging = false;
		const viewportHeight = window.innerHeight;
		const currentIdx = get(currentSectionIndex);
		const { shouldNavigate, direction } = decideSwipeNavigation({
			dragOffsetPx: currentDragOffset,
			viewportHeightPx: viewportHeight,
			finalVelocityPxPerMs: finalVelocity,
			momentumMultiplier: MOMENTUM_MULTIPLIER,
			minMomentumDistancePx: MIN_MOMENTUM_DISTANCE,
			velocityThresholdPxPerMs: VELOCITY_THRESHOLD,
			snapThreshold: SNAP_THRESHOLD
		});
		
		// Navigate or snap back
		if (shouldNavigate) {
			const targetIdx = currentIdx + direction;
			// Boundary check
			if (targetIdx >= 0 && targetIdx < allSectionsData.length) {
				// Reset sections to default positions before navigation to avoid conflicts
				const sections = document.querySelectorAll('.full-screen-section');
				const particleLayer = document.querySelector('.particle-effect-layer') as HTMLElement;
				
				// Reset particle layer if currently on hero section
				if (particleLayer && currentIdx === 0) {
					gsap.set(particleLayer, { yPercent: 0, force3D: true });
				}
				
				sections.forEach((section, idx) => {
					if (idx === currentIdx) {
						gsap.set(section, { yPercent: 0, autoAlpha: 1 });
					} else {
						gsap.set(section, { yPercent: 100, autoAlpha: 0 });
					}
				});
				// Now trigger the normal navigation animation
				mobileNavigateTo(targetIdx, 'swipe');
			} else {
				// At boundary, snap back
				snapBackToCurrentSection();
			}
		} else {
			// Not enough movement, snap back
			snapBackToCurrentSection();
		}
		
		// Reset drag offset
		currentDragOffset = 0;
	}

	/**
	 * Animate back to current section (cancel gesture)
	 */
	function snapBackToCurrentSection() {
		const sections = document.querySelectorAll('.full-screen-section');
		const particleLayer = document.querySelector('.particle-effect-layer') as HTMLElement;
		if (sections.length === 0) return;
		
		const currentIdx = get(currentSectionIndex);
		const currentSection = sections[currentIdx] as HTMLElement;
		
		// Reset particle layer if on hero section
		if (particleLayer && currentIdx === 0) {
			gsap.to(particleLayer, {
				yPercent: 0,
				duration: 0.4,
				ease: 'power2.out',
				force3D: true
			});
		}
		
		gsap.to(currentSection, {
			yPercent: 0,
			duration: 0.4,
			ease: 'power2.out',
			force3D: true
		});
		
		// Hide any visible adjacent sections
		[currentIdx - 1, currentIdx + 1].forEach(idx => {
			if (idx >= 0 && idx < sections.length) {
				const section = sections[idx] as HTMLElement;
				const direction = idx < currentIdx ? -1 : 1;
				gsap.to(section, {
					yPercent: direction * 100,
					duration: 0.4,
					ease: 'power2.out',
					force3D: true,
					onComplete: () => {
						gsap.set(section, { autoAlpha: 0 });
					}
				});
			}
		});
	}

	function onTouchStart(e: TouchEvent) {
		if (!get(renderProfile).isMobile || get(isInitialReveal) || get(isAnimating)) return;
		
		// Check if touch is on navigation dots
		const target = e.target;
		if (target && target instanceof Element && target.closest('.mobile-dots')) {
			return;
		}
		
		const t = e.changedTouches[0];
		if (!t) return;

		touchStartY = t.clientY;
		touchStartX = t.clientX;
		lastTouchY = t.clientY;
		touchStartTime = performance.now();
		lastTouchTime = touchStartTime;
		touchIntent = null;
		isInteractingWithEffect = false;
		isDragging = false;
		currentDragOffset = 0;
		dragVelocity = 0;

		// Check if starting on interactive effect
		if (isTouchOnInteractiveEffect(e.target)) {
			isInteractingWithEffect = true;
			// Forward touch to particle effects (they handle their own events)
			forwardTouchToParticleEffect(e, 'start');
		}
	}

	function onTouchMove(e: TouchEvent) {
		if (!get(renderProfile).isMobile || get(isInitialReveal) || get(isAnimating)) return;
		
		// Check if touch is on navigation dots
		const target = e.target;
		if (target && target instanceof Element && target.closest('.mobile-dots')) {
			return;
		}
		
		const t = e.changedTouches[0];
		if (!t) return;

		const currentY = t.clientY;
		const currentX = t.clientX;
		const currentTime = performance.now();
		const dy = currentY - touchStartY;
		const dx = currentX - touchStartX;
		const absDy = Math.abs(dy);
		const absDx = Math.abs(dx);

		// Calculate instantaneous velocity for momentum
		dragVelocity = computeInstantVelocityPxPerMs({
			currentY,
			lastY: lastTouchY,
			currentTimeMs: currentTime,
			lastTimeMs: lastTouchTime
		});
		lastTouchY = currentY;
		lastTouchTime = currentTime;

		// Forward touch to particle effects for simultaneous interaction
		if (isInteractingWithEffect) {
			forwardTouchToParticleEffect(e, 'move');
		}

		// Determine intent if not yet set
		if (!touchIntent && (absDy > DRAG_THRESHOLD || absDx > DRAG_THRESHOLD)) {
			const decision = decideGestureIntent({
				absDx,
				absDy,
				dragThresholdPx: DRAG_THRESHOLD,
				horizTolerancePx: HORIZ_TOLERANCE
			});
			// For effect areas: Always allow both particle interaction AND navigation
			// Don't lock into 'interact' mode - let both happen together
			// The visual nudge provides feedback that navigation is possible
			if (decision.intent === 'horizontal') {
				touchIntent = 'horizontal';
				return;
			}
			if (decision.intent === 'vertical') {
				touchIntent = 'vertical';
				isDragging = decision.startDragging;
			}
		}

		// Handle based on intent
		if (touchIntent === 'horizontal') {
			return; // Let other handlers manage this
		}

		// Handle vertical dragging with progressive feedback
		// This works alongside particle interaction on hero/contact sections
		if (touchIntent === 'vertical' && isDragging) {
			// Cancel horizontal if too much horizontal movement
			if (shouldCancelVerticalGesture({ absDx, horizTolerancePx: HORIZ_TOLERANCE })) {
				touchIntent = 'horizontal';
				isDragging = false;
				snapBackToCurrentSection();
				return;
			}

			// Update drag offset and visual feedback (shows navigation possibility)
			currentDragOffset = dy;
			updateDragPosition(dy);

			// Prevent pull-to-refresh at top
			const scroller = (document.scrollingElement as HTMLElement | null) ?? document.body;
			const atTop = scroller ? scroller.scrollTop <= 0 : window.scrollY <= 0;
			if (dy > 0 && atTop && absDy > DRAG_THRESHOLD) {
				e.preventDefault();
			}
		}
	}

	function onTouchEnd(e: TouchEvent) {
		if (!get(renderProfile).isMobile || get(isInitialReveal) || get(isAnimating)) return;
		
		// Check if touch is on navigation dots
		const target = e.target;
		if (target && target instanceof Element && target.closest('.mobile-dots')) {
			return;
		}

		// Forward touch end to particle effects
		if (isInteractingWithEffect) {
			forwardTouchToParticleEffect(e, 'end');
		}

		// If was dragging, finish with momentum
		if (isDragging && touchIntent === 'vertical') {
			finishDragAndSnap(dragVelocity);
		}

		// Reset state
		touchIntent = null;
		isInteractingWithEffect = false;
		isDragging = false;
		currentDragOffset = 0;
		dragVelocity = 0;
	}
</script>

<svelte:head>
	<title>{siteConfig.title}</title>
	<meta name="description" content={siteConfig.description} />
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400..900&display=swap" rel="stylesheet">
</svelte:head>

<div>
	<!-- Visually hidden live region for announcing section changes -->
	<div aria-live="polite" aria-atomic="true" class="sr-only">{liveMessage}</div>
	{#if showLoadingScreen}
		<LoadingScreen />
	{/if}

	<div 
		class="particle-effect-layer" 
		class:initial-state={$isInitialReveal}
		class:on-top={$isLeavingHero}
		style="pointer-events: {particleLayerPointerEvents};"
		on:touchstart|passive={onTouchStart}
		on:touchmove={onTouchMove}
		on:touchend|passive={onTouchEnd}
	>
			<HeroSection
			bind:this={heroSectionInstance}
				activeSectionIndex={$currentSectionIndex}
			isTransitioning={$isTransitioning}
			{transitionDuration}
			isInitialLoad={$isInitialReveal}
			on:ready={onParticleEffectReady}
		/>
	</div>

		<main
			class="portfolio-container"
			style="pointer-events: {mainContainerPointerEvents};"
			on:touchstart|passive={onTouchStart}
			on:touchmove={onTouchMove}
			on:touchend|passive={onTouchEnd}
		>
		<section id="hero" class="full-screen-section hero-section-container">
			<!-- Focus sentinel (programmatic target to avoid focusing visible controls) -->
			<div class="section-focus-sentinel sr-only" tabindex="-1"></div>
		</section>

		{#each allSectionsData.slice(1) as section, i (section.id)}
			<section 
				id={section.id} 
				class="full-screen-section"
			>
				<!-- Invisible focus target (no aria-hidden; may be focused during transitions) -->
				<div class="section-focus-sentinel sr-only" tabindex="-1"></div>
				{#if section.id === 'about'}
					<AboutSection
						bind:this={sectionInstancesArray[i + 1]}
					data={aboutData}
						{contactSectionIndex}
						{navigateToSection}
						on:animationComplete={handleAnimationComplete}
					/>
						{:else if section.id.startsWith('project-')}
					<ProjectSection
						bind:this={sectionInstancesArray[i + 1]}
						project={section.data as Project}
						on:animationComplete={handleAnimationComplete}
					>
						<svelte:component 
							this={section.layout} 
									{...(section.data as Project)}
									readMoreFallbackLabel={(($page.data as any)?.messages?.common?.projects?.readMore) ?? undefined}
						/>
					</ProjectSection>
				{:else if section.id === 'contact'}
								<ContactSection
						bind:this={sectionInstancesArray[i + 1]}
									data={contactData}
										socialLinks={aboutData.socialLinks}
						on:animationComplete={handleAnimationComplete}
					/>
				{/if}
			</section>
		{/each}
			{#if get(renderProfile).isMobile}
				<MobileNavDots
					sections={allSectionsData.map(s => ({ id: s.id, label: s.id }))}
					activeIndex={$navActiveIndex}
					on:select={(e) => mobileNavigateTo(e.detail.index, 'dot')}
				/>
			{/if}
		</main>

  

	<style>
		.particle-effect-layer { 
			position: fixed; 
			top: 0; 
			left: 0; 
			width: 100vw; 
			height: 100vh; 
			z-index: 0; /* Default state: behind main content */
			background-color: rgb(9 9 11); 
			transition: opacity 1.5s cubic-bezier(0.4, 0.2, 1); 
		}

		/* --- START OF FIX --- */
		/* This class is now applied only when transitioning away from the hero section. */
		.particle-effect-layer.on-top {
			z-index: 2; /* Promoted state: on top of main content */
			background-color: transparent; /* Makes the layer see-through, leaving only the particles. */
		}
		/* --- END OF FIX --- */

		.particle-effect-layer.initial-state { background-color: rgb(5 8 5); }
		.portfolio-container { 
			position: relative; 
			width: 100%; 
			height: 100vh; 
			overflow: hidden; 
			z-index: 1; /* Default state: on top of hero particles */
		}
    
		.full-screen-section {
			height: 100%;
			width: 100%;
			position: absolute;
			top: 0;
			left: 0;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			box-sizing: border-box;
			background-color: transparent; 
		}

		.hero-section-container {
			pointer-events: none;
		}
    
		* { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

		/* Screen reader only (visually hidden) */
		.sr-only {
			border: 0 !important;
			clip: rect(1px, 1px, 1px, 1px) !important;
			clip-path: inset(50%) !important;
			height: 1px !important;
			margin: -1px !important;
			overflow: hidden !important;
			padding: 0 !important;
			position: absolute !important;
			width: 1px !important;
			white-space: nowrap !important;
		}

		/* Focus sentinel inherits sr-only; ensure no outline flicker */
		.section-focus-sentinel:focus { outline: none; }
	</style>

  
</div>
