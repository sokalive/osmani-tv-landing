import { APK_CONFIG } from "../config/download";
import type { BrowserProfile } from "./browser";
import {
  selectInstallHandoffPlan,
  tierLabel,
  type InstallHandoffAction,
  type InstallHandoffTier,
} from "./installHandoffStrategy";
import {
  isHtmlContentType,
  validateApkBlob,
  validateApkSha256,
} from "./apkValidation";

export type DownloadProgress = {
  loaded: number;
  total: number | null;
  percent: number | null;
};

export type DownloadResult = {
  blob: Blob | null;
  method: "fetch-blob" | "native-anchor" | "navigation";
};

export type InstallHandoffResult = {
  tier: InstallHandoffTier;
  targetTier: InstallHandoffTier;
  action: InstallHandoffAction;
  blobInMemory: boolean;
  /** True when Download Manager received a persisted copy (RAM→disk, not CDN) */
  browserDownloadStarted: boolean;
  shareAvailable: boolean;
  packageInstallerAvailable: false;
  message: string;
};

let retainedInstallObjectUrl: string | null = null;
let artifactPersistedToDownloads = false;

export function resetInstallHandoffState(): void {
  revokeInstallObjectUrl();
  artifactPersistedToDownloads = false;
}

export function hasPersistedArtifactToDownloads(): boolean {
  return artifactPersistedToDownloads;
}

export function revokeInstallObjectUrl(): void {
  if (retainedInstallObjectUrl) {
    URL.revokeObjectURL(retainedInstallObjectUrl);
    retainedInstallObjectUrl = null;
  }
}

function getOrCreateInstallObjectUrl(blob: Blob): string {
  if (!retainedInstallObjectUrl) {
    retainedInstallObjectUrl = URL.createObjectURL(
      new Blob([blob], { type: "application/vnd.android.package-archive" }),
    );
  }
  return retainedInstallObjectUrl;
}

export async function downloadApkWithProgress(
  url: string,
  onProgress: (progress: DownloadProgress) => void,
  signal?: AbortSignal,
): Promise<DownloadResult> {
  const response = await fetch(url, { cache: "no-store", signal });

  if (!response.ok) {
    throw new Error(`APK unavailable (HTTP ${response.status})`);
  }

  const responseType = response.headers.get("content-type");
  if (isHtmlContentType(responseType)) {
    throw new Error("Invalid APK response: received HTML instead of APK bytes");
  }

  const contentLength = response.headers.get("content-length");
  const total = contentLength
    ? parseInt(contentLength, 10)
    : APK_CONFIG.expectedSizeBytes;

  if (total !== null && total < APK_CONFIG.minBytes) {
    throw new Error(`Invalid APK response: file too small (${total} bytes)`);
  }

  if (!response.body) {
    const blob = await response.blob();
    const validation = await validateApkBlob(blob);
    if (!validation.valid) throw new Error(validation.reason);
    const hashCheck = await validateApkSha256(blob);
    if (!hashCheck.valid) throw new Error(hashCheck.reason);
    onProgress({ loaded: blob.size, total: blob.size, percent: 100 });
    return { blob, method: "fetch-blob" };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  onProgress({ loaded: 0, total, percent: total ? 0 : null });

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.length;
      onProgress({
        loaded,
        total,
        percent: total ? Math.min(100, Math.round((loaded / total) * 100)) : null,
      });
    }
  }

  const blob = new Blob(chunks as BlobPart[], {
    type: "application/vnd.android.package-archive",
  });

  const validation = await validateApkBlob(blob);
  if (!validation.valid) throw new Error(validation.reason);

  const hashCheck = await validateApkSha256(blob);
  if (!hashCheck.valid) throw new Error(hashCheck.reason);

  return { blob, method: "fetch-blob" };
}

export function triggerNativeDownload(url: string, fileName: string): DownloadResult {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  return { blob: null, method: "native-anchor" };
}

export function triggerNavigationDownload(url: string): DownloadResult {
  window.location.assign(url);
  return { blob: null, method: "navigation" };
}

/**
 * Writes verified in-memory APK bytes to the browser Download Manager.
 * Does not re-fetch from CDN. Used for OS-level install handoff (Tier 2).
 */
