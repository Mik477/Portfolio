/**
 * Navigation History Store
 * 
 * Tracks the last non-legal page the user visited, enabling the BackButton
 * on legal pages to return users to their previous content location.
 * 
 * "Non-legal" pages include:
 * - Main portfolio page (any section): /en, /de, /en#about, /de#project-2, etc.
 * - Project detail pages: /en/projects/BURA, /de/projects/Project2#section-1, etc.
 * 
 * "Legal" pages are excluded from history:
 * - /impressum, /datenschutz, /barrierefreiheit (German)
 * - /imprint, /privacy, /accessibility (English)
 * - With or without locale prefix
 * 
 * The store persists to sessionStorage so it survives page refreshes within a session.
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'portfolio-nav-history';

/** Legal page path patterns (without locale prefix) */
const LEGAL_PATHS = [
	'/impressum',
	'/datenschutz',
	'/barrierefreiheit',
	'/imprint',
	'/privacy',
	'/accessibility'
];

/**
 * Check if a pathname is a legal page
 */
export function isLegalPage(pathname: string): boolean {
	// Normalize: remove trailing slash
	const normalized = pathname.endsWith('/') && pathname.length > 1 
		? pathname.slice(0, -1) 
		: pathname;
	
	// Check if path matches any legal pattern (with or without locale prefix)
	// Patterns: /impressum, /en/impressum, /de/impressum, etc.
	for (const legalPath of LEGAL_PATHS) {
		// Direct match
		if (normalized === legalPath) return true;
		// With locale prefix: /en/impressum or /de/impressum
		if (normalized === `/en${legalPath}` || normalized === `/de${legalPath}`) return true;
	}
	
	return false;
}

interface NavigationHistoryState {
	/** The last non-legal page URL (pathname + hash) */
	lastContentPage: string | null;
}

function createNavigationHistoryStore() {
	// Load initial state from sessionStorage if available
	const getInitialState = (): NavigationHistoryState => {
		if (!browser) return { lastContentPage: null };
		
		try {
			const stored = sessionStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				if (typeof parsed.lastContentPage === 'string' || parsed.lastContentPage === null) {
					return parsed;
				}
			}
		} catch {
			// Ignore parse errors, use default
		}
		
		return { lastContentPage: null };
	};

	const { subscribe, set, update } = writable<NavigationHistoryState>(getInitialState());

	// Persist to sessionStorage on changes
	if (browser) {
		subscribe((state) => {
			try {
				sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
			} catch {
				// Ignore storage errors (e.g., private browsing)
			}
		});
	}

	return {
		subscribe,

		/**
		 * Record a page visit. Only non-legal pages are stored.
		 * Call this from the main page, project pages, etc.
		 * 
		 * @param pathname - The page pathname (e.g., '/en', '/de/projects/BURA')
		 * @param hash - Optional hash fragment (e.g., '#about', '#section-2')
		 */
		recordPageVisit(pathname: string, hash: string = ''): void {
			if (!browser) return;
			
			// Don't record legal pages
			if (isLegalPage(pathname)) return;
			
			// Build the full path with hash
			const fullPath = hash ? `${pathname}${hash}` : pathname;
			
			update((state) => ({
				...state,
				lastContentPage: fullPath
			}));
		},

		/**
		 * Get the URL to navigate back to.
		 * Returns the last content page, or falls back to the locale home.
		 * 
		 * @param currentLocale - The current locale ('en' or 'de')
		 * @returns The URL to navigate to
		 */
		getBackUrl(currentLocale: 'en' | 'de' = 'de'): string {
			const state = get({ subscribe });
			
			if (state.lastContentPage) {
				return state.lastContentPage;
			}
			
			// Fallback to locale home
			return `/${currentLocale}`;
		},

		/**
		 * Clear the navigation history (e.g., on logout or session end)
		 */
		clear(): void {
			set({ lastContentPage: null });
		}
	};
}

export const navigationHistoryStore = createNavigationHistoryStore();
