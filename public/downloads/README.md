# APK hosting slot

Place the production Osmani TV APK here:

```
public/downloads/osmani-tv.apk
```

It will be served at:

```
https://osmani-tv-landing.vercel.app/downloads/osmani-tv.apk
```

## Recommended for large APKs (~90 MB)

Do **not** commit large APK files to Git. Instead:

1. Upload the APK to object storage (AWS S3, Cloudflare R2, Bunny CDN, etc.)
2. Set the CDN URL in `src/config/download.ts`:

```ts
externalUrl: "https://your-cdn.example.com/osmani-tv.apk",
```

When `externalUrl` is set, it overrides the local path.

## Verify

After uploading, confirm availability:

```bash
curl -I https://osmani-tv-landing.vercel.app/downloads/osmani-tv.apk
```

Expect `HTTP/200` when the file is present.
