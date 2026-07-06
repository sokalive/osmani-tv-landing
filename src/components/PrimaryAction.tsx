import type { DownloadState } from "../hooks/useApkDownload";
import type { DownloadProgress } from "../utils/apkDownload";
import { APK_CONFIG } from "../config/download";
import "./PrimaryAction.css";

type PrimaryActionProps = {
  state: DownloadState;
  progress: DownloadProgress;
  message: string;
  showInstallHint: boolean;
  hasBlobInMemory: boolean;
  isMetaInApp: boolean;
  onPrimaryClick: () => void;
  onDownloadAgain: () => void;
};

function getButtonLabel(state: DownloadState): string {
  switch (state) {
    case "preparing":
      return "Preparing download…";
    case "downloading":
    case "cors_limited":
      return "Downloading…";
    case "complete":
    case "open_install_ready":
    case "manual_download_required":
      return "OPEN / INSTALL";
    case "blocked":
      return "Download";
    case "network_error":
    case "invalid_apk_response":
      return "Try again";
    case "unavailable":
      return "Unavailable";
    default:
      return "Download";
  }
}

function isInstallReady(state: DownloadState): boolean {
  return (
    state === "open_install_ready" ||
    state === "complete" ||
    state === "manual_download_required"
  );
}

export function PrimaryAction({
  state,
  progress,
  message,
  showInstallHint,
  hasBlobInMemory,
  isMetaInApp,
  onPrimaryClick,
  onDownloadAgain,
}: PrimaryActionProps) {
  const isBusy =
    state === "preparing" || state === "downloading" || state === "cors_limited";
  const isDisabled = state === "unavailable";
  const showProgress =
    state === "downloading" || state === "cors_limited";
  const showPercent =
    showProgress && progress.percent !== null && progress.percent > 0;
  const installReady = isInstallReady(state);

  return (
    <section className="primary-action" aria-label="Download Osmani TV">
      {isMetaInApp && state === "blocked" && (
        <p className="primary-action__meta-banner" role="status">
          Tap <strong>Download</strong> below — {message}
        </p>
      )}

      <div className="primary-action__buttons">
        <button
          type="button"
          className={`primary-action__btn ${installReady ? "primary-action__btn--install" : ""}`}
          onClick={onPrimaryClick}
          disabled={isBusy || isDisabled}
          aria-busy={isBusy}
        >
          {getButtonLabel(state)}
        </button>
        {installReady && (
          <button
            type="button"
            className="primary-action__btn secondary"
            onClick={onDownloadAgain}
          >
            Download again
          </button>
        )}
      </div>

      {showProgress && (
        <div className="primary-action__progress" aria-live="polite">
          {showPercent ? (
            <>
              <div
                className="primary-action__progress-bar"
                role="progressbar"
                aria-valuenow={progress.percent ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="primary-action__progress-fill"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <span className="primary-action__progress-text">
                {progress.percent}%
              </span>
            </>
          ) : (
            <div
              className="primary-action__progress-bar primary-action__progress-bar--indeterminate"
              role="progressbar"
              aria-busy="true"
              aria-label="Downloading, progress indeterminate"
            >
              <div className="primary-action__progress-fill primary-action__progress-fill--indeterminate" />
            </div>
          )}
        </div>
      )}

      {message && state !== "blocked" && (
        <p className="primary-action__message">{message}</p>
      )}

      {state === "blocked" && (
        <p className="primary-action__message primary-action__message--blocked">
          {message}
        </p>
      )}

      {showInstallHint && (
        <div className="primary-action__hint">
          <p>
            <strong>To install on Android:</strong>
          </p>
          <ol className="primary-action__steps">
            <li>Open your notification shade or Downloads folder.</li>
            <li>
              Tap <em>{APK_CONFIG.fileName}</em>.
            </li>
            <li>Confirm in the Android package installer.</li>
          </ol>
          {!hasBlobInMemory && installReady && (
            <p className="primary-action__hint-note">
              The APK was handed off to your browser download manager. JavaScript
              cannot open the Android installer directly.
            </p>
          )}
          {hasBlobInMemory && (
            <p className="primary-action__hint-note">
              OPEN / INSTALL shows install steps or the system share sheet — not
              a guaranteed package installer launch.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
