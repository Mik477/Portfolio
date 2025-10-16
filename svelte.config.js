// Switched to static adapter for IONOS hosting (no Node runtime)
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Notes for IONOS static hosting:
// - No Node runtime: everything must be prerendered.
// - Prefer absolute URLs (relative:false) because site is served from root.
// - Keep build output small and cache-friendly.

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html', // Fallback for client-side routing
			precompress: false, // Disabled for now to rule out host issues with compressed variants
			strict: true
		}),
		paths: {
			relative: false // Force absolute /_app/... asset URLs instead of ./_app for IONOS root hosting
		},
		alias: {
			$components: 'src/lib/components',
			$stores: 'src/lib/stores',
			$three: 'src/lib/three'
		},
		// trailingSlash and inlineStyleThreshold not supported in current SvelteKit version; removed.
		prerender: {
			concurrency: 4, // Avoid overwhelming shared hosting during local prerender
			handleUnseenRoutes: 'ignore',
			handleHttpError: ({ path, status, message }) => {
				if (status === 405) return null; // Ignore method mismatch for removed endpoints
				return { path, status, message };
			},
			entries: [
				'*',
				'/', // Root page with client-side IP geolocation
				'/404',
				'/en', '/de',
				'/en/404', '/de/404',
				'/impressum', '/datenschutz', '/barrierefreiheit',
				'/en/imprint', '/de/impressum',
				'/en/privacy', '/de/datenschutz',
				'/en/accessibility', '/de/barrierefreiheit',
				'/en/projects/BURA', '/de/projects/BURA',
				'/en/projects/Project2', '/de/projects/Project2'
			]
		}
	}
};

export default config;
