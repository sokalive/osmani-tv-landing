# Osmani TV APK slot

Place the production APK here:

```
public/downloads/osmani-tv.apk
```

Served at:

```
https://osmani-tv-landing.vercel.app/downloads/osmani-tv.apk
```

Download filename presented to users: **Osmani-TV-Max.apk** (configured in `vercel.json` Content-Disposition).

## Large APKs (~90 MB)

Do **not** commit large APKs to Git. Use external CDN instead:

```ts
// src/config/download.ts
externalUrl: "https://your-cdn.example.com/Osmani-TV-Max.apk",
```

## Verify after upload

```bash
curl -I https://osmani-tv-landing.vercel.app/downloads/osmani-tv.apk
```

Expect:

- `HTTP/2 200`
- `Content-Type: application/vnd.android.package-archive`
- **Not** `text/html`

Do not add fake `.apk` files (renamed text, empty files, etc.).
