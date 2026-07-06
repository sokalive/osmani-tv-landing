import { useCallback, useEffect, useRef, useState } from "react";
import {
  APK_CONFIG,
  isSameOriginApk,
  resolveApkUrl,
} from "../config/download";
import {
  checkApkAvailability,
  downloadApkWithProgress,
  openInstallHandoff,
  saveBlobToDevice,
  triggerNativeDownload,
  triggerNavigationDownload,
  type DownloadProgress,
} from "../utils/apkDownload";
import { getBrowserProfile, isBackForwardNavigation } from "../utils/browser";

const SESSION_AUTO_KEY = "osmani_apk_auto_attempted";
const SESSION_COMPLETE_KEY = "osmani_apk_download_complete";

export type { DownloadProgress } from "../utils/apkDownload";

export type DownloadState =
  | "idle"
  | "preparing"
  | "downloading"
  | "complete"
  | "blocked"
  | "error"
  | "unavailable";

export type DownloadStatus = {
  state: DownloadState;
  progress: import("../utils/apkDownload").DownloadProgress;
  message: string;
  browserLabel: string;
  showInstallHint: boolean;
};

function getInitialState(): DownloadState {
  if (sessionStorage.getItem(SESSION_COMPLETE_KEY) === "true") {
    return "complete";
  }
  return "idle";
}

export function useApkDownload() {
  const [state, setState] = useState<DownloadState>(getInitialState);
  const [progress, setProgress] = useState<DownloadProgress>({
    loaded: 0,
    total: null,
    percent: null,
  });
  const [message, setMessage] = useState("");
  const [showInstallHint, setShowInstallHint] = useState(false);
  const blobRef = useRef<Blob | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const browser = getBrowserProfile();

  const markComplete = useCallback((blob: Blob | null) => {
    if (blob) blobRef.current = blob;
    sessionStorage.setItem(SESSION_COMPLETE_KEY, "true");
    setState("complete");
    setMessage("Download complete");
    setShowInstallHint(true);
  }, []);

  const startDownload = useCallback(
    async (options: { manual?: boolean; auto?: boolean } = {}) => {
      if (busyRef.current) return;
      if (
        sessionStorage.getItem(SESSION_COMPLETE_KEY) === "true" &&
        !options.manual
      ) {
        return;
      }

      busyRef.current = true;
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const url = resolveApkUrl();
      setState("preparing");
      setMessage("Preparing download…");
      setProgress({ loaded: 0, total: null, percent: null });
      setShowInstallHint(false);

      try {
        const available = await checkApkAvailability(url);
        if (!available) {
          setState("unavailable");
          setMessage(
            "APK not uploaded yet. Place osmani-tv.apk in public/downloads/ or set EXTERNAL_APK_URL.",
          );
          return;
        }

        if (options.auto && !browser.supportsAutoDownload) {
          sessionStorage.setItem(SESSION_AUTO_KEY, "true");
          setState("blocked");
          setMessage(
            `Automatic download blocked in ${browser.label} — tap Download`,
          );
          return;
        }

        setState("downloading");
        setMessage("Downloading…");

        const sameOrigin = isSameOriginApk(url);

        if (sameOrigin) {
          try {
            const result = await downloadApkWithProgress(
              url,
              setProgress,
              abortRef.current.signal,
            );
            saveBlobToDevice(result.blob!, APK_CONFIG.fileName);
            markComplete(result.blob);
            return;
          } catch {
            // Fall through to native anchor below
          }
        }

        if (browser.isMetaInApp || browser.isSamsungInternet) {
          triggerNavigationDownload(url);
          sessionStorage.setItem(SESSION_COMPLETE_KEY, "true");
          setState("complete");
          setMessage("Download started — check your notifications");
          setShowInstallHint(true);
          return;
        }

        triggerNativeDownload(url, APK_CONFIG.fileName);
        sessionStorage.setItem(SESSION_COMPLETE_KEY, "true");
        setState("complete");
        setMessage("Download started — check your notifications");
        setShowInstallHint(true);
      } catch (error) {
        if (options.auto) {
          sessionStorage.setItem(SESSION_AUTO_KEY, "true");
          setState("blocked");
          setMessage("Automatic download blocked — tap Download");
        } else {
          setState("error");
          setMessage(
            error instanceof Error ? error.message : "Download failed",
          );
        }
      } finally {
        busyRef.current = false;
      }
    },
    [browser, markComplete],
  );

  const startDownloadRef = useRef(startDownload);

  useEffect(() => {
    startDownloadRef.current = startDownload;
  }, [startDownload]);

  const handleOpenInstall = useCallback(async () => {
    const shared = await openInstallHandoff(blobRef.current);
    if (!shared) {
      setShowInstallHint(true);
      setMessage(
        "Open your Downloads folder or notification shade, then tap osmani-tv.apk to install.",
      );
    }
  }, []);

  const handlePrimaryAction = useCallback(() => {
    if (state === "complete") {
      void handleOpenInstall();
      return;
    }
    void startDownload({ manual: true });
  }, [handleOpenInstall, startDownload, state]);

  const handleDownloadAgain = useCallback(() => {
    sessionStorage.removeItem(SESSION_COMPLETE_KEY);
    blobRef.current = null;
    void startDownload({ manual: true });
  }, [startDownload]);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_AUTO_KEY) === "true") return;
    if (isBackForwardNavigation()) return;
    if (sessionStorage.getItem(SESSION_COMPLETE_KEY) === "true") return;

    sessionStorage.setItem(SESSION_AUTO_KEY, "true");
    void startDownloadRef.current({ auto: true });
  }, []);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted && sessionStorage.getItem(SESSION_COMPLETE_KEY) === "true") {
        setState("complete");
        setMessage("Download complete");
        setShowInstallHint(true);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return {
    state,
    progress,
    message,
    browserLabel: browser.label,
    showInstallHint,
    isMetaInApp: browser.isMetaInApp,
    handlePrimaryAction,
    handleDownloadAgain,
    handleOpenInstall,
  };
}
