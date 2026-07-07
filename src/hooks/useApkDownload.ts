import { useCallback, useState } from "react";
import {
  clearApkTransferSession,
  hasApkTransferStarted,
  initiateApkCdnDownload,
} from "../utils/apkDelivery";
import { probeApkAvailability } from "../utils/apkValidation";
import { getBrowserProfile } from "../utils/browser";
import {
  attemptExternalBrowserHandoff,
  shouldAttemptIabExternalHandoff,
} from "../utils/externalBrowser";
import {
  cancelActiveDownloadAttempt,
  endDownloadAttempt,
  tryBeginDownloadAttempt,
} from "../utils/downloadCoordinator";
import {
  type DownloadState,
  getStatusMessage,
} from "../utils/downloadState";
import { resolveApkUrl } from "../config/download";

export type { DownloadState } from "../utils/downloadState";

export function useApkDownload() {
  const [state, setState] = useState<DownloadState>("idle");
  const [message, setMessage] = useState("");
  const browser = getBrowserProfile();

  const handleInstallApk = useCallback(async () => {
    if (hasApkTransferStarted() && state === "browser_handoff") {
      return;
    }

    const began = tryBeginDownloadAttempt();
    if (!began) return;

    const { attemptId } = began;

    try {
      if (browser.isMetaInApp && shouldAttemptIabExternalHandoff(browser)) {
        endDownloadAttempt(attemptId);
        setState("starting");
        setMessage("Inafungua Chrome…");
        attemptExternalBrowserHandoff();
        return;
      }

      if (hasApkTransferStarted()) {
        endDownloadAttempt(attemptId);
        setState("browser_handoff");
        setMessage(getStatusMessage("browser_handoff"));
        return;
      }

      setState("starting");
      setMessage(getStatusMessage("starting"));

      const probe = await probeApkAvailability(resolveApkUrl());
      if (!probe.valid) {
        setState(probe.reason.includes("404") ? "unavailable" : "error");
        setMessage(probe.reason);
        return;
      }

      initiateApkCdnDownload();
      setState("browser_handoff");
      setMessage(getStatusMessage("browser_handoff"));
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Imeshindikana kuanza upakuaji.";
      setState("error");
      setMessage(msg);
    } finally {
      endDownloadAttempt(attemptId);
    }
  }, [browser, state]);

  const handleRetry = useCallback(() => {
    clearApkTransferSession();
    cancelActiveDownloadAttempt();
    setState("idle");
    setMessage("");
    void handleInstallApk();
  }, [handleInstallApk]);

  return {
    state,
    message: message || getStatusMessage(state),
    browserLabel: browser.label,
    isMetaInApp: browser.isMetaInApp,
    handleInstallApk,
    handleRetry,
  };
}
