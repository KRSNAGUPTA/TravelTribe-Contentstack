import axios from "axios";
import { personalizeSdk } from "./contentstackSDK";

const cmsClient = axios.create({
    baseURL: import.meta.env.VITE_CS_BASE_URL,
    headers:{
        api_key:import.meta.env.VITE_CS_API_KEY,
        access_token:import.meta.env.VITE_CS_ACCESS_TOKEN,
        branch:import.meta.env.VITE_CS_BRANCH,
    }
})
export default cmsClient;

cmsClient.interceptors.request.use((config) => {
  const variants = personalizeSdk?.getVariantAliases?.() || [];
  config.headers["x-cs-variant-uid"] = variants.join(",");
  return config;
});