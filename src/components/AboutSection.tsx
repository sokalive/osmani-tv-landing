import { APP_CONFIG } from "../config/constants";
import "./AboutSection.css";

export function AboutSection() {
  return (
    <section className="about-section">
      <div className="about-section__header">
        <h2 className="about-section__title">About this app</h2>
        <span className="about-section__arrow" aria-hidden="true">
          ›
        </span>
      </div>
      <p className="about-section__text">{APP_CONFIG.tagline}</p>
      <p className="about-section__description">{APP_CONFIG.description}</p>
    </section>
  );
}
