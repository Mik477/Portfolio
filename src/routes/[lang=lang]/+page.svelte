<!-- src/routes/[lang=lang]/+page.svelte -->
<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { writable, get } from 'svelte/store';
		import { siteConfig } from '$lib/data/siteConfig';
		import { page } from '$app/stores';
	import { getProjects, type Project, type Locale } from '$lib/data/projectsData';
	import { initialSiteLoadComplete, preloadAssets } from '$lib/stores/preloadingStore';
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
	$: allSectionsData = [
		{ id: 'hero', component: HeroSection, data: siteConfig.heroSection, layout: null },
		{ id: 'about', component: AboutSection, data: siteConfig.aboutSection, layout: null },
		{ id: `project-${localizedProjects[0].id}`, component: ProjectSection, layout: ProjectOneLayout, data: localizedProjects[0] },
		{ id: `project-${localizedProjects[1].id}`, component: ProjectSection, layout: ProjectOneLayout, data: localizedProjects[1] },
		{ id: 'contact', component: ContactSection, data: siteConfig.contactSection, layout: null }
	];
	const contactSectionIndex = allSectionsData.findIndex(s => s.id === 'contact');

		// Localized data overrides for About and Contact
		let aboutData: typeof siteConfig.aboutSection = siteConfig.aboutSection;
		let contactData: typeof siteConfig.contactSection = siteConfig.contactSection;
		$: {
			const common = ($page.data as any)?.messages?.common;
			if (common?.about) {
				aboutData = {
					...siteConfig.aboutSection,
					title: common.about.title ?? siteConfig.aboutSection.title,
					introduction: common.about.introduction ?? siteConfig.aboutSection.introduction
				};
			}
			if (common?.contact) {
				contactData = {
					...siteConfig.contactSection,
					title: common.contact.title ?? siteConfig.contactSection.title,
					outroMessage: common.contact.outroMessage ?? siteConfig.contactSection.outroMessage
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

	// --- Focus management helpers ---
	function isElementVisible(el: Element): boolean {
		if (!(el instanceof HTMLElement)) return false;
		if (el.hidden) return false;
		if (el.getAttribute('aria-hidden') === 'true') return false;
		const rect = el.getBoundingClientRect();
		return rect.width > 0 && rect.height > 0;
	}

	function findFocusTarget(sectionEl: HTMLElement): HTMLElement | null {
		// 1) explicit opt-in
		let candidate = sectionEl.querySelector('[data-focus-first]') as HTMLElement | null;
		if (candidate && isElementVisible(candidate)) return candidate;
		// 2) autofocus
		candidate = sectionEl.querySelector('[autofocus]') as HTMLElement | null;
		if (candidate && isElementVisible(candidate)) return candidate;
		// 3) native focusables
		const focusables = sectionEl.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
		for (const el of Array.from(focusables)) {
			if (isElementVisible(el) && !el.hasAttribute('disabled')) return el;
		}
		// 4) first meaningful heading
		const headings = sectionEl.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6');
		for (const h of Array.from(headings)) {
			if (isElementVisible(h)) {
				if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
				return h;
			}
		}
		// 5) fallback to the section container
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

	// The HYBRID Preload Manager
	const preloadManager = {
		async updateNeighborStates(activeIndex: number) {
			const currentStates = get(sectionStatesStore);
			const desiredStates: SectionState[] = allSectionsData.map((_, i) => {
				if (i === activeIndex) return 'ACTIVE';
				if (i === activeIndex - 1 || i === activeIndex + 1) return 'READY';
				return 'COOLDOWN';
			});

			const tasks: Promise<void>[] = [];

			for (let i = 0; i < allSectionsData.length; i++) {
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
      
			sectionStatesStore.update(states => {
				states[activeIndex] = 'ACTIVE';
				return states;
			});

			await Promise.all(tasks);
		},
    
		async prepareSection(index: number) {
			const currentState = get(sectionStatesStore)[index];
			if (currentState !== 'IDLE' && currentState !== 'COOLDOWN') return;
      
			const sectionInfo = allSectionsData[index];
			const instance = sectionInstances.get(sectionInfo.id);
			const element = sectionElements[index];

			if (!instance || !element) return;

			sectionStatesStore.update(states => { states[index] = 'PRELOADING'; return states; });

			const urls = this.getSectionAssetUrls(index);
			if (urls.length > 0) await preloadAssets(urls);
      
			if (instance.initializeEffect) await instance.initializeEffect();
      
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
      
			sectionStatesStore.update(states => { states[index] = 'READY'; return states; });
		},

		async coolDownSection(index: number) {
			const sectionId = allSectionsData[index].id;
			sectionStatesStore.update(states => { states[index] = 'COOLDOWN'; return states; });
      
			const instance = sectionInstances.get(sectionId);
			instance?.onUnload?.();
      
			sectionStatesStore.update(states => { states[index] = 'IDLE'; return states; });
		},

		getSectionAssetUrls(index: number): string[] {
			if (index < 0 || index >= allSectionsData.length) return [];
			const section = allSectionsData[index];
			let urls: string[] = [];
			if (section.id === 'about') {
				urls.push((section.data as typeof siteConfig.aboutSection).imageUrl);
			} else if (section.id.startsWith('project-')) {
				const p = section.data as Project;
				if (p.backgrounds && p.backgrounds.length > 0) {
					urls.push(p.backgrounds[0].value);
					if (p.backgrounds.length > 1) urls.push(p.backgrounds[1].value);
				}
				p.cards.forEach(card => {
					if (card.cardImage) urls.push(card.cardImage);
				});
			}
			return urls.filter(Boolean);
		},
	};

	function handleAnimationComplete() {
		const nextNeighborIndex = get(currentSectionIndex) + 2;
		if(nextNeighborIndex < allSectionsData.length) {
			preloadManager.prepareSection(nextNeighborIndex);
		}
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
				preloadManager.updateNeighborStates(currentIndex);
			}
		}
	}

	onMount(() => {
		const mountLogic = async () => {
			await tick();
      
				sectionStatesStore.set(new Array(allSectionsData.length).fill('IDLE'));
			sectionElements = allSectionsData.map(section => document.getElementById(section.id) as HTMLElement);

				sectionElements.forEach((sectionEl, index) => {
				const sectionData = allSectionsData[index];
				if (sectionData.id.startsWith('project-')) {
					const bgTarget = sectionEl.querySelector('.background-zoom-target') as HTMLElement;
					sectionBackgroundZooms[index] = bgTarget ? gsap.to(bgTarget, { scale: 1.08, duration: projectBgZoomDuration, ease: 'power1.out', paused: true }) : null;
				}
				gsap.set(sectionEl, { yPercent: index === 0 ? 0 : 100, autoAlpha: index === 0 ? 1 : 0 });
			});

				// Prevent focus from landing in off-screen sections
				setActiveSectionInert(0);
				// Optional: announce initial section
				announceSection(0);

			const setupInitialLoad = async () => {
				await Promise.all([heroReadyPromise, preloadManager.prepareSection(1)]);
				preloadManager.updateNeighborStates(0);
				initialSiteLoadComplete.set(true);
			};

			setupInitialLoad();

			if (!get(renderProfile).isMobile) {
				window.addEventListener('wheel', handleWheel, { passive: false });
				window.addEventListener('keydown', handleKeyDown);
			}
			document.addEventListener('visibilitychange', handleVisibilityChange);
		};

		mountLogic();
    
	unsubInitialLoadComplete = initialSiteLoadComplete.subscribe(complete => {
		if (complete && !hasStartedInitialReveal) startInitialReveal();
	});

		return () => {
			if (!get(renderProfile).isMobile) {
				window.removeEventListener('wheel', handleWheel);
				window.removeEventListener('keydown', handleKeyDown);
			}
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			if (unsubInitialLoadComplete) unsubInitialLoadComplete();
			sectionBackgroundZooms.forEach(tween => tween?.kill());
			clearTimeout(visibilityHideTimeoutId);
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
				preloadManager.prepareSection(2);
			}
			setTimeout(() => { isInitialReveal.set(false); }, particleFadeInDuration * 1000);
		}, initialRevealDelay);
	}
  
	function navigateToSection(newIndex: number) { 
		if (get(isInitialReveal)) return; 
		const oldIndex = get(currentSectionIndex); 
		if (get(isAnimating) || newIndex === oldIndex || newIndex < 0 || newIndex >= sectionElements.length) return; 
		// Update dots immediately to animate grow/shrink during transition
		navActiveIndex.set(newIndex);
    
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
				isTransitioning.set(false);
				isLeavingHero.set(false);
				preloadManager.updateNeighborStates(newIndex);
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

	let lastScrollTime = 0;
	const scrollDebounce = 200;
	function handleWheel(event: WheelEvent) { event.preventDefault(); if (get(isInitialReveal)) return; const currentTime = Date.now(); if (currentTime - lastScrollTime < scrollDebounce || get(isAnimating)) return; lastScrollTime = currentTime; navigateToSection(get(currentSectionIndex) + (event.deltaY > 0 ? 1 : -1)); }
	function handleKeyDown(event: KeyboardEvent) { if (get(isInitialReveal) || get(isAnimating)) { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(event.key)) event.preventDefault(); return; } const currentTime = Date.now(); if (currentTime - lastScrollTime < scrollDebounce) { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(event.key)) event.preventDefault(); return; } let newIndex = get(currentSectionIndex); let shouldScroll = false; switch (event.key) { case 'ArrowDown': case 'PageDown': case ' ': newIndex++; shouldScroll = true; break; case 'ArrowUp': case 'PageUp': newIndex--; shouldScroll = true; break; case 'Home': newIndex = 0; shouldScroll = true; break; case 'End': newIndex = sectionElements.length - 1; shouldScroll = true; break; } if (shouldScroll && newIndex !== get(currentSectionIndex)) { event.preventDefault(); lastScrollTime = currentTime; navigateToSection(newIndex); } }

	// --- Mobile swipe detection (no drag-follow, swipe triggers only) ---
	let touchStartY = 0;
	let touchStartX = 0;
	let touchStartTime = 0;
	const SWIPE_DIST = 70; // px
	const SWIPE_VELOCITY = 0.35; // px/ms
	const HORIZ_DEADZONE = 60; // px, ignore if mostly horizontal

		function onTouchStart(e: TouchEvent) {
			if (!get(renderProfile).isMobile || get(isInitialReveal) || get(isAnimating)) return;
		const t = e.changedTouches[0];
		touchStartY = t.clientY;
		touchStartX = t.clientX;
		touchStartTime = performance.now();
	}
		function onTouchEnd(e: TouchEvent) {
			if (!get(renderProfile).isMobile || get(isInitialReveal) || get(isAnimating)) return;
		const t = e.changedTouches[0];
		const dy = t.clientY - touchStartY;
		const dx = t.clientX - touchStartX;
		const dt = Math.max(1, performance.now() - touchStartTime);
		if (Math.abs(dx) > HORIZ_DEADZONE) return; // likely horizontal gesture (e.g., carousels)
		const v = Math.abs(dy) / dt; // px/ms
			if (Math.abs(dy) > SWIPE_DIST || v > SWIPE_VELOCITY) {
				const dir = dy < 0 ? 1 : -1; // swipe up -> next
				mobileNavigateTo(get(currentSectionIndex) + dir, 'swipe');
			}
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
	<LoadingScreen /> 

	<div 
		class="particle-effect-layer" 
		class:initial-state={$isInitialReveal}
		class:on-top={$isLeavingHero}
		style="pointer-events: {particleLayerPointerEvents};"
		on:touchstart|passive={onTouchStart}
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
			on:touchend|passive={onTouchEnd}
		>
		<section id="hero" class="full-screen-section hero-section-container"></section>

		{#each allSectionsData.slice(1) as section, i (section.id)}
			<section 
				id={section.id} 
				class="full-screen-section"
			>
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
								emailLabel={(($page.data as any)?.messages?.common?.contact?.emailLabel) ?? undefined}
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
	</style>

  
</div>
