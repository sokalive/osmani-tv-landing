import { APP_CONFIG } from "../config/constants";
import { ASSET_LAYOUT, ASSET_PATHS } from "../config/assets";
import { AssetImage } from "./AssetImage";
import "./AppIdentity.css";

export function AppIdentity() {
  return (
    <section className="app-identity">
      <div
        className="app-identity__icon"
        style={{
          width: ASSET_LAYOUT.appIconSize,
          height: ASSET_LAYOUT.appIconSize,
        }}
      >
        <AssetImage
          src={ASSET_PATHS.appIcon}
          alt={`${APP_CONFIG.name} app icon`}
          className="app-identity__icon-img"
          width={ASSET_LAYOUT.appIconSize}
          height={ASSET_LAYOUT.appIconSize}
          placeholderLabel="App icon pending"
        />
      </div>
      <div className="app-identity__info">
        <p className="app-identity__developer">{APP_CONFIG.developer}</p>
        <h1 className="app-identity__title">{APP_CONFIG.name}</h1>
        {APP_CONFIG.inAppPurchases && (
          <p className="app-identity__meta">In-app purchases</p>
        )}
      </div>
    </section>
  );
}
