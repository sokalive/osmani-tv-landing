# Osmani TV visual assets

Place real Osmani TV images at these **exact paths**:

| File | Path | Recommended size | Format |
|------|------|------------------|--------|
| App icon | `app-icon.png` | 512 × 512 px | PNG |
| Screenshot 1 | `screenshot-01.png` | 1080 × 1920 px | PNG or WebP |
| Screenshot 2 | `screenshot-02.png` | 1080 × 1920 px | PNG or WebP |
| Screenshot 3 | `screenshot-03.png` | 1080 × 1920 px | PNG or WebP |
| Screenshot 4 | `screenshot-04.png` | 1080 × 1920 px | PNG or WebP |
| Screenshot 5 | `screenshot-05.png` | 1080 × 1920 px | PNG or WebP |
| Feature graphic | `feature-graphic.png` | 1024 × 500 px | PNG or JPG |
| Social preview | `social-preview-1200x630.png` | 1200 × 630 px | PNG or JPG |

Full paths on disk:

```
public/assets/osmani/app-icon.png
public/assets/osmani/screenshot-01.png
…
public/assets/osmani/social-preview-1200x630.png
```

The site automatically uses these files once present. Until then, neutral placeholders are shown (no broken images).

After uploading `social-preview-1200x630.png`, update `index.html` Open Graph `og:image` to:

```
https://osmani-tv-landing.vercel.app/assets/osmani/social-preview-1200x630.png
```

Do not commit placeholder images pretending to be real Osmani TV screenshots.
