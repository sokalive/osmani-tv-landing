import { useCallback, useEffect, useRef, useState } from "react";
import { APK_CONFIG, isSameOriginApk, resolveApkUrl } from "../config/download";
import {
  attemptInstallHandoff,
  downloadApkWithProgress,
  resetInstallHandoffState,
  shareApkFile,
  triggerNavigationDownload,
  type DownloadProgress,
} from "../utils/apkDownload";
import {
  pathUsesCdnNavigation,
  pathUsesVerifiedFetch,
  selectAndroidDownloadPath,
} from "../utils/androidDownloadPath";
import { probeApkAvailability } from "../utils/apkValidation";
import { getBrowserProfile, isBackForwardNavigation } from "../utils/browser";
import {
  attemptExternalBrowserHandoff,
  shouldAttemptIabExternalHandoff,
} from "../utils/externalBrowser";
import {
  cancelActiveDownloadAttempt,
  consumeModuleAutoStart,
  endDownloadAttempt,
  isActiveDownloadAttempt,
  tryBeginDownloadAttempt,
} from "../utils/downloadCoordinator";
import {
  type DownloadState,
  isVerifiedCompleteState,
} from "../utils/downloadState";
import { formatProgressLabel } from "../utils/formatBytes";

const SESSION_AUTO_KEY = "osmani_apk_auto_attempted";
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

function isValidationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message;
  return (
    msg.includes("HTML") ||
    msg.includes("Invalid APK") ||
    msg.includes("mismatch") ||
    msg.includes("SHA-256")
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
  const browser = getBrowserProfile();

  useEffect(() => {
    if (
      sessionStorage.getItem(SESSION_VERIFIED_KEY) === "true" &&
      !blobRef.current
    ) {
      sessionStorage.removeItem(SESSION_VERIFIED_KEY);
    }
  }, []);

  const markVerifiedComplete = useCallback((blob: Blob, attemptId: number) => {
    if (!isActiveDownloadAttempt(attemptId)) return;

    blobRef.current = blob;
    setHasBlobInMemory(true);
    sessionStorage.setItem(SESSION_VERIFIED_KEY, "true");
    setState("install_handoff");
    setMessage("Download complete — tap OPEN / INSTALL to save via browser.");
  }, []);

  const startBrowserHandoff = useCallback((attemptId: number, detail?: string) => {
    if (!isActiveDownloadAttempt(attemptId)) return;

    blobRef.current = null;
    resetInstallHandoffState();
    setHasBlobInMemory(false);
    setProgress({ loaded: 0, total: null, percent: null });
    setState("browser_handoff");
    setMessage(
      detail ??
        `Download started in ${browser.label} — check your notification shade for ${APK_CONFIG.fileName}. Tap the download to open the Android installer.`,
    );
  }, [browser.label]);

  const startDirectCdnDownload = useCallback(
    async (attemptId: number) => {
      const url = resolveApkUrl();

      setState("starting");
      setMessage("Preparing download…");

      const probe = await probeApkAvailability(url);
      if (!isActiveDownloadAttempt(attemptId)) return;

      if (!probe.valid) {
        if (probe.reason.includes("404") || probe.reason.includes("not found")) {
          setState("unavailable");
          setMessage("APK unavailable at the configured URL.");
        } else {
          setState("error");
          setMessage(probe.reason);
        }
        return;
      }

      triggerNavigationDownload(url);
      startBrowserHandoff(
        attemptId,
        `Downloading ${APK_CONFIG.fileName} via ${browser.label}. Progress appears in your notification shade — tap the download when complete to install.`,
      );
    },
    [browser.label, startBrowserHandoff],
  );

  const startVerifiedFetchDownload = useCallback(
    async (attemptId: number, signal: AbortSignal) => {
      const url = resolveApkUrl();
      let bytesReceived = 0;

      const onProgress = (p: DownloadProgress) => {
        if (!isActiveDownloadAttempt(attemptId)) return;
        bytesReceived = p.loaded;
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
        const result = await downloadApkWithProgress(url, onProgress, signal);
        if (!isActiveDownloadAttempt(attemptId)) return;

        setState("verifying");
        setMessage("Verifying download…");
        markVerifiedComplete(result.blob!, attemptId);
      } catch (fetchError) {
        if (!isActiveDownloadAttempt(attemptId)) return;

        if (bytesReceived > 0) {
          resetInstallHandoffState();
          blobRef.current = null;
          setHasBlobInMemory(false);
          sessionStorage.removeItem(SESSION_VERIFIED_KEY);
          setState("error");
          setMessage(
            "Download interrupted after partial transfer. Tap Download to retry.",
          );
          return;
        }

        if (isValidationError(fetchError)) {
          resetInstallHandoffState();
          blobRef.current = null;
          setHasBlobInMemory(false);
          sessionStorage.removeItem(SESSION_VERIFIED_KEY);
          setState("error");
          setMessage(
            fetchError instanceof Error
              ? fetchError.message
              : "Verification failed",
          );
          return;
        }

        const canNativeFallback =
          !isSameOriginApk(url) &&
          (isFetchBlockedError(fetchError) || browser.isAndroid);

        if (canNativeFallback && isActiveDownloadAttempt(attemptId)) {
          await startDirectCdnDownload(attemptId);
          return;
        }

        setState("error");
        setMessage(
          fetchError instanceof Error ? fetchError.message : "Download failed",
        );
      }
    },
    [browser.isAndroid, markVerifiedComplete, startDirectCdnDownload],
  );

  const startDownload = useCallback(
    async (
      options: {
        manual?: boolean;
        auto?: boolean;
        forceRetry?: boolean;
        preferVerifiedFetch?: boolean;
      } = {},
    ) => {
      if (
        !options.forceRetry &&
        sessionStorage.getItem(SESSION_VERIFIED_KEY) === "true" &&
        blobRef.current
      ) {
        return;
      }

      const began = tryBeginDownloadAttempt();
      if (!began) return;

      const { attemptId, signal } = began;

      resetInstallHandoffState();

      const path = selectAndroidDownloadPath(browser, {
        preferVerifiedFetch: options.preferVerifiedFetch,
      });

      if (path === "iab-external-browser") {
        endDownloadAttempt(attemptId);
        setState("starting");
        setMessage("Opening in Chrome for download…");
        attemptExternalBrowserHandoff();
        return;
      }

      if (options.auto && !browser.supportsAutoDownload) {
        endDownloadAttempt(attemptId);
        setState("blocked");
        setMessage(
          browser.isMetaInApp
            ? "Tap Download to open Chrome or start the APK download."
            : `Automatic download blocked in ${browser.label} — tap Download`,
        );
        return;
      }

      try {
        if (pathUsesCdnNavigation(path)) {
          await startDirectCdnDownload(attemptId);
          return;
        }

        if (pathUsesVerifiedFetch(path)) {
          await startVerifiedFetchDownload(attemptId, signal);
        }
      } catch (error) {
        if (!isActiveDownloadAttempt(attemptId)) return;
        const msg = error instanceof Error ? error.message : "Download failed";
        if (options.auto) {
          setState("blocked");
          setMessage("Automatic download blocked — tap Download");
        } else {
          setState("error");
          setMessage(msg);
        }
      } finally {
        endDownloadAttempt(attemptId);
      }
    },
    [
      browser,
      startDirectCdnDownload,
      startVerifiedFetchDownload,
    ],
  );

  const startDownloadRef = useRef(startDownload);

  useEffect(() => {
    startDownloadRef.current = startDownload;
  }, [startDownload]);

  const handleOpenInstall = useCallback(async () => {
    if (!isVerifiedCompleteState(state) || !blobRef.current) {
      return;
    }
    const result = await attemptInstallHandoff(blobRef.current, browser, {
      browserFetchComplete: true,
    });
    setMessage(result.message);
  }, [browser, state]);

  const handleShareApk = useCallback(async () => {
    if (!blobRef.current) return;
    const result = await shareApkFile(blobRef.current);
    setMessage(result.message);
  }, []);

  const handlePrimaryAction = useCallback(() => {
    if (isVerifiedCompleteState(state)) {
      void handleOpenInstall();
      return;
    }

    if (
      browser.isMetaInApp &&
      shouldAttemptIabExternalHandoff(browser)
    ) {
      setState("starting");
      setMessage("Opening in Chrome…");
      attemptExternalBrowserHandoff();
      return;
    }

    void startDownload({ manual: true });
  }, [browser, handleOpenInstall, startDownload, state]);

  const handleDownloadAgain = useCallback(() => {
    sessionStorage.removeItem(SESSION_VERIFIED_KEY);
    resetInstallHandoffState();
    blobRef.current = null;
    setHasBlobInMemory(false);
    void startDownload({ manual: true, forceRetry: true });
  }, [startDownload]);

  const handleCancel = useCallback(() => {
    cancelActiveDownloadAttempt();
    resetInstallHandoffState();
    blobRef.current = null;
    setHasBlobInMemory(false);
    sessionStorage.removeItem(SESSION_VERIFIED_KEY);
    setState("cancelled");
    setMessage("Download cancelled.");
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_AUTO_KEY) === "true") return;
    if (isBackForwardNavigation()) return;
    if (!consumeModuleAutoStart()) return;

    sessionStorage.setItem(SESSION_AUTO_KEY, "true");
    void startDownloadRef.current({ auto: true });
  }, []);

  const canShareApk =
    hasBlobInMemory &&
    isVerifiedCompleteState(state) &&
    browser.supportsWebShareFiles;

  const showInstallHint =
    isVerifiedCompleteState(state) || state === "browser_handoff";

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
