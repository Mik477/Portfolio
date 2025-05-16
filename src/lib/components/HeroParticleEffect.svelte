<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import * as THREE from 'three';
  import { FontLoader, type Font } from 'three/examples/jsm/loaders/FontLoader.js';
  import { 
    Environment as ParticleEnvironment,
  } from '$lib/three/heroParticleLogic'; // Ensure this path is correct

  export let activeSectionIndex: number;
  
  const HERO_SECTION_LOGICAL_INDEX = 0; 

  let threeContainerElement: HTMLDivElement | undefined;
  let loadingOverlayElement: HTMLDivElement | undefined;

  let particleSystemInstance: ParticleEnvironment | null = null;
  let loadedFontAsset: Font | null = null;
  let loadedParticleTextureMap: THREE.Texture | null = null;
  
  let assetsArePreloaded = false;
  let assetsAreLoading = false;
  let effectIsVisiblyRunning = false; 

  const FONT_ASSET_PATH = '/fonts/Inter_18pt_ExtraLight.json';
  const PARTICLE_TEXTURE_ASSET_PATH = 'https://res.cloudinary.com/dfvtkoboz/image/upload/v1605013866/particle_a64uzf.png';

  function showLoadingOverlay() {
    if (loadingOverlayElement) {
        loadingOverlayElement.style.display = 'flex';
        loadingOverlayElement.classList.remove('hidden-overlay'); 
        loadingOverlayElement.style.opacity = '1';
    }
  }

  function hideLoadingOverlay() {
    if (loadingOverlayElement && loadingOverlayElement.style.display !== 'none') {
        setTimeout(() => { 
            if (loadingOverlayElement) {
                loadingOverlayElement.classList.add('hidden-overlay');
                setTimeout(() => {
                    if (loadingOverlayElement) loadingOverlayElement.style.display = 'none';
                }, 800); 
            }
        }, 100); 
    }
  }

  async function preloadEffectAssets() {
    if (assetsArePreloaded || assetsAreLoading) return;
    
    assetsAreLoading = true;
    showLoadingOverlay();
    console.log("HeroParticleEffect: Preloading assets...");

    const manager = new THREE.LoadingManager();
    manager.onLoad = () => {
      console.log("HeroParticleEffect: Assets loaded by manager.");
      assetsArePreloaded = true;
      assetsAreLoading = false;
    };
    manager.onError = (url) => {
      console.error(`HeroParticleEffect: Error loading asset: ${url}`);
      assetsAreLoading = false;
      assetsArePreloaded = false; 
      hideLoadingOverlay();
    };

    const fontLoader = new FontLoader(manager);
    const textureLoader = new THREE.TextureLoader(manager);

    try {
      loadedFontAsset = await fontLoader.loadAsync(FONT_ASSET_PATH);
      console.log("HeroParticleEffect: Font loaded.");
      loadedParticleTextureMap = await textureLoader.loadAsync(PARTICLE_TEXTURE_ASSET_PATH);
      console.log("HeroParticleEffect: Particle texture loaded.");
    } catch (error) {
      console.error("HeroParticleEffect: Asset loading failed:", error);
    }
  }

  function initializeAndRunEffect() {
    if (!assetsArePreloaded || !threeContainerElement || !loadedFontAsset || !loadedParticleTextureMap) {
      console.warn("HeroParticleEffect: Cannot initialize, prerequisites not met.", {
        assetsArePreloaded, 
        containerReady: !!threeContainerElement, 
        fontReady: !!loadedFontAsset, 
        textureReady: !!loadedParticleTextureMap
      });
      if (assetsAreLoading) {
        console.log("HeroParticleEffect: Assets are still loading. Will try again once loaded.");
      } else if (!assetsArePreloaded) {
        console.log("HeroParticleEffect: Assets failed to load or not yet loaded. Cannot initialize.");
        hideLoadingOverlay(); 
      }
      return;
    }

    if (particleSystemInstance) { 
      if (!particleSystemInstance.isLooping()) { 
        particleSystemInstance.startAnimationLoop();
      }
      if (particleSystemInstance.createParticles) {
        particleSystemInstance.createParticles.bindInteractionEvents(); // Ensure events are bound
        particleSystemInstance.createParticles.resetParticleState(); 
        console.log("HeroParticleEffect: Reset particle state and bound events on resume.");
      }
      effectIsVisiblyRunning = true; 
      if (threeContainerElement) threeContainerElement.style.opacity = '1';
      hideLoadingOverlay(); 
      return;
    }

    console.log("HeroParticleEffect: Initializing ParticleEnvironment for the first time...");
    particleSystemInstance = new ParticleEnvironment(loadedFontAsset, loadedParticleTextureMap, threeContainerElement);
    
    // After new ParticleEnvironment, createParticles is instantiated, so we can bind events.
    if (particleSystemInstance.createParticles) {
        particleSystemInstance.createParticles.bindInteractionEvents();
        console.log("HeroParticleEffect: Bound interaction events after first-time init.");
    }

    effectIsVisiblyRunning = true; 
    if (threeContainerElement) {
        threeContainerElement.style.opacity = '0'; 
        requestAnimationFrame(() => { 
            if (threeContainerElement) threeContainerElement.style.opacity = '1';
        });
    }
    console.log("HeroParticleEffect: Effect initialized and running.");
    hideLoadingOverlay(); 
  }

  function pauseEffectLogic() {
    if (particleSystemInstance && effectIsVisiblyRunning) {
      particleSystemInstance.stopAnimationLoop();
      if (particleSystemInstance.createParticles) {
        particleSystemInstance.createParticles.unbindInteractionEvents(); // Unbind events on pause
        console.log("HeroParticleEffect: Unbound interaction events on pause.");
      }
      effectIsVisiblyRunning = false; 
      if (threeContainerElement) threeContainerElement.style.opacity = '0'; 
      console.log("HeroParticleEffect: Effect paused.");
    }
  }

  function destroyEffectLogic() {
    if (particleSystemInstance) {
      console.log("HeroParticleEffect: Destroying ParticleEnvironment...");
      // Ensure events are unbound and loop is stopped before full disposal
      if (particleSystemInstance.createParticles) {
        particleSystemInstance.createParticles.unbindInteractionEvents();
      }
      particleSystemInstance.stopAnimationLoop(); // Explicitly stop loop
      
      particleSystemInstance.dispose();
      particleSystemInstance = null;
      effectIsVisiblyRunning = false; 
      console.log("HeroParticleEffect: Effect destroyed.");
    }
  }
  
  onMount(async () => {
    if (loadingOverlayElement) {
        loadingOverlayElement.style.opacity = '0';
        loadingOverlayElement.style.display = 'none';
        loadingOverlayElement.classList.add('hidden-overlay');
    }
  });

  onDestroy(() => {
    destroyEffectLogic();
    loadedFontAsset = null;
    loadedParticleTextureMap = null;
    assetsArePreloaded = false;
    assetsAreLoading = false;
  });

  $: if (typeof activeSectionIndex === 'number') { 
    (async () => { 
        while (!threeContainerElement || !loadingOverlayElement) {
            if (typeof window === 'undefined') return; 
            await tick(); 
        }

        // console.log(`HeroParticleEffect: Index: ${activeSectionIndex}, Preloaded: ${assetsArePreloaded}, Loading: ${assetsAreLoading}, Instance: ${!!particleSystemInstance}, Running: ${effectIsVisiblyRunning}`);
        
        if (activeSectionIndex === HERO_SECTION_LOGICAL_INDEX) { 
            if (!assetsArePreloaded) { 
                if (!assetsAreLoading) { 
                    await preloadEffectAssets(); 
                }
            }
            
            if (assetsArePreloaded) {
                if (activeSectionIndex === HERO_SECTION_LOGICAL_INDEX) { // Re-check index after await
                    if (!particleSystemInstance || !effectIsVisiblyRunning) {
                        initializeAndRunEffect(); 
                    } else if (particleSystemInstance && effectIsVisiblyRunning) {
                        // If already running and on hero, ensure events are bound (might have been unbound by quick nav)
                        // and reset state. initializeAndRunEffect handles this if instance exists.
                        initializeAndRunEffect();
                    }
                }
            } else if (!assetsAreLoading) { 
                console.warn("HeroParticleEffect: Hero active, but assets not loaded and not loading.");
            }

        } else if (activeSectionIndex === HERO_SECTION_LOGICAL_INDEX + 1) { 
            if (particleSystemInstance && effectIsVisiblyRunning) {
                pauseEffectLogic();
            } else if (!particleSystemInstance) { 
                if (!assetsArePreloaded && !assetsAreLoading) {
                    console.log("HeroParticleEffect: Pre-loading for potential scroll to Hero (section 1).");
                    await preloadEffectAssets();
                }
                if (activeSectionIndex === HERO_SECTION_LOGICAL_INDEX + 1 && assetsArePreloaded && !particleSystemInstance) {
                    console.log("HeroParticleEffect: Pre-initializing instance then pausing (section 1).");
                    initializeAndRunEffect(); 
                    await tick(); 
                    if (activeSectionIndex === HERO_SECTION_LOGICAL_INDEX + 1 && particleSystemInstance) {
                       pauseEffectLogic(); 
                    }
                }
            }
        } else if (activeSectionIndex >= HERO_SECTION_LOGICAL_INDEX + 2) { 
            if (particleSystemInstance) {
                destroyEffectLogic();
            }
        }
    })();
  }

</script>

<div 
  class="hero-particle-container" 
  bind:this={threeContainerElement} 
  id="magic"
>
  <!-- Three.js canvas will be appended here by heroParticleLogic.ts -->
</div>

<div 
  class="hero-loading-overlay" 
  bind:this={loadingOverlayElement}
  id="loading-overlay-particles" 
>
  <p>Loading Experience...</p>
</div>

<style>
  .hero-particle-container {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background-color: transparent;
    opacity: 0; 
    transition: opacity 0.5s ease-in-out;
    overflow: hidden;
    /* Ensure it can receive mouse events for interaction */
    pointer-events: auto; 
  }

  .hero-loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #111;
    color: white;
    display: none; 
    justify-content: center;
    align-items: center;
    font-size: 1.5rem;
    z-index: 10000; 
    opacity: 1;
    transition: opacity 0.8s ease-out;
  }

  .hero-loading-overlay.hidden-overlay {
    opacity: 0;
  }
</style>