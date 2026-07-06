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
import {
  type DownloadState,
  isVerifiedCompleteState,
} from "../utils/downloadState";
import { formatProgressLabel } from "../utils/formatBytes";

const SESSION_AUTO_KEY = "osmani_apk_auto_attempted";
/** Only set when fetch+verify completed with blob in this session */
const SESSION_VERIFIED_KEY = "osmani_apk_verified_complete";

export type { DownloadProgress } from "../utils/apkDownload";
export type { DownloadState } from "../utils/downloadState";

function getInitialState(): DownloadState {
  return "idle";
}

function isFetchBlockedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("cors") ||
    msg.includes("load failed")
  );
}

export function useApkDownload() {
  const [state, setState] = useState<DownloadState>(getInitialState);
  const [progress, setProgress] = useState<DownloadProgress>({
    loaded: 0,
    total: null,
    percent: null,
  });
  const [message, setMessage] = useState("");
  const [hasBlobInMemory, setHasBlobInMemory] = useState(false);
  const blobRef = useRef<Blob | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const browser = getBrowserProfile();

  const markVerifiedComplete = useCallback((blob: Blob) => {
    blobRef.current = blob;
    setHasBlobInMemory(true);
    sessionStorage.setItem(SESSION_VERIFIED_KEY, "true");
    setState("install_handoff");
    setMessage("Download complete — tap OPEN / INSTALL for install steps.");
  }, []);

  const startBrowserHandoff = useCallback(() => {
    blobRef.current = null;
    setHasBlobInMemory(false);
    setProgress({ loaded: 0, total: null, percent: null });
    setState("browser_handoff");
    setMessage(
      `Download started in ${browser.label} — check your notification shade for ${APK_CONFIG.fileName}. This page cannot detect when the browser finishes.`,
    );
  }, [browser.label]);

  const startDownload = useCallback(
    async (options: { manual?: boolean; auto?: boolean } = {}) => {
      if (busyRef.current) return;

      if (
        sessionStorage.getItem(SESSION_VERIFIED_KEY) === "true" &&
        hasBlobInMemory &&
        !options.manual
      ) {
        return;
      }

      busyRef.current = true;
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const url = resolveApkUrl();
      setState("starting");
      setMessage("Preparing download…");
      setProgress({ loaded: 0, total: null, percent: null });

      try {
        const probe = await probeApkAvailability(url);
        if (!probe.valid) {
          if (probe.reason.includes("404") || probe.reason.includes("not found")) {
            setState("unavailable");
            setMessage("APK unavailable at the configured URL.");
          } else if (
            probe.reason.includes("HTML") ||
            probe.reason.includes("mismatch")
          ) {
            setState("error");
            setMessage(probe.reason);
          } else {
            setState("error");
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

        const onProgress = (p: DownloadProgress) => {
          setProgress(p);
          if (p.total !== null && p.percent !== null) {
            setMessage(formatProgressLabel(p.loaded, p.total, p.percent));
          } else if (p.total !== null) {
            setMessage(formatProgressLabel(p.loaded, p.total, null));
          } else {
            setMessage("Downloading…");
          }
        };

        setState("downloading");
        setMessage("Downloading…");

        try {
          const result = await downloadApkWithProgress(
            url,
            onProgress,
            abortRef.current.signal,
          );

          setState("verifying");
          setMessage("Verifying download…");

          saveBlobToDevice(result.blob!, APK_CONFIG.fileName);
          setState("completed");
          markVerifiedComplete(result.blob!);
          return;
        } catch (fetchError) {
          if (
            !isSameOriginApk(url) &&
            isFetchBlockedError(fetchError) &&
            !options.manual
          ) {
            // Expected without Bunny CORS — fall through to browser handoff
          } else if (
            !isSameOriginApk(url) &&
            isFetchBlockedError(fetchError) &&
            options.manual
          ) {
            // manual retry still falls to browser path below
          } else if (fetchError instanceof Error) {
            const msg = fetchError.message;
            if (
              msg.includes("HTML") ||
              msg.includes("Invalid APK") ||
              msg.includes("mismatch") ||
              msg.includes("SHA-256")
            ) {
              setState("error");
              setMessage(msg);
              return;
            }
            if (!isSameOriginApk(url)) {
              // fall through to browser handoff
            } else {
              setState("error");
              setMessage(msg);
              return;
            }
          }
        }

        if (browser.isMetaInApp) {
          triggerNavigationDownload(url);
          startBrowserHandoff();
          return;
        }

        if (browser.isSamsungInternet) {
          triggerNavigationDownload(url);
          startBrowserHandoff();
          return;
        }

        triggerNativeDownload(url, APK_CONFIG.fileName);
        startBrowserHandoff();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Download failed";
        if (options.auto) {
          setState("blocked");
          setMessage("Automatic download blocked — tap Download");
        } else {
          setState("error");
          setMessage(msg);
        }
      } finally {
        busyRef.current = false;
      }
    },
    [browser, hasBlobInMemory, markVerifiedComplete, startBrowserHandoff],
  );

  const startDownloadRef = useRef(startDownload);

  useEffect(() => {
    startDownloadRef.current = startDownload;
  }, [startDownload]);

  const handleOpenInstall = useCallback(() => {
    if (!isVerifiedCompleteState(state) || !blobRef.current) {
      return;
    }
    const result = getInstallInstructions(true, true);
    setMessage(result.message);
  }, [state]);

  const handleShareApk = useCallback(async () => {
    if (!blobRef.current) return;
    const result = await shareApkFile(blobRef.current);
    setMessage(result.message);
  }, []);

  const handlePrimaryAction = useCallback(() => {
    if (isVerifiedCompleteState(state)) {
      handleOpenInstall();
      return;
    }
    if (state === "browser_handoff") {
      void startDownload({ manual: true });
      return;
    }
    void startDownload({ manual: true });
  }, [handleOpenInstall, startDownload, state]);

  const handleDownloadAgain = useCallback(() => {
    sessionStorage.removeItem(SESSION_VERIFIED_KEY);
    blobRef.current = null;
    setHasBlobInMemory(false);
    void startDownload({ manual: true });
  }, [startDownload]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setState("cancelled");
    setMessage("Download cancelled.");
    busyRef.current = false;
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_AUTO_KEY) === "true") return;
    if (isBackForwardNavigation()) return;

    sessionStorage.setItem(SESSION_AUTO_KEY, "true");
    void startDownloadRef.current({ auto: true });
  }, []);

  const canShareApk =
    hasBlobInMemory && isVerifiedCompleteState(state) && browser.supportsWebShareFiles;

  const showInstallHint = isVerifiedCompleteState(state);

  return {
    state,
    progress,
    message,
    browserLabel: browser.label,
    showInstallHint,
    hasBlobInMemory,
    canShareApk,
    isMetaInApp: browser.isMetaInApp,
    handlePrimaryAction,
    handleDownloadAgain,
    handleOpenInstall,
    handleShareApk,
    handleCancel,
  };
}
