import { APP_CONFIG } from "../config/constants";
import "./AppHeader.css";

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header__logo" aria-hidden="true">
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="80" height="80" rx="18" fill="url(#logoGrad)" />
          <path
            d="M28 24L56 40L28 56V24Z"
            fill="white"
            fillOpacity="0.95"
          />
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="80" y2="80">
              <stop stopColor="#01875f" />
              <stop offset="1" stopColor="#00a86b" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="app-header__info">
        <h1 className="app-header__title">{APP_CONFIG.name}</h1>
        <p className="app-header__category">{APP_CONFIG.category}</p>
        <p className="app-header__tagline">{APP_CONFIG.tagline}</p>
      </div>
    </header>
  );
}
