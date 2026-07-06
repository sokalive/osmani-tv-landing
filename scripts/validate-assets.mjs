#!/usr/bin/env node
/**
 * Developer-only asset validation.
 * Usage: npm run validate:assets
 *        RELEASE_MODE=1 npm run validate:assets
 */
import { existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import imageSize from "image-size";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ASSET_DIR = join(ROOT, "public", "assets", "osmani");

const RELEASE_MODE = process.env.RELEASE_MODE === "1";

const ASSETS = [
  {
    file: "app-icon.png",
    required: RELEASE_MODE,
    width: 512,
    height: 512,
    minBytes: 5_000,
  },
  {
    file: "screenshot-01.png",
    required: false,
    width: 1080,
    height: 1920,
    minBytes: 10_000,
  },
  {
    file: "screenshot-02.png",
    required: false,
    width: 1080,
    height: 1920,
    minBytes: 10_000,
  },
  {
    file: "screenshot-03.png",
    required: false,
    width: 1080,
    height: 1920,
    minBytes: 10_000,
  },
  {
    file: "screenshot-04.png",
    required: false,
    width: 1080,
    height: 1920,
    minBytes: 10_000,
  },
  {
    file: "screenshot-05.png",
    required: false,
    width: 1080,
    height: 1920,
    minBytes: 10_000,
  },
  {
    file: "feature-graphic.png",
    required: RELEASE_MODE,
    width: 1024,
    height: 500,
    minBytes: 10_000,
  },
  {
    file: "social-preview-1200x630.png",
    required: RELEASE_MODE,
    width: 1200,
    height: 630,
    minBytes: 10_000,
  },
];

let errors = 0;
let warnings = 0;

console.log(`\nOsmani TV asset validation (${RELEASE_MODE ? "RELEASE MODE" : "dev mode"})\n`);
console.log(`Directory: ${ASSET_DIR}\n`);

for (const asset of ASSETS) {
  const path = join(ASSET_DIR, asset.file);
  const label = asset.file.padEnd(32);

  if (!existsSync(path)) {
    if (asset.required) {
      console.log(`❌ ${label} MISSING (required in release mode)`);
      errors++;
    } else {
      console.log(`⚠️  ${label} missing (placeholder will show)`);
      warnings++;
    }
    continue;
  }

  const { size } = statSync(path);
  if (size < asset.minBytes) {
    console.log(`❌ ${label} too small (${size} bytes)`);
    errors++;
    continue;
  }

  try {
    const dim = imageSize(path);
    if (dim.width !== asset.width || dim.height !== asset.height) {
      console.log(
        `⚠️  ${label} dimensions ${dim.width}x${dim.height} (expected ${asset.width}x${asset.height})`,
      );
      warnings++;
    } else {
      console.log(`✅ ${label} ${dim.width}x${dim.height} (${(size / 1024).toFixed(1)} KB)`);
    }
  } catch {
    console.log(`❌ ${label} unreadable or unsupported format`);
    errors++;
  }
}

console.log(`\n${errors} error(s), ${warnings} warning(s)\n`);
process.exit(errors > 0 ? 1 : 0);
