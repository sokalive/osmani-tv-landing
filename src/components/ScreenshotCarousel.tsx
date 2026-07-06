import { useCallback, useState } from "react";
import {
  ASSET_LAYOUT,
  ASSET_PATHS,
  SCREENSHOT_LABELS,
} from "../config/assets";
import { AssetImage } from "./AssetImage";
import "./ScreenshotCarousel.css";

export function ScreenshotCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const screenshots = ASSET_PATHS.screenshots.map((src, index) => ({
    id: index + 1,
    src,
    alt: `Osmani TV screenshot ${index + 1}`,
    label: SCREENSHOT_LABELS[index] ?? `Screen ${index + 1}`,
  }));

  const scrollTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, screenshots.length - 1));
      setActiveIndex(clamped);
      const el = document.getElementById(`screenshot-${clamped}`);
      el?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    },
    [screenshots.length],
  );

  return (
    <section className="screenshots" aria-label="App screenshots">
      <h2 className="screenshots__title">Screenshots</h2>
      <div className="screenshots__track" role="list">
        {screenshots.map((shot, index) => (
          <div
            key={shot.id}
            id={`screenshot-${index}`}
            className="screenshots__slide"
            role="listitem"
          >
            <div
              className="screenshots__frame"
              style={{
                width: ASSET_LAYOUT.screenshotWidth,
                aspectRatio: ASSET_LAYOUT.screenshotAspectRatio,
              }}
            >
              <AssetImage
                src={shot.src}
                alt={shot.alt}
                className="screenshots__image"
                aspectRatio={ASSET_LAYOUT.screenshotAspectRatio}
                placeholderLabel={shot.label}
              />
            </div>
          </div>
        ))}
      </div>
      <div
        className="screenshots__dots"
        role="tablist"
        aria-label="Screenshot navigation"
      >
        {screenshots.map((shot, index) => (
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
