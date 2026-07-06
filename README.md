# Osmani TV Landing Page

**Production:** https://osmani-tv-landing.vercel.app  
**Repository:** https://github.com/sokalive/osmani-tv-landing

Direct APK distribution landing page (React + Vite), optimized for Meta ad traffic.

## Owner checklist

### 1. Upload real APK

```
public/downloads/osmani-tv.apk
```

Or set CDN URL in `src/config/download.ts` → `externalUrl`

### 2. Upload real visual assets

```
public/assets/osmani/app-icon.png
public/assets/osmani/screenshot-01.png … screenshot-05.png
public/assets/osmani/feature-graphic.png
public/assets/osmani/social-preview-1200x630.png
```

See `public/assets/osmani/README.md` for dimensions.

### 3. Update Open Graph image (after social preview upload)

In `index.html`, set `og:image` to:
`https://osmani-tv-landing.vercel.app/assets/osmani/social-preview-1200x630.png`

## Development

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Architecture

| Config | Purpose |
|--------|---------|
| `src/config/download.ts` | APK URL, filename, package ID |
| `src/config/assets.ts` | All image paths (single source) |
| `src/config/constants.ts` | App copy, SEO, neutral stats |

## Verify APK route (after upload)

```bash
curl -I https://osmani-tv-landing.vercel.app/downloads/osmani-tv.apk
```

Must return `application/vnd.android.package-archive`, **not** `text/html`.
