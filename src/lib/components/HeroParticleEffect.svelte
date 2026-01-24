<!-- src/lib/components/HeroParticleEffect.svelte -->
<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import *  as THREE from 'three';
  import { FontLoader, type Font } from 'three/examples/jsm/loaders/FontLoader.js';
  import { Environment as ParticleEnvironment } from '$lib/three/heroParticleLogic';
  import { preloadingStore, startLoadingTask, preloadAssets, waitForLoadingAnimationReady } from '$lib/stores/preloadingStore';
  import { renderProfile } from '$lib/stores/renderProfile';
  import { prefersReducedMotion as prm } from '$lib/stores/renderProfile';
  import { get } from 'svelte/store';

  export let activeSectionIndex: number;
  export let isTransitioning: boolean = false;
  export let transitionDuration: number = 1.1;
  export let isInitialLoad: boolean = false;

  const dispatch = createEventDispatcher();

  const HERO_SECTION_LOGICAL_INDEX = 0;
  const HERO_ASSETS_TASK_ID = 'heroEffectAssets';
  const HERO_INIT_TASK_ID = 'heroEffectInitialization';

  let threeContainerElement: HTMLDivElement | undefined;
  let particleSystemInstance: ParticleEnvironment | null = null;
  let loadedFontAsset: Font | null = null;
  let loadedParticleTextureMap: THREE.Texture | null = null;
  let preloadPromise: Promise<void> | null = null;
  let instancePromise: Promise<void> | null = null;
  let isDestroyed = false;
  // Lightweight gated logger. Logs only if debug overlay is active (three consecutive 'd' presses) or if FORCE_DEBUG env flag (could be added later).
  function dlog(level: 'log' | 'warn' | 'error', ...args: any[]) {
    if (particleSystemInstance?.isDebugOverlayActive()) {
      // Prefix for easier filtering
      const prefix = '[HPE]';
      switch(level) {
        case 'log': console.log(prefix, ...args); break;
        case 'warn': console.warn(prefix, ...args); break;
        case 'error': console.error(prefix, ...args); break;
      }
    }
  }

  let isThreeJsLoopRunning = false;
  let areInteractionsBound = false;
  let animationLoopPauseTimeoutId: number | undefined;
  
  let initialOpacity = isInitialLoad ? '0' : '1';

  const FONT_ASSET_PATH = '/fonts/Inter_18pt_ExtraLight.json';
  const PARTICLE_TEXTURE_ASSET_PATH = 'https://res.cloudinary.com/dfvtkoboz/image/upload/v1605013866/particle_a64uzf.png';

  async function _preloadAssets() {
    const currentStatus = preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID);
    if (currentStatus === 'loaded' && loadedFontAsset && loadedParticleTextureMap) return;
    if (currentStatus === 'loading') return preloadPromise ?? Promise.resolve();
    if (preloadPromise) return preloadPromise;

    preloadPromise = (async () => {
      startLoadingTask(HERO_ASSETS_TASK_ID);

      try {
        await preloadAssets([FONT_ASSET_PATH, PARTICLE_TEXTURE_ASSET_PATH]);
      } catch (error) {
        dlog('error', 'Asset preloading with preloadAssets failed:', error);
        preloadingStore.updateTaskStatus(HERO_ASSETS_TASK_ID, 'error', (error as Error).message);
        return;
      }

      const manager = new THREE.LoadingManager();
      manager.onError = (url) => {
        dlog('error', `Error loading asset for Three.js: ${url}`);
        preloadingStore.updateTaskStatus(HERO_ASSETS_TASK_ID, 'error', `Failed to load ${url}`);
      };
      const fontLoader = new FontLoader(manager);
      const textureLoader = new THREE.TextureLoader(manager);

      try {
        const [font, texture] = await Promise.all([
          fontLoader.loadAsync(FONT_ASSET_PATH),
          textureLoader.loadAsync(PARTICLE_TEXTURE_ASSET_PATH)
        ]);
        loadedFontAsset = font;
        loadedParticleTextureMap = texture;
        preloadingStore.updateTaskStatus(HERO_ASSETS_TASK_ID, 'loaded');
      } catch (error) {
        dlog('error', 'Asset loading promise for Three.js failed:', error);
        if (preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID) !== 'error') {
          preloadingStore.updateTaskStatus(HERO_ASSETS_TASK_ID, 'error', 'Asset loading failed.');
        }
      }
    })().finally(() => {
      preloadPromise = null;
    });

    return preloadPromise;
  }

  async function _ensureInstanceAndStartLoop() {
    if (preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID) !== 'loaded' || !loadedFontAsset || !loadedParticleTextureMap) {
  dlog('warn', 'Assets not ready for _ensureInstanceAndStartLoop.');
      await _preloadAssets(); 
      if (preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID) !== 'loaded') return; 
    }
    if (!threeContainerElement) {
  dlog('warn', 'DOM container not ready for _ensureInstanceAndStartLoop.');
      return;
    }

    if (instancePromise) {
      await instancePromise;
    }

    if (!particleSystemInstance) {
      instancePromise = (async () => {
        preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'loading');
        try {
          const mobile = get(renderProfile).isMobile;
          const options = mobile
            ? { initialInternalScale: 0.7, maxInternalDim: 960, amountScale: 1.0, antialias: true }
            : { initialInternalScale: 1.0, maxInternalDim: 1440, amountScale: 1.0, antialias: true };

          const instance = new ParticleEnvironment(loadedFontAsset!, loadedParticleTextureMap!, threeContainerElement, options);
          if (isDestroyed) {
            instance.dispose();
            return;
          }
          particleSystemInstance = instance;
          preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'loaded');
          dlog('log', 'Created new Three.js instance.');
        } catch (error) {
          dlog('error', 'Error during ParticleEnvironment instantiation:', error);
          preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'error', 'Instantiation failed.');
          try { particleSystemInstance?.dispose(); } catch {}
          particleSystemInstance = null;
        }
      })().finally(() => {
        instancePromise = null;
      });

      await instancePromise;
      if (!particleSystemInstance) return;
    }

    if (particleSystemInstance && !particleSystemInstance.isLooping()) {
      particleSystemInstance.startAnimationLoop();
      isThreeJsLoopRunning = true;
  dlog('log', 'Three.js animation loop STARTED.');
    }
  }

  function _pauseThreeJsLoop() {
    if (particleSystemInstance && particleSystemInstance.isLooping()) {
      particleSystemInstance.stopAnimationLoop();
      isThreeJsLoopRunning = false;
  dlog('log', 'Three.js animation loop PAUSED.');
    }
  }

  function _bindInteractionEvents() {
    if (particleSystemInstance?.createParticles && !areInteractionsBound) {
      particleSystemInstance.createParticles.bindInteractionEvents();
      particleSystemInstance.createParticles.resetParticleState(); 
      areInteractionsBound = true;
  dlog('log', 'Interaction events BOUND and particle state RESET.');
    }
  }

  function _unbindInteractionEvents() {
    if (particleSystemInstance?.createParticles && areInteractionsBound) {
      particleSystemInstance.createParticles.unbindInteractionEvents();
      particleSystemInstance.createParticles.neutralizeLastMousePosition(); 
      areInteractionsBound = false;
  dlog('log', 'Interaction events UNBOUND and mouse position neutralized.');
    }
  }
  function _fadeInVisuals() {
    if (threeContainerElement) {
      if (isInitialLoad) {
        threeContainerElement.style.opacity = '0';
        requestAnimationFrame(() => {
          if (threeContainerElement) {
            threeContainerElement.style.opacity = '1';
          }
        });
      } else {
        threeContainerElement.style.opacity = '1';
      }
    }
  }

  function _fadeOutVisuals() {
    if (threeContainerElement) threeContainerElement.style.opacity = '0';
  }

  // --- EXPORTED METHODS FOR +page.svelte ---
  export async function onTransitionToHeroStart() {
  dlog('log', 'Method: onTransitionToHeroStart triggered.');
    clearTimeout(animationLoopPauseTimeoutId);
    if ($prm) {
      _unbindInteractionEvents();
      _fadeOutVisuals();
      _pauseThreeJsLoop();
      return;
    }
    await _ensureInstanceAndStartLoop();
    _fadeInVisuals();
    _unbindInteractionEvents();
  }

  export function onTransitionToHeroComplete() {
  dlog('log', 'Method: onTransitionToHeroComplete triggered.');
    if ($prm) return;
    _bindInteractionEvents();
  }

  export function onTransitionFromHeroStart() {
  dlog('log', 'Method: onTransitionFromHeroStart triggered.');
    _unbindInteractionEvents();
    _fadeOutVisuals();
    clearTimeout(animationLoopPauseTimeoutId);
    animationLoopPauseTimeoutId = window.setTimeout(() => {
      if (particleSystemInstance?.createParticles) {
        particleSystemInstance.createParticles.resetParticleState();
  dlog('log', 'Particle state RESET after fade out.');
      }
      _pauseThreeJsLoop();
    }, transitionDuration * 1000);
  }

  async function _handleSettledState() {
    if (activeSectionIndex === HERO_SECTION_LOGICAL_INDEX) {
  dlog('log', 'Settled on Hero.');
      clearTimeout(animationLoopPauseTimeoutId);
      if ($prm) {
        _unbindInteractionEvents();
        _fadeOutVisuals();
        _pauseThreeJsLoop();
        return;
      }
      await _ensureInstanceAndStartLoop();
      _fadeInVisuals();
      _bindInteractionEvents();
    } else {
  dlog('log', 'Settled off Hero.');
      _unbindInteractionEvents();
      _fadeOutVisuals();

      if (isThreeJsLoopRunning && particleSystemInstance?.isLooping() && animationLoopPauseTimeoutId === undefined) {
  dlog('log', '(SettledOff): Scheduling deferred pause and reset.');
        animationLoopPauseTimeoutId = window.setTimeout(() => {
          if (particleSystemInstance?.createParticles) {
            particleSystemInstance.createParticles.resetParticleState();
            dlog('log', '(SettledOff): Particle state RESET.');
          }
          _pauseThreeJsLoop();
          animationLoopPauseTimeoutId = undefined;
        }, transitionDuration * 1000);
      } else if (!isThreeJsLoopRunning && particleSystemInstance?.createParticles) {
  dlog('log', '(SettledOff): Loop already paused. Ensuring particle state is reset.');
        particleSystemInstance.createParticles.resetParticleState();
      }
    }
  }

  let isMountedAndInitialized = false;
  onMount(async () => {
    await tick(); 
    
    // Register the tasks this component is responsible for.
    if (!preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID)) {
      preloadingStore.registerTask(HERO_ASSETS_TASK_ID, 'pending');
    }
    if (!preloadingStore.getTaskStatus(HERO_INIT_TASK_ID)) {
      preloadingStore.registerTask(HERO_INIT_TASK_ID, 'pending');
    }

    // Wait for the loading screen animation to be running smoothly
    // before starting heavy asset loading. This prevents animation stutter.
    await waitForLoadingAnimationReady();
    if (isDestroyed) return;

    // Await the asset loading before proceeding.
    await _preloadAssets();
    isMountedAndInitialized = true;
    
    // FIX: The reactive `$: ` block won't fire for the initial state,
    // so we must manually call the state handler on mount to ensure
    // the Three.js instance is created during the loading screen phase.
    if (!isTransitioning) {
      await _handleSettledState();
    }
    
    // Only after all assets are loaded and the instance is created,
    // we signal that this component is fully ready.
    dispatch('ready');
  });

  onDestroy(() => {
    isDestroyed = true;
    clearTimeout(animationLoopPauseTimeoutId);
    _unbindInteractionEvents();
    if (particleSystemInstance?.createParticles) {
        particleSystemInstance.createParticles.resetParticleState();
    }
    _pauseThreeJsLoop();
    if (particleSystemInstance) {
      particleSystemInstance.dispose();
      particleSystemInstance = null;
  dlog('log', 'Three.js instance disposed.');
    }
    preloadPromise = null;
    instancePromise = null;
  });

  // This reactive block handles all subsequent navigation after the initial load.
  $: if (isMountedAndInitialized && typeof activeSectionIndex === 'number') {
    if (!isTransitioning) {
        _handleSettledState();
    }
  }

  // React to reduced-motion preference changes at runtime
  $: if (isMountedAndInitialized) {
    if ($prm) {
      _unbindInteractionEvents();
      _fadeOutVisuals();
      _pauseThreeJsLoop();
    } else {
      // If user turns reduced-motion off while on hero, ensure visuals are ready on next settle
      if (activeSectionIndex === HERO_SECTION_LOGICAL_INDEX && !isTransitioning) {
        _handleSettledState();
      }
    }
  }

</script>

<div
  class="hero-particle-container"
  bind:this={threeContainerElement}
  id="magic"
  aria-hidden="true"
  role="presentation"
  style="opacity: {initialOpacity}; transition: opacity {transitionDuration}s ease-in-out;"
>
</div>

<style>
  .hero-particle-container {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background-color: rgb(9 9 11);
    overflow: hidden;
    pointer-events: auto;
  }
</style>