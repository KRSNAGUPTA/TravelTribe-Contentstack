import axios from "axios";

const cmsClient = axios.create({
    baseURL: process.env.CS_BASE_URL,
    headers:{
        api_key:process.env.CS_API_KEY,
        access_token:process.env.CS_ACCESS_TOKEN
    }
})
export default cmsClient;