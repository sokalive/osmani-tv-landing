import { APP_CONFIG } from "../config/constants";
import "./RatingSection.css";

function StarRating({ rating }: { rating: number }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = rating >= i + 1;
    const half = !filled && rating >= i + 0.5;
    return { filled, half };
  });

  return (
    <div className="star-rating" aria-label={`${rating} out of 5 stars`}>
      {stars.map((star, i) => (
        <span
          key={i}
          className={`star-rating__star ${star.filled ? "star-rating__star--filled" : ""} ${star.half ? "star-rating__star--half" : ""}`}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function RatingSection() {
  return (
    <section className="rating-section" aria-label="App ratings">
      <div className="rating-section__item">
        <StarRating rating={APP_CONFIG.rating} />
        <span className="rating-section__value">{APP_CONFIG.rating}</span>
        <span className="rating-section__label">
          {APP_CONFIG.ratingCount} reviews
        </span>
      </div>
      <div className="rating-section__divider" aria-hidden="true" />
      <div className="rating-section__item">
        <span className="rating-section__icon" aria-hidden="true">
          ⬇
        </span>
        <span className="rating-section__value">{APP_CONFIG.downloads}</span>
        <span className="rating-section__label">Downloads</span>
      </div>
      <div className="rating-section__divider" aria-hidden="true" />
      <div className="rating-section__item">
        <span className="rating-section__badge">{APP_CONFIG.ageRating}</span>
        <span className="rating-section__label">Rated for</span>
      </div>
    </section>
  );
}
