import Contentstack from "contentstack";
import ContentstackLivePreview from "@contentstack/live-preview-utils";
const config = {
  api_key: import.meta.env.VITE_CS_API_KEY,
  delivery_token: import.meta.env.VITE_CS_ACCESS_TOKEN,
  environment: import.meta.env.VITE_CS_DEV_ENV,
  branch: import.meta.env.VITE_CS_BRANCH,
  preview_token: import.meta.env.VITE_CS_PREVIEW_TOKEN,
  preview_host: import.meta.env.VITE_CS_DEV_PREVIEW_HOST,
  app_host: import.meta.env.VITE_CS_DEV_APP_HOST,
  api_host: import.meta.env.VITE_CS_DEV_API_HOST,
  enable_live_preview: import.meta.env.VITE_CS_ENABLE_LIVE_PREVIEW,
};
const Stack = Contentstack.Stack({
  api_key: config.api_key,
  delivery_token: config.delivery_token,
  environment: config.environment,
  branch: config.branch,
  live_preview: {
    preview_token: config.preview_token,
    host: config.preview_host,
    port: 443,
  },
});

if (config.api_host) {
  Stack.setHost(config.api_host);
}
ContentstackLivePreview.init({
  enable: config.enable_live_preview,
  cleanCslpOnProduction: true,
  ssr: false,
  stackSdk: Stack,
  stackDetails: {
    apiKey: config.api_key,
    environment: config.environment,
    branch: config.branch,
  },
  clientUrlParams: {
    protocol: "https",
    host: config.app_host,
    port: 443,
  },
  editButton: {
    enable: config.environment !== "production",
    exclude:
      config.environment === "production" ? ["outsideLivePreviewPortal"] : [], // to exclude edit button on outside live preview portal pages
    includeByQueryParameter: false,
    position: "top-right",
  },
  mode: config.environment === "production" ? "preview" : "builder",
});
export const { onEntryChange } = ContentstackLivePreview;
export default Stack;
