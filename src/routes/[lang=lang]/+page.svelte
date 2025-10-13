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
		initializeEffect?: () => Promise<void>;
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
			requestAnimationFrame(() => {
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
		requestAnimationFrame(() => { liveMessage = title; });
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
	let legacyScheduler: LegacySectionScheduler | null = null;

	function ensureScheduler() {
		if (!legacyScheduler) {
			legacyScheduler = new LegacySectionScheduler({
				sections: allSectionsData as any,
				sectionElements,
				sectionInstances,
				contactSectionIndex
			}, { debug: false });
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

	function handleAnimationComplete() {
		// Phase 2: use predictive warmup instead of static +2 preload
		ensureScheduler().predictiveWarmup(get(currentSectionIndex));
	}

	async function handleVisibilityChange() {
		const currentIndex = get(currentSectionIndex);
		const currentInstance = sectionInstances.get(allSectionsData[currentIndex].id);
		if (!currentInstance) return;
		if (document.hidden) {
			visibilityHideTimeoutId = window.setTimeout(() => {
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
					await currentInstance.initializeEffect();
				}
				currentInstance.onEnterSection();
				requestAnimationFrame(() => {
					currentInstance.onTransitionComplete?.();
				});
				isTabHiddenAndPaused = false;
				ensureScheduler().updateNeighborStates(currentIndex);
				ensureScheduler().predictiveWarmup(currentIndex);
			}
		}
	}

	onMount(() => {
		const mountLogic = async () => {
			await tick();
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
						try { await inst.initializeEffect(); } catch {}
					}
					inst?.onEnterSection();
					requestAnimationFrame(() => inst?.onTransitionComplete?.());
				}

			const setupInitialLoad = async () => {
				if (!isDeepLinkStart) {
					await Promise.all([heroReadyPromise, ensureScheduler().prepareSection(1)]);
					ensureScheduler().updateNeighborStates(0);
					ensureScheduler().predictiveWarmup(0);
					initialSiteLoadComplete.set(true);
				} else if (initialHashTargetIndex && initialHashTargetIndex > 0) {
					// Preload neighbors of target section instead of hero neighbors
					const t = initialHashTargetIndex;
					const preloadPromises: Promise<void>[] = [];
					if (t - 1 >= 0) preloadPromises.push(ensureScheduler().prepareSection(t - 1));
					if (t + 1 < allSectionsData.length) preloadPromises.push(ensureScheduler().prepareSection(t + 1));
					await Promise.all(preloadPromises);
					ensureScheduler().updateNeighborStates(t);
					ensureScheduler().predictiveWarmup(t);
					initialSiteLoadComplete.set(true);
					// Immediately end initial reveal state
					isInitialReveal.set(false);
				}
			};

			setupInitialLoad();

			onHashChange = () => {
				if (suppressNextHashUpdate) { suppressNextHashUpdate = false; return; }
				if (get(isInitialReveal) || get(isAnimating)) return; // ignore during reveal/animation
				const raw = window.location.hash?.trim();
				if (raw && raw.length > 1) {
					const fragment = decodeURIComponent(raw.substring(1));
					const idx = allSectionsData.findIndex(s => s.id === fragment);
					if (idx >= 0) navigateToSection(idx);
				} else {
					// Empty hash -> go back to hero
					if (get(currentSectionIndex) !== 0) navigateToSection(0);
				}
			};
			window.addEventListener('hashchange', onHashChange);

			if (!get(renderProfile).isMobile) {
				window.addEventListener('wheel', handleWheel, { passive: false });
				window.addEventListener('keydown', handleKeyDown);
			}
			document.addEventListener('visibilitychange', handleVisibilityChange);
		};

		mountLogic();
    
	unsubInitialLoadComplete = initialSiteLoadComplete.subscribe(complete => {
		if (!startOnHero) return; // deep link path handles its own reveal
		if (complete && !hasStartedInitialReveal) startInitialReveal();
	});

		return () => {
			if (!get(renderProfile).isMobile) {
				window.removeEventListener('wheel', handleWheel);
				window.removeEventListener('keydown', handleKeyDown);
			}
			document.removeEventListener('visibilitychange', handleVisibilityChange);
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

		setTimeout(() => {
			if (heroSectionInstance) {
				heroSectionInstance.onTransitionToHeroComplete();
				ensureScheduler().predictiveWarmup(0);
			}
			setTimeout(() => { isInitialReveal.set(false); }, particleFadeInDuration * 1000);
		}, initialRevealDelay);
	}
  
	async function navigateToSection(newIndex: number) { 
		if (get(isInitialReveal)) return; 
		const oldIndex = get(currentSectionIndex); 
		if (get(isAnimating) || newIndex === oldIndex || newIndex < 0 || newIndex >= sectionElements.length) return; 
		// If jumping more than one section ahead/behind, proactively preload target before animating
		if (Math.abs(newIndex - oldIndex) > 1) {
			const targetId = allSectionsData[newIndex].id;
			const targetInstance = sectionInstances.get(targetId);
			try { await ensureScheduler().prepareSection(newIndex); } catch {}
			// Make sure instance map has updated (in rare cases of dynamic data)
			if (targetInstance && targetInstance.initializeEffect) {
				try { await targetInstance.initializeEffect(); } catch {}
			}
		}
		// Update dots immediately to animate grow/shrink during transition
		navActiveIndex.set(newIndex);

		// Ensure target section is at least initialized if preload state was skipped (robustness)
		const targetId = allSectionsData[newIndex].id;
		const targetInstance = sectionInstances.get(targetId);
		if (targetInstance && targetInstance.initializeEffect) {
			try { targetInstance.initializeEffect(); } catch {}
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
    
		const masterTransitionTl = gsap.timeline({ 
			onComplete: () => { 
				currentSectionIndex.set(newIndex); 
				// Record navigation for direction-aware prediction
				ensureScheduler().recordNavigation(newIndex);
				isTransitioning.set(false);
				isLeavingHero.set(false);
				ensureScheduler().updateNeighborStates(newIndex);
				ensureScheduler().predictiveWarmup(newIndex);
				requestAnimationFrame(() => newInstance?.onTransitionComplete?.());
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
		masterTransitionTl.to(currentSectionEl, { yPercent: -direction * 100, autoAlpha: 0, duration: transitionDuration, ease: 'expo.out' }, "slide"); 
		masterTransitionTl.to(targetSectionEl, { yPercent: 0, duration: transitionDuration, ease: 'expo.out' }, "slide"); 
		masterTransitionTl.call(() => {
				sectionBackgroundZooms[newIndex]?.restart();
		}, [], `slide+=${transitionDuration * 0.1}`);

		gsap.delayedCall(Math.max(transitionDuration, minSectionDisplayDuration), () => { 
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
			navigateToSection(get(currentSectionIndex) + dir);
		}
	function handleKeyDown(event: KeyboardEvent) { if (get(isInitialReveal) || get(isAnimating)) { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(event.key)) event.preventDefault(); return; } const currentTime = Date.now(); if (currentTime - lastScrollTime < scrollDebounce) { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(event.key)) event.preventDefault(); return; } let newIndex = get(currentSectionIndex); let shouldScroll = false; switch (event.key) { case 'ArrowDown': case 'PageDown': case ' ': newIndex++; shouldScroll = true; break; case 'ArrowUp': case 'PageUp': newIndex--; shouldScroll = true; break; case 'Home': newIndex = 0; shouldScroll = true; break; case 'End': newIndex = sectionElements.length - 1; shouldScroll = true; break; } if (shouldScroll && newIndex !== get(currentSectionIndex)) { event.preventDefault(); lastScrollTime = currentTime; navigateToSection(newIndex); } }

	// --- Modern Mobile Swipe Detection ---
	// State tracking
	let touchStartY = 0;
	let touchStartX = 0;
	let touchStartTime = 0;
	let touchIntent: 'next' | 'prev' | 'interact' | null = null;
	let isInteractingWithEffect = false;

	// Modernized thresholds (more forgiving)
	const SWIPE_MIN_DISTANCE = 50; // px (reduced from 70)
	const SWIPE_MIN_VELOCITY = 0.25; // px/ms (reduced from 0.35)
	const HORIZ_TOLERANCE = 80; // px (increased from 60 to be more lenient)
	const INTENT_LOCK_DISTANCE = 20; // px before locking direction intent (reduced from 24)
	const VERTICAL_BIAS_FACTOR = 1.2; // vertical must be 20% more than horizontal (reduced from 1.35)
	const PULL_REFRESH_THRESHOLD = 12; // px before blocking pull-to-refresh (reduced from 16)
	
	// Effect interaction detection threshold
	const EFFECT_INTERACTION_THRESHOLD = 15; // px of movement before considering it an effect interaction

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

	function onTouchStart(e: TouchEvent) {
		if (!get(renderProfile).isMobile || get(isInitialReveal) || get(isAnimating)) return;
		
		// CRITICAL: Check if touch is on navigation dots - if so, don't handle it here
		const target = e.target;
		if (target && target instanceof Element && target.closest('.mobile-dots')) {
			return; // Let the navigation dots handle this touch
		}
		
		const t = e.changedTouches[0];
		if (!t) return;

		touchStartY = t.clientY;
		touchStartX = t.clientX;
		touchStartTime = performance.now();
		touchIntent = null;
		isInteractingWithEffect = false;

		// Detect if we're starting on an interactive effect area
		if (isTouchOnInteractiveEffect(e.target)) {
			// Mark as potential effect interaction, but don't commit yet
			// We'll decide based on gesture pattern in touchmove
			isInteractingWithEffect = true;
		}
	}

	function onTouchMove(e: TouchEvent) {
		if (!get(renderProfile).isMobile || get(isInitialReveal) || get(isAnimating)) return;
		
		// CRITICAL: Check if touch is on navigation dots - if so, don't handle it here
		const target = e.target;
		if (target && target instanceof Element && target.closest('.mobile-dots')) {
			return; // Let the navigation dots handle this touch
		}
		
		const t = e.changedTouches[0];
		if (!t) return;

		const currentY = t.clientY;
		const currentX = t.clientX;
		const dy = currentY - touchStartY;
		const dx = currentX - touchStartX;
		const absDy = Math.abs(dy);
		const absDx = Math.abs(dx);

		// Check if this looks like horizontal gesture (carousel, etc.)
		if (absDx > HORIZ_TOLERANCE && absDx > absDy * 1.5) {
			touchIntent = null;
			return;
		}

		// Determine if vertical movement is dominant
		const isVerticalDominant = absDy > absDx * VERTICAL_BIAS_FACTOR;

		// Intent locking logic
		if (!touchIntent && absDy >= INTENT_LOCK_DISTANCE) {
			if (isInteractingWithEffect && absDy < EFFECT_INTERACTION_THRESHOLD * 2) {
				// Small movements on effect areas = interaction, not navigation
				touchIntent = 'interact';
			} else if (isVerticalDominant) {
				// Clear vertical swipe = navigation intent
				touchIntent = dy < 0 ? 'next' : 'prev';
			}
		}

		// Pull-to-refresh prevention (only at top of page)
		const scroller = (document.scrollingElement as HTMLElement | null) ?? document.body;
		const atTop = scroller ? scroller.scrollTop <= 0 : window.scrollY <= 0;
		
		if (dy > 0 && atTop && isVerticalDominant) {
			// Block pull-to-refresh for navigation gestures or when intent locked upward
			if (absDy >= PULL_REFRESH_THRESHOLD || touchIntent === 'prev') {
				e.preventDefault();
			}
		}
	}

	function onTouchEnd(e: TouchEvent) {
		if (!get(renderProfile).isMobile || get(isInitialReveal) || get(isAnimating)) return;
		
		// CRITICAL: Check if touch is on navigation dots - if so, don't handle it here
		const target = e.target;
		if (target && target instanceof Element && target.closest('.mobile-dots')) {
			return; // Let the navigation dots handle this touch
		}
		
		const t = e.changedTouches[0];
		if (!t) return;

		const dy = t.clientY - touchStartY;
		const dx = t.clientX - touchStartX;
		const dt = Math.max(1, performance.now() - touchStartTime);
		const absDy = Math.abs(dy);
		const absDx = Math.abs(dx);

		// Don't navigate if this was marked as effect interaction
		if (touchIntent === 'interact') {
			touchIntent = null;
			isInteractingWithEffect = false;
			return;
		}

		// Ignore if too horizontal
		if (absDx > HORIZ_TOLERANCE && absDx > absDy * 1.5) {
			touchIntent = null;
			isInteractingWithEffect = false;
			return;
		}

		// Calculate velocity
		const velocity = absDy / dt; // px/ms

		// Trigger navigation if: distance OR velocity threshold met (OR logic, not AND)
		const shouldNavigate = absDy > SWIPE_MIN_DISTANCE || velocity > SWIPE_MIN_VELOCITY;

		if (shouldNavigate) {
			// Use locked intent if available, otherwise infer from direction
			const dir = touchIntent === 'next' ? 1 
				: touchIntent === 'prev' ? -1 
				: (dy < 0 ? 1 : -1); // swipe up -> next
			
			mobileNavigateTo(get(currentSectionIndex) + dir, 'swipe');
		}

		// Reset state
		touchIntent = null;
		isInteractingWithEffect = false;
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
			<!-- Focus sentinel: remove invalid aria-label on generic div; hide from AT but keep focusable -->
			<div class="section-focus-sentinel sr-only" tabindex="-1" aria-hidden="true"></div>
		</section>

		{#each allSectionsData.slice(1) as section, i (section.id)}
			<section 
				id={section.id} 
				class="full-screen-section"
			>
				<!-- Invisible focus target (no aria-label on generic element) -->
				<div class="section-focus-sentinel sr-only" tabindex="-1" aria-hidden="true"></div>
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
