# Bunny CDN setup for Osmani TV APK (~90 MB)

This landing-page repo has **no Bunny credentials**. Use your existing Bunny account.

## Recommended workflow

1. **Create a Storage Zone** (or use existing) e.g. `osmani-apk`
2. **Upload** `Osmani TV Max.apk` → rename on CDN to `Osmani-TV-Max.apk`
3. **Attach a Pull Zone** with a hostname e.g. `osmani-apk.b-cdn.net`
4. **Set public URL** in `src/config/download.ts`:

```ts
externalUrl: "https://osmani-apk.b-cdn.net/releases/Osmani-TV-Max.apk",
```

5. **Run locally** to get SHA-256 and size:

```bash
npm run validate:apk -- ./Osmani-TV-Max.apk
```

6. **Paste** `expectedSizeBytes` and `sha256` into `APK_RELEASE` in `src/config/download.ts`

## Required CDN headers

Configure in Bunny → Edge Rules or origin headers:

| Header | Value |
|--------|-------|
| `Content-Type` | `application/vnd.android.package-archive` |
| `Content-Disposition` | `attachment; filename="Osmani-TV-Max.apk"` |
| `Accept-Ranges` | `bytes` |
| `Access-Control-Allow-Origin` | `https://osmani-tv-landing.vercel.app` |
| `Access-Control-Expose-Headers` | `Content-Length, Content-Range, Accept-Ranges, Content-Disposition` |

**Without CORS**, the landing page cannot measure byte progress. Downloads still work via the browser download manager, but the page stays in an honest `browser_handoff` state (no fake progress, no premature OPEN / INSTALL).

**With CORS configured**, the page can fetch+stream the APK, show real `Downloading… 48% (43.20 MB / 90.83 MB)`, verify SHA-256, and only then show OPEN / INSTALL.
| `Cache-Control` | `public, max-age=3600, must-revalidate` |

CORS is required only if you want **byte-level download progress** via `fetch()` from the landing page. Without CORS, the landing page falls back to native browser download (no progress bar).

## Versioning

Use versioned paths:

```
/releases/v2.4.1/Osmani-TV-Max.apk
```

Update `externalUrl` + `APK_RELEASE.versionName` together per release.

## Verify

```bash
curl -I https://YOUR-PULL-ZONE.b-cdn.net/releases/Osmani-TV-Max.apk
```

Must return `200` and `application/vnd.android.package-archive`, **not** `text/html`.
