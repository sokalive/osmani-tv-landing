# Native install bridge specification

Required when **guaranteed Tier 1** (real Package Installer on first OPEN/INSTALL tap) is mandatory for all Android users.

## Problem

Verified APK in browser RAM has no `content://` URI. Android Package Installer requires an OS-scoped URI with temporary read permission. Normal HTTPS pages cannot provide this.

## Smallest native bridge

### Option A — Extend Osmani TV app (`com.burudanitv.app`)

**AndroidManifest.xml** intent filter:

```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https"
        android:host="osmani-tv-landing.vercel.app"
        android:pathPrefix="/install" />
</intent-filter>
```

**Landing page** (when app installed — detect via `intent://` fallback or Play package check not available on web):

```
https://osmani-tv-landing.vercel.app/install?apk=<encoded-cdn-url>&sha256=<hash>
```

**App flow:**

1. Receive App Link
2. Download APK once (verify SHA-256 matches)
3. Write to `context.getExternalFilesDir()` or cache
4. `FileProvider.getUriForFile(...)`
5. `startActivity(Intent(ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive").addFlags(FLAG_GRANT_READ_URI_PERMISSION))`
6. Android shows real Cancel / Install — **Tier 1**

### Option B — Tiny helper APK (~100 KB)

Same flow as Option A with package `com.osmanimedia.installer` — only for first-time users without main app.

Trade-off: user must install helper first (bootstrap problem).

## Web-side preparation (implemented in landing page)

1. Keep fetch-to-RAM for progress + SHA verification
2. OPEN/INSTALL → persist to Downloads (Tier 2) when app not installed
3. Future: if App Link probe succeeds, skip persist and open `/install?...` deep link

## Security

- Never `ACTION_INSTALL_PACKAGE` with `EXTRA_INSTALLER_PACKAGE_NAME` bypass
- Never silent install (`REQUEST_INSTALL_PACKAGES` still shows system UI)
- Always verify SHA-256 before `FileProvider` handoff
- HTTPS only for APK URL

## First-time vs update users

| Scenario | Recommended path |
|----------|------------------|
| First install, no app | Web Tier 2 (notification) OR helper APK |
| Update, app installed | App Link → native Tier 1 |
| Meta IAB | Open in Chrome banner → web Tier 2 |

## Not in scope of landing-page repo

Implementation belongs in the Osmani TV Android / Expo native project. Do not deploy from this repository without owner approval.
