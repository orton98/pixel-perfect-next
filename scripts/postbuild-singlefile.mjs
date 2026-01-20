#!/usr/bin/env node
/**
 * Postbuild helper: copy the single-file export to dist/single.html.
 *
 * Usage:
 *   node scripts/postbuild-singlefile.mjs
 */

import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve(process.cwd(), "dist");
const src = path.join(distDir, "index.html");
const dest = path.join(distDir, "single.html");

if (!fs.existsSync(src)) {
  console.error(`[postbuild-singlefile] Missing ${src}. Run: vite build --mode singlefile first.`);
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log(`[postbuild-singlefile] Wrote ${dest}`);
