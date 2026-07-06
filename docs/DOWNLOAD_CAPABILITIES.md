# Download flow — platform capabilities (investigated 2026-07-06)

## Verified from this repository / CDN tests

| Capability | Status |
|------------|--------|
| Bunny CDN GET + Content-Length | Yes (90,834,935 bytes) |
| Bunny CDN Accept-Ranges | Yes |
| Bunny CDN CORS | **No** `Access-Control-Allow-Origin` |
| Browser fetch progress cross-origin | **Impossible without CORS** |
| HEAD from server (curl/PowerShell) | 200 |
| OPTIONS preflight | 405 |

## Android / browser — cannot be done from a normal HTTPS page

| Claim | Reality |
|-------|---------|
| Auto-launch Package Installer after download | **No** — blocked by Android security |
| Open local Downloads file via JS | **No** — no file path access |
| `intent://` to installed APK on disk | **No** — cannot reference browser download path |
| `file://` APK URI | **Blocked** |
| File System Access API for install | **Not available** on Android Chrome for this flow |
| Service worker tracking browser download completion | **No** — SW does not see download manager events |
| Know native anchor download finished | **No** — opaque to JavaScript |

## Possible with user gesture after verified fetch (requires CORS)

| Capability | Status |
|------------|---------|
| Stream APK with real byte progress | Yes, if Bunny adds CORS |
| Verify size + SHA-256 in page | Yes, after full fetch |
| Save blob via `<a download>` | Yes |
| `navigator.share({ files })` | Share sheet only — **not** guaranteed installer |

## MIME type

Bunny returns `application/octet-stream`. `application/vnd.android.package-archive` may improve handling but **does not enable auto-installer** from the web page. Configure on Bunny if desired.

## Memory

Buffering 90,834,935 bytes as a Blob on low-memory Android may cause tab pressure. Trade-off for real progress + verification. Browser-managed download avoids page memory use.

## Current production path (no CORS)

1. Try fetch → fails CORS
2. Fall back to native `<a download>` / navigation
3. UI state: `browser_handoff` — button stays **Download**, no OPEN / INSTALL, no fake progress

## Path after Bunny CORS is configured

1. Fetch stream with Content-Length
2. Show real % and MB
3. Verify bytes + SHA-256
4. State: `install_handoff` → **OPEN / INSTALL** (instructions only; user opens notification/Downloads)
