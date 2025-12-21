<!-- src/lib/components/AnkiCardStack.svelte -->
<!-- Interactive card stack preview for Anki Automation section -->
<!-- Replicates the exact look and interaction from the anki-demo -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { renderProfile } from '$lib/stores/renderProfile';
  import katex from 'katex';
  import 'katex/dist/katex.min.css';
  
  // Card data interface matching the demo format
  interface CardField {
    Front: string;
    Back: string;
  }
  
  interface CardData {
    fields: CardField;
    uid: string;
    tags?: string[];
  }
  
  // Props
  export let cards: CardData[] = [];
  export let isActive: boolean = false;
  
  // Local state
  let cardStackElement: HTMLElement;
  let currentCardIndex = 0;
  let cardIndices: number[] = [];
  let cardElements: HTMLElement[] = [];
  
  // Drag state matching demo implementation
  let dragState = {
    isDragging: false,
    activeCard: null as HTMLElement | null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    dragStartTime: 0
  };
  
  // Animation settings (from Figma CarouselStack - exactly as demo)
  const animationSettings = {
    springDuration: 0.3,
    springBounce: 0.3,
    xSpringDuration: 0.5,
    xSpringBounce: 0.1,
    dragElastic: 0.7,
    swipeConfidenceThreshold: 10000,
    zIndexDelay: 0.05
  };
  
  // Initialize card indices when cards change
  $: if (cards.length > 0) {
    initializeCardIndices();
  }
  
  function initializeCardIndices() {
    currentCardIndex = 0;
    const visibleCount = Math.min(4, cards.length);
    cardIndices = [];
    for (let i = 0; i < visibleCount; i++) {
      cardIndices[i] = i % cards.length;
    }
  }
  
  // Global event handlers for drag (exactly as demo)
  function handleGlobalMouseMove(e: MouseEvent) {
    if (!dragState.isDragging || !dragState.activeCard) return;
    handleDragMove(e.clientX, e.clientY);
  }
  
  function handleGlobalMouseUp() {
    if (!dragState.isDragging || !dragState.activeCard) return;
    handleDragEnd();
  }
  
  function handleGlobalTouchMove(e: TouchEvent) {
    if (!dragState.isDragging || !dragState.activeCard) return;
    const touch = e.touches[0];
    if (touch) {
      handleDragMove(touch.clientX, touch.clientY);
    }
  }
  
  function handleGlobalTouchEnd() {
    if (!dragState.isDragging || !dragState.activeCard) return;
    handleDragEnd();
  }
  
  // Handle drag move (exact same logic as demo)
  function handleDragMove(clientX: number, clientY: number) {
    const card = dragState.activeCard;
    if (!card) return;
    
    dragState.currentX = clientX;
    dragState.currentY = clientY;
    
    const offsetX = dragState.currentX - dragState.startX;
    const offsetY = dragState.currentY - dragState.startY;
    
    // Apply drag elastic (from Figma settings)
    const elasticX = offsetX * animationSettings.dragElastic;
    const elasticY = offsetY * animationSettings.dragElastic * 0.3;
    
    // Calculate slight rotation based on drag direction
    const rotationAmount = Math.min(Math.max(elasticX / 30, -15), 15);
    
    // Apply transform during drag
    card.style.transform = `scale(1) translateX(${elasticX}px) translateY(${elasticY}px) rotate(${rotationAmount}deg)`;
    card.style.zIndex = '5';
  }
  
  // Handle drag end (exact same logic as demo)
  function handleDragEnd() {
    const card = dragState.activeCard;
    if (!card) return;
    
    const offsetX = dragState.currentX - dragState.startX;
    const offsetY = dragState.currentY - dragState.startY;
    const elapsedTime = Date.now() - dragState.dragStartTime;
    
    // Calculate velocity
    const velocityX = Math.abs(offsetX) / Math.max(elapsedTime, 1) * 1000;
    const velocityY = Math.abs(offsetY) / Math.max(elapsedTime, 1) * 1000;
    
    // Calculate swipe power
    const powerX = swipePower(offsetX, velocityX);
    const powerY = swipePower(offsetY, velocityY);
    const totalPower = Math.max(Math.abs(powerX), Math.abs(powerY));
    
    // Remove dragging class
    card.classList.remove('dragging');
    card.style.cursor = 'grab';
    card.style.zIndex = '';
    
    // Check if swipe meets threshold
    if (totalPower > animationSettings.swipeConfidenceThreshold) {
      animateCardToBack(card);
    } else {
      springBackToPosition(card);
    }
    
    // Reset drag state
    dragState.isDragging = false;
    dragState.activeCard = null;
  }
  
  // Calculate swipe power (Figma formula: |offset| × velocity)
  function swipePower(offset: number, velocity: number): number {
    return Math.abs(offset) * velocity;
  }
  
  // Animate the dragged card to back position
  function animateCardToBack(card: HTMLElement) {
    // Set z-index to 0 immediately so card goes behind the stack
    card.style.zIndex = '0';
    card.classList.add('to-back');
    
    // Apply the back-of-stack transform
    card.style.transform = 'scale(0.8) translateX(62px) translateY(12px) rotate(7deg)';
    card.style.opacity = '0.85';
    
    // After animation, update all card positions together
    setTimeout(() => {
      card.classList.remove('to-back');
      card.style.transform = '';
      card.style.opacity = '';
      card.style.zIndex = '';
      paginate();
    }, 350);
  }
  
  // Spring back to original position
  function springBackToPosition(card: HTMLElement) {
    card.style.transform = '';
    card.style.opacity = '';
  }
  
  // Paginate to next card (Figma style)
  function paginate() {
    currentCardIndex = (currentCardIndex + 1) % cards.length;
    
    const visibleCount = Math.min(4, cards.length);
    cardIndices = [];
    for (let i = 0; i < visibleCount; i++) {
      cardIndices[i] = (currentCardIndex + i) % cards.length;
    }
    
    updateStackPositions();
  }
  
  // Update stack positions - CSS handles smooth animation
  function updateStackPositions() {
    if (!cardStackElement) return;
    
    const cardEls = Array.from(cardStackElement.querySelectorAll('.preview-card')) as HTMLElement[];
    const visibleCount = Math.min(4, cards.length);
    
    // Build a map of data index -> desired position
    const positionMap = new Map<number, number>();
    for (let pos = 0; pos < visibleCount; pos++) {
      positionMap.set(cardIndices[pos], pos);
    }
    
    // Track which positions are assigned
    const assignedPositions = new Set<number>();
    const cardsNeedingNewData: HTMLElement[] = [];
    
    // First pass: assign positions to cards whose data is still in view
    cardEls.forEach((card) => {
      const cardDataIndex = parseInt(card.dataset.cardIndex || '0');
      
      if (positionMap.has(cardDataIndex)) {
        const newPosition = positionMap.get(cardDataIndex)!;
        card.dataset.position = newPosition.toString();
        assignedPositions.add(newPosition);
      } else {
        cardsNeedingNewData.push(card);
      }
    });
    
    // Second pass: reassign cards whose data left the view
    cardsNeedingNewData.forEach((card) => {
      for (let pos = 0; pos < visibleCount; pos++) {
        if (!assignedPositions.has(pos)) {
          const newDataIndex = cardIndices[pos];
          card.dataset.cardIndex = newDataIndex.toString();
          card.dataset.position = pos.toString();
          assignedPositions.add(pos);
          break;
        }
      }
    });
  }
  
  // Start dragging a card
  function startDrag(card: HTMLElement, clientX: number, clientY: number) {
    if (dragState.isDragging) return;
    
    dragState.isDragging = true;
    dragState.activeCard = card;
    dragState.startX = clientX;
    dragState.startY = clientY;
    dragState.currentX = clientX;
    dragState.currentY = clientY;
    dragState.dragStartTime = Date.now();
    
    card.classList.add('dragging');
    card.style.cursor = 'grabbing';
  }
  
  // Card event handlers
  function handleCardMouseDown(e: MouseEvent, card: HTMLElement) {
    if (card.dataset.position !== '0') return;
    e.preventDefault();
    startDrag(card, e.clientX, e.clientY);
  }
  
  function handleCardTouchStart(e: TouchEvent, card: HTMLElement) {
    if (card.dataset.position !== '0') return;
    const touch = e.touches[0];
    if (touch) {
      // Store initial touch position to detect swipe vs scroll later
      dragState.startX = touch.clientX;
      dragState.startY = touch.clientY;
      startDrag(card, touch.clientX, touch.clientY);
    }
  }
  
  function handleCardTouchMove(e: TouchEvent, card: HTMLElement) {
    if (dragState.isDragging && dragState.activeCard === card) {
      e.preventDefault();
    }
  }
  
  // Prevent wheel events from propagating to section scroll
  function handleWheelOnCard(e: WheelEvent) {
    // Stop propagation to prevent section scroll when scrolling card content
    e.stopPropagation();
  }
  
  // Prevent touch scroll on card content from triggering section navigation
  // But allow horizontal swipes to bubble up for card dragging
  let contentScrollStartX = 0;
  let contentScrollStartY = 0;
  let isVerticalScroll = false;
  let hasDetectedScrollDirection = false;

  function handleContentTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    if (touch) {
      contentScrollStartX = touch.clientX;
      contentScrollStartY = touch.clientY;
      hasDetectedScrollDirection = false;
      isVerticalScroll = false;
    }
  }

  function handleContentTouchMove(e: TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;

    // Only detect direction once per touch sequence
    if (!hasDetectedScrollDirection) {
      const deltaX = Math.abs(touch.clientX - contentScrollStartX);
      const deltaY = Math.abs(touch.clientY - contentScrollStartY);
      
      // If movement is primarily vertical, it's a scroll - stop propagation
      // If primarily horizontal, it's a card swipe - allow bubbling
      if (deltaY > deltaX && deltaY > 5) {
        hasDetectedScrollDirection = true;
        isVerticalScroll = true;
        e.stopPropagation();
      } else if (deltaX > deltaY && deltaX > 5) {
        hasDetectedScrollDirection = true;
        isVerticalScroll = false;
        // Don't stop propagation - let it bubble to card drag handlers
      }
    } else if (isVerticalScroll) {
      // Direction already detected as vertical - continue stopping propagation
      e.stopPropagation();
    }
    // If horizontal swipe, don't stop propagation - let card drag happen
  }
  
  // Toggle spoiler state
  function handleSpoilerClick(e: Event) {
    const target = e.target as HTMLElement;
    if (target.classList.contains('spoiler')) {
      target.classList.toggle('revealed');
    }
  }
  
  onMount(() => {
    if (!browser) return;
    
    // Add global event listeners
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
    document.addEventListener('touchend', handleGlobalTouchEnd);
    document.addEventListener('touchcancel', handleGlobalTouchEnd);
  });
  
  onDestroy(() => {
    if (!browser) return;
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
    document.removeEventListener('touchmove', handleGlobalTouchMove);
    document.removeEventListener('touchend', handleGlobalTouchEnd);
    document.removeEventListener('touchcancel', handleGlobalTouchEnd);
  });
  
  // Render LaTeX in HTML content
  function renderLatex(html: string): string {
    if (!browser) return html;
    
    try {
      // Replace display math \[ ... \] (LaTeX syntax)
      html = html.replace(/\\\[([\s\S]*?)\\\]/g, (match, latex) => {
        try {
          return katex.renderToString(latex.trim(), {
            displayMode: true,
            throwOnError: false,
            trust: true
          });
        } catch (e) {
          console.warn('KaTeX display render error:', e);
          return match;
        }
      });
      
      // Replace display math $$...$$ (must come before inline)
      html = html.replace(/\$\$([^$]+)\$\$/g, (match, latex) => {
        try {
          return katex.renderToString(latex.trim(), {
            displayMode: true,
            throwOnError: false,
            trust: true
          });
        } catch (e) {
          console.warn('KaTeX display render error:', e);
          return match;
        }
      });
      
      // Replace inline math \( ... \) (LaTeX syntax)
      html = html.replace(/\\\(([\s\S]*?)\\\)/g, (match, latex) => {
        try {
          return katex.renderToString(latex.trim(), {
            displayMode: false,
            throwOnError: false,
            trust: true
          });
        } catch (e) {
          console.warn('KaTeX inline render error:', e);
          return match;
        }
      });
      
      // Replace inline math $...$ 
      html = html.replace(/\$([^$]+)\$/g, (match, latex) => {
        try {
          return katex.renderToString(latex.trim(), {
            displayMode: false,
            throwOnError: false,
            trust: true
          });
        } catch (e) {
          console.warn('KaTeX inline render error:', e);
          return match;
        }
      });
    } catch (e) {
      console.warn('KaTeX processing error:', e);
    }
    
    return html;
  }
  
  // Process card data with LaTeX rendering reactively
  $: processedCards = cards.map(card => ({
    ...card,
    fields: {
      Front: renderLatex(card.fields.Front),
      Back: renderLatex(card.fields.Back)
    }
  }));

  // Get visible cards based on current indices
  $: visibleCards = processedCards.length > 0 ? cardIndices.map((idx, pos) => ({
    data: processedCards[idx],
    dataIndex: idx,
    position: pos
  })) : [];
