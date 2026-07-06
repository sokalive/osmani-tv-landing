import { WHATS_NEW } from "../config/constants";
import "./WhatsNew.css";

export function WhatsNew() {
  return (
    <section className="whats-new">
      <div className="whats-new__header">
        <h2 className="whats-new__title">What&apos;s new</h2>
        <span className="whats-new__arrow" aria-hidden="true">
          ›
        </span>
      </div>
      <p className="whats-new__version">
        Version {WHATS_NEW.version} · {WHATS_NEW.date}
      </p>
      <ul className="whats-new__list">
        {WHATS_NEW.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
