import { useEffect, useState } from "react";

/**
 * Probes whether a static asset exists without rendering broken <img> tags.
 */
export function useAssetAvailable(src: string): boolean | null {
  const [state, setState] = useState<{
    src: string;
    available: boolean | null;
  }>({ src, available: null });

  useEffect(() => {
    let cancelled = false;

    const img = new Image();
    img.onload = () => {
      if (!cancelled) setState({ src, available: true });
    };
    img.onerror = () => {
      if (!cancelled) setState({ src, available: false });
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (state.src !== src) {
    return null;
  }

  return state.available;
}
