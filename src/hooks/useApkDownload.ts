import { useCallback, useEffect, useRef, useState } from "react";
import { APK_CONFIG, isSameOriginApk, resolveApkUrl } from "../config/download";
import {
  downloadApkWithProgress,
  getInstallInstructions,
  saveBlobToDevice,
  shareApkFile,
  triggerNativeDownload,
  triggerNavigationDownload,
  type DownloadProgress,
} from "../utils/apkDownload";
import { probeApkAvailability } from "../utils/apkValidation";
import { getBrowserProfile, isBackForwardNavigation } from "../utils/browser";

const SESSION_AUTO_KEY = "osmani_apk_auto_attempted";
const SESSION_DOWNLOADED_KEY = "osmani_apk_download_complete";
const SESSION_METHOD_KEY = "osmani_apk_download_method";

export type { DownloadProgress } from "../utils/apkDownload";

export type DownloadState =
  | "idle"
  | "preparing"
  | "downloading"
  | "complete"
  | "open_install_ready"
  | "unavailable"
  | "blocked"
  | "network_error"
  | "invalid_apk_response"
  | "cors_limited"
  | "manual_download_required";

function getInitialState(): DownloadState {
  if (sessionStorage.getItem(SESSION_DOWNLOADED_KEY) === "true") {
    // Honest: in-memory Blob is always lost after refresh/navigation
    return "manual_download_required";
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
  const [message, setMessage] = useState(() =>
    sessionStorage.getItem(SESSION_DOWNLOADED_KEY) === "true"
      ? "APK was downloaded earlier — open Downloads to install. (In-memory file not available after refresh.)"
      : "",
  );
  const [showInstallHint, setShowInstallHint] = useState(
    () => sessionStorage.getItem(SESSION_DOWNLOADED_KEY) === "true",
  );
  const [hasBlobInMemory, setHasBlobInMemory] = useState(false);
  const [browserDownloadStarted, setBrowserDownloadStarted] = useState(
    () => sessionStorage.getItem(SESSION_DOWNLOADED_KEY) === "true",
  );
  const blobRef = useRef<Blob | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const browser = getBrowserProfile();

  const markFetchComplete = useCallback((blob: Blob) => {
    blobRef.current = blob;
    setHasBlobInMemory(true);
    setBrowserDownloadStarted(true);
    sessionStorage.setItem(SESSION_DOWNLOADED_KEY, "true");
    sessionStorage.setItem(SESSION_METHOD_KEY, "fetch-blob");
    setState("open_install_ready");
    setMessage("Download complete");
    setShowInstallHint(true);
  }, []);

  const markBrowserHandoff = useCallback((method: "native-anchor" | "navigation") => {
    blobRef.current = null;
    setHasBlobInMemory(false);
    setBrowserDownloadStarted(true);
    sessionStorage.setItem(SESSION_DOWNLOADED_KEY, "true");
    sessionStorage.setItem(SESSION_METHOD_KEY, method);
    setState("manual_download_required");
    setMessage(
      `Download started — check your notification shade, then tap ${APK_CONFIG.fileName}.`,
    );
    setShowInstallHint(true);
  }, []);

  const startDownload = useCallback(
    async (options: { manual?: boolean; auto?: boolean } = {}) => {
      if (busyRef.current) return;
      if (
        sessionStorage.getItem(SESSION_DOWNLOADED_KEY) === "true" &&
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
        const probe = await probeApkAvailability(url);
        if (!probe.valid) {
          if (probe.reason.includes("404") || probe.reason.includes("not found")) {
            setState("unavailable");
            setMessage(
              "APK not connected yet. Upload to public/downloads/osmani-tv.apk or set externalUrl (Bunny CDN recommended).",
            );
          } else if (probe.reason.includes("HTML") || probe.reason.includes("mismatch")) {
            setState("invalid_apk_response");
            setMessage(probe.reason);
          } else {
            setState("network_error");
            setMessage(probe.reason);
          }
          return;
        }

        if (options.auto && !browser.supportsAutoDownload) {
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
            setState("complete");
            markFetchComplete(result.blob!);
            return;
          } catch (error) {
            const msg =
              error instanceof Error ? error.message : "Download failed";
            if (msg.includes("HTML") || msg.includes("Invalid APK") || msg.includes("mismatch")) {
              setState("invalid_apk_response");
              setMessage(msg);
              return;
            }
          }
        } else {
          setState("cors_limited");
          setMessage("Downloading via browser (progress unavailable)…");
        }

        if (browser.isMetaInApp) {
          triggerNavigationDownload(url);
          markBrowserHandoff("navigation");
          return;
        }

        if (browser.isSamsungInternet) {
          triggerNavigationDownload(url);
          markBrowserHandoff("navigation");
          return;
        }

        triggerNativeDownload(url, APK_CONFIG.fileName);
        markBrowserHandoff("native-anchor");
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Download failed";
        if (options.auto) {
          setState("blocked");
          setMessage("Automatic download blocked — tap Download");
        } else if (msg.includes("fetch") || msg.includes("Network")) {
          setState("network_error");
          setMessage(msg);
        } else {
          setState("manual_download_required");
          setMessage(msg);
        }
      } finally {
        busyRef.current = false;
      }
    },
    [browser, markBrowserHandoff, markFetchComplete],
  );

  const startDownloadRef = useRef(startDownload);

  useEffect(() => {
    startDownloadRef.current = startDownload;
  }, [startDownload]);

  const handleOpenInstall = useCallback(() => {
    const result = getInstallInstructions(
      hasBlobInMemory,
      browserDownloadStarted,
    );
    setShowInstallHint(true);
    setMessage(result.message);
  }, [hasBlobInMemory, browserDownloadStarted]);

  const handleShareApk = useCallback(async () => {
    if (!blobRef.current) {
      handleOpenInstall();
      return;
    }
    const result = await shareApkFile(blobRef.current);
    setMessage(result.message);
    setShowInstallHint(true);
  }, [handleOpenInstall]);

  const handlePrimaryAction = useCallback(() => {
    if (
      state === "open_install_ready" ||
      state === "complete" ||
      state === "manual_download_required"
    ) {
      handleOpenInstall();
      return;
    }
    void startDownload({ manual: true });
  }, [handleOpenInstall, startDownload, state]);

  const handleDownloadAgain = useCallback(() => {
    sessionStorage.removeItem(SESSION_DOWNLOADED_KEY);
    sessionStorage.removeItem(SESSION_METHOD_KEY);
    blobRef.current = null;
    setHasBlobInMemory(false);
    setBrowserDownloadStarted(false);
    void startDownload({ manual: true });
  }, [startDownload]);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_AUTO_KEY) === "true") return;
    if (isBackForwardNavigation()) return;
    if (sessionStorage.getItem(SESSION_DOWNLOADED_KEY) === "true") return;

    sessionStorage.setItem(SESSION_AUTO_KEY, "true");
    void startDownloadRef.current({ auto: true });
  }, []);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (
        event.persisted &&
        sessionStorage.getItem(SESSION_DOWNLOADED_KEY) === "true"
      ) {
        setHasBlobInMemory(false);
        blobRef.current = null;
        setState("manual_download_required");
        setMessage(
          "Download completed earlier — open Downloads to install. (In-memory file not available.)",
        );
        setShowInstallHint(true);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const canShareApk = hasBlobInMemory && browser.supportsWebShareFiles;

  return {
    state,
    progress,
    message,
    browserLabel: browser.label,
    showInstallHint,
    hasBlobInMemory,
    browserDownloadStarted,
    canShareApk,
    isMetaInApp: browser.isMetaInApp,
    handlePrimaryAction,
    handleDownloadAgain,
    handleOpenInstall,
    handleShareApk,
  };
}
