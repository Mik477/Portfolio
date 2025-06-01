<!-- src/lib/components/LoadingScreen.svelte -->
<script lang="ts">  import { onMount, onDestroy } from 'svelte';
  import { overallLoadingState, initialSiteLoadComplete, loadingProgress, minimumLoadingDuration } from '$lib/stores/preloadingStore';
  import { get } from 'svelte/store';

  let showScreen = !get(initialSiteLoadComplete);
  let isFadingOut = false;
  let textElement: HTMLDivElement;
  let tickerInstance: Ticker | null = null;
  
  const fadeOutDuration = 800; // ms
  const fadeOutDelay = 200; // ms
  
  let loadingStartTime = Date.now();
  let minimumDurationTimer: number | undefined;
  // Ticker class for continuous matrix-like animation
  class Ticker {
    private done = false;
    private cycleCount = 8; // Increased for longer animation cycles
    private cycleCurrent = 0;
    private chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()-_=+{}|[]\\;\':"<>?,./`~'.split('');
    private charsCount = this.chars.length;
    private letters: HTMLSpanElement[] = [];
    private letterCount = 0;
    private letterCurrent = 0;
    private animationFrameId: number | null = null;
    private originalText: string;
    private continuousMode = false;

    constructor(element: HTMLDivElement, text: string, continuous = false) {
      this.originalText = text;
      this.continuousMode = continuous;
      this.setupLetters(element);
    }

    private setupLetters(element: HTMLDivElement) {
      // Clear existing content
      element.innerHTML = '';
      
      // Create spans for each character
      this.letters = [];
      for (let i = 0; i < this.originalText.length; i++) {
        const span = document.createElement('span');
        span.setAttribute('data-orig', this.originalText[i]);
        span.textContent = '-';
        span.style.display = 'inline-block';
        element.appendChild(span);
        this.letters.push(span);
      }
      
      this.letterCount = this.letters.length;
    }

    private getChar(): string {
      return this.chars[Math.floor(Math.random() * this.charsCount)];
    }    public start(continuous = false): void {
      this.continuousMode = continuous;
      this.reset();
    }

    private reset(): void {
      this.done = false;
      this.cycleCurrent = 0;
      this.letterCurrent = 0;
      
      this.letters.forEach(letter => {
        if (this.continuousMode) {
          // In continuous mode, keep letters visible
          letter.textContent = letter.getAttribute('data-orig') || '';
          letter.classList.add('done');
          letter.style.transform = 'translateX(0) scale(1)';
          letter.style.opacity = '1';
        } else {
          letter.textContent = letter.getAttribute('data-orig') || '';
          letter.classList.remove('done');
          letter.style.transform = 'translateX(100%) scale(0.9)';
          letter.style.opacity = '1';
        }
      });
      
      this.loop();
    }    private loop = (): void => {
      if (this.continuousMode) {
        // In continuous mode, randomly glitch some letters periodically
        this.letters.forEach((letter, index) => {
          const orig = letter.getAttribute('data-orig');
          if (orig !== ' ' && Math.random() < 0.1) { // 10% chance per frame
            letter.textContent = this.getChar();
            letter.style.opacity = String(0.5 + Math.random() * 0.5);
            
            // Reset back to original after a short delay
            setTimeout(() => {
              letter.textContent = orig || '';
              letter.style.opacity = '1';
            }, 100 + Math.random() * 200);
          }
        });
      } else {
        // Original progressive reveal animation
        this.letters.forEach((letter, index) => {
          if (index >= this.letterCurrent) {
            const orig = letter.getAttribute('data-orig');
            if (orig !== ' ') {
              letter.textContent = this.getChar();
              letter.style.opacity = String(Math.random());
            }
          }
        });

        if (this.cycleCurrent < this.cycleCount) {
          this.cycleCurrent++;
        } else if (this.letterCurrent < this.letterCount) {
          const currLetter = this.letters[this.letterCurrent];
          this.cycleCurrent = 0;
          currLetter.textContent = currLetter.getAttribute('data-orig') || '';
          currLetter.style.opacity = '1';
          currLetter.style.transform = 'translateX(0) scale(1)';
          currLetter.classList.add('done');
          this.letterCurrent++;
        } else {
          this.done = true;
          // Switch to continuous mode after initial reveal
          this.continuousMode = true;
          this.done = false;
        }
      }

      if (!this.done) {
        this.animationFrameId = requestAnimationFrame(this.loop);
      }
    };

    public destroy(): void {
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      this.done = true;
    }
  }
  function startLoadingAnimation() {
    if (!textElement) return;
    
    // Destroy previous ticker if exists
    if (tickerInstance) {
      tickerInstance.destroy();
    }
    
    // Create new ticker with "LOADING..." text
    tickerInstance = new Ticker(textElement, "LOADING...");
    tickerInstance.start(); // No callback needed, continuous animation
  }

  function handleLoadingComplete() {
    if (isFadingOut) return;
    
    const elapsedTime = Date.now() - loadingStartTime;
    const remainingMinimumTime = Math.max(0, minimumLoadingDuration - elapsedTime);
    
    // Wait for minimum duration before fading out
    minimumDurationTimer = setTimeout(() => {
      if (tickerInstance) {
        tickerInstance.destroy();
      }
      isFadingOut = true;
      
      setTimeout(() => {
        showScreen = false;
      }, fadeOutDuration + fadeOutDelay);
    }, remainingMinimumTime);
  }

  const unsubInitialLoad = initialSiteLoadComplete.subscribe(completed => {
    if (completed && showScreen && !isFadingOut) {
      handleLoadingComplete();
    }
  });
  const unsubOverallState = overallLoadingState.subscribe(status => {
    if (get(initialSiteLoadComplete)) return;
    
    if (status === 'error') {
      clearTimeout(minimumDurationTimer);
      
      // Show error state
      if (tickerInstance) {
        tickerInstance.destroy();
      }
      if (textElement) {
        tickerInstance = new Ticker(textElement, "ERROR LOADING");
        tickerInstance.start();
      }
    }
  });
  onMount(() => {
    loadingStartTime = Date.now();
    
    if (!get(initialSiteLoadComplete) && textElement) {
      // Start the loading animation
      startLoadingAnimation();
    }
  });

  onDestroy(() => {
    if (tickerInstance) {
      tickerInstance.destroy();
    }
    clearTimeout(minimumDurationTimer);
    unsubOverallState();
    unsubInitialLoad();
  });
