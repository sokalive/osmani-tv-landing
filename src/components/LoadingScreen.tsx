import "./LoadingScreen.css";

export function LoadingScreen() {
  return (
    <div className="loading-screen" role="alert" aria-live="polite">
      <div className="loading-screen__content">
        <div className="loading-screen__spinner" aria-hidden="true" />
        <p className="loading-screen__text">
          Redirecting to Google Play Store...
        </p>
      </div>
    </div>
  );
}
