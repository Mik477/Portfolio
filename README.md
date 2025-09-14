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

## Locale resolution and GeoIP (i18n)

This app supports English (`/en`) and German (`/de`) routes. The server resolves the locale in this priority:

1) URL prefix (e.g. `/en/...`) — always wins
2) `locale` cookie (set when a user picks a language)
3) `Accept-Language` header
4) GeoIP country header (e.g. Cloudflare `CF-IPCountry`, Vercel `x-vercel-ip-country`, Fastly `Fastly-GeoIP-Country-Code`, Netlify `x-nf-geo`)
5) Default: `en`

Cache/Vary: responses include a `Vary` header for `Accept-Language, Cookie, CF-IPCountry, X-Country-Code, X-Geo-Country, X-Vercel-IP-Country, Fastly-GeoIP-Country-Code, X-Fastly-Country-Code, X-NF-Geo` so CDNs can cache per-language/geo correctly.

To enable GeoIP-based defaulting on your host/CDN, ensure one of the supported country headers is injected. No external IP API is required.
