# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Locale resolution (i18n) — Static Mode

The site is now fully statically prerendered (no Node runtime). Locale selection logic moved client‑side:

Priority on first visit to root `/`:

1. Existing `locale` cookie (`en` or `de`)
2. `navigator.language` (German -> `de`, otherwise `en`)
3. Default fallback `en`

Explicit language URL prefixes ( `/en/...` or `/de/...` ) always define the active locale. A lightweight script sets a `locale` cookie (non-HTTP only) for future direct root visits.

GeoIP and `Accept-Language` headers were removed to allow simple static hosting (IONOS). If you later move to a platform with edge functions, you can restore the former server logic from git history.

## Deployment: IONOS Webhosting (Static)

IONOS Webhosting Plus does not run Node.js processes, so we use `@sveltejs/adapter-static`.

Build output location: `build/`

Steps:

1. Install dependencies (one time or after changes):

```bash
npm install
```

2. Generate static site:

```bash
npm run build
```

3. Upload the contents of the `build` folder to your IONOS web space `htdocs` (or the target subdirectory). Preserve the folder hierarchy.
4. Ensure these are present after upload:
	- `index.html` (root redirect bootstrap; performs client locale redirect)
	- `200.html` (fallback for direct deep links / SPA style navigation)
	- `_app/` assets under `build/_app/...`
	- Image and font assets (e.g. `/images`, `/fonts`)
5. Optional: If IONOS does not automatically serve `200.html` for unknown paths, create an `.htaccess` with a rewrite fallback (Apache example):

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ /200.html [L]
```

Place this `.htaccess` at the site root (same directory as `index.html`).
6. Browser caching: IONOS may set default cache headers. Because files are content‑hashed, long caching of `/_app/immutable/*` is safe. You can optionally add rules in `.htaccess` to leverage far‑future expiry.
7. Verify by visiting:
	- `https://your-domain/` (should redirect to `/en` or `/de` based on browser language / cookie)
	- `https://your-domain/en/imprint` & `.../de/impressum`
	- Project pages: `https://your-domain/en/projects/BURA`

### Adding a new project (static)

1. Add project data to `src/lib/data/projectsData.ts`.
2. Add its slugs to the `prerender.entries` array in `svelte.config.js` for both locales if needed.
3. Rebuild & upload changed files.

### Common Pitfalls

| Issue | Fix |
|-------|-----|
| 404 on deep link refresh | Ensure `200.html` exists and `.htaccess` rewrite added. |
| Old assets still served | Clear browser cache or use hard reload; hashed filenames guarantee freshness. |
| Locale redirect loops | Delete stale `locale` cookie and retest. |
| Missing images | Confirm you uploaded `images/` folder preserving nested directories. |


### Dev vs Production Differences

In dev (`npm run dev`) SvelteKit still simulates SSR for convenience, but production output is purely static; server load files were neutralized to no‑ops.
