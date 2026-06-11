import { useEffect, useState } from "react";
import { PLAY_STORE_URL, REDIRECT_DELAY_MS } from "../config/constants";

const REDIRECT_KEY = "osmani_tv_redirected";

function shouldSkipRedirect(): boolean {
  if (sessionStorage.getItem(REDIRECT_KEY) === "true") {
    return true;
  }

  const navEntries = performance.getEntriesByType(
    "navigation",
  ) as PerformanceNavigationTiming[];
  if (navEntries.length > 0 && navEntries[0].type === "back_forward") {
    return true;
  }

  return false;
}

export function useAutoRedirect() {
  const [isRedirecting, setIsRedirecting] = useState(
    () => !shouldSkipRedirect(),
  );

  useEffect(() => {
    if (!isRedirecting) {
      return;
    }

    const timer = setTimeout(() => {
      sessionStorage.setItem(REDIRECT_KEY, "true");
      window.location.href = PLAY_STORE_URL;
    }, REDIRECT_DELAY_MS);

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted || shouldSkipRedirect()) {
        clearTimeout(timer);
        setIsRedirecting(false);
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [isRedirecting]);

  return { isRedirecting };
}
