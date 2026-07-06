#!/usr/bin/env node
/**
 * Validate local APK file and print SHA-256 for src/config/download.ts
 * Usage: npm run validate:apk -- path/to/Osmani-TV-Max.apk
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const apkPath =
  process.argv[2] || join(ROOT, "public", "downloads", "osmani-tv.apk");

if (!existsSync(apkPath)) {
  console.error(`\n❌ APK not found: ${apkPath}`);
  console.error("\nPlace the real APK at public/downloads/osmani-tv.apk");
  console.error("Or pass a path: npm run validate:apk -- ./Osmani-TV-Max.apk\n");
  process.exit(1);
}

const { size } = statSync(apkPath);
const MIN_BYTES = 100_000;

if (size < MIN_BYTES) {
  console.error(`\n❌ File too small (${size} bytes) — not a valid APK\n`);
  process.exit(1);
}

const hash = createHash("sha256");
const stream = createReadStream(apkPath);

stream.on("data", (chunk) => hash.update(chunk));
stream.on("end", () => {
  const sha256 = hash.digest("hex");
  const header = Buffer.alloc(4);
  const fd = createReadStream(apkPath, { start: 0, end: 3 });
  const chunks = [];
  fd.on("data", (c) => chunks.push(c));
  fd.on("end", () => {
    const magic = Buffer.concat(chunks);
    const isZip = magic[0] === 0x50 && magic[1] === 0x4b;

    console.log("\n✅ APK validation passed\n");
    console.log(`  Path:     ${apkPath}`);
    console.log(`  Size:     ${size} bytes (${(size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`  SHA-256:  ${sha256}`);
    console.log(`  ZIP/APK:  ${isZip ? "yes (PK header)" : "NO — invalid"}`);

    if (!isZip) {
      process.exit(1);
    }

    console.log("\nAdd to src/config/download.ts → APK_RELEASE:\n");
    console.log(`  expectedSizeBytes: ${size},`);
    console.log(`  sha256: "${sha256}",`);
    console.log("");
  });
});

stream.on("error", (err) => {
  console.error(err);
  process.exit(1);
});
