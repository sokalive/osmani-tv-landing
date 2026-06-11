import { FEATURES } from "../config/constants";
import "./FeaturesSection.css";

export function FeaturesSection() {
  return (
    <section className="features" aria-label="App features">
      <h2 className="features__title">Features</h2>
      <ul className="features__grid">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="features__card">
            <span className="features__icon" aria-hidden="true">
              {feature.icon}
            </span>
            <h3 className="features__card-title">{feature.title}</h3>
            <p className="features__card-desc">{feature.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
