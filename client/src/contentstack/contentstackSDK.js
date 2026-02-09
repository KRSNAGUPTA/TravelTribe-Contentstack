import Contentstack from "contentstack";
import ContentstackLivePreview from "@contentstack/live-preview-utils";
import Personalize from "@contentstack/personalize-edge-sdk";
// let projectUid = import.meta.env.VITE_CS_PERSONALIZE_PROJECT_UID;
const Stack = Contentstack.Stack({
  api_key: import.meta.env.VITE_CS_API_KEY,
  delivery_token: import.meta.env.VITE_CS_ACCESS_TOKEN,
  environment: import.meta.env.VITE_CS_DEV_ENV,
  branch: import.meta.env.VITE_CS_BRANCH,
  live_preview: {
    preview_token: import.meta.env.VITE_CS_PREVIEW_TOKEN,
    enable: true,
    host: import.meta.env.VITE_CS_DEV_PREVIEW_HOST,
  },
});

// const personalizeSdk =  Personalize.init(projectUid);
// const experiences =  personalizeSdk.getExperiences();
// console.log(personalizeSdk.getActiveVariant(experiences[0].activeVariantShortUid))

if (import.meta.env.VITE_CS_DEV_API_HOST) {
  Stack.setHost(import.meta.env.VITE_CS_DEV_API_HOST);
}
ContentstackLivePreview.init({
  enable: import.meta.env.VITE_CS_DEV_ENV !== "production",
  cleanCslpOnProduction: import.meta.env.VITE_CS_DEV_ENV === "production",
  ssr: false,
  stackSdk: Stack,
  stackDetails: {
    apiKey: import.meta.env.VITE_CS_API_KEY,
    environment: import.meta.env.VITE_CS_DEV_ENV,
    branch: import.meta.env.VITE_CS_BRANCH,
  },
  clientUrlParams: {
    protocol: "https",
    host: import.meta.env.VITE_CS_DEV_APP_HOST,
    port: 443,
  },
  editButton: {
    enable: true,
    exclude: ["outsideLivePreviewPortal"], // to exclude edit button on outside live preview portal pages
    includeByQueryParameter: false,
    position: "top-right",
  },
  mode: "builder",
});
export const { onEntryChange } = ContentstackLivePreview;

// console.log(personalizeSdk.getVariants())
// console.log("SDK Initialized")
export default Stack;
