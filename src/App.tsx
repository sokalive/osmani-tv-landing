import { TopBar } from "./components/TopBar";
import { AppIdentity } from "./components/AppIdentity";
import { StatsRow } from "./components/StatsRow";
import { PrimaryAction } from "./components/PrimaryAction";
import { ScreenshotCarousel } from "./components/ScreenshotCarousel";
import { AboutSection } from "./components/AboutSection";
import { CategoryChips } from "./components/CategoryChips";
import { WhatsNew } from "./components/WhatsNew";
import { AppInfo } from "./components/AppInfo";
import { useApkDownload } from "./hooks/useApkDownload";
import "./App.css";

function App() {
  const {
    state,
    progress,
    message,
    showInstallHint,
    hasBlobInMemory,
    browserDownloadStarted,
    canShareApk,
    isMetaInApp,
    handlePrimaryAction,
    handleDownloadAgain,
    handleShareApk,
  } = useApkDownload();

  return (
    <div className="app">
      <div className="app__page">
        <TopBar />
        <main className="app__main">
          <AppIdentity />
          <StatsRow />
          <PrimaryAction
            state={state}
            progress={progress}
            message={message}
            showInstallHint={showInstallHint}
            hasBlobInMemory={hasBlobInMemory}
            browserDownloadStarted={browserDownloadStarted}
            canShareApk={canShareApk}
            isMetaInApp={isMetaInApp}
            onPrimaryClick={handlePrimaryAction}
            onDownloadAgain={handleDownloadAgain}
            onShareApk={handleShareApk}
          />
          <p className="app__install-note">
            Download on phone. Android 6.0 or later required.
          </p>

          <ScreenshotCarousel />
          <AboutSection />
          <CategoryChips />
          <WhatsNew />
          <AppInfo />
        </main>

        <footer className="app__footer">
          <p>Osmani TV · Direct APK download</p>
          <p className="app__footer-note">
            This is not Google Play. Distributed directly by Osmani Media.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
