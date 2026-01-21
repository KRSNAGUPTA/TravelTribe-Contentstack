import Contentstack from "contentstack"
const Stack = Contentstack.Stack({
    api_key:import.meta.env.VITE_CS_API_KEY,
    delivery_token:import.meta.env.VITE_CS_DEV_ACCESS_TOKEN,
    environment:import.meta.env.VITE_CS_DEV_ENV,
    branch:"main",
    live_preview:{
        preview_token: import.meta.env.VITE_CS_DEV_PREVIEW_TOKEN,
        enable:true
    }
}
);
// console.log("SDK Initialized")
export default Stack;