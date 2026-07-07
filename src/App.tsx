import { NativeInstallScreen } from "./components/NativeInstallScreen";
import { useApkDownload } from "./hooks/useApkDownload";

function App() {
  const { state, message, handleInstallApk } = useApkDownload();

  return (
    <NativeInstallScreen
      state={state}
      message={message}
      onInstall={handleInstallApk}
    />
  );
}

export default App;
