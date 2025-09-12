<script lang="ts">
	import { page } from '$app/stores';
	import { transitionStore } from '$lib/stores/transitionStore';

		interface LegalLink {
		name: string;
		url: string;
	}

	export let legalLinks: LegalLink[] = [];

	function withLang(url: string) {
		// If already prefixed with a locale, keep as is.
		if (/^\/(en|de)(\/|$)/.test(url)) return url;
		// Only prefix root-relative paths
		if (url.startsWith('/')) {
			const lang = $page.params?.lang ?? 'de';
			return `/${lang}${url}`;
		}
		return url;
	}

	const handleNavigate = (url: string) => {
		transitionStore.fadeToBlackAndNavigate(withLang(url));
	};
  
	// Accessibility: small helper for keyboard activation on Enter/Space when needed
	const onKeyActivate = (e: KeyboardEvent, url: string) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleNavigate(url);
		}
	};
</script>

<footer class="legal-footer" aria-label={(($page.data as any)?.messages?.common?.a11y?.legalFooter ?? 'Legal information links')}>
	<div class="addons"><slot /></div>
	<nav class="legal-nav" aria-label={(($page.data as any)?.messages?.common?.a11y?.legalNav ?? 'Legal Links')}>
			{#each legalLinks as link (link.url)}
				<button
					type="button"
					class="legal-link"
					on:click={() => handleNavigate(link.url)}
					on:keydown={(e) => onKeyActivate(e, link.url)}
				>
					<span class="measure" aria-hidden="true">{link.name}</span>
					<span class="label">{link.name}</span>
				</button>
			{/each}
	</nav>
	<div class="legal-meta">© {new Date().getFullYear()}</div>
  
	<!-- Ensure overlay can cover this: z-index below TransitionOverlay's 99999 -->
</footer>

<style>
	/* Hover behavior matches ParallaxCard title: weight + letter-spacing with smooth timing */
		.legal-footer {
			position: fixed;
			top: 0.75rem;
			right: 0.75rem;
			display: flex;
			align-items: center;
			justify-content: flex-end;
			gap: 0.75rem;
			padding: 0.25rem 0.35rem;
			font-size: 0.8rem;
			color: rgba(255, 255, 255, 0.6);
			pointer-events: none; /* allow clicks through except on buttons */
			z-index: 9990;

		/* Typography transition parameters (scoped) */
		--legal-link-transition-duration: 0.8s;
		/* Space Grotesk weight range (variable): 300..700 */
		--legal-link-initial-weight: 500;
		--legal-link-hover-weight: 700;
		--legal-link-initial-tracking: 0.01em;
		--legal-link-hover-tracking: 0.03em;
		}
			.addons { pointer-events: auto; display: inline-flex; align-items: center; }

		.legal-nav { display: flex; gap: 0.5rem; align-items: center; }

		.legal-link {
				pointer-events: auto; /* re-enable for interactive elements */
				background: transparent;
				border: none;
				padding: 0.2rem 0.4rem;
				color: inherit;
				cursor: pointer;
				opacity: 0.8;
				display: grid; /* overlay label + measure to reserve max width */
				align-items: center;
				justify-items: end;
				white-space: nowrap;
				/* custom property for animatable weight */
				--legal-link-wght: var(--legal-link-initial-weight);
	}

			.legal-link:hover,
			.legal-link:focus-visible {
				color: #ffffff;
				opacity: 1;
				text-shadow: 0 0 4px rgba(255,255,255,0.25);
				outline: none;
			}

			/* Overlaid spans: measure reserves hover width; label animates smoothly */
			.legal-link .measure,
			.legal-link .label { grid-area: 1 / 1; }

			.legal-link .measure {
				visibility: hidden; /* not visible but participates in layout sizing */
				pointer-events: none;
				user-select: none;
				white-space: nowrap;
				font-weight: var(--legal-link-hover-weight);
				letter-spacing: var(--legal-link-hover-tracking);
			}

			/* Smooth variable-font weight where supported */
			@supports (font-variation-settings: 'wght' 500) {
				/* Register animatable custom property for weight */
				@property --legal-link-wght {
					syntax: '<number>';
					inherits: true;
					initial-value: 500;
				}

					.legal-link .label {
					/* Use variable font axis for smooth boldness */
					font-variation-settings: 'wght' var(--legal-link-wght);
					letter-spacing: var(--legal-link-initial-tracking);
					transition: 
						--legal-link-wght var(--legal-link-transition-duration) ease,
						letter-spacing var(--legal-link-transition-duration) ease,
						color 120ms ease,
						opacity 120ms ease,
						text-shadow 120ms ease;
						/* Modern brutalist sans to vibe with site */
						font-family: 'Space Grotesk', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
				}

				.legal-link:hover .label,
				.legal-link:focus-visible .label {
					--legal-link-wght: var(--legal-link-hover-weight);
					letter-spacing: var(--legal-link-hover-tracking);
				}
			}

			/* Fallback when variable fonts not available: animate letter-spacing only, keep layout stable via measure */
			@supports not (font-variation-settings: 'wght' 500) {
				.legal-link .label {
					font-weight: var(--legal-link-initial-weight);
					letter-spacing: var(--legal-link-initial-tracking);
					transition:
						letter-spacing var(--legal-link-transition-duration) ease,
						color 120ms ease,
						opacity 120ms ease,
						text-shadow 120ms ease;
				}
				.legal-link:hover .label,
				.legal-link:focus-visible .label {
					letter-spacing: var(--legal-link-hover-tracking);
				}
			}

		.legal-meta {
			font-size: 0.7rem;
			color: rgba(255, 255, 255, 0.45);
			pointer-events: none;
			margin-left: 0.25rem;
		}

	@media (max-width: 640px) {
		.legal-footer { gap: 0.4rem; font-size: 0.75rem; top: 0.5rem; right: 0.5rem; }
	}
</style>

