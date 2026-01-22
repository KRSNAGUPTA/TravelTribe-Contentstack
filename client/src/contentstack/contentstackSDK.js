import Contentstack from "contentstack"
import ContentstackLivePreview from "@contentstack/live-preview-utils";
const Stack = Contentstack.Stack({
    api_key:import.meta.env.VITE_CS_API_KEY,
    delivery_token:import.meta.env.VITE_CS_DEV_ACCESS_TOKEN,
    environment:import.meta.env.VITE_CS_DEV_ENV,
    branch:import.meta.env.VITE_CS_BRANCH,
    live_preview:{
        preview_token: import.meta.env.VITE_CS_DEV_PREVIEW_TOKEN,
        enable:true,
        host:import.meta.env.VITE_CS_DEV_PREVIEW_HOST
    }
}
);

if(import.meta.env.VITE_CS_DEV_API_HOST){
    Stack.setHost(import.meta.env.VITE_CS_DEV_API_HOST)
}
ContentstackLivePreview.init({
    enable: import.meta.env.VITE_CS_DEV_ENV !== "production",
    cleanCslpOnProduction: import.meta.env.VITE_CS_DEV_ENV  === "production",
    ssr:false,
    stackSdk: Stack,
    stackDetails:{
        apiKey: import.meta.env.VITE_CS_API_KEY,
        environment: import.meta.env.VITE_CS_DEV_ENV,
        branch: import.meta.env.VITE_CS_BRANCH
    },
    clientUrlParams:{
        protocol:'https',
        host: import.meta.env.VITE_CS_DEV_APP_HOST,
        port:443
    },
    editButton: {
        enable: true,
        exclude: ["outsideLivePreviewPortal"],
        includeByQueryParameter: false,
        position:'top-right',
    }

});
export const {onEntryChange} = ContentstackLivePreview


// console.log("SDK Initialized")
export default Stack;