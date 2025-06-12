// src/lib/stores/transitionStore.ts
import { writable } from 'svelte/store';
import type { Flip } from 'gsap/Flip';

// This type will hold the state captured by GSAP's Flip plugin.
export type TransitionState = {
  // FIX: Replaced 'any' with the specific 'Flip.FlipState' type from GSAP.
  // We use 'type Flip' to import only the type information, which is efficient.
  fromState: Flip.FlipState; 
  cardId: string | null;
} | null;

/**
 * A globally accessible Svelte store to pass the animation state
 * from the main page to the project subpage during navigation.
 */
export const transitionStore = writable<TransitionState>(null);