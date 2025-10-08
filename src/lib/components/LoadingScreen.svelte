<!-- src/lib/components/LoadingScreen.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { overallLoadingState, initialSiteLoadComplete, minimumLoadingDuration } from '$lib/stores/preloadingStore';
  import { page } from '$app/stores';
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
    private cycleCount = 6;
    private cycleCurrent = 0;
    private chars = [
      '日','〇','ハ','ミ','ヒ','ウ','シ','ナ','モ','サ','ワ','ツ','オ','リ','ア','ホ','テ','マ','ケ','メ',
      'エ','カ','キ','ム','ユ','ラ','セ','ネ','ヲ','イ','ク','コ','ソ','タ','チ','ト','ノ','フ','ヘ',
      'ヤ','ヨ','ル','レ','ロ','∆','δ','ε','ζ','η','θ','∃','∄','∅','Д'
    ];
    private charsCount = this.chars.length;
    private letters: HTMLSpanElement[] = [];
    private letterCount = 0;
    private letterCurrent = 0;
    private animationFrameId: number | null = null;
    private originalText: string;
    private continuousMode = false;
    private overlayTimeouts = new Map<HTMLSpanElement, number>();

    constructor(element: HTMLDivElement, text: string) {
      this.originalText = text;
      this.setupLetters(element);
    }

    private setupLetters(element: HTMLDivElement) {
      element.innerHTML = '';
      this.letters = [];
      for (let i = 0; i < this.originalText.length; i++) {
        const span = document.createElement('span');
        const origChar = this.originalText[i];
        span.setAttribute('data-orig', origChar);
        span.textContent = origChar === ' ' ? '\u00A0' : origChar;
        span.classList.add('glitching');
        element.appendChild(span);
        this.letters.push(span);
      }
      this.letterCount = this.letters.length;
    }

    private getChar(): string {
      return this.chars[Math.floor(Math.random() * this.charsCount)];
    }

    public start(): void {
      this.loop();
    }
    
    private loop = (): void => {
      if (this.continuousMode) {
        // In continuous mode, randomly glitch some letters periodically
        this.letters.forEach((letter) => {
          const orig = letter.getAttribute('data-orig');
          if (!orig || orig === ' ') return;
          if (Math.random() < 0.1) {
            this.triggerOverlayGlitch(letter);
          }
        });
      } else {
        // Original progressive reveal animation
        this.letters.forEach((letter, index) => {
          if (index >= this.letterCurrent) {
            const orig = letter.getAttribute('data-orig');
            if (orig !== ' ') {
              letter.dataset.char = this.getChar();
              letter.style.opacity = String(Math.random());
            }
          }
        });

        if (this.cycleCurrent < this.cycleCount) {
          this.cycleCurrent++;
        } else if (this.letterCurrent < this.letterCount) {
          const currLetter = this.letters[this.letterCurrent];
          this.cycleCurrent = 0;
          this.resolveLetter(currLetter);
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
      this.overlayTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
      this.overlayTimeouts.clear();
      this.done = true;
    }

    private resolveLetter(letter: HTMLSpanElement) {
      this.clearOverlay(letter);
      letter.style.opacity = '1';
      letter.style.transform = 'translateX(0) scale(1)';
      letter.classList.remove('glitching');
      letter.classList.add('done');
    }

    private triggerOverlayGlitch(letter: HTMLSpanElement) {
      this.clearOverlay(letter);
      letter.dataset.char = this.getChar();
      letter.classList.add('glitching');
      letter.style.opacity = String(0.5 + Math.random() * 0.5);
      const timeoutId = window.setTimeout(() => {
        this.clearOverlay(letter);
      }, 100 + Math.random() * 200);
      this.overlayTimeouts.set(letter, timeoutId);
    }

    private clearOverlay(letter: HTMLSpanElement) {
      const timeoutId = this.overlayTimeouts.get(letter);
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        this.overlayTimeouts.delete(letter);
      }
  letter.removeAttribute('data-char');
      letter.classList.remove('glitching');
      letter.style.opacity = '1';
    }
  }

  function handleLoadingComplete() {
    if (isFadingOut) return;
    
    const elapsedTime = Date.now() - loadingStartTime;
    const remainingMinimumTime = Math.max(0, minimumLoadingDuration - elapsedTime);
    
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
    
    if (status === 'error' && textElement) {
      clearTimeout(minimumDurationTimer);
      if (tickerInstance) tickerInstance.destroy();
  const msg = (($page.data as any)?.messages?.common?.loading?.error) ?? 'ERROR LOADING';
  tickerInstance = new Ticker(textElement, msg);
      tickerInstance.start();
    }
  });

  onMount(() => {
    loadingStartTime = Date.now();
    if (!get(initialSiteLoadComplete) && textElement) {
      const msg = (($page.data as any)?.messages?.common?.loading?.loading) ?? 'LOADING...';
      tickerInstance = new Ticker(textElement, msg);
      tickerInstance.start();
    }
  });

  onDestroy(() => {
    if (tickerInstance) tickerInstance.destroy();
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
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: radial-gradient(ellipse at center, #0a1a0a 0%, #000500 100%);
    display: flex; justify-content: center; align-items: center; z-index: 10000;
    opacity: 1; transition: opacity var(--fade-duration) cubic-bezier(0.4, 0, 0.2, 1);
  }
  .loading-overlay.fade-out { opacity: 0; pointer-events: none; }
  .loading-content { position: relative; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
  .word {
    --loading-base-color: #fff;
    --loading-done-color: #6f6;
    --loading-glitch-color: var(--loading-done-color);
    color: var(--loading-base-color);
    font-family: 'Source Code Pro', 'Courier New', monospace; font-weight: 400; font-size: clamp(1.5rem, 4vw, 2.5rem); text-transform: uppercase; letter-spacing: 0.15em;
    text-shadow: 0 0 10px rgba(50, 255, 50, 0.5), 0 0 20px rgba(100, 255, 100, 0.5), 0 0 30px rgba(50, 255, 50, 0.3), 0 0 40px rgba(100, 255, 100, 0.2);
    position: relative; z-index: 2; animation: flicker 4s linear infinite;
  }
  .word :global(span) {
    position: relative; display: inline-flex; justify-content: center; align-items: center; white-space: pre; color: inherit;
    transform: translateX(100%) scale(0.9); transition: transform 500ms cubic-bezier(0.4, 0, 0.2, 1); will-change: transform, opacity;
  }
  .word :global(span)::after {
    content: attr(data-char); position: absolute; inset: 0; display: flex; justify-content: center; align-items: center;
    color: var(--loading-glitch-color); text-shadow: inherit; pointer-events: none; transform: none;
  }
  .word :global(span.glitching) { color: transparent; }
  .word :global(span.glitching)::after { transform: none; }
  .word :global(.done) { color: var(--loading-done-color); transform: translateX(0) scale(1) !important; }
  .word :global(.done:not(.glitching))::after { content: ''; }
  .scanline-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: repeating-linear-gradient( 0deg, transparent, transparent 2px, rgba(50, 255, 50, 0.03) 2px, rgba(50, 255, 50, 0.03) 4px ); background-size: 100% 4px; animation: scanline 8s linear infinite; pointer-events: none; z-index: 1; }
  .scanline-overlay::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient( 180deg, transparent 0%, rgba(50, 255, 50, 0.02) 50%, transparent 100% ); animation: scanline-move 3s linear infinite; }
  @keyframes scanline { 0% { background-position: 0 0; } 100% { background-position: 0 10px; } }
  @keyframes scanline-move { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
  @keyframes flicker { 0%, 100% { opacity: 1; } 92% { opacity: 0.95; } 94% { opacity: 1; } 96% { opacity: 0.97; } }
  @media (max-width: 640px) { .word { font-size: 1.25rem; letter-spacing: 0.1em; } }
  @media (prefers-reduced-motion: reduce) { .word :global(span) { transition: none; } .scanline-overlay, .scanline-overlay::before { animation: none; } }
</style>