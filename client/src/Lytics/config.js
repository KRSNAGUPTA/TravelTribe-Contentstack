// client/src/Lytics/config.js

import axios from "axios";

// const initLytics = async () => {
//   if (!import.meta.env.VITE_LYTICS_CID || !import.meta.env.VITE_LYTICS_STREAM) {
//     console.warn(
//       "Lytics CID or Stream is not set. Skipping Lytics initialization.",
//     );
//     return;
//   }
//   try {
//     jstag.init({
//       cid: import.meta.env.VITE_LYTICS_CID, // Connects to your Lytics account
//       stream: import.meta.env.VITE_LYTICS_STREAM, // Target data stream
//       sessecs: 1800, // Session timeout (seconds)
//     });
//   } catch (error) {
//     console.error("Error initializing Lytics:", error);
//   }
// };

// initLytics();

export const trackEvent = (eventName, properties = {}) => {
  jstag.send({
    _e: eventName,
    ...properties,
  });  
};
export const identifyUser = (email, traits = {}) => {
  jstag.identify({
    email: email,
    ...traits,
  });
};


export const fetchLyticsProfile = async (email) =>{
  try {
    const baseUrl = import.meta.env.VITE_LYTICS_BASE_URL;
    const apiKey = import.meta.env.VITE_LYTICS_API_KEY;

    if (!baseUrl || !apiKey) {
      return console.warn("Lytics base URL or API key is not set. Cannot fetch profile.");
    }

    const res = await axios.get(`${baseUrl}/identity/user/email/${email}`, {
      headers: {
        Authorization: `${apiKey}`,
      },
    });

    console.log("Lytics Profile Response", res.data);
    return res.data;
  } catch (error) {
    console.error("Error fetching user profile from Lytics:", error);
  }
}