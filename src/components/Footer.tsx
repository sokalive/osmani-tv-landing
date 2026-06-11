import { APP_CONFIG } from "../config/constants";
import "./Footer.css";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__brand">{APP_CONFIG.name}</p>
        <p className="footer__copy">
          &copy; {year} {APP_CONFIG.developer}. All rights reserved.
        </p>
        <nav className="footer__links" aria-label="Footer navigation">
          <a href="#features">Features</a>
          <a href="#faq">FAQ</a>
          <a href="mailto:support@osmanitv.com">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
