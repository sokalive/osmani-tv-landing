import { APP_INFO } from "../config/constants";
import "./AppInfo.css";

export function AppInfo() {
  return (
    <section className="app-info">
      <div className="app-info__header">
        <h2 className="app-info__title">App info</h2>
        <span className="app-info__arrow" aria-hidden="true">
          ›
        </span>
      </div>
      <dl className="app-info__list">
        {APP_INFO.map((item) => (
          <div key={item.label} className="app-info__row">
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
