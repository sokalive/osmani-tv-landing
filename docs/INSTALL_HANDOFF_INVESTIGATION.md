# Install handoff investigation (2026-07-06)

## Phase 1 — Current pipeline (fetch-to-RAM)

```
page load
  → consumeModuleAutoStart + sessionStorage auto key
  → tryBeginDownloadAttempt()
  → probeApkAvailability (HEAD with CORS)
  → downloadApkWithProgress (fetch + ReadableStream)
  → onProgress (real bytes)
  → validateApkBlob (size + PK magic)
  → validateApkSha256
  → Blob in blobRef (RAM only)
  → state: install_handoff
  → user taps OPEN / INSTALL
  → attemptInstallHandoff(blob, profile)
```

### Proven answers (from code, not guesswork)

| Question | Answer | Evidence |
|----------|--------|----------|
| A. Persisted to Android Downloads after fetch? | **No** (until OPEN / INSTALL) | `markVerifiedComplete` stores `blobRef` only; no `persistVerifiedBlobToDownloads` on completion |
| B. Only in browser RAM? | **Yes** after fetch | `Blob` built from `chunks[]` in `downloadApkWithProgress` |
| C. Download Manager knows about fetch path? | **No** until handoff | `fetch()` does not register with Android Download Manager |
| D. Package Installer gets `content://`? | **No** from web blob | No FileProvider in web context |
| E. Package Installer gets `file://`? | **No** | Blocked from HTTPS origins |
| F. Only `blob:` URL? | **Yes** for in-page handoff attempts | `URL.createObjectURL(blob)` |
| G. RAM-only architecture blocks Tier 1? | **Yes** for direct installer | Android requires OS-owned URI + `FLAG_GRANT_READ_URI_PERMISSION` |

## Path A — Blob / object URL

| Mechanism | Chrome Android | Samsung Internet | Meta IAB |
|-----------|----------------|------------------|----------|
| Anchor without `download` | Does not launch Package Installer | Unproven on device | N/A |
| `window.location` to blob | Blank / download page | Unproven | N/A |
| `blob:` + APK MIME | Not mapped to Package Installer | Unproven | Blocked |

**Conclusion:** Tier 4 for direct blob open. Not sufficient alone.

## Path B — Real Download Manager artifact

| Approach | Page progress | OS install path | Duplicate risk |
|----------|---------------|-----------------|----------------|
| Native CDN download only | No (notification only) | Notification → Installer (Tier 1 on tap) | Low |
| Fetch-to-RAM + persist on OPEN/INSTALL | Yes | Notification → Installer | **No CDN duplicate** — RAM→disk only |
| Fetch + auto persist on complete | Yes | Same | Was duplicate bug — removed |

**Selected hybrid:** Keep fetch for progress/verify; on OPEN/INSTALL call `persistVerifiedBlobToDownloads` (zero CDN bytes).

## Path C — content:// / FileProvider

Package Installer normally receives:

```kotlin
Intent(ACTION_VIEW).setDataAndType(contentUri, "application/vnd.android.package-archive")
  .addFlags(FLAG_GRANT_READ_URI_PERMISSION)
```

HTTPS pages **cannot** create `content://` URIs. Requires native Android component with FileProvider.

## Path D — intent:// URIs

- Cannot reference browser blob or Download Manager path
- HTTP intent to CDN URL triggers **new download** — rejected (90 MB duplicate)
- Valid only with native app receiving App Link + downloading once

## Path E — CDN headers (verified 2026-07-06)

```
Content-Type: application/octet-stream
Content-Length: 90834935
Access-Control-Allow-Origin: *
Content-Disposition: (not set)
```

**Bunny recommended change:**

1. Content-Type: `application/vnd.android.package-archive`
2. Content-Disposition: `attachment; filename="Osmani TV Mx.apk"`

Improves MIME-aware routing; does not enable Tier 1 from RAM blob alone.

## Path F — Direct APK navigation

- Single CDN transfer via Download Manager
- User taps notification → Package Installer (Tier 1)
- **No page-side byte progress** — used only as CORS-failure fallback today

## Path G — PWA / Service Worker

- Service Worker cannot expose `content://` to Package Installer
- Background Fetch: not viable for install handoff on Android Chrome
- File Handling API: not available for arbitrary APK install from landing page

## Path H — Web Share

- `navigator.share({ files: [File] })` with APK MIME
- May list Package Installer on some Android builds (Tier 1 if user selects it)
- 90 MB held in RAM before share — same memory constraint as fetch path
- Implemented as **first** Android step when `canShare({ files })`

## Path I — Native bridge (required for reliable Tier 1)

See [NATIVE_INSTALL_BRIDGE.md](./NATIVE_INSTALL_BRIDGE.md).

Smallest native component:

1. App Link / custom scheme from landing page
2. Download APK once (DownloadManager or OkHttp)
3. FileProvider `content://` URI
4. `ACTION_VIEW` → real Cancel / Install UI

## Path J — Existing Osmani TV app

Package: `com.burudanitv.app`

| User | Web-only today | With app bridge |
|------|----------------|-----------------|
| First install | Tier 2 max (notification) | Tier 1 via native FileProvider |
| Update (app installed) | Same | App Link → in-app download → installer |

No Android source in this repository — bridge must be implemented in the mobile app repo.

## Decision matrix summary

| Architecture | Tier | Progress | One CDN transfer | In repo |
|--------------|------|----------|------------------|---------|
| Fetch RAM + blob URL | 4 | Yes | Yes | Previous |
| Fetch RAM + persist on tap | **2→1** | Yes | Yes | **Implemented** |
| Native CDN only | 2→1 | No | Yes | Fallback |
| Native bridge | **1** | Optional | Yes | Spec only |

## Highest achievable tier (honest)

| Environment | Tier |
|-------------|------|
| Android Chrome (this release) | **2** — OPEN/INSTALL → Downloads notification → user tap → Tier 1 installer |
| Android + Web Share + Package Installer target | **1** possible if user picks installer |
| Meta IAB | **4** |
| Pure web without native bridge | **Cannot guarantee Tier 1** |
