#!/usr/bin/env node
/**
 * Copies prerendered locale landing pages (en.html, de.html) into
 * ./en/index.html and ./de/index.html so that visiting /en or /de
 * works on basic Apache hosting without rewrites.
 */
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');
const locales = ['en', 'de'];

for (const locale of locales) {
  const source = path.join(buildDir, `${locale}.html`);
  const targetDir = path.join(buildDir, locale);
  const target = path.join(targetDir, 'index.html');
  try {
    if (!fs.existsSync(source)) {
      console.warn(`[postbuild-locale-indexes] Source file missing: ${source}`);
      continue;
    }
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.copyFileSync(source, target);
    console.log(`[postbuild-locale-indexes] Created ${target}`);
  } catch (e) {
    console.error(`[postbuild-locale-indexes] Error processing ${locale}:`, e);
    process.exitCode = 1;
  }
}
