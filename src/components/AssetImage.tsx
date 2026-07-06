import type { CSSProperties } from "react";
import { useAssetAvailable } from "../hooks/useAssetAvailable";
import "./AssetImage.css";

type AssetImageProps = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  placeholderLabel?: string;
};

export function AssetImage({
  src,
  alt,
  className = "",
  width,
  height,
  aspectRatio,
  placeholderLabel = "Asset pending",
}: AssetImageProps) {
  const available = useAssetAvailable(src);

  const style: CSSProperties = {
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined,
    aspectRatio: aspectRatio,
  };

  if (available === true) {
    return (
      <img
        src={src}
        alt={alt}
        className={`asset-image ${className}`}
        style={style}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div
      className={`asset-image__placeholder ${className}`}
      style={style}
      role="img"
      aria-label={`${alt} — ${placeholderLabel}`}
    >
      <span className="asset-image__placeholder-icon" aria-hidden="true">
        ◻
      </span>
      <span className="asset-image__placeholder-text">{placeholderLabel}</span>
    </div>
  );
}
