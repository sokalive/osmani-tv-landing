import { useCallback, useEffect, useRef, useState } from "react";
import { APK_CONFIG, isSameOriginApk, resolveApkUrl } from "../config/download";
import {
  attemptInstallHandoff,
  downloadApkWithProgress,
  saveBlobToDevice,
  triggerNativeDownload,
  triggerNavigationDownload,
  type DownloadProgress,
} from "../utils/apkDownload";
import { probeApkAvailability } from "../utils/apkValidation";
import { getBrowserProfile, isBackForwardNavigation } from "../utils/browser";

const SESSION_AUTO_KEY = "osmani_apk_auto_attempted";
const SESSION_COMPLETE_KEY = "osmani_apk_download_complete";

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
  if (sessionStorage.getItem(SESSION_COMPLETE_KEY) === "true") {
    return "open_install_ready";
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
  const [showInstallHint, setShowInstallHint] = useState(
    () => sessionStorage.getItem(SESSION_COMPLETE_KEY) === "true",
  );
  const [hasBlobInMemory, setHasBlobInMemory] = useState(false);
  const blobRef = useRef<Blob | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const browser = getBrowserProfile();

  const markDownloadSuccess = useCallback(
    (blob: Blob | null, userMessage: string) => {
      if (blob) {
        blobRef.current = blob;
        setHasBlobInMemory(true);
      } else {
        setHasBlobInMemory(false);
      }
      sessionStorage.setItem(SESSION_COMPLETE_KEY, "true");
      setState("open_install_ready");
      setMessage(userMessage);
      setShowInstallHint(true);
    },
    [],
  );

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
        const probe = await probeApkAvailability(url);
        if (!probe.valid) {
          if (probe.reason.includes("404") || probe.reason.includes("not found")) {
            setState("unavailable");
            setMessage(
              "APK not uploaded yet. Place osmani-tv.apk in public/downloads/ or set externalUrl in src/config/download.ts.",
            );
          } else if (probe.reason.includes("HTML")) {
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
            setMessage("Download complete");
            markDownloadSuccess(result.blob, "Download complete");
            return;
          } catch (error) {
            const msg =
              error instanceof Error ? error.message : "Download failed";
            if (msg.includes("HTML") || msg.includes("Invalid APK")) {
              setState("invalid_apk_response");
              setMessage(msg);
              return;
            }
            // Fall through to native anchor for same-origin edge cases
          }
        } else {
          // Cross-origin: progress requires CORS; use native download
          setState("cors_limited");
          setMessage("Downloading via browser (progress unavailable)…");
        }

        if (browser.isMetaInApp) {
          triggerNavigationDownload(url);
          markDownloadSuccess(
            null,
            "Download started — check your notifications, then tap the file to install.",
          );
          return;
        }

        if (browser.isSamsungInternet) {
          triggerNavigationDownload(url);
          markDownloadSuccess(
            null,
            "Download started in Samsung Internet — open Downloads to install.",
          );
          return;
        }

        triggerNativeDownload(url, APK_CONFIG.fileName);
        markDownloadSuccess(
          null,
          "Download started — check your notifications, then tap Osmani-TV-Max.apk.",
        );
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
    [browser, markDownloadSuccess],
  );

  const startDownloadRef = useRef(startDownload);

  useEffect(() => {
    startDownloadRef.current = startDownload;
  }, [startDownload]);

  const handleOpenInstall = useCallback(async () => {
    const result = await attemptInstallHandoff(blobRef.current, {
      preferShare: browser.isAndroid && browser.supportsWebShareFiles,
    });
    setShowInstallHint(true);
    setMessage(result.message);
    if (!blobRef.current) {
      setState("manual_download_required");
    }
  }, [browser.isAndroid, browser.supportsWebShareFiles]);

  const handlePrimaryAction = useCallback(() => {
    if (state === "open_install_ready" || state === "complete") {
      void handleOpenInstall();
      return;
    }
    void startDownload({ manual: true });
  }, [handleOpenInstall, startDownload, state]);

  const handleDownloadAgain = useCallback(() => {
    sessionStorage.removeItem(SESSION_COMPLETE_KEY);
    blobRef.current = null;
    setHasBlobInMemory(false);
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
      if (
        event.persisted &&
        sessionStorage.getItem(SESSION_COMPLETE_KEY) === "true"
      ) {
        setState("open_install_ready");
        setMessage(
          blobRef.current
            ? "Download complete"
            : "Download completed earlier — open Downloads to install.",
        );
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
    hasBlobInMemory,
    isMetaInApp: browser.isMetaInApp,
    handlePrimaryAction,
    handleDownloadAgain,
    handleOpenInstall,
  };
}
