# Osmani TV Landing Page

A production-ready React + Vite landing page for Osmani TV, optimized for Google Play Store redirects and Meta (Facebook/Instagram) ad traffic.

## Quick Start

```bash
npm install
npm run dev
```

## Configuration

Update the Play Store URL in `src/config/constants.ts`:

```ts
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.burudanitv.app";
```

Also update `SEO.siteUrl` in the same file to match your production domain.

## Features

- Auto-redirect to Google Play Store after 1 second on first visit
- Landing page remains visible when user returns via browser back button
- Google Play Store-inspired responsive UI
- SEO, Open Graph, and Twitter Card metadata
- Vercel-ready deployment

## Deploy to Vercel

1. Push this repository to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy

No additional environment variables required.

## Build

```bash
npm run build
npm run preview
```
