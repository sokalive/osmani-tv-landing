import { PLAY_STORE_URL } from "../config/constants";
import "./DownloadButton.css";

export function DownloadButton() {
  return (
    <a
      href={PLAY_STORE_URL}
      className="download-btn"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download Osmani TV on Google Play"
    >
      <svg
        className="download-btn__icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M3.609 1.814L13.792 12 3.61 22.186a1.003 1.003 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"
        />
      </svg>
      <span className="download-btn__text">
        <span className="download-btn__label">GET IT ON</span>
        <span className="download-btn__store">Google Play</span>
      </span>
    </a>
  );
}
