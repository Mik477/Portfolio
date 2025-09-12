# i18n structure

This folder contains locale files for English (en) and German (de). We use namespaces to keep bundles small and lazy-load what's needed per route.

- locales/
  - en/
    - common.json (global UI, language switcher, legal labels)
    - layout.json (head meta, skip links)
  - de/
    - common.json
    - layout.json
- namespaces.ts (namespace type and helpers)

Next steps:
1. Wire SSR locale detection (cookie + Accept-Language) and expose `locale` via +layout.server.ts.
2. Add a language switcher (EN/DE) that sets the cookie, runs the fade transition, and navigates to the target locale URL.
3. Migrate UI strings into `common.json` and page meta into `layout.json`.
4. Add more namespaces (hero, about, contact, projects, project-bura, legal) and migrate the rest incrementally.
5. Introduce `[lang=lang]` route segment and redirect `/` to the chosen locale.
