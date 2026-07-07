/** Truthful APK-first download state machine — no fake progress. */

export type DownloadState =
  | "idle"
  | "starting"
  | "browser_handoff"
  | "unavailable"
  | "blocked"
  | "error";

export function isBrowserHandoffState(state: DownloadState): boolean {
  return state === "browser_handoff";
}

export function isBusyState(state: DownloadState): boolean {
  return state === "starting";
}

export function getInstallButtonLabel(state: DownloadState): string {
  switch (state) {
    case "starting":
      return "INAANZA…";
    case "browser_handoff":
      return "APK INAPAKULIWA…";
    case "unavailable":
      return "HAIPATIKANI";
    case "error":
    case "blocked":
      return "INSTALL APK";
    default:
      return "INSTALL APK";
  }
}

export function getStatusMessage(state: DownloadState, custom?: string): string {
  if (custom) return custom;
  switch (state) {
    case "starting":
      return "Inaanza kupakua…";
    case "browser_handoff":
      return "APK inapakuliwa — angalia arifa za simu yako, kisha bonyeza ili kusakinisha.";
    case "unavailable":
      return "APK haipatikani kwa sasa.";
    case "error":
      return "Imeshindikana kuanza upakuaji. Jaribu tena.";
    case "blocked":
      return "Bonyeza INSTALL APK ili kupakua.";
    default:
      return "Bonyeza ili kupakua na kusakinisha";
  }
}