</script>

{#if showScreen}
  <div class="loading-overlay" class:fade-out={isFadingOut} style="--fade-duration: {fadeOutDuration}ms;">
    <div class="loading-content">
      <div class="word" bind:this={textElement}></div>
      <div class="scanline-overlay"></div>
    </div>
  </div>
{/if}

<style>
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: radial-gradient(ellipse at center, #0a1a0a 0%, #000500 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    opacity: 1;
    transition: opacity var(--fade-duration) cubic-bezier(0.4, 0, 0.2, 1);
  }

  .loading-overlay.fade-out {
    opacity: 0;
    pointer-events: none;
  }

  .loading-content {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .word {
    color: #fff;
    font-family: 'Source Code Pro', 'Courier New', monospace;
    font-weight: 400;
    font-size: clamp(1.5rem, 4vw, 2.5rem);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    text-shadow: 
      0 0 10px rgba(50, 255, 50, 0.5), 
      0 0 20px rgba(100, 255, 100, 0.5),
      0 0 30px rgba(50, 255, 50, 0.3),
      0 0 40px rgba(100, 255, 100, 0.2);
    position: relative;
    z-index: 2;
  }

  .word :global(span) {
    display: inline-block;
    transform: translateX(100%) scale(0.9);
    transition: transform 500ms cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform, opacity;
  }

  .word :global(.done) {
    color: #6f6;
    transform: translateX(0) scale(1) !important;
  }

  .scanline-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(50, 255, 50, 0.03) 2px,
        rgba(50, 255, 50, 0.03) 4px
      );
    background-size: 100% 4px;
    animation: scanline 8s linear infinite;
    pointer-events: none;
    z-index: 1;
  }

  .scanline-overlay::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(50, 255, 50, 0.02) 50%,
      transparent 100%
    );
    animation: scanline-move 3s linear infinite;
  }

  @keyframes scanline {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 0 10px;
    }
  }

  @keyframes scanline-move {
    0% {
      transform: translateY(-100%);
    }
    100% {
      transform: translateY(100%);
    }
  }

  /* Add subtle flicker effect */
  @keyframes flicker {
    0%, 100% {
      opacity: 1;
    }
    92% {
      opacity: 0.95;
    }
    94% {
      opacity: 1;
    }
    96% {
      opacity: 0.97;
    }
  }

  .word {
    animation: flicker 4s linear infinite;
  }

  /* Mobile optimizations */
  @media (max-width: 640px) {
    .word {
      font-size: 1.25rem;
      letter-spacing: 0.1em;
    }
  }

  /* Reduced motion preference */
  @media (prefers-reduced-motion: reduce) {
    .word :global(span) {
      transition: none;
    }
    .scanline-overlay,
    .scanline-overlay::before {
      animation: none;
    }
  }
</style>