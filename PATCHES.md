# Local Package Patches

This project uses `patch-package` to adjust third-party dependencies after install.

## svelte-particles@2.12.0

Reason: The package exposes a `"svelte"` field but doesn't declare conditional `exports`. Vite's Svelte plugin prints a warning:

```text
WARNING: The following packages have a svelte field in their package.json but no exports condition for svelte.

svelte-particles@2.12.0
```

Fix applied: Added an `exports` map to `node_modules/svelte-particles/package.json` so modern resolvers and future tooling treat the Svelte source, ESM, and CJS entries explicitly.

```jsonc
"exports": {
  ".": {
    "types": "./src/index.d.ts",
    "svelte": "./src/index.ts",
    "import": "./dist/es/svelte-particles.js",
    "require": "./dist/umd/svelte-particles.js",
    "default": "./dist/es/svelte-particles.js"
  }
}
```

Patch file: `patches/svelte-particles+2.12.0.patch`

To regenerate after dependency updates:

1. Remove the old patch (if upstream fixes it).
2. Reinstall, reapply edits if still needed.
3. Run `npx patch-package svelte-particles`.

If the upstream library adds proper exports in a future release, delete the patch and update the version.
