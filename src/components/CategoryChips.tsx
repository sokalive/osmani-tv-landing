import { CATEGORY_CHIPS } from "../config/constants";
import "./CategoryChips.css";

export function CategoryChips() {
  return (
    <section className="category-chips" aria-label="App categories">
      <div className="category-chips__list">
        {CATEGORY_CHIPS.map((chip) => (
          <span key={chip} className="category-chips__chip">
            {chip}
          </span>
        ))}
      </div>
    </section>
  );
}
