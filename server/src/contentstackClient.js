import axios from "axios";

const rawBaseUrl = (process.env.CS_BASE_URL || "https://eu-cdn.contentstack.com/v3").trim();
const baseURL = (/^https?:\/\//i.test(rawBaseUrl) ? rawBaseUrl : `https://${rawBaseUrl}`).replace(/\/+$/, "");

const cmsClient = axios.create({
  baseURL,
  headers: {
    api_key: process.env.CS_API_KEY,
    access_token: process.env.CS_ACCESS_TOKEN,
    branch: process.env.CS_BRANCH || "main",
  },
  timeout: 10000,
});

export default cmsClient;