import type { DownloadState } from "../hooks/useApkDownload";
import type { DownloadProgress } from "../utils/apkDownload";
import "./PrimaryAction.css";

type PrimaryActionProps = {
  state: DownloadState;
  progress: DownloadProgress;
  message: string;
  showInstallHint: boolean;
  onPrimaryClick: () => void;
  onDownloadAgain: () => void;
};

function getButtonLabel(state: DownloadState): string {
  switch (state) {
    case "preparing":
      return "Preparing download…";
    case "downloading":
      return "Downloading…";
    case "complete":
      return "OPEN / INSTALL";
    case "blocked":
      return "Download";
    case "error":
      return "Try again";
    case "unavailable":
      return "Unavailable";
    default:
      return "Download";
  }
}

export function PrimaryAction({
  state,
  progress,
  message,
  showInstallHint,
  onPrimaryClick,
  onDownloadAgain,
}: PrimaryActionProps) {
  const isBusy = state === "preparing" || state === "downloading";
  const isDisabled = state === "unavailable";
  const showProgress = state === "downloading";
  const showPercent =
    showProgress && progress.percent !== null && progress.percent > 0;

  return (
    <section className="primary-action" aria-label="Download Osmani TV">
      <div className="primary-action__buttons">
        <button
          type="button"
          className={`primary-action__btn ${state === "complete" ? "primary-action__btn--install" : ""}`}
          onClick={onPrimaryClick}
          disabled={isBusy || isDisabled}
          aria-busy={isBusy}
        >
          {getButtonLabel(state)}
        </button>
        {state === "complete" && (
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
            >
              <div className="primary-action__progress-fill primary-action__progress-fill--indeterminate" />
            </div>
          )}
        </div>
      )}

      {message && (
        <p
          className={`primary-action__message ${state === "blocked" ? "primary-action__message--blocked" : ""}`}
        >
          {message}
        </p>
      )}

      {showInstallHint && (
        <div className="primary-action__hint">
          <p>
            <strong>To install:</strong> Open your notification shade or
            Downloads folder, then tap <em>{APK_FILE_NAME}</em>. You may need to
            allow installs from this browser in Android settings.
          </p>
        </div>
      )}
    </section>
  );
}

const APK_FILE_NAME = "osmani-tv.apk";
