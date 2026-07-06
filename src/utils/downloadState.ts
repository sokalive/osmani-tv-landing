/** Truthful download state machine — "started" ≠ "completed". */

export type DownloadState =
  | "idle"
  | "starting"
  | "downloading"
  | "verifying"
  | "completed"
  | "install_handoff"
  | "browser_handoff"
  | "unavailable"
  | "blocked"
  | "error"
  | "cancelled";

/** States where OPEN / INSTALL is allowed (verified bytes in memory). */
export function isVerifiedCompleteState(state: DownloadState): boolean {
  return state === "completed" || state === "install_handoff";
}

/** States where UI is actively transferring or verifying bytes via fetch. */
export function isActiveFetchState(state: DownloadState): boolean {
  return (
    state === "starting" ||
    state === "downloading" ||
    state === "verifying"
  );
}

/** Browser download manager has the file; JS cannot verify completion. */
export function isBrowserHandoffState(state: DownloadState): boolean {
  return state === "browser_handoff";
}

export function getPrimaryButtonLabel(state: DownloadState): string {
  switch (state) {
    case "starting":
      return "Preparing download…";
    case "downloading":
      return "Downloading…";
    case "verifying":
      return "Verifying…";
    case "completed":
    case "install_handoff":
      return "OPEN / INSTALL";
    case "browser_handoff":
      return "Download";
    case "blocked":
    case "error":
      return "Download";
    case "cancelled":
      return "Download";
    case "unavailable":
      return "Unavailable";
    default:
      return "Download";
  }
}

export function shouldShowDownloadAgain(state: DownloadState): boolean {
  return isVerifiedCompleteState(state);
}

export function shouldShowInstallHint(state: DownloadState): boolean {
  return isVerifiedCompleteState(state) || state === "browser_handoff";
}

export function calculateProgressPercent(
  loaded: number,
  total: number | null,
): number | null {
  if (total === null || total <= 0) return null;
  return Math.min(100, Math.round((loaded / total) * 100));
}
