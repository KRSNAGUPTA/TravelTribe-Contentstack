import ContentstackLivePreview from "@contentstack/live-preview-utils";
import Stack from "./contentstackSDK";

ContentstackLivePreview.init({
    enable: import.meta.env.VITE_CS_DEV_ENV !== "production",
    cleanCslpOnProduction: import.meta.env.VITE_CS_DEV_ENV  === "production",
    ssr:false,
    stackSdk: Stack
});