import axios from "axios";
import { getVariantHeaders } from "./personalizeSdk";

const cmsClient = axios.create({
    baseURL: import.meta.env.VITE_CS_BASE_URL,
    headers:{
        api_key:import.meta.env.VITE_CS_API_KEY,
        access_token:import.meta.env.VITE_CS_ACCESS_TOKEN,
        branch:import.meta.env.VITE_CS_BRANCH,
    }
})
export default cmsClient;

cmsClient.interceptors.request.use(async (config) => {
    const variantHeaders = await getVariantHeaders();
    const variantAliasHeader = variantHeaders["x-cs-variant-uid"];

    if (!variantAliasHeader) {
        return config;
    }

    config.headers = config.headers || {};
    config.headers["x-cs-variant-uid"] = variantAliasHeader;
    return config;
});