</script>

<div 
  class="card-stack-wrapper" 
  class:mobile={$renderProfile.isMobile}
  class:is-active={isActive}
>
  <div class="card-stack" bind:this={cardStackElement}>
    {#each visibleCards as { data, dataIndex, position } (dataIndex)}
      <div
        class="preview-card"
        data-position={position}
        data-card-index={dataIndex}
        on:mousedown={(e) => {
          const target = e.currentTarget as HTMLElement;
          handleCardMouseDown(e, target);
        }}
        on:touchstart={(e) => {
          const target = e.currentTarget as HTMLElement;
          handleCardTouchStart(e, target);
        }}
        on:touchmove|nonpassive={(e) => {
          const target = e.currentTarget as HTMLElement;
          handleCardTouchMove(e, target);
        }}
        on:wheel={handleWheelOnCard}
        on:click={handleSpoilerClick}
        role="button"
        tabindex={position === 0 ? 0 : -1}
        aria-label="Flashcard {dataIndex + 1} of {cards.length}"
      >
        <div class="card-face-container">
          <div class="card-half front">
            <div class="card-half-label">FRONT</div>
            <div class="card-half-content" on:wheel|stopPropagation on:touchstart={handleContentTouchStart} on:touchmove={handleContentTouchMove}>
              {@html data.fields.Front}
            </div>
            <div class="overflow-indicator">
              <span class="overflow-indicator-text">⋯ MORE CONTENT</span>
            </div>
          </div>
          <div class="card-half back">
            <div class="card-half-label">BACK</div>
            <div class="card-half-content" on:wheel|stopPropagation on:touchstart={handleContentTouchStart} on:touchmove={handleContentTouchMove}>
              {@html data.fields.Back}
            </div>
            <div class="overflow-indicator">
              <span class="overflow-indicator-text">⋯ MORE CONTENT</span>
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  /* ============================================================
     CARD STACK WRAPPER - Portfolio Integration
     ============================================================ */
  .card-stack-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    /* No background - cards sit directly on section */
  }

  .card-stack {
    position: relative;
    width: clamp(280px, 24vw, 340px);
    height: clamp(380px, 36vw, 480px);
    perspective: 400px;
    transform-style: preserve-3d;
  }

  .card-stack-wrapper.mobile .card-stack {
    width: clamp(240px, 70vw, 300px);
    height: clamp(340px, 90vw, 420px);
  }

  /* ============================================================
     PREVIEW CARD - Dark Mode (matches portfolio theme)
     ============================================================ */
  .preview-card {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #111827;
    border-radius: 16px;
    box-shadow:
      0px 35px 14px rgba(0, 0, 0, 0.05),
      0px 20px 12px rgba(0, 0, 0, 0.15),
      0px 9px 9px rgba(0, 0, 0, 0.2),
      0px 2px 5px rgba(0, 0, 0, 0.25);
    cursor: grab;
    -webkit-user-select: none;
    user-select: none;
    touch-action: none;
    overflow: hidden;
    will-change: transform, opacity;
    border: 1px solid #374151;
  }

  .preview-card:active {
    cursor: grabbing;
  }

  /* Spring transitions for smooth card movements */
  .preview-card:not(.dragging) {
    transition: 
      transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
      opacity 0.3s ease-out;
    transition-property: transform, opacity, z-index;
    transition-duration: 0.5s, 0.3s, 0s;
    transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1), ease-out, linear;
    transition-delay: 0s, 0s, 0.05s;
  }

  .preview-card.dragging {
    transition: none !important;
    cursor: grabbing;
  }

  /* Card positions in stack (0=front, 3=back) - Figma values */
  .preview-card[data-position="0"] {
    z-index: 4;
    transform: translateX(0px) translateY(0px) scale(1) rotate(0deg);
    opacity: 1;
  }

  .preview-card[data-position="1"] {
    z-index: 3;
    transform: translateX(32px) translateY(-12px) scale(0.9) rotate(2deg);
    opacity: 1;
    pointer-events: none;
  }

  .preview-card[data-position="2"] {
    z-index: 2;
    transform: translateX(48px) translateY(0px) scale(0.85) rotate(4deg);
    opacity: 1;
    pointer-events: none;
  }

  .preview-card[data-position="3"] {
    z-index: 1;
    transform: translateX(62px) translateY(12px) scale(0.8) rotate(7deg);
    opacity: 0.85;
    pointer-events: none;
  }

  .preview-card.to-back {
    z-index: 0 !important;
    transition: 
      transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
      opacity 0.3s ease-out !important;
  }

  /* ============================================================
     CARD FACE LAYOUT
     ============================================================ */
  .card-face-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }

  .card-half {
    flex: 1;
    position: relative;
    padding: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #111827;
    color: #E5E7EB;
  }

  .card-half.front {
    border-bottom: 2px solid #374151;
    border-radius: 16px 16px 0 0;
  }

  .card-half.back {
    border-radius: 0 0 16px 16px;
  }

  .card-half-label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    margin-bottom: 10px;
    opacity: 0.6;
    color: #9CA3AF;
  }

  .card-half-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    font-size: 13px;
    line-height: 1.6;
    position: relative;
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
  }

  .card-half-content::-webkit-scrollbar {
    width: 5px;
  }

  .card-half-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .card-half-content::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.3);
    border-radius: 3px;
  }

  /* ============================================================
     CARD CONTENT STYLING - Dark Mode
     ============================================================ */
  
  /* Typography */
  .card-half-content :global(p) {
    margin: 0 0 0.75em 0;
  }

  .card-half-content :global(strong),
  .card-half-content :global(b) {
    font-weight: 600;
    color: #F9FAFB;
  }

  .card-half-content :global(em),
  .card-half-content :global(i) {
    font-style: italic;
  }

  /* Lists */
  .card-half-content :global(ul),
  .card-half-content :global(ol) {
    margin: 10px 0;
    padding-left: 18px;
  }

  .card-half-content :global(li) {
    margin: 4px 0;
    line-height: 1.5;
  }

  /* Code */
  .card-half-content :global(code) {
    font-family: 'SF Mono', 'Consolas', 'Monaco', 'Menlo', monospace;
    background-color: #374151;
    color: #E5E7EB;
    padding: 2px 5px;
    border-radius: 3px;
    font-size: 0.85em;
  }

  .card-half-content :global(pre) {
    background-color: #0F172A;
    color: #E5E7EB;
    padding: 12px 14px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 10px 0;
    font-family: 'SF Mono', 'Consolas', 'Monaco', 'Menlo', monospace;
    font-size: 0.8em;
    line-height: 1.5;
  }

  .card-half-content :global(pre code) {
    background: none;
    color: inherit;
    padding: 0;
    font-size: inherit;
  }

  /* Tables */
  .card-half-content :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    background: #1F2937;
    border: 1px solid #374151;
    border-radius: 6px;
    overflow: hidden;
    font-size: 0.85em;
  }

  .card-half-content :global(th) {
    background-color: #374151;
    color: #F9FAFB;
    padding: 8px 10px;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid #4B5563;
  }

  .card-half-content :global(td) {
    padding: 6px 10px;
    border-bottom: 1px solid #374151;
    vertical-align: top;
    background-color: #1F2937;
  }

  .card-half-content :global(tr:last-child td) {
    border-bottom: none;
  }

  .card-half-content :global(tr:nth-child(even) td) {
    background-color: #263244;
  }

  /* Callout boxes */
  .card-half-content :global(.callout),
  .card-half-content :global(.info),
  .card-half-content :global(.warning),
  .card-half-content :global(.tip),
  .card-half-content :global(.error) {
    padding: 10px 12px;
    border-radius: 6px;
    margin: 10px 0;
    border-left: 3px solid;
    font-size: 0.9em;
  }

  .card-half-content :global(.info) {
    background-color: rgba(96, 165, 250, 0.1);
    border-left-color: #60A5FA;
  }

  .card-half-content :global(.warning) {
    background-color: rgba(251, 191, 36, 0.1);
    border-left-color: #F59E0B;
  }

  .card-half-content :global(.tip) {
    background-color: rgba(52, 211, 153, 0.1);
    border-left-color: #10B981;
  }

  .card-half-content :global(.error) {
    background-color: rgba(248, 113, 113, 0.1);
    border-left-color: #EF4444;
  }

  /* Badges */
  .card-half-content :global(.badge) {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.75em;
    font-weight: 500;
    margin: 2px 3px 2px 0;
    vertical-align: middle;
  }

  .card-half-content :global(.badge-cyan),
  .card-half-content :global(.badge-primary) {
    background-color: rgba(34, 211, 238, 0.2);
    color: #67E8F9;
  }

  .card-half-content :global(.badge-blue) {
    background-color: rgba(96, 165, 250, 0.2);
    color: #93C5FD;
  }

  .card-half-content :global(.badge-green),
  .card-half-content :global(.badge-success) {
    background-color: rgba(52, 211, 153, 0.2);
    color: #6EE7B7;
  }

  .card-half-content :global(.badge-amber),
  .card-half-content :global(.badge-warning) {
    background-color: rgba(251, 191, 36, 0.2);
    color: #FCD34D;
  }

  .card-half-content :global(.badge-red),
  .card-half-content :global(.badge-error) {
    background-color: rgba(248, 113, 113, 0.2);
    color: #FCA5A5;
  }

  .card-half-content :global(.badge-purple) {
    background-color: rgba(167, 139, 250, 0.2);
    color: #C4B5FD;
  }

  /* Keyboard keys */
  .card-half-content :global(kbd) {
    display: inline-block;
    padding: 2px 6px;
    font-family: 'SF Mono', 'Consolas', monospace;
    font-size: 0.8em;
    background: linear-gradient(180deg, #374151 0%, #1F2937 100%);
    color: #E5E7EB;
    border: 1px solid #4B5563;
    border-radius: 4px;
    box-shadow: 0 2px 0 #374151;
    margin: 0 2px;
    vertical-align: middle;
  }

  /* Spoiler/reveal */
  .card-half-content :global(.spoiler) {
    background-color: #374151;
    color: transparent;
    padding: 3px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-block;
    user-select: none;
    border: 1px dashed #4B5563;
    position: relative;
    min-width: 80px;
    text-align: center;
  }

  .card-half-content :global(.spoiler)::before {
    content: "👁 Reveal";
    color: #9CA3AF;
    font-size: 0.85em;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    white-space: nowrap;
    transition: opacity 0.3s ease;
  }

  .card-half-content :global(.spoiler:hover)::before,
  .card-half-content :global(.spoiler.revealed)::before {
    opacity: 0;
    pointer-events: none;
  }

  .card-half-content :global(.spoiler:hover),
  .card-half-content :global(.spoiler.revealed) {
    background-color: #4B5563;
    border-color: #6B7280;
    color: #E5E7EB;
    border-style: solid;
  }

  /* Highlights */
  .card-half-content :global(mark),
  .card-half-content :global(.highlight) {
    background-color: rgba(251, 191, 36, 0.3);
    padding: 1px 4px;
    border-radius: 3px;
    color: inherit;
  }

  .card-half-content :global(.highlight-green) {
    background-color: rgba(52, 211, 153, 0.25);
  }

  .card-half-content :global(.highlight-cyan) {
    background-color: rgba(34, 211, 238, 0.25);
  }

  .card-half-content :global(.highlight-red) {
    background-color: rgba(248, 113, 113, 0.2);
  }

  /* Yes/No markers */
  .card-half-content :global(.yes),
  .card-half-content :global(.check) {
    color: #10B981;
    font-weight: bold;
  }

  .card-half-content :global(.no),
  .card-half-content :global(.cross) {
    color: #EF4444;
    font-weight: bold;
  }

  /* Definition lists */
  .card-half-content :global(dl) {
    margin: 10px 0;
  }

  .card-half-content :global(dt) {
    font-weight: 600;
    color: #F3F4F6;
    margin-top: 8px;
  }

  .card-half-content :global(dd) {
    margin-left: 14px;
    padding: 6px 0;
    color: #9CA3AF;
    border-left: 2px solid #374151;
    padding-left: 12px;
  }

  /* Blockquote */
  .card-half-content :global(blockquote) {
    border-left: 3px solid #4B5563;
    margin: 10px 0;
    padding: 8px 14px;
    background-color: #1F2937;
    border-radius: 0 6px 6px 0;
    color: #9CA3AF;
    font-style: italic;
    font-size: 0.9em;
  }

  .card-half-content :global(blockquote cite) {
    display: block;
    margin-top: 6px;
    font-size: 0.85em;
    color: #6B7280;
    font-style: normal;
  }

  /* Links */
  .card-half-content :global(a) {
    color: #60A5FA;
    text-decoration: none;
  }

  .card-half-content :global(a:hover) {
    text-decoration: underline;
    color: #93C5FD;
  }

  /* Overflow indicator */
  .overflow-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 36px;
    background: linear-gradient(to bottom, transparent, rgba(17, 24, 39, 0.95));
    display: none;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 6px;
    pointer-events: none;
  }

  .overflow-indicator.visible {
    display: flex;
  }

  .overflow-indicator-text {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: #9CA3AF;
    opacity: 0.8;
  }

  /* ============================================================
     MOBILE ADJUSTMENTS
     ============================================================ */
  .card-stack-wrapper.mobile .preview-card[data-position="1"] {
    transform: translateX(24px) translateY(-10px) scale(0.92) rotate(2deg);
  }

  .card-stack-wrapper.mobile .preview-card[data-position="2"] {
    transform: translateX(36px) translateY(0px) scale(0.87) rotate(4deg);
  }

  .card-stack-wrapper.mobile .preview-card[data-position="3"] {
    transform: translateX(48px) translateY(10px) scale(0.82) rotate(7deg);
  }

  .card-stack-wrapper.mobile .card-half {
    padding: 12px;
  }

  .card-stack-wrapper.mobile .card-half-content {
    font-size: 11px;
  }

  .card-stack-wrapper.mobile .card-half-content :global(.badge) {
    font-size: 0.7em;
  }

  .card-stack-wrapper.mobile .card-half-content :global(table) {
    font-size: 0.75em;
  }
</style>
