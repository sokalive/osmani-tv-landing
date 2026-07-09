import type { ReactNode } from "react";
import { APK_CONFIG } from "../config/download";
import { ApkFileCard } from "./ApkFileCard";
import "./NativeInstallScreen.css";

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NavIcon({ type }: { type: "live" | "filamu" | "series" | "zaidi" }) {
  const paths: Record<typeof type, ReactNode> = {
    live: (
      <>
        <rect x="3" y="5" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 21h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    filamu: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
      </>
    ),
    series: (
      <>
        <path
          d="M4 7h16v12H4V7z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M8 11h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    zaidi: (
      <>
        <rect x="5" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  };

  return (
    <svg className="native-install__nav-icon" viewBox="0 0 24 24" fill="none">
      {paths[type]}
    </svg>
  );
}

export function NativeInstallScreen() {
  return (
    <div className="native-install">
      <div className="native-install__glow" aria-hidden="true" />
      <div className="native-install__waves" aria-hidden="true" />

      <header className="native-install__header">
        <div className="native-install__brand">
          <img
            className="native-install__brand-icon"
            src="/assets/osmani/hero-artwork.png"
            alt=""
            width={32}
            height={32}
          />
          <span className="native-install__brand-text">OSMANI TV</span>
        </div>
        <button type="button" className="native-install__menu" aria-label="Menu">
          <MenuIcon />
        </button>
      </header>

      <main className="native-install__main">
        <h1 className="native-install__title">
          Burudani
          <br />
          Bila Kikomo
        </h1>
        <p className="native-install__subtitle">
          Filamu, Series, Channels Live TV
          <br />
          na Zaidi
        </p>

        <div className="native-install__hero-wrap">
          <div className="native-install__hero-glow" aria-hidden="true" />
          <img
            className="native-install__hero-art"
            src="/assets/osmani/hero-artwork.png"
            alt="Osmani TV"
            width={220}
            height={220}
          />
        </div>

        <h2 className="native-install__app-name">Osmani TV Mx</h2>

        <p className="native-install__version">Version {APK_CONFIG.version}</p>

        <div className="native-install__file-card-wrap">
          <ApkFileCard />
        </div>
      </main>

      <nav className="native-install__bottom-nav" aria-label="App navigation">
        <div className="native-install__nav-item">
          <NavIcon type="live" />
          <span>Live TV</span>
        </div>
        <div className="native-install__nav-item">
          <NavIcon type="filamu" />
          <span>Filamu</span>
        </div>
        <div className="native-install__nav-item">
          <NavIcon type="series" />
          <span>Series</span>
        </div>
        <div className="native-install__nav-item">
          <NavIcon type="zaidi" />
          <span>Zaidi</span>
        </div>
      </nav>
    </div>
  );
}
