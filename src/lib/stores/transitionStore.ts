// src/lib/stores/transitionStore.ts
import { writable } from 'svelte/store';
import { goto } from '$app/navigation';

interface TransitionState {
  visible: boolean;
  color: string;
}

const { subscribe, update } = writable<TransitionState>({
  visible: false,
  color: '#000000', // Default to black for our fade effect
});

// --- MODIFICATION: Reduced transition duration for a "snappier" feel ---
const TRANSITION_DURATION = 90; // ms

export const transitionStore = {
  subscribe,
  /**
   * Manages a smooth fade-to-black transition between routes.
   * @param href The destination URL to navigate to.
   */
  fadeToBlackAndNavigate: (href: string) => {
    // 1. Make the overlay visible to start the fade-in animation.
    update(state => ({ ...state, visible: true }));

    // 2. Wait for the fade-in animation to complete.
    setTimeout(() => {
      // 3. After the screen is black, perform the actual navigation.
      goto(href).then(() => {
        // 4. Once SvelteKit has loaded the new page, start fading out the overlay.
        // A tiny delay ensures the new page's content has started rendering.
        setTimeout(() => {
            update(state => ({ ...state, visible: false }));
        }, 50); 
      });
    }, TRANSITION_DURATION); // This duration MUST match the CSS/Svelte transition duration.
  }
};