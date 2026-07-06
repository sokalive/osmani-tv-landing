import { APK_CONFIG } from "../config/download";
import { isHtmlContentType, validateApkBlob } from "./apkValidation";

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
  /** What actually happened — never claim package installer opened unless verified */
  action: "instructions" | "share-chooser" | "blob-unavailable";
  message: string;
};

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
  const total = contentLength ? parseInt(contentLength, 10) : null;

  if (total !== null && total < APK_CONFIG.minBytes) {
    throw new Error(`Invalid APK response: file too small (${total} bytes)`);
  }

  if (!response.body) {
    const blob = await response.blob();
    const validation = await validateApkBlob(blob);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }
    onProgress({
      loaded: blob.size,
      total: blob.size,
      percent: 100,
    });
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
  if (!validation.valid) {
    throw new Error(validation.reason);
  }

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

export function saveBlobToDevice(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
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

/**
 * Attempt install handoff. Browsers cannot open Android Package Installer directly.
 * - With in-memory blob: optional share chooser (NOT guaranteed installer)
 * - Without blob: instructions only
 */
export async function attemptInstallHandoff(
  blob: Blob | null,
  options: { preferShare?: boolean } = {},
): Promise<InstallHandoffResult> {
  if (!blob) {
    return {
      action: "blob-unavailable",
      message:
        "Open your notification shade or Downloads folder, then tap Osmani-TV-Max.apk. If you refreshed the page, the in-memory file is no longer available — use Download again only if the file is missing.",
    };
  }

  if (options.preferShare) {
    const file = new File([blob], APK_CONFIG.fileName, {
      type: "application/vnd.android.package-archive",
    });
    if (
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({ files: [file], title: APK_CONFIG.fileName });
        return {
          action: "share-chooser",
          message:
            "System share sheet opened. Choose a file manager or installer if listed. Android may still require you to tap the download notification.",
        };
      } catch {
        // fall through to instructions
      }
    }
  }

  return {
    action: "instructions",
    message:
      "Open your notification shade or Downloads folder, then tap Osmani-TV-Max.apk to install. Allow installs from this browser if Android prompts you.",
  };
}