export function persistVerifiedBlobToDownloads(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(
    new Blob([blob], { type: "application/vnd.android.package-archive" }),
  );
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

/** @deprecated Use persistVerifiedBlobToDownloads — kept for test compatibility */
export function saveBlobToDevice(blob: Blob, fileName: string): void {
  persistVerifiedBlobToDownloads(blob, fileName);
}

export function isShareAvailableForApk(blob: Blob): boolean {
  const file = new File([blob], APK_CONFIG.fileName, {
    type: "application/vnd.android.package-archive",
  });
  return (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  );
}

function openBlobWithAnchor(objectUrl: string): void {
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.type = "application/vnd.android.package-archive";
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function persistOnce(blob: Blob): boolean {
  if (artifactPersistedToDownloads) return false;
  persistVerifiedBlobToDownloads(blob, APK_CONFIG.fileName);
  artifactPersistedToDownloads = true;
  return true;
}

async function executeHandoffStep(
  step: InstallHandoffAction,
  blob: Blob,
  profile: BrowserProfile,
  plan: ReturnType<typeof selectInstallHandoffPlan>,
): Promise<InstallHandoffResult | null> {
  const shareAvailable = isShareAvailableForApk(blob);

  switch (step) {
    case "web-share": {
      if (!shareAvailable) return null;
      const file = new File([blob], APK_CONFIG.fileName, {
        type: "application/vnd.android.package-archive",
      });
      try {
        await navigator.share({ files: [file], title: APK_CONFIG.fileName });
        return {
          tier: 1,
          targetTier: plan.targetTier,
          action: "web-share",
          blobInMemory: true,
          browserDownloadStarted: false,
          shareAvailable: true,
          packageInstallerAvailable: false,
          message:
            "Android share sheet opened. If Package Installer appears, choose it to reach Cancel / Install.",
        };
      } catch {
        return null;
      }
    }

    case "persist-to-downloads": {
      const firstPersist = persistOnce(blob);
      return {
        tier: 2,
        targetTier: plan.targetTier,
        action: "persist-to-downloads",
        blobInMemory: true,
        browserDownloadStarted: true,
        shareAvailable,
        packageInstallerAvailable: false,
        message: firstPersist
          ? `APK handed to Android Downloads. Tap the ${profile.label} download notification for ${APK_CONFIG.fileName} — that opens the real Cancel / Install installer.`
          : `APK is already in Downloads. Tap the ${profile.label} download notification or open Downloads and tap ${APK_CONFIG.fileName}.`,
      };
    }

    case "blob-anchor-open": {
      try {
        openBlobWithAnchor(getOrCreateInstallObjectUrl(blob));
        return {
          tier: 3,
          targetTier: plan.targetTier,
          action: "blob-anchor-open",
          blobInMemory: true,
          browserDownloadStarted: artifactPersistedToDownloads,
          shareAvailable,
          packageInstallerAvailable: false,
          message:
            "Attempted blob open. If no installer appeared, use the download notification or Downloads folder.",
        };
      } catch {
        return null;
      }
    }

    case "blob-navigation": {
      if (!profile.isAndroid) return null;
      try {
        window.location.assign(getOrCreateInstallObjectUrl(blob));
        return {
          tier: 3,
          targetTier: plan.targetTier,
          action: "blob-navigation",
          blobInMemory: true,
          browserDownloadStarted: artifactPersistedToDownloads,
          shareAvailable,
          packageInstallerAvailable: false,
          message: "Opening APK…",
        };
      } catch {
        return null;
      }
    }

    case "instructions-only":
      return {
        tier: 4,
        targetTier: plan.targetTier,
        action: "instructions-only",
        blobInMemory: true,
        browserDownloadStarted: artifactPersistedToDownloads,
        shareAvailable,
        packageInstallerAvailable: false,
        message: plan.tier1Limitation,
      };
  }
}

export function getInstallInstructionsFallback(
  blobInMemory: boolean,
): InstallHandoffResult {
  return {
    tier: 4,
    targetTier: 4,
    action: "instructions-only",
    blobInMemory,
    browserDownloadStarted: artifactPersistedToDownloads,
    shareAvailable: false,
    packageInstallerAvailable: false,
    message: blobInMemory
      ? `Open Downloads or your notification shade and tap ${APK_CONFIG.fileName}.`
      : "Download the APK first.",
  };
}

/**
 * Strongest install handoff from verified in-memory APK.
 * Must run under user gesture. Never re-fetches CDN bytes.
 */
export async function attemptInstallHandoff(
  blob: Blob,
  profile: BrowserProfile,
): Promise<InstallHandoffResult> {
  const plan = selectInstallHandoffPlan(profile);

  for (const step of plan.steps) {
    const result = await executeHandoffStep(step, blob, profile, plan);
    if (!result) continue;

    // Web-share may achieve Tier 1 if user picks installer; persist achieves Tier 2.
    // Stop after first successful initiation unless instructions-only.
    if (result.action === "instructions-only") {
      return result;
    }
    if (result.action === "web-share") {
      return result;
    }
    if (result.action === "persist-to-downloads") {
      return result;
    }
    if (result.action === "blob-anchor-open" && !artifactPersistedToDownloads) {
      return result;
    }
  }

  return {
    tier: 4,
    targetTier: plan.targetTier,
    action: "instructions-only",
    blobInMemory: true,
    browserDownloadStarted: artifactPersistedToDownloads,
    shareAvailable: isShareAvailableForApk(blob),
    packageInstallerAvailable: false,
    message: `${plan.tier1Limitation} Highest achievable: ${tierLabel(plan.targetTier)}.`,
  };
}

export async function shareApkFile(blob: Blob): Promise<InstallHandoffResult> {
  if (!isShareAvailableForApk(blob)) {
    return getInstallInstructionsFallback(true);
  }
  const file = new File([blob], APK_CONFIG.fileName, {
    type: "application/vnd.android.package-archive",
  });
  try {
    await navigator.share({ files: [file], title: APK_CONFIG.fileName });
    return {
      tier: 1,
      targetTier: 2,
      action: "web-share",
      blobInMemory: true,
      browserDownloadStarted: artifactPersistedToDownloads,
      shareAvailable: true,
      packageInstallerAvailable: false,
      message:
        "Share sheet opened. Choose Package Installer if listed.",
    };
  } catch {
    return getInstallInstructionsFallback(true);
  }
}
