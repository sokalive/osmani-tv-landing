import type { DownloadState } from "../utils/downloadState";
import type { DownloadProgress } from "../utils/apkDownload";
import { APK_CONFIG } from "../config/download";
import {
  getPrimaryButtonLabel,
  isActiveFetchState,
  isBrowserHandoffState,
  isVerifiedCompleteState,
  shouldShowDownloadAgain,
} from "../utils/downloadState";
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
  onShareApk?: () => void;
  canShareApk?: boolean;
};

export function PrimaryAction({
  state,
  progress,
  message,
  showInstallHint,
  hasBlobInMemory,
  isMetaInApp,
  onPrimaryClick,
  onDownloadAgain,
  onShareApk,
  canShareApk = false,
}: PrimaryActionProps) {
  const isBusy = isActiveFetchState(state);
  const isDisabled = state === "unavailable";
  const showProgress = state === "downloading" && progress.loaded > 0;
  const showPercent = showProgress && progress.percent !== null;
  const verifiedComplete = isVerifiedCompleteState(state);
  const browserHandoff = isBrowserHandoffState(state);

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
          className={`primary-action__btn ${verifiedComplete ? "primary-action__btn--install" : ""}`}
          onClick={onPrimaryClick}
          disabled={isBusy || isDisabled}
          aria-busy={isBusy}
        >
          {getPrimaryButtonLabel(state)}
        </button>
        {shouldShowDownloadAgain(state) && (
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
          ) : progress.total !== null ? (
            <span className="primary-action__progress-text">{message}</span>
          ) : null}
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

      {browserHandoff && (
        <p className="primary-action__hint-note primary-action__message">
          Download is handled by your browser. Check your notification shade,
          then tap <em>{APK_CONFIG.fileName}</em> to install.
        </p>
      )}

      {showInstallHint && verifiedComplete && (
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
          {hasBlobInMemory && (
            <p className="primary-action__hint-note">
              OPEN / INSTALL attempts to hand the verified APK to Android&apos;s
              package installer. If that does not open, use Share APK or your
              Downloads folder.
            </p>
          )}
          {canShareApk && onShareApk && (
            <button
              type="button"
              className="primary-action__share-btn"
              onClick={onShareApk}
            >
              Share APK (optional)
            </button>
          )}
        </div>
      )}
    </section>
  );
}
