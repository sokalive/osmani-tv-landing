import { APP_CONFIG } from "../config/constants";
import { APK_CONFIG } from "../config/download";
import "./StatsRow.css";

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="stats-row__rating" aria-label={`${rating} out of 5 stars`}>
      {rating}
      <span className="stats-row__star" aria-hidden="true">
        ★
      </span>
    </span>
  );
}

export function StatsRow() {
  return (
    <section className="stats-row" aria-label="App statistics">
      <div className="stats-row__item">
        <StarRating rating={APP_CONFIG.rating} />
        <span className="stats-row__label">{APP_CONFIG.ratingCount} reviews</span>
      </div>
      <div className="stats-row__divider" aria-hidden="true" />
      <div className="stats-row__item">
        <span className="stats-row__badge">{APP_CONFIG.ageRating}</span>
        <span className="stats-row__label">Rated for Everyone</span>
      </div>
      <div className="stats-row__divider" aria-hidden="true" />
      <div className="stats-row__item">
        <span className="stats-row__value">{APK_CONFIG.size}</span>
        <span className="stats-row__label">Download size</span>
      </div>
      <div className="stats-row__divider" aria-hidden="true" />
      <div className="stats-row__item">
        <span className="stats-row__value">{APP_CONFIG.downloads}</span>
        <span className="stats-row__label">Downloads</span>
      </div>
    </section>
  );
}
