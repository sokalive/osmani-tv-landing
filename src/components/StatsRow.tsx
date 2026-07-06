import { APP_CONFIG } from "../config/constants";
import { APK_CONFIG } from "../config/download";
import "./StatsRow.css";

export function StatsRow() {
  const showRating =
    APP_CONFIG.rating !== null && APP_CONFIG.ratingCount !== null;
  const showDownloads = APP_CONFIG.downloads !== null;

  return (
    <section className="stats-row" aria-label="App statistics">
      {showRating && (
        <>
          <div className="stats-row__item">
            <span
              className="stats-row__rating"
              aria-label={`${APP_CONFIG.rating} out of 5 stars`}
            >
              {APP_CONFIG.rating}
              <span className="stats-row__star" aria-hidden="true">
                ★
              </span>
            </span>
            <span className="stats-row__label">
              {APP_CONFIG.ratingCount} reviews
            </span>
          </div>
          <div className="stats-row__divider" aria-hidden="true" />
        </>
      )}

      <div className="stats-row__item">
        <span className="stats-row__badge">{APP_CONFIG.ageRating}</span>
        <span className="stats-row__label">Content rating</span>
      </div>

      <div className="stats-row__divider" aria-hidden="true" />

      <div className="stats-row__item">
        <span className="stats-row__value">{APK_CONFIG.size}</span>
        <span className="stats-row__label">Download size</span>
      </div>

      {showDownloads && (
        <>
          <div className="stats-row__divider" aria-hidden="true" />
          <div className="stats-row__item">
            <span className="stats-row__value">{APP_CONFIG.downloads}</span>
            <span className="stats-row__label">Downloads</span>
          </div>
        </>
      )}
    </section>
  );
}
