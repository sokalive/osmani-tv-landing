import { AppHeader } from "./components/AppHeader";
import { DownloadButton } from "./components/DownloadButton";
import { FAQSection } from "./components/FAQSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { Footer } from "./components/Footer";
import { LoadingScreen } from "./components/LoadingScreen";
import { RatingSection } from "./components/RatingSection";
import { ScreenshotCarousel } from "./components/ScreenshotCarousel";
import { StatsSection } from "./components/StatsSection";
import { useAutoRedirect } from "./hooks/useAutoRedirect";
import "./App.css";

function App() {
  const { isRedirecting } = useAutoRedirect();

  return (
    <>
      {isRedirecting && <LoadingScreen />}

      <div className={`app ${isRedirecting ? "app--hidden" : ""}`}>
        <main className="app__main">
          <div className="app__hero">
            <AppHeader />
            <div className="app__cta">
              <DownloadButton />
            </div>
            <RatingSection />
          </div>

          <ScreenshotCarousel />
          <StatsSection />

          <div id="features">
            <FeaturesSection />
          </div>

          <div id="faq">
            <FAQSection />
          </div>

          <div className="app__cta app__cta--bottom">
            <DownloadButton />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

export default App;
