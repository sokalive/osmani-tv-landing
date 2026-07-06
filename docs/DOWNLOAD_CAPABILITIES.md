# Download flow — platform capabilities (updated 2026-07-06)

## Verified from this repository / CDN tests

| Capability | Status |
|------------|--------|
| Bunny CDN GET + Content-Length | Yes (90,834,935 bytes) |
| Bunny CDN Accept-Ranges | Yes |
| Bunny CDN CORS | Yes — `Access-Control-Allow-Origin: *` |
| Browser fetch progress cross-origin | Yes (owner physical-device evidence) |
| HEAD from server (curl/PowerShell) | 200 |
| OPTIONS preflight | 405 (GET/HEAD sufficient) |

## Duplicate-download fix (2026-07-06)

**Root cause:** After streaming the APK via `fetch`, `saveBlobToDevice()` triggered a second browser download (`Osmani TV Mx (1).apk`).

**Fix:** Verified blob stays in page memory only. `saveBlobToDevice` is never called on fetch completion. OPEN / INSTALL uses blob URL anchor open (no `download` attribute) under user gesture.

## Android / browser — cannot be done from a normal HTTPS page

| Claim | Reality |
|-------|---------|
| Auto-launch Package Installer without user gesture | **No** |
| Open local Downloads file path via JS | **No** |
| `intent://` to browser-downloaded file on disk | **No** |
| `file://` APK URI | **Blocked** |
| Detect native browser download completion | **No** |

## Possible with CORS + verified fetch

| Capability | Status |
|------------|--------|
| Stream APK with real byte progress | Yes |
| Verify size + SHA-256 in page | Yes |
| Blob in memory for install handoff | Yes |
| Blob anchor open (no download attr) on user tap | **Attempted** — may open installer on some Android browsers |
| `navigator.share({ files })` | Share sheet — fallback only |

## MIME type

Bunny returns `application/octet-stream`. Recommended Bunny change:

- Set Content-Type to `application/vnd.android.package-archive` for `.apk` files
- Optional: `Content-Disposition: attachment; filename="Osmani TV Mx.apk"`

This may improve Android recognition but does not guarantee installer launch from the web page.

## Architecture

1. Auto-start once (module + sessionStorage guards, StrictMode-safe)
2. Single-flight coordinator — one fetch attempt at a time
3. Stream → verify size + SHA-256 → `install_handoff`
4. OPEN / INSTALL → `attemptInstallHandoff(blob)` (blob URL open, then share, then instructions)
5. Native CDN download fallback only when fetch fails with zero bytes received
