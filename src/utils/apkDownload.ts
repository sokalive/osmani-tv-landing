import { APK_CONFIG } from "../config/download";

export type DownloadProgress = {
  loaded: number;
  total: number | null;
  percent: number | null;
};

export type DownloadResult = {
  blob: Blob | null;
  method: "fetch-blob" | "native-anchor" | "navigation";
};

export async function checkApkAvailability(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

export async function downloadApkWithProgress(
  url: string,
  onProgress: (progress: DownloadProgress) => void,
  signal?: AbortSignal,
): Promise<DownloadResult> {
  const response = await fetch(url, { cache: "no-store", signal });

  if (!response.ok) {
    throw new Error(`APK unavailable (${response.status})`);
  }

  const contentLength = response.headers.get("content-length");
  const total = contentLength ? parseInt(contentLength, 10) : null;

  if (!response.body) {
    const blob = await response.blob();
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

export async function openInstallHandoff(blob: Blob | null): Promise<boolean> {
  if (!blob) return false;

  const file = new File([blob], APK_CONFIG.fileName, {
    type: "application/vnd.android.package-archive",
  });

  if (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: "Install Osmani TV",
      });
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
