import { APK_CONFIG, APK_RELEASE, isCrossOriginCdnApk } from "../config/download";

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
  if (
    length !== null &&
    APK_RELEASE.expectedSizeBytes !== null &&
    length !== APK_RELEASE.expectedSizeBytes
  ) {
    return {
      valid: false,
      reason: `APK size mismatch: expected ${APK_RELEASE.expectedSizeBytes} bytes, got ${length}`,
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
  if (
    APK_RELEASE.expectedSizeBytes !== null &&
    blob.size !== APK_RELEASE.expectedSizeBytes
  ) {
    return {
      valid: false,
      reason: `APK size mismatch: expected ${APK_RELEASE.expectedSizeBytes} bytes, got ${blob.size}`,
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

export async function validateApkSha256(blob: Blob): Promise<ApkValidationResult> {
  if (!APK_RELEASE.sha256) {
    return { valid: true, contentLength: blob.size, contentType: blob.type };
  }
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (hashHex !== APK_RELEASE.sha256.toLowerCase()) {
    return {
      valid: false,
      reason: `APK SHA-256 mismatch: expected ${APK_RELEASE.sha256}, got ${hashHex}`,
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
    if (isCrossOriginCdnApk(url) && APK_CONFIG.externalUrl) {
      return {
        valid: true,
        contentLength: APK_RELEASE.expectedSizeBytes,
        contentType: "application/octet-stream",
      };
    }
    return { valid: false, reason: "Network error while checking APK" };
  }
}
