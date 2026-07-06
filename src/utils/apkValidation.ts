import { APK_CONFIG } from "../config/download";

export type ApkValidationResult =
  | { valid: true; contentLength: number | null; contentType: string | null }
  | { valid: false; reason: string };

const APK_MAGIC = [0x50, 0x4b]; // PK (ZIP/APK)

export function isHtmlContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.toLowerCase().includes("text/html");
}

export function validateApkHead(
  status: number,
  contentType: string | null,
  contentLength: string | null,
): ApkValidationResult {
  if (status === 404) {
    return { valid: false, reason: "APK not found (404)" };
  }
  if (!status || status >= 400) {
    return { valid: false, reason: `APK unavailable (HTTP ${status})` };
  }
  if (isHtmlContentType(contentType)) {
    return {
      valid: false,
      reason: "Invalid APK response: received HTML instead of APK bytes",
    };
  }
  const length = contentLength ? parseInt(contentLength, 10) : null;
  if (length !== null && length < APK_CONFIG.minBytes) {
    return {
      valid: false,
      reason: `Invalid APK response: file too small (${length} bytes)`,
    };
  }
  return { valid: true, contentLength: length, contentType };
}

export async function validateApkBlob(blob: Blob): Promise<ApkValidationResult> {
  if (isHtmlContentType(blob.type)) {
    return {
      valid: false,
      reason: "Invalid APK response: received HTML instead of APK bytes",
    };
  }
  if (blob.size < APK_CONFIG.minBytes) {
    return {
      valid: false,
      reason: `Invalid APK response: file too small (${blob.size} bytes)`,
    };
  }
  const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  if (header[0] !== APK_MAGIC[0] || header[1] !== APK_MAGIC[1]) {
    const textPeek = await blob.slice(0, 32).text();
    if (textPeek.trimStart().startsWith("<!") || textPeek.includes("<html")) {
      return {
        valid: false,
        reason: "Invalid APK response: SPA HTML returned instead of APK",
      };
    }
    return {
      valid: false,
      reason: "Invalid APK response: not a valid APK/ZIP archive",
    };
  }
  return { valid: true, contentLength: blob.size, contentType: blob.type };
}

export async function probeApkAvailability(url: string): Promise<ApkValidationResult> {
  try {
    const response = await fetch(url, { method: "HEAD", cache: "no-store" });
    return validateApkHead(
      response.status,
      response.headers.get("content-type"),
      response.headers.get("content-length"),
    );
  } catch {
    return { valid: false, reason: "Network error while checking APK" };
  }
}
