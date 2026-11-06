// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

// Bundle ID format: space.manus.<project_name_dots>.<timestamp>
const rawBundleId = "space.manus.droidsh.t267813220906866";
const bundleId =
  rawBundleId
    .replace(/[-_]/g, ".")
    .replace(/[^a-zA-Z0-9.]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .toLowerCase()
    .split(".")
    .map((segment) => (/^[a-zA-Z]/.test(segment) ? segment : "x" + segment))
    .join(".") || "space.manus.app";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  appName: "DroidSH — Terminal Android",
  appSlug: "droidsh",
  logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519664066264035/yNkVxHbmDAQmSfCu.png",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const publicRuntime = {
  oauthPortalUrl:
    process.env.MANUS_OAUTH_PORTAL_URL ??
    process.env.VITE_OAUTH_PORTAL_URL ??
    process.env.EXPO_PUBLIC_OAUTH_PORTAL_URL ??
    "",
  oauthServerUrl:
    process.env.MANUS_OAUTH_API_URL ?? process.env.OAUTH_SERVER_URL ?? process.env.EXPO_PUBLIC_OAUTH_SERVER_URL ?? "",
  appId: process.env.MANUS_PROJECT_ID ?? process.env.VITE_APP_ID ?? process.env.EXPO_PUBLIC_APP_ID ?? "",
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  extra: publicRuntime,
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "dark",
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#07111F",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: env.scheme, host: "*" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: { bundler: "metro", output: "static", favicon: "./assets/images/favicon.png" },
  plugins: [
    "expo-asset",
    "expo-router",
    ["expo-audio", { microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone." }],
    ["expo-video", { supportsBackgroundPlayback: true, supportsPictureInPicture: true }],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#07111F",
        dark: { backgroundColor: "#07111F" },
      },
    ],
    ["expo-build-properties", { android: { buildArchs: ["armeabi-v7a", "arm64-v8a"], minSdkVersion: 24 } }],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
};

export default config;
