<!-- src/lib/components/HeroParticleEffect.svelte -->
<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import *  as THREE from 'three';
  import { FontLoader, type Font } from 'three/examples/jsm/loaders/FontLoader.js';
  import { Environment as ParticleEnvironment } from '$lib/three/heroParticleLogic';
  // FIX: Import the new generic preloadAssets function
  import { preloadingStore, startLoadingTask, preloadAssets } from '$lib/stores/preloadingStore';

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

  let isThreeJsLoopRunning = false;
  let areInteractionsBound = false;
  let animationLoopPauseTimeoutId: number | undefined;
  
  let initialOpacity = isInitialLoad ? '0' : '1';

  const FONT_ASSET_PATH = '/fonts/Inter_18pt_ExtraLight.json';
  const PARTICLE_TEXTURE_ASSET_PATH = 'https://res.cloudinary.com/dfvtkoboz/image/upload/v1605013866/particle_a64uzf.png';

  async function _preloadAssets() {
    const currentStatus = preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID);
    if (currentStatus === 'loaded' && loadedFontAsset && loadedParticleTextureMap) return;
    if (currentStatus === 'loading') return;

    startLoadingTask(HERO_ASSETS_TASK_ID);

    // FIX: Use the new generic preloader to manage asset status centrally.
    try {
      await preloadAssets([FONT_ASSET_PATH, PARTICLE_TEXTURE_ASSET_PATH]);
    } catch (error) {
      console.error("HPE: Asset preloading with preloadAssets failed:", error);
      preloadingStore.updateTaskStatus(HERO_ASSETS_TASK_ID, 'error', (error as Error).message);
      return;
    }

    // Still use a local LoadingManager to know when assets are ready for *this component*.
    const manager = new THREE.LoadingManager();
    manager.onLoad = () => preloadingStore.updateTaskStatus(HERO_ASSETS_TASK_ID, 'loaded');
    manager.onError = (url) => {
      console.error(`HPE: Error loading asset for Three.js: ${url}`);
      preloadingStore.updateTaskStatus(HERO_ASSETS_TASK_ID, 'error', `Failed to load ${url}`);
    };
    const fontLoader = new FontLoader(manager);
    const textureLoader = new THREE.TextureLoader(manager);

    try {
      // Use the loaders, which will now pull from the browser cache thanks to preloadAssets.
      const [font, texture] = await Promise.all([
        fontLoader.loadAsync(FONT_ASSET_PATH),
        textureLoader.loadAsync(PARTICLE_TEXTURE_ASSET_PATH)
      ]);
      loadedFontAsset = font;
      loadedParticleTextureMap = texture;
    } catch (error) {
      console.error("HPE: Asset loading promise for Three.js failed:", error);
      if (preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID) !== 'error') {
        preloadingStore.updateTaskStatus(HERO_ASSETS_TASK_ID, 'error', 'Asset loading failed.');
      }
    }
  }

  async function _ensureInstanceAndStartLoop() {
    if (preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID) !== 'loaded' || !loadedFontAsset || !loadedParticleTextureMap) {
      console.warn("HPE: Assets not ready for _ensureInstanceAndStartLoop.");
      await _preloadAssets(); 
      if (preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID) !== 'loaded') return; 
    }
    if (!threeContainerElement) {
      console.warn("HPE: DOM container not ready for _ensureInstanceAndStartLoop.");
      return;
    }

    if (!particleSystemInstance) {
      preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'loading');
      try {
        particleSystemInstance = new ParticleEnvironment(loadedFontAsset!, loadedParticleTextureMap!, threeContainerElement);
        preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'loaded');
        console.log("HPE: Created new Three.js instance.");
      } catch (error) {
        console.error("HPE: Error during ParticleEnvironment instantiation:", error);
        preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'error', 'Instantiation failed.');
        particleSystemInstance = null;
        return;
      }
    }

    if (particleSystemInstance && !particleSystemInstance.isLooping()) {
      particleSystemInstance.startAnimationLoop();
      isThreeJsLoopRunning = true;
      console.log("HPE: Three.js animation loop STARTED.");
    }
  }

  function _pauseThreeJsLoop() {
    if (particleSystemInstance && particleSystemInstance.isLooping()) {
      particleSystemInstance.stopAnimationLoop();
      isThreeJsLoopRunning = false;
      console.log("HPE: Three.js animation loop PAUSED.");
    }
  }

  function _bindInteractionEvents() {
    if (particleSystemInstance?.createParticles && !areInteractionsBound) {
      particleSystemInstance.createParticles.bindInteractionEvents();
      particleSystemInstance.createParticles.resetParticleState(); 
      areInteractionsBound = true;
      console.log("HPE: Interaction events BOUND and particle state RESET.");
    }
  }

  function _unbindInteractionEvents() {
    if (particleSystemInstance?.createParticles && areInteractionsBound) {
      particleSystemInstance.createParticles.unbindInteractionEvents();
      particleSystemInstance.createParticles.neutralizeLastMousePosition(); 
      areInteractionsBound = false;
      console.log("HPE: Interaction events UNBOUND and mouse position neutralized.");
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
    console.log("HPE Method: onTransitionToHeroStart triggered.");
    clearTimeout(animationLoopPauseTimeoutId);
    await _ensureInstanceAndStartLoop();
    _fadeInVisuals();
    _unbindInteractionEvents();
  }

  export function onTransitionToHeroComplete() {
    console.log("HPE Method: onTransitionToHeroComplete triggered.");
    _bindInteractionEvents();
  }

  export function onTransitionFromHeroStart() {
    console.log("HPE Method: onTransitionFromHeroStart triggered.");
    _unbindInteractionEvents();
    _fadeOutVisuals();
    clearTimeout(animationLoopPauseTimeoutId);
    animationLoopPauseTimeoutId = window.setTimeout(() => {
      if (particleSystemInstance?.createParticles) {
        particleSystemInstance.createParticles.resetParticleState();
        console.log("HPE: Particle state RESET after fade out.");
      }
      _pauseThreeJsLoop();
    }, transitionDuration * 1000);
  }

  async function _handleSettledState() {
    if (activeSectionIndex === HERO_SECTION_LOGICAL_INDEX) {
      console.log("HPE: Settled on Hero.");
      clearTimeout(animationLoopPauseTimeoutId);
      await _ensureInstanceAndStartLoop();
      _fadeInVisuals();
      _bindInteractionEvents();
    } else {
      console.log("HPE: Settled off Hero.");
      _unbindInteractionEvents();
      _fadeOutVisuals();

      if (isThreeJsLoopRunning && particleSystemInstance?.isLooping() && animationLoopPauseTimeoutId === undefined) {
        console.log("HPE (SettledOff): Scheduling deferred pause and reset.");
        animationLoopPauseTimeoutId = window.setTimeout(() => {
          if (particleSystemInstance?.createParticles) {
            particleSystemInstance.createParticles.resetParticleState();
            console.log("HPE (SettledOff): Particle state RESET.");
          }
          _pauseThreeJsLoop();
          animationLoopPauseTimeoutId = undefined;
        }, transitionDuration * 1000);
      } else if (!isThreeJsLoopRunning && particleSystemInstance?.createParticles) {
        console.log("HPE (SettledOff): Loop already paused. Ensuring particle state is reset.");
        particleSystemInstance.createParticles.resetParticleState();
      }
    }
  }

  let isMountedAndInitialized = false;
  onMount(async () => {
    await tick(); 
    if (!preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID)) {
      preloadingStore.registerTask(HERO_ASSETS_TASK_ID, 'pending');
    }
    if (!preloadingStore.getTaskStatus(HERO_INIT_TASK_ID)) {
      preloadingStore.registerTask(HERO_INIT_TASK_ID, 'pending');
    }
    await _preloadAssets();
    isMountedAndInitialized = true;

    dispatch('ready');
    
    if (!isTransitioning && !isInitialLoad) {
      _handleSettledState();
    }
  });

  onDestroy(() => {
    clearTimeout(animationLoopPauseTimeoutId);
    _unbindInteractionEvents();
    if (particleSystemInstance?.createParticles) {
        particleSystemInstance.createParticles.resetParticleState();
    }
    _pauseThreeJsLoop();
    if (particleSystemInstance) {
      particleSystemInstance.dispose();
      particleSystemInstance = null;
      console.log("HPE: Three.js instance disposed.");
    }
  });

  $: if (isMountedAndInitialized && typeof activeSectionIndex === 'number') {
    if (!isTransitioning) {
        _handleSettledState();
    }
  }

</script>

<div
  class="hero-particle-container"
  bind:this={threeContainerElement}
  id="magic"
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