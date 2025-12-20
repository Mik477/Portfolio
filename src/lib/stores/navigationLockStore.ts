// src/lib/stores/navigationLockStore.ts
/**
 * Global Navigation Lock Store
 * 
 * This store provides a mechanism to temporarily lock navigation (e.g., locale switches)
 * while animations are in progress. This prevents state corruption when users click
 * the language switcher during section transitions.
 * 
 * Usage:
 * - Pages with animations should call `lockNavigation()` when starting a transition
 * - Pages should call `unlockNavigation()` when the transition completes
 * - The LanguageSwitcher checks `isNavigationLocked` and defers navigation if locked
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

interface NavigationLockState {
	/** Whether navigation is currently locked (animation in progress) */
	locked: boolean;
	/** Pending locale switch to execute after unlock (if any) */
	pendingLocaleSwitch: {
		targetLocale: 'en' | 'de';
		targetUrl: string;
	} | null;
}

const { subscribe, set, update } = writable<NavigationLockState>({
	locked: false,
	pendingLocaleSwitch: null
});

/** Callbacks to execute when navigation is unlocked */
let unlockCallbacks: (() => void)[] = [];

export const navigationLockStore = {
	subscribe,

	/**
	 * Lock navigation (call when starting an animation/transition)
	 */
	lock(): void {
		update(state => ({ ...state, locked: true }));
	},

	/**
	 * Unlock navigation and execute any pending locale switch
	 */
	unlock(): void {
		const state = get({ subscribe });
		
		// Execute pending locale switch if any
		if (state.pendingLocaleSwitch) {
			const pending = state.pendingLocaleSwitch;
			// Clear the pending state first
			set({ locked: false, pendingLocaleSwitch: null });
			
			// Execute callbacks (the LanguageSwitcher will register one)
			unlockCallbacks.forEach(cb => {
				try { cb(); } catch {}
			});
			unlockCallbacks = [];
		} else {
			set({ locked: false, pendingLocaleSwitch: null });
		}
	},

	/**
	 * Check if navigation is currently locked
	 */
	isLocked(): boolean {
		return get({ subscribe }).locked;
	},

	/**
	 * Queue a locale switch to execute after navigation unlocks
	 * @returns true if queued (was locked), false if executed immediately
	 */
	queueLocaleSwitch(targetLocale: 'en' | 'de', targetUrl: string, executeImmediately: () => void): boolean {
		const state = get({ subscribe });
		
		if (!state.locked) {
			// Not locked, execute immediately
			executeImmediately();
			return false;
		}
		
		// Locked - queue the switch
		update(s => ({
			...s,
			pendingLocaleSwitch: { targetLocale, targetUrl }
		}));
		
		// Register callback to execute when unlocked
		unlockCallbacks.push(executeImmediately);
		return true;
	},

	/**
	 * Clear any pending locale switch (e.g., if user navigates away)
	 */
	clearPending(): void {
		update(state => ({ ...state, pendingLocaleSwitch: null }));
		unlockCallbacks = [];
	}
};

// Convenience exports for simpler usage
export function lockNavigation(): void {
	navigationLockStore.lock();
}

export function unlockNavigation(): void {
	navigationLockStore.unlock();
}

export function isNavigationLocked(): boolean {
	return navigationLockStore.isLocked();
}
