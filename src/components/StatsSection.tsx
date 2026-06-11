import { APP_CONFIG } from "../config/constants";
import "./StatsSection.css";

const STATS = [
  { label: "Developer", value: APP_CONFIG.developer },
  { label: "Version", value: APP_CONFIG.version },
  { label: "Updated", value: APP_CONFIG.lastUpdated },
  { label: "Size", value: APP_CONFIG.size },
] as const;

export function StatsSection() {
  return (
    <section className="stats-section" aria-label="App details">
      <h2 className="stats-section__title">About this app</h2>
      <p className="stats-section__description">{APP_CONFIG.description}</p>
      <dl className="stats-section__grid">
        {STATS.map((stat) => (
          <div key={stat.label} className="stats-section__item">
            <dt className="stats-section__label">{stat.label}</dt>
            <dd className="stats-section__value">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
