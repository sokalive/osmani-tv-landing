import { APK_CONFIG, resolveApkUrl } from "../config/download";
import "./ApkFileCard.css";

function ApkFileIcon() {
  return (
    <svg
      className="apk-file-card__icon"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 6h16l8 8v28a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"
        fill="rgba(33,120,255,0.2)"
        stroke="#4da3ff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M28 6v8h8"
        stroke="#4da3ff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="14" y="26" width="20" height="10" rx="2" fill="#1a6fe8" />
      <text
        x="24"
        y="33.5"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="7"
        fontWeight="700"
        fontFamily="Roboto, sans-serif"
      >
        APK
      </text>
    </svg>
  );
}

/** Rounded human-readable size for the file card (91 MB from 90,834,935 bytes). */
function formatApkFileSizeLabel(): string {
  const mb = Math.round(APK_CONFIG.expectedSizeBytes / 1_000_000);
  return `${mb} MB`;
}

export function ApkFileCard() {
  const apkUrl = resolveApkUrl();
  const fileName = APK_CONFIG.fileName;
  const sizeLabel = formatApkFileSizeLabel();
  const ariaLabel = `Fungua faili ${fileName}, ukubwa ${sizeLabel}`;

  return (
    <a
      className="apk-file-card"
      href={apkUrl}
      rel="noopener"
      aria-label={ariaLabel}
    >
      <div className="apk-file-card__icon-wrap">
        <ApkFileIcon />
      </div>
      <div className="apk-file-card__body">
        <span className="apk-file-card__name">{fileName}</span>
        <span className="apk-file-card__meta">
          {sizeLabel} • APK
        </span>
        <span className="apk-file-card__hint">Gusa faili kufungua</span>
      </div>
    </a>
  );
}
