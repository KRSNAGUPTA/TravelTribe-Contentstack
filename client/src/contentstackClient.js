import axios from "axios";

const cmsClient = axios.create({
    baseURL: import.meta.env.VITE_CS_BASE_URL,
    headers:{
        api_key:import.meta.env.VITE_CS_API_KEY,
        access_token:import.meta.env.VITE_CS_ACCESS_TOKEN
    }
})
export default cmsClient;