// client/src/Lytics/config.js


// from the doc, but not recommended. Use the availabale script from Lytics setup to add in index.html
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

// no official source found for this
// export const identifyUser = (email, traits = {}) => {
//   jstag.identify({
//     email: email,
//     ...traits,
//   });
// };

// not recommended to use this directly, as lytics provide a callback based approach. 
// export const fetchLyticsProfile = async (email) =>{
//   try {
//     const baseUrl = import.meta.env.VITE_LYTICS_BASE_URL;
//     const apiKey = import.meta.env.VITE_LYTICS_API_KEY;

//     if (!baseUrl || !apiKey) {
//       return console.warn("Lytics base URL or API key is not set. Cannot fetch profile.");
//     }

//     const res = await axios.get(`${baseUrl}/identity/user/email/${email}`, {
//       headers: {
//         Authorization: `${apiKey}`,
//       },
//     });

//     console.log("Lytics Profile Response", res.data);
//     return res.data;
//   } catch (error) {
//     console.error("Error fetching user profile from Lytics:", error);
//   }
// }

// This function now returns a Promise "wrapper"


export const getLyticsProfile = () => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.warn("Lytics timed out (likely blocked by AdBlock). Please, turn off Adblocker for personalized experience!");
      resolve({ user: { viewed_hostel: [] } }); // Resolve with empty data so the app doesn't crash
    }, 2000); // 2 seconds is usually enough

    // console.log("Calling jstag for entityReady");

    // 2. Try the Lytics call
    try{
      jstag.call("entityReady", (profile) => {
        clearTimeout(timeout); // Cancel the timeout if Lytics actually responds
        // console.log("Lytics responded successfully");
        
        if (profile && profile.data) {
          resolve(profile.data);
        } else {
          resolve({ user: { viewed_hostel: [] } }); // Fallback
        }
      });
    } catch (e) {
      clearTimeout(timeout);
      console.error("jstag is not defined or crashed:", e);
      resolve({ user: { viewed_hostel: [] } });
    }
  });
};