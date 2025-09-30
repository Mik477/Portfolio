// Switched to static adapter for IONOS hosting (no Node runtime)
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: null, // no SPA fallback; all needed routes are prerendered as static files
			precompress: false,
			relative: false // absolute URLs; required for typical shared hosting root setups like IONOS
		}),
		prerender: {
			handleUnseenRoutes: 'ignore', // ignore dynamic placeholders like /projects/[slug]
			handleHttpError: ({ path, status, message }) => {
				if (status === 405) return null; // ignore method not allowed (stale endpoints removed for static build)
				return { path, status, message };
			},
			entries: [
				'*',
				'/en', '/de',
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
