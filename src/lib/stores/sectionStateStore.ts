// src/lib/stores/sectionStateStore.ts
import { writable } from 'svelte/store';

/**
 * Defines the possible lifecycle states for a main page section.
 * - IDLE: Not loaded, not a neighbor of the active section.
 * - PRELOADING: Assets are being fetched and/or effects are being initialized.
 * - READY: Fully prepared for a seamless transition.
 * - ACTIVE: Currently visible to the user.
 * - COOLDOWN: No longer a neighbor, can be unloaded to free resources.
 */
export type SectionState = 'IDLE' | 'PRELOADING' | 'READY' | 'ACTIVE' | 'COOLDOWN';

/**
 * A writable store that holds an array of states, one for each section
 * in the main portfolio page.
 */
export const sectionStates = writable<SectionState[]>([]);