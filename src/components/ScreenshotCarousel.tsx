import { useCallback, useState } from "react";
import { SCREENSHOTS } from "../config/constants";
import "./ScreenshotCarousel.css";

export function ScreenshotCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, SCREENSHOTS.length - 1));
    setActiveIndex(clamped);
    const el = document.getElementById(`screenshot-${clamped}`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  return (
    <section className="screenshots" aria-label="App screenshots">
      <h2 className="screenshots__title">Screenshots</h2>
      <div className="screenshots__track" role="list">
        {SCREENSHOTS.map((shot, index) => (
          <div
            key={shot.id}
            id={`screenshot-${index}`}
            className="screenshots__slide"
            role="listitem"
          >
            <div className="screenshots__frame" aria-label={shot.alt}>
              <div className="screenshots__mockup">
                <div className="screenshots__status-bar" />
                <div className="screenshots__content">
                  <span className="screenshots__label">{shot.label}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="screenshots__dots" role="tablist" aria-label="Screenshot navigation">
        {SCREENSHOTS.map((shot, index) => (
          <button
            key={shot.id}
            type="button"
            role="tab"
            className={`screenshots__dot ${index === activeIndex ? "screenshots__dot--active" : ""}`}
            aria-selected={index === activeIndex}
            aria-label={`View screenshot ${index + 1}: ${shot.label}`}
            onClick={() => scrollTo(index)}
          />
        ))}
      </div>
    </section>
  );
}
