<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import * as THREE from 'three';
  import { FontLoader, type Font } from 'three/examples/jsm/loaders/FontLoader.js';
  import { 
    Environment as ParticleEnvironment,
  } from '$lib/three/heroParticleLogic';
  import { preloadingStore, startLoadingTask } from '$lib/stores/preloadingStore';

  export let activeSectionIndex: number;
  export let isTransitioning: boolean = false;
  export let transitionDuration: number = 1.1;
  
  const HERO_SECTION_LOGICAL_INDEX = 0; 
  const HERO_ASSETS_TASK_ID = 'heroEffectAssets';
  const HERO_INIT_TASK_ID = 'heroEffectInitialization';

  let threeContainerElement: HTMLDivElement | undefined;
  let particleSystemInstance: ParticleEnvironment | null = null;
  let loadedFontAsset: Font | null = null;
  let loadedParticleTextureMap: THREE.Texture | null = null;
  
  let effectIsVisiblyRunning = false;
  let isVisible = false;
  let opacityTransitionTimeout: number | undefined;

  const FONT_ASSET_PATH = '/fonts/Inter_18pt_ExtraLight.json';
  const PARTICLE_TEXTURE_ASSET_PATH = 'https://res.cloudinary.com/dfvtkoboz/image/upload/v1605013866/particle_a64uzf.png';

  async function preloadEffectAssets() {
    const currentStatus = preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID);
    if (currentStatus === 'loaded') {
        if (!loadedFontAsset || !loadedParticleTextureMap) {
            // Assets marked loaded globally, but not in this instance's vars yet.
        } else {
            return; // Already loaded and local vars populated
        }
    }
    if (currentStatus === 'loading') return; 
    
    startLoadingTask(HERO_ASSETS_TASK_ID);

    const manager = new THREE.LoadingManager();
    manager.onLoad = () => {
      preloadingStore.updateTaskStatus(HERO_ASSETS_TASK_ID, 'loaded');
    };
    manager.onError = (url) => {
      console.error(`HeroParticleEffect: Error loading asset: ${url}`);
      preloadingStore.updateTaskStatus(HERO_ASSETS_TASK_ID, 'error', `Failed to load ${url}`);
    };

    const fontLoader = new FontLoader(manager);
    const textureLoader = new THREE.TextureLoader(manager);

    try {
      loadedFontAsset = await fontLoader.loadAsync(FONT_ASSET_PATH);
      loadedParticleTextureMap = await textureLoader.loadAsync(PARTICLE_TEXTURE_ASSET_PATH);
    } catch (error) {
      console.error("HeroParticleEffect: Asset loading promise failed:", error);
      if (preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID) !== 'error') {
        preloadingStore.updateTaskStatus(HERO_ASSETS_TASK_ID, 'error', 'Asset loading promise failed.');
      }
    }
  }

  function initializeOrResumeEffect() {
    const assetsStatus = preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID);
    if (assetsStatus !== 'loaded') {
      console.warn("HeroParticleEffect: Assets not loaded. Cannot initialize.", { assetsStatus });
      return;
    }

    if (!threeContainerElement || !loadedFontAsset || !loadedParticleTextureMap) {
      console.warn("HeroParticleEffect: Cannot initialize, DOM or asset prerequisites not met.");
      preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'error', 'DOM/asset prerequisites missing for init.');
      return;
    }

    if (particleSystemInstance) { 
      // Instance exists, resume it
      if (!particleSystemInstance.isLooping()) { 
        particleSystemInstance.startAnimationLoop();
      }
      if (particleSystemInstance.createParticles) {
        particleSystemInstance.createParticles.bindInteractionEvents();
        particleSystemInstance.createParticles.resetParticleState(); 
      }
      effectIsVisiblyRunning = true;
      console.log("HeroParticleEffect: Resumed existing instance");
      
      if (preloadingStore.getTaskStatus(HERO_INIT_TASK_ID) !== 'loaded') {
        preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'loaded');
      }
      return;
    }

    // First-time initialization
    preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'loading');
    try {
      particleSystemInstance = new ParticleEnvironment(loadedFontAsset, loadedParticleTextureMap, threeContainerElement);
      
      if (particleSystemInstance.createParticles) {
          particleSystemInstance.createParticles.bindInteractionEvents();
      }
      preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'loaded');
      effectIsVisiblyRunning = true;
      console.log("HeroParticleEffect: Created new instance");
    } catch (error) {
      console.error("HeroParticleEffect: Error during ParticleEnvironment instantiation:", error);
      preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'error', 'Failed to instantiate ParticleEnvironment.');
      particleSystemInstance = null;
    }
  }

  function pauseEffect() {
    if (particleSystemInstance && effectIsVisiblyRunning) {
      particleSystemInstance.stopAnimationLoop();
      if (particleSystemInstance.createParticles) {
        particleSystemInstance.createParticles.unbindInteractionEvents();
      }
      effectIsVisiblyRunning = false; 
      console.log("HeroParticleEffect: Effect paused");
    }
  }

  function showEffect() {
    if (!isVisible) {
      isVisible = true;
      if (threeContainerElement) {
        // First set display to block
        threeContainerElement.style.display = 'block';
        // Force reflow to ensure display change is applied
        void threeContainerElement.offsetWidth;
        // Then fade in
        threeContainerElement.style.opacity = '1';
      }
    }
  }

  function hideEffect() {
    if (isVisible) {
      isVisible = false;
      if (threeContainerElement) {
        // First fade out
        threeContainerElement.style.opacity = '0';
        // Then set display none after transition
        if (opacityTransitionTimeout) clearTimeout(opacityTransitionTimeout);
        opacityTransitionTimeout = setTimeout(() => {
          if (threeContainerElement && !isVisible) {
            threeContainerElement.style.display = 'none';
          }
        }, transitionDuration * 1000);
      }
    }
  }
  
  onMount(async () => {
    await tick(); 
    if (!preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID)) {
        preloadingStore.registerTask(HERO_ASSETS_TASK_ID, 'pending');
    }
    if (!preloadingStore.getTaskStatus(HERO_INIT_TASK_ID)) {
        preloadingStore.registerTask(HERO_INIT_TASK_ID, 'pending');
    }
    
    // Always preload assets on mount for faster transitions
    await preloadEffectAssets();
  });

  onDestroy(() => {
    if (opacityTransitionTimeout) clearTimeout(opacityTransitionTimeout);
    
    // Clean disposal on component destroy
    if (particleSystemInstance) {
      pauseEffect();
      particleSystemInstance.dispose();
      particleSystemInstance = null;
    }
  });

  // Main reactive block for managing effect state based on section index
  $: if (typeof activeSectionIndex === 'number' && typeof window !== 'undefined') {
    (async () => {
      // Wait for container element
      while (!threeContainerElement) {
        await tick();
      }

      if (activeSectionIndex === HERO_SECTION_LOGICAL_INDEX) {
        // On hero section - show and activate
        
        // If transitioning to hero, synchronize the fade-in
        if (isTransitioning) {
          // Start showing immediately when transition starts
          showEffect();
        } else {
          // Not transitioning, show immediately
          showEffect();
        }
        
        // Initialize or resume the effect
        const currentAssetStatus = preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID);
        if (currentAssetStatus === 'loaded') {
          await initializeOrResumeEffect();
        } else if (currentAssetStatus !== 'loading') {
          // Need to load assets first
          await preloadEffectAssets();
          // Check again after loading attempt
          if (preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID) === 'loaded') {
            await initializeOrResumeEffect();
          }
        }
        
      } else {
        // Not on hero section - hide and pause
        
        // If transitioning away from hero, start fade immediately
        if (isTransitioning && effectIsVisiblyRunning) {
          hideEffect();
        }
        
        // Pause the effect (but keep instance alive)
        pauseEffect();
        
        // If not transitioning and still visible, hide it
        if (!isTransitioning && isVisible) {
          hideEffect();
        }
      }
    })();
  }
</script>

<div 
  class="hero-particle-container" 
  bind:this={threeContainerElement} 
  id="magic"
  style="display: none; opacity: 0; transition: opacity {transitionDuration}s ease-in-out;"
>
  <!-- Three.js canvas will be appended here by heroParticleLogic.ts -->
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