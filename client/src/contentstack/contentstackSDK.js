import Contentstack from "contentstack";
import ContentstackLivePreview from "@contentstack/live-preview-utils";

const config = {
  api_key: import.meta.env.VITE_CS_API_KEY,
  delivery_token: import.meta.env.VITE_CS_ACCESS_TOKEN,
  environment: import.meta.env.VITE_CS_DEV_ENV,
  branch: import.meta.env.VITE_CS_BRANCH,
  region: import.meta.env.VITE_CS_REGION || "eu",
  preview_token: import.meta.env.VITE_CS_PREVIEW_TOKEN,
  app_host: import.meta.env.VITE_CS_DEV_APP_HOST,
  enable_live_preview: import.meta.env.VITE_CS_ENABLE_LIVE_PREVIEW === "true",
};

const REGION_MAP = {
  us: Contentstack.Region.US,
  na: Contentstack.Region.US,
  eu: Contentstack.Region.EU,
  au: Contentstack.Region.AU,
  "azure-na": Contentstack.Region.AZURE_NA,
  "azure-eu": Contentstack.Region.AZURE_EU,
  "gcp-na": Contentstack.Region.GCP_NA,
  "gcp-eu": Contentstack.Region.GCP_EU,
};

const region =
  REGION_MAP[String(config.region).toLowerCase()] || "eu";

const Stack = Contentstack.Stack({
  api_key: config.api_key,
  delivery_token: config.delivery_token,
  environment: config.environment,
  branch: config.branch,
  region,
  live_preview: {
    enable: config.enable_live_preview,
    preview_token: config.preview_token,
    host: config.app_host,
  },
});

ContentstackLivePreview.init({
  enable: config.enable_live_preview,
  editInVisualBuilderButton: {
    enable: false
  },
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
    enable: config.enable_live_preview,
    exclude: config.enable_live_preview ? ["outsideLivePreviewPortal"] : [],
    includeByQueryParameter: false,
    position: "top-right",
  },
  mode: config.environment === "production" ? "preview" : "builder",
});

export const { onEntryChange } = ContentstackLivePreview;
export default Stack;