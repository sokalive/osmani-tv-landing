# Osmani TV Landing Page

Production React + Vite landing page for direct APK distribution, optimized for Meta (Facebook/Instagram) ad traffic.

**Production URL:** https://osmani-tv-landing.vercel.app

## Quick Start

```bash
npm install
npm run dev
```

## APK Configuration

Edit `src/config/download.ts`:

```ts
export const APK_CONFIG = {
  localPath: "/downloads/osmani-tv.apk",
  externalUrl: "", // Set CDN URL for large APKs (~90 MB)
  fileName: "osmani-tv.apk",
  version: "2.4.1",
  size: "90 MB",
  packageId: "com.burudanitv.app",
};
```

### Upload the real APK

**Option A — Same-origin (small APKs / testing)**

Place the file at `public/downloads/osmani-tv.apk`

**Option B — External CDN (recommended for ~90 MB)**

Set `externalUrl` to your object-storage/CDN URL. Do not commit large APKs to Git.

See `public/downloads/README.md` for details.

## Features

- Automatic APK download on first visit (once per session)
- Manual Download fallback when auto-download is blocked
- Real byte-level progress when same-origin + Content-Length available
- OPEN / INSTALL handoff via Web Share API (Android) with instructional fallback
- App-store-style mobile-first UI (white background)
- Meta in-app browser, Chrome, and Samsung Internet fallbacks
- No Play Store redirect — visitors stay on the landing page

## Deploy to Vercel

1. Push to `sokalive/osmani-tv-landing` on `master`
2. Vercel auto-deploys from GitHub
3. Framework: **Vite** · Build: `npm run build` · Output: `dist`

## Build

```bash
npm run build
npm run preview
```